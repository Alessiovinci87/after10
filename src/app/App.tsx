import { useCallback, useEffect, useRef, useState } from 'react';
import type { Effect, GameState, ProbeId } from '@engine/index';
import { StatusBar } from '@ui/StatusBar';
import { Timer } from '@ui/Timer';
import { Scene } from '@ui/Scene';
import { ClueLog } from '@ui/ClueLog';
import { ActionBar } from '@ui/ActionBar';
import { Ending } from '@ui/Ending';
import { AudioEngine } from '@audio/AudioEngine';
import { useEngine } from './useEngine';

/**
 * AFTER 10 — il finto OS giocabile: scene cinematografiche, storia a stadi,
 * audio procedurale reattivo all'umore. React è solo una vista dell'engine e
 * traduce gli `effects` in mondo reale (vibrazione, audio).
 */
export function App() {
  const audioRef = useRef<AudioEngine | null>(null);
  if (!audioRef.current) audioRef.current = new AudioEngine();
  const [muted, setMuted] = useState(false);

  const onEffect = useCallback((effect: Effect, _state: GameState) => {
    const audio = audioRef.current;
    if (effect.type === 'HAPTIC' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const pattern = effect.pattern === 'end' ? [40, 60, 40] : effect.pattern === 'beat' ? 24 : 12;
      try {
        navigator.vibrate(pattern);
      } catch {
        /* alcuni browser bloccano vibrate senza gesto: ignora */
      }
    } else if (effect.type === 'BEAT') {
      audio?.beat(effect.scene, effect.mood);
    } else if (effect.type === 'TIME_UP') {
      audio?.end();
    }
  }, []);

  const { state, send, reset } = useEngine(onEffect);

  const onProbe = useCallback(
    (probe: ProbeId) => {
      const audio = audioRef.current;
      audio?.resume();
      audio?.probe(probe);
      send({ type: 'PROBE', probe });
    },
    [send],
  );

  // Avvia l'audio al primo tocco (richiesto da iOS), una volta sola.
  useEffect(() => {
    const start = () => audioRef.current?.resume();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, []);

  // Ripristina l'atmosfera quando (ri)parte una partita.
  useEffect(() => {
    if (state.phase === 'running') audioRef.current?.revive();
  }, [state.phase]);

  // Pulizia alla chiusura.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.dispose();
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audioRef.current?.resume();
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const audioButton = (
    <button
      type="button"
      className="audio-toggle"
      onClick={toggleMute}
      aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );

  if (state.phase === 'ended') {
    return (
      <main className="os-shell">
        <StatusBar state={state} />
        {audioButton}
        <Ending state={state} onRestart={reset} />
      </main>
    );
  }

  return (
    <main className="os-shell">
      <StatusBar state={state} />
      {audioButton}
      <div className="stage-wrap">
        <Scene scene={state.scene} image={state.image} mood={state.mood} />
        <Timer state={state} />
      </div>
      <ClueLog log={state.log} />
      <ActionBar probes={state.scenario.probes} onProbe={onProbe} />
    </main>
  );
}
