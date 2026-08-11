import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initialState,
  reduce,
  type Action,
  type Effect,
  type GameState,
} from '@engine/index';

/**
 * Ponte React <-> engine.
 *
 * React è solo una vista: qui tratteniamo lo stato dell'engine e gli inviamo
 * azioni. L'unico "motore" del tempo è un loop su requestAnimationFrame che
 * emette TICK col delta reale trascorso (soft real-time). Gli `effects`
 * prodotti dal reducer vengono consegnati a un handler esterno.
 */
export function useEngine(onEffect?: (effect: Effect, state: GameState) => void) {
  const [state, dispatch] = useReducer(reduceWithEffects, undefined, () => ({
    game: initialState(),
    pending: [] as Effect[],
  }));

  // Handler degli effetti sempre aggiornato senza rilanciare il loop.
  const onEffectRef = useRef(onEffect);
  useEffect(() => {
    onEffectRef.current = onEffect;
  }, [onEffect]);

  // Consegna gli effetti accumulati (fuori dal render).
  useEffect(() => {
    if (state.pending.length === 0) return;
    for (const effect of state.pending) {
      onEffectRef.current?.(effect, state.game);
    }
    dispatch({ type: '@@drain' });
  }, [state.pending, state.game]);

  const send = useCallback((action: Action) => {
    dispatch({ type: '@@action', action });
  }, []);

  // Loop del tempo reale: finché la partita gira, TICK col delta effettivo.
  const running = state.game.phase === 'running';
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const deltaMs = now - last;
      last = now;
      dispatch({ type: '@@action', action: { type: 'TICK', deltaMs } });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  return { state: state.game, send };
}

interface Internal {
  game: GameState;
  pending: Effect[];
}

type InternalAction =
  | { type: '@@action'; action: Action }
  | { type: '@@drain' };

function reduceWithEffects(prev: Internal, message: InternalAction): Internal {
  switch (message.type) {
    case '@@action': {
      const { state, effects } = reduce(prev.game, message.action);
      return {
        game: state,
        pending: effects.length ? [...prev.pending, ...effects] : prev.pending,
      };
    }
    case '@@drain':
      return prev.pending.length ? { ...prev, pending: [] } : prev;
    default:
      return prev;
  }
}
