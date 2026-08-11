import type {
  Action,
  Effect,
  GameState,
  LogEntry,
  Phase,
  ProbeId,
  ReduceResult,
} from './types';
import { createInitialState, START_CLOCK_MINUTES, TOTAL_SECONDS } from './state';

/** Punti percentuali di batteria consumati passivamente ogni secondo reale. */
const BATTERY_DRAIN_PER_SECOND = 8 / 600; // ~8% nell'arco dei 10 minuti.

/** Scene "tese" su cui vale la pena far vibrare il telefono al loro arrivo. */
const TENSE_SCENES = new Set(['figure', 'door']);

/**
 * reduce(state, action) -> { state, effects[] }
 *
 * Funzione PURA e totale: stesso input, stesso output; nessun side effect.
 * È il solo punto in cui lo stato evolve. React ne è soltanto una vista.
 */
export function reduce(state: GameState, action: Action): ReduceResult {
  switch (action.type) {
    case 'TICK':
      return tick(state, action.deltaMs);
    case 'PROBE':
      return probe(state, action.probe);
    case 'RESET':
      return { state: createInitialState(state.scenario, action.truth), effects: [] };
    default:
      // Con nuove azioni sostituire con `return assertNever(action)` per
      // riattivare il controllo di esaustività a compile-time.
      throw new Error(`Azione non gestita: ${(action as Action).type}`);
  }
}

/**
 * Avanzamento soft real-time: il clock scorre col tempo reale, la batteria cala
 * lentamente e si attivano i momenti della sceneggiatura via via che il tempo
 * li raggiunge. Leggere non costa secondi; solo TICK e le azioni consumano tempo.
 */
function tick(state: GameState, deltaMs: number): ReduceResult {
  if (state.phase !== 'running' || deltaMs <= 0) {
    return { state, effects: [] };
  }

  const deltaSeconds = deltaMs / 1000;
  const secondsRemaining = Math.max(0, state.resources.secondsRemaining - deltaSeconds);
  const battery = clampBattery(
    state.resources.battery - deltaSeconds * BATTERY_DRAIN_PER_SECOND,
  );

  const moved: GameState = {
    ...state,
    clockMinutes: minutesFromRemaining(secondsRemaining),
    resources: { ...state.resources, secondsRemaining, battery },
  };

  const advanced = advanceMoments(moved);
  const ended = maybeEnd(advanced.state);
  return { state: ended.state, effects: [...advanced.effects, ...ended.effects] };
}

/**
 * Azione investigativa (spioncino / cerca): costa tempo e batteria, può far
 * scattare momenti (se il costo supera una soglia), poi rivela il dettaglio del
 * momento corrente. Se in questo momento hai già scoperto tutto, niente spam:
 * un avviso transitorio invece di una riga ripetuta nel registro.
 */
function probe(state: GameState, probeId: ProbeId): ReduceResult {
  if (state.phase !== 'running') {
    return { state, effects: [] };
  }

  const spec = state.scenario.probes[probeId];
  const secondsRemaining = Math.max(0, state.resources.secondsRemaining - spec.timeCost);
  const battery = clampBattery(state.resources.battery - spec.batteryCost);

  const afterCost: GameState = {
    ...state,
    clockMinutes: minutesFromRemaining(secondsRemaining),
    resources: { ...state.resources, secondsRemaining, battery },
    notice: null,
  };

  // Il tempo speso può aver fatto avanzare la storia.
  const advanced = advanceMoments(afterCost);
  const s = advanced.state;

  const momentIndex = Math.max(0, s.momentIndex);
  const script = s.scenario.script[s.truth];
  const moment = script[momentIndex];
  const key = `${probeId}:${momentIndex}`;

  const effects: Effect[] = [{ type: 'HAPTIC', pattern: 'tap' }, ...advanced.effects];

  if (!moment) {
    return { state: s, effects };
  }

  if (s.seen[key]) {
    // Già scoperto in questo momento: avviso transitorio, nessuna riga nuova.
    return { state: { ...s, notice: spec.exhausted }, effects };
  }

  const text = probeId === 'peep' ? moment.peep : moment.search;
  const entry: LogEntry = {
    id: s.nextLogId,
    atMinutes: s.clockMinutes,
    text,
    causedBy: probeId,
  };

  const revealed: GameState = {
    ...s,
    resources: {
      ...s.resources,
      knowledge: s.resources.knowledge + spec.knowledgeGain,
    },
    seen: { ...s.seen, [key]: true },
    notice: null,
    log: [...s.log, entry],
    nextLogId: s.nextLogId + 1,
  };

  effects.push({ type: 'CLUE', text });

  const ended = maybeEnd(revealed);
  return { state: ended.state, effects: [...effects, ...ended.effects] };
}

/**
 * Attiva tutti i momenti il cui tempo è stato raggiunto (possono essere più di
 * uno dopo un'azione costosa). Ogni attivazione cambia scena e aggiunge la
 * riga ambientale al registro (causa: il tempo).
 */
function advanceMoments(state: GameState): ReduceResult {
  const elapsed = TOTAL_SECONDS - state.resources.secondsRemaining;
  const script = state.scenario.script[state.truth];

  let s = state;
  const effects: Effect[] = [];

  while (s.momentIndex + 1 < script.length && (script[s.momentIndex + 1]?.atSeconds ?? Infinity) <= elapsed) {
    const nextIndex = s.momentIndex + 1;
    const moment = script[nextIndex];
    if (!moment) break;

    const entry: LogEntry = {
      id: s.nextLogId,
      atMinutes: s.clockMinutes,
      text: moment.ambient,
      causedBy: 'time',
    };

    s = {
      ...s,
      momentIndex: nextIndex,
      scene: moment.scene,
      log: [...s.log, entry],
      nextLogId: s.nextLogId + 1,
    };

    effects.push({ type: 'BEAT', scene: moment.scene });
    if (TENSE_SCENES.has(moment.scene)) {
      effects.push({ type: 'HAPTIC', pattern: 'beat' });
    }
  }

  return { state: s, effects };
}

/** Se il tempo è esaurito, chiude la partita ed emette gli effetti del finale. */
function maybeEnd(state: GameState): ReduceResult {
  if (state.phase !== 'running' || state.resources.secondsRemaining > 0) {
    return { state, effects: [] };
  }
  const phase: Phase = 'ended';
  return {
    state: { ...state, phase, endReason: 'time_up' },
    effects: [{ type: 'TIME_UP' }, { type: 'HAPTIC', pattern: 'end' }],
  };
}

/** L'orologio diegetico avanza di quanto è stato consumato dai 10:00 iniziali. */
function minutesFromRemaining(secondsRemaining: number): number {
  const elapsedSeconds = TOTAL_SECONDS - secondsRemaining;
  return START_CLOCK_MINUTES + Math.floor(elapsedSeconds / 60);
}

function clampBattery(value: number): number {
  return Math.max(0, Math.min(100, value));
}
