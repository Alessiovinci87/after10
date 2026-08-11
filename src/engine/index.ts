/** Superficie pubblica dell'engine. React importa solo da qui. */
export type {
  Action,
  DoorState,
  Effect,
  GameState,
  NetworkState,
  Phase,
  ReduceResult,
  Resources,
} from './types';
export { reduce } from './reducer';
export { initialState, TOTAL_SECONDS } from './state';
export { formatClock, formatTimer } from './format';
