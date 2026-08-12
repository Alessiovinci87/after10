import type {
  Action,
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

/** Sotto questa carica lo schermo si oscura e vedere costa di più. */
export const LOW_BATTERY = 20;
/** Moltiplicatore del costo in tempo delle azioni a batteria scarica. */
const LOW_BATTERY_PENALTY = 1.6;

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
    case 'CHOOSE':
      return choose(state, action.choice);
    case 'RESET':
      return { state: createInitialState(state.scenario, action.truth), effects: [] };
    default:
      throw new Error(`Azione non gestita: ${(action as Action).type}`);
  }
}

/** Aggiunge una riga al registro aggiornando scena/immagine/umore (se dati). */
function pushLine(
  state: GameState,
  text: string,
  causedBy: ProbeId | 'time',
  mood: Mood,
  scene = state.scene,
  image = state.image,
): { state: GameState; effects: Effect[] } {
  const entry: LogEntry = {
    id: state.nextLogId,
    atMinutes: state.clockMinutes,
    text,
    causedBy,
    mood,
  };
  return {
    state: {
      ...state,
      scene,
      image,
      mood,
      log: [...state.log, entry],
      nextLogId: state.nextLogId + 1,
    },
    effects: [
      { type: 'BEAT', scene, mood },
      { type: 'HAPTIC', pattern: mood === 'panic' ? 'beat' : 'tap' },
      { type: 'CLUE', text },
    ],
  };
}

/** Soft real-time: clock, batteria e avanzamento degli stadi a tempo. */
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

  const advanced = advanceStages(moved);
  const ended = maybeEnd(advanced.state);
  return { state: ended.state, effects: [...advanced.effects, ...ended.effects] };
}

/** Attiva gli stadi il cui istante è stato raggiunto (atmosfera che avanza). */
function advanceStages(state: GameState): ReduceResult {
  const elapsed = TOTAL_SECONDS - state.resources.secondsRemaining;
  const stages = state.scenario.stages[state.truth];

  let s = state;
  const effects: Effect[] = [];

  while (
    s.stageIndex + 1 < stages.length &&
    (stages[s.stageIndex + 1]?.atSeconds ?? Infinity) <= elapsed
  ) {
    const nextIndex = s.stageIndex + 1;
    const stage = stages[nextIndex];
    if (!stage) break;
    const moved: GameState = { ...s, stageIndex: nextIndex };
    const applied = pushLine(moved, stage.ambient, 'time', stage.mood, stage.scene, stage.image ?? moved.image);
    s = applied.state;
    effects.push(...applied.effects);
    if (stage.scare) {
      effects.push({ type: 'SCARE', image: s.image }, { type: 'HAPTIC', pattern: 'shock' });
    }
    // Ultimo stadio: si sblocca la scelta finale (apri / resta).
    if (nextIndex === stages.length - 1 && !s.decision) {
      s = { ...s, decision: true };
      effects.push({ type: 'DECISION' });
    }
  }

  return { state: s, effects };
}

/**
 * Azione investigativa: costa tempo e batteria, aggiorna gli stadi a tempo, poi
 * riporta lo STATO ATTUALE della minaccia. Se in questo stadio l'hai già visto,
 * dà una riga di tensione (che varia) invece di un vicolo cieco.
 */
function probe(state: GameState, probeId: ProbeId): ReduceResult {
  if (state.phase !== 'running') {
    return { state, effects: [] };
  }

  const spec = state.scenario.probes[probeId];
  // Batteria scarica: fumbling al buio, vedere costa di più.
  const lowBatt = state.resources.battery < LOW_BATTERY;
  const timeCost = lowBatt ? Math.round(spec.timeCost * LOW_BATTERY_PENALTY) : spec.timeCost;
  const secondsRemaining = Math.max(0, state.resources.secondsRemaining - timeCost);
  const battery = clampBattery(state.resources.battery - spec.batteryCost);

  const afterCost: GameState = {
    ...state,
    clockMinutes: minutesFromRemaining(secondsRemaining),
    resources: { ...state.resources, secondsRemaining, battery },
  };

  const advanced = advanceStages(afterCost);
  const s = advanced.state;
  const preEffects: Effect[] = [...advanced.effects];

  const stages = s.scenario.stages[s.truth];
  const idx = Math.max(0, s.stageIndex);
  const stage = stages[idx];
  if (!stage) {
    return { state: s, effects: [...preEffects, { type: 'HAPTIC', pattern: 'tap' }] };
  }

  const key = `${probeId}:${idx}`;
  const firstTimeHere = !s.seen[key];

  let applied;
  if (firstTimeHere) {
    // Stato attuale della minaccia in questo stadio (sostanziale).
    const text = probeId === 'peep' ? stage.peep : stage.search;
    const withKnowledge: GameState = {
      ...s,
      seen: { ...s.seen, [key]: true },
      resources: { ...s.resources, knowledge: s.resources.knowledge + spec.knowledgeGain },
    };
    applied = pushLine(withKnowledge, text, probeId, stage.mood, stage.scene, stage.image ?? s.image);
  } else {
    // Già controllato in questo stadio: riga di tensione che varia (mai vuoto).
    const pool = s.scenario.filler[s.mood];
    const text = pool[s.nextLogId % pool.length] ?? '…';
    applied = pushLine(s, text, probeId, s.mood);
  }

  // Startle: un jumpscare a sorpresa può colpire mentre controlli (mai al calmo).
  const startled = withStartle(applied.state, probeId);

  const ended = maybeEnd(startled.state);
  return {
    state: ended.state,
    effects: [...preEffects, ...applied.effects, ...startled.effects, ...ended.effects],
  };
}

/**
 * Spavento a sorpresa deterministico ma imprevedibile per il giocatore: un
 * hash del contatore decide, con cooldown, se scatta. Puro (niente Math.random
 * dentro reduce). Più probabile nel panico; mai quando sei calmo.
 */
function withStartle(state: GameState, probeId: ProbeId): ReduceResult {
  if (state.mood === 'calm') return { state, effects: [] };
  if (state.nextLogId - state.lastStartleId < 4) return { state, effects: [] };
  const hash = (state.nextLogId * 2654435761) >>> 0;
  const chance = state.mood === 'panic' ? 30 : 16;
  if (hash % 100 >= chance) return { state, effects: [] };

  const pool = state.scenario.startles[state.truth];
  const text = pool[hash % pool.length] ?? '!';
  const applied = pushLine(
    { ...state, lastStartleId: state.nextLogId },
    text,
    probeId,
    'panic',
  );
  return {
    state: applied.state,
    effects: [
      ...applied.effects,
      { type: 'SCARE', image: applied.state.image },
      { type: 'HAPTIC', pattern: 'shock' },
    ],
  };
}

/** La scelta finale: chiude la partita con l'esito scelto. */
function choose(state: GameState, choice: 'open' | 'stay'): ReduceResult {
  if (state.phase !== 'running' || !state.decision) {
    return { state, effects: [] };
  }
  return {
    state: { ...state, phase: 'ended', endReason: 'chose', outcome: choice },
    effects: [{ type: 'HAPTIC', pattern: choice === 'open' ? 'shock' : 'end' }],
  };
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
