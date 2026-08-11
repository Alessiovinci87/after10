import { useCallback } from 'react';
import type { Effect, GameState, ProbeId } from '@engine/index';
import { StatusBar } from '@ui/StatusBar';
import { Timer } from '@ui/Timer';
import { SceneStage } from '@ui/SceneStage';
import { ClueLog } from '@ui/ClueLog';
import { ActionBar } from '@ui/ActionBar';
import { Ending } from '@ui/Ending';
import { useEngine } from './useEngine';

/**
 * M2 — "Pianerottolo" con scene visive e storia che evolve nel tempo.
 * Uno stage SVG mostra lo spioncino (buio, sagome, torce, ombre sotto la
 * porta) mentre i momenti della sceneggiatura avanzano da soli. Spioncino
 * (−8s) e Cerca (−20s) rivelano il dettaglio del momento corrente.
 */
export function App() {
  const onEffect = useCallback((effect: Effect, _state: GameState) => {
    if (effect.type === 'HAPTIC' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const pattern = effect.pattern === 'end' ? [40, 60, 40] : effect.pattern === 'beat' ? 24 : 12;
      navigator.vibrate(pattern);
    }
  }, []);

  const { state, send, reset } = useEngine(onEffect);

  const onProbe = useCallback(
    (probe: ProbeId) => send({ type: 'PROBE', probe }),
    [send],
  );

  if (state.phase === 'ended') {
    return (
      <main className="os-shell">
        <StatusBar state={state} />
        <Ending state={state} onRestart={reset} />
      </main>
    );
  }

  return (
    <main className="os-shell">
      <StatusBar state={state} />
      <div className="stage-wrap">
        <SceneStage scene={state.scene} />
        <Timer state={state} />
      </div>
      <ClueLog log={state.log} />
      {state.notice && <p className="notice">{state.notice}</p>}
      <ActionBar probes={state.scenario.probes} onProbe={onProbe} />
    </main>
  );
}
