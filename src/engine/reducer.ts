import type { Action, Effect, GameState, Phase, ReduceResult } from './types';

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
    default:
      // Con più azioni sostituire con `return assertNever(action)` per
      // riattivare il controllo di esaustività a compile-time.
      throw new Error(`Azione non gestita: ${(action as Action).type}`);
  }
}

/**
 * Avanzamento soft real-time: il clock scorre col tempo reale trascorso.
 * Leggere non costa secondi (nessuna azione qui); solo TICK consuma tempo.
 */
function tick(state: GameState, deltaMs: number): ReduceResult {
  if (state.phase !== 'running' || deltaMs <= 0) {
    return { state, effects: [] };
  }

  const deltaSeconds = deltaMs / 1000;
  const secondsRemaining = Math.max(0, state.resources.secondsRemaining - deltaSeconds);

  const effects: Effect[] = [];
  let phase: Phase = state.phase;

  if (secondsRemaining <= 0) {
    phase = 'ended';
    effects.push({ type: 'TIME_UP' });
  }

  return {
    state: {
      ...state,
      phase,
      resources: {
        ...state.resources,
        secondsRemaining,
      },
    },
    effects,
  };
}
