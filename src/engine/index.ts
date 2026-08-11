/** Superficie pubblica dell'engine. React importa solo da qui. */
export type {
  Action,
  DoorState,
  Effect,
  EndReason,
  GameState,
  LogEntry,
  NetworkState,
  Phase,
  ProbeId,
  ProbeSpec,
  ReduceResult,
  Resources,
  Scenario,
  Truth,
} from './types';
export { reduce } from './reducer';
export { createInitialState, TOTAL_SECONDS } from './state';
export { formatClock, formatTimer } from './format';
