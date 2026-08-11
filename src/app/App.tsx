import { useCallback } from 'react';
import type { Effect, GameState, ProbeId } from '@engine/index';
import { StatusBar } from '@ui/StatusBar';
import { Timer } from '@ui/Timer';
import { ClueLog } from '@ui/ClueLog';
import { ActionBar } from '@ui/ActionBar';
import { Ending } from '@ui/Ending';
import { useEngine } from './useEngine';

/**
 * M1 — slice "Pianerottolo".
 * Il finto OS ora è giocabile: guardi dallo spioncino (−8s) o cerchi in casa
 * (−20s), gli indizi si accumulano, e quando il tempo finisce si rivela quale
 * delle tre verità stava davvero accadendo.
 */
export function App() {
  const onEffect = useCallback((effect: Effect, _state: GameState) => {
    if (effect.type === 'HAPTIC' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(effect.pattern === 'end' ? [40, 60, 40] : 12);
    }
  }, []);

  const { state, send, reset } = useEngine(onEffect);

  const onProbe = useCallback(
    (probe: ProbeId) => send({ type: 'PROBE', probe }),
    [send],
  );

  const ended = state.phase === 'ended';

  return (
    <main className="os-shell">
      <StatusBar state={state} />
      {ended ? (
        <Ending state={state} onRestart={reset} />
      ) : (
        <>
          <section className="os-screen">
            <Timer state={state} />
            <ClueLog state={state} />
          </section>
          <ActionBar state={state} onProbe={onProbe} />
        </>
      )}
    </main>
  );
}
