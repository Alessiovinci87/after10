/** Superficie pubblica dell'engine. React importa solo da qui. */
export type {
  Action,
  DoorState,
  Effect,
  EndReason,
  GameState,
  LogEntry,
  Moment,
  NetworkState,
  Phase,
  ProbeId,
  ProbeSpec,
  ReduceResult,
  Resources,
  Scenario,
  SceneId,
  Truth,
} from './types';
export { reduce } from './reducer';
export { createInitialState, START_CLOCK_MINUTES, TOTAL_SECONDS } from './state';
export { formatClock, formatTimer } from './format';
