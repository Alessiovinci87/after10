/** Superficie pubblica dell'engine. React importa solo da qui. */
export type {
  Action,
  DoorState,
  Effect,
  EndReason,
  Endings,
  GameState,
  LogEntry,
  Mood,
  NetworkState,
  Outcome,
  Phase,
  ProbeId,
  ProbeSpec,
  ReduceResult,
  Resources,
  Scenario,
  SceneId,
  Stage,
  Truth,
} from './types';
export { reduce, LOW_BATTERY } from './reducer';
export { createInitialState, START_CLOCK_MINUTES, TOTAL_SECONDS } from './state';
export { formatClock, formatTimer } from './format';
