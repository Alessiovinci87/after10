import type {
  Action,
  Effect,
  GameState,
  LogEntry,
  Phase,
  ProbeId,
  ReduceResult,
} from './types';
import { createInitialState } from './state';

/** Punti percentuali di batteria consumati passivamente ogni secondo reale. */
const BATTERY_DRAIN_PER_SECOND = 8 / 600; // ~8% nell'arco dei 10 minuti.

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
 * Avanzamento soft real-time: il clock scorre col tempo reale trascorso e la
 * batteria cala lentamente. Leggere non costa secondi (nessuna azione qui);
 * solo TICK e le azioni investigative consumano tempo.
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

  const next: GameState = {
    ...state,
    clockMinutes: minutesFromRemaining(secondsRemaining),
    resources: { ...state.resources, secondsRemaining, battery },
  };

  return maybeEnd(next);
}

/**
 * Azione investigativa (spioncino / cerca): costa tempo e batteria, alza la
 * Conoscenza e rivela l'indizio successivo coerente con la verità in corso.
 */
function probe(state: GameState, probeId: ProbeId): ReduceResult {
  if (state.phase !== 'running') {
    return { state, effects: [] };
  }

  const spec = state.scenario.probes[probeId];
  const count = state.probeCounts[probeId];
  const clueList = spec.clues[state.truth];
  const clueText = count < clueList.length ? clueList[count] : spec.exhausted;
  const isNew = count < clueList.length;

  const secondsRemaining = Math.max(0, state.resources.secondsRemaining - spec.timeCost);
  const battery = clampBattery(state.resources.battery - spec.batteryCost);
  const clockMinutes = minutesFromRemaining(secondsRemaining);

  const entry: LogEntry = {
    id: state.nextLogId,
    atMinutes: clockMinutes,
    text: clueText ?? spec.exhausted,
    causedBy: probeId,
  };

  const next: GameState = {
    ...state,
    clockMinutes,
    resources: {
      ...state.resources,
      secondsRemaining,
      battery,
      knowledge: isNew
        ? state.resources.knowledge + spec.knowledgeGain
        : state.resources.knowledge,
    },
    probeCounts: { ...state.probeCounts, [probeId]: count + 1 },
    log: [...state.log, entry],
    nextLogId: state.nextLogId + 1,
  };

  const effects: Effect[] = [
    { type: 'HAPTIC', pattern: 'tap' },
    { type: 'CLUE', text: entry.text },
  ];

  const ended = maybeEnd(next);
  return { state: ended.state, effects: [...effects, ...ended.effects] };
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
  const elapsedSeconds = 600 - secondsRemaining;
  const startMinutes = 22 * 60 + 41;
  return startMinutes + Math.floor(elapsedSeconds / 60);
}

function clampBattery(value: number): number {
  return Math.max(0, Math.min(100, value));
}
