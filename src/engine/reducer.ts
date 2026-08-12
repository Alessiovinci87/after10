import type {
  Action,
  Beat,
  Effect,
  GameState,
  LogEntry,
  Mood,
  Phase,
  ProbeId,
  ReduceResult,
} from './types';
import { createInitialState, START_CLOCK_MINUTES, TOTAL_SECONDS } from './state';

/** Punti percentuali di batteria consumati passivamente ogni secondo reale. */
const BATTERY_DRAIN_PER_SECOND = 8 / 600; // ~8% nell'arco dei 10 minuti.

/**
 * reduce(state, action) -> { state, effects[] }
 * Funzione PURA e totale: è il solo punto in cui lo stato evolve.
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
      throw new Error(`Azione non gestita: ${(action as Action).type}`);
  }
}

/**
 * Applica un beat: aggiorna scena, immagine e umore, aggiunge la riga al
 * registro (così testo e immagine restano allineati) e produce gli effetti
 * (vibrazione in base all'umore). Cuore condiviso tra tempo e azioni.
 */
function applyBeat(
  state: GameState,
  beat: Beat,
  causedBy: ProbeId | 'time',
): { state: GameState; effects: Effect[] } {
  const entry: LogEntry = {
    id: state.nextLogId,
    atMinutes: state.clockMinutes,
    text: beat.text,
    causedBy,
    mood: beat.mood,
  };
  const next: GameState = {
    ...state,
    scene: beat.scene,
    image: beat.image ?? state.image,
    mood: beat.mood,
    notice: null,
    log: [...state.log, entry],
    nextLogId: state.nextLogId + 1,
  };
  const effects: Effect[] = [
    { type: 'BEAT', scene: beat.scene, mood: beat.mood },
    { type: 'HAPTIC', pattern: hapticFor(beat.mood) },
    { type: 'CLUE', text: beat.text },
  ];
  return { state: next, effects };
}

function hapticFor(mood: Mood): 'tap' | 'beat' {
  return mood === 'panic' ? 'beat' : 'tap';
}

/**
 * Soft real-time: il clock scorre, la batteria cala e i beat a tempo scattano
 * quando il tempo li raggiunge (atmosfera che avanza anche senza agire).
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

/** Attiva tutti i beat a tempo il cui istante è stato raggiunto. */
function advanceMoments(state: GameState): ReduceResult {
  const elapsed = TOTAL_SECONDS - state.resources.secondsRemaining;
  const script = state.scenario.script[state.truth];

  let s = state;
  const effects: Effect[] = [];

  while (
    s.momentIndex + 1 < script.length &&
    (script[s.momentIndex + 1]?.atSeconds ?? Infinity) <= elapsed
  ) {
    const moment = script[s.momentIndex + 1];
    if (!moment) break;
    const applied = applyBeat({ ...s, momentIndex: s.momentIndex + 1 }, moment, 'time');
    s = applied.state;
    effects.push(...applied.effects);
  }

  return { state: s, effects };
}

/**
 * Azione investigativa: costa tempo e batteria, può far scattare beat a tempo,
 * poi rivela il beat successivo della propria coda (immagine + testo allineati).
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

  const advanced = advanceMoments(afterCost);
  const s = advanced.state;

  const queue = s.scenario.reveals[s.truth][probeId];
  const cursor = s.probeCounts[probeId];
  const preEffects: Effect[] = [{ type: 'HAPTIC', pattern: 'tap' }, ...advanced.effects];

  if (cursor >= queue.length) {
    return { state: { ...s, notice: spec.exhausted }, effects: preEffects };
  }

  const beat = queue[cursor];
  if (!beat) {
    return { state: s, effects: preEffects };
  }

  const applied = applyBeat(
    {
      ...s,
      resources: { ...s.resources, knowledge: s.resources.knowledge + spec.knowledgeGain },
      probeCounts: { ...s.probeCounts, [probeId]: cursor + 1 },
    },
    beat,
    probeId,
  );

  const ended = maybeEnd(applied.state);
  return { state: ended.state, effects: [...preEffects, ...applied.effects, ...ended.effects] };
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

function minutesFromRemaining(secondsRemaining: number): number {
  const elapsedSeconds = TOTAL_SECONDS - secondsRemaining;
  return START_CLOCK_MINUTES + Math.floor(elapsedSeconds / 60);
}

function clampBattery(value: number): number {
  return Math.max(0, Math.min(100, value));
}
