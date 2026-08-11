import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  createInitialState,
  reduce,
  type Action,
  type Effect,
  type GameState,
} from '@engine/index';
import { PIANEROTTOLO, pickTruth } from '@scenarios/pianerottolo';

/**
 * Ponte React <-> engine.
 *
 * React è solo una vista: qui tratteniamo lo stato dell'engine e gli inviamo
 * azioni. Il "motore" del tempo è un loop su requestAnimationFrame che emette
 * TICK col delta reale trascorso (soft real-time). Il wiring dello scenario
 * (Pianerottolo) e la scelta della verità vivono qui, nel composition root,
 * così l'engine resta puro.
 */
export function useEngine(onEffect?: (effect: Effect, state: GameState) => void) {
  const bootstrap = useMemo(
    () => () => ({
      game: createInitialState(PIANEROTTOLO, pickTruth()),
      pending: [] as Effect[],
    }),
    [],
  );

  const [state, dispatch] = useReducer(reduceWithEffects, undefined, bootstrap);

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

  const reset = useCallback(() => {
    dispatch({ type: '@@action', action: { type: 'RESET', truth: pickTruth() } });
  }, []);

  // Loop del tempo reale. Le animazioni sono CSS (indipendenti da React),
  // quindi non serve aggiornare lo stato a 60fps: accumuliamo il tempo reale
  // ed emettiamo un TICK ogni ~STEP_MS. Meno re-render = tap reattivi, e il
  // tempo resta accurato perché il TICK porta il delta realmente trascorso.
  // Il delta è limitato: se l'app va in background, il timer di fatto si mette
  // in pausa invece di fare un salto al ritorno.
  const running = state.game.phase === 'running';
  useEffect(() => {
    if (!running) return;
    const STEP_MS = 250;
    const MAX_DELTA_MS = 1000;
    let frame = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      acc += Math.min(now - last, MAX_DELTA_MS);
      last = now;
      if (acc >= STEP_MS) {
        dispatch({ type: '@@action', action: { type: 'TICK', deltaMs: acc } });
        acc = 0;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  return { state: state.game, send, reset };
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
