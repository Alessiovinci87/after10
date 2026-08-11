import { useCallback } from 'react';
import type { Effect, GameState } from '@engine/index';
import { StatusBar } from '@ui/StatusBar';
import { Timer } from '@ui/Timer';
import { useEngine } from './useEngine';

/**
 * M0 — il guscio del finto OS.
 * Schermo nero, status bar in alto, timer al centro che scorre davvero.
 * Nessuna interazione ancora: solo il tempo che passa.
 */
export function App() {
  const onEffect = useCallback((effect: Effect, _state: GameState) => {
    if (effect.type === 'TIME_UP') {
      // Al M0 il finale non esiste ancora: il timer resta a 0:00.
      // Gli slice successivi engancheranno qui la scena di chiusura.
    }
  }, []);

  const { state } = useEngine(onEffect);

  return (
    <main className="os-shell">
      <StatusBar state={state} />
      <section className="os-screen">
        <Timer state={state} />
      </section>
    </main>
  );
}
