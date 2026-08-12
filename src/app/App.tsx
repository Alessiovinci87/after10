import { useCallback, useEffect, useRef, useState } from 'react';
import { LOW_BATTERY, type Effect, type GameState, type Outcome, type ProbeId } from '@engine/index';
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
 * audio procedurale, jumpscare e una scelta finale con conseguenze.
 */
export function App() {
  const audioRef = useRef<AudioEngine | null>(null);
  if (!audioRef.current) audioRef.current = new AudioEngine();
  const [muted, setMuted] = useState(false);
  const [scare, setScare] = useState<{ img: string | null; id: number } | null>(null);
  const scareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerScare = useCallback((img: string | null) => {
    setScare({ img, id: Date.now() });
    if (scareTimer.current) clearTimeout(scareTimer.current);
    scareTimer.current = setTimeout(() => setScare(null), 820);
  }, []);

  const onEffect = useCallback(
    (effect: Effect, _state: GameState) => {
      const audio = audioRef.current;
      switch (effect.type) {
        case 'HAPTIC':
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            const p =
              effect.pattern === 'shock'
                ? [0, 90, 40, 120]
                : effect.pattern === 'end'
                  ? [40, 60, 40]
                  : effect.pattern === 'beat'
                    ? 24
                    : 12;
            try {
              navigator.vibrate(p);
            } catch {
              /* alcuni browser bloccano vibrate senza gesto */
            }
          }
          break;
        case 'BEAT':
          audio?.beat(effect.scene, effect.mood);
          break;
        case 'SCARE':
          audio?.shock();
          triggerScare(effect.image);
          break;
        case 'DECISION':
          audio?.decision();
          break;
        case 'TIME_UP':
          audio?.end();
          break;
        default:
          break;
      }
    },
    [triggerScare],
  );

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

  const onChoose = useCallback(
    (choice: Outcome) => {
      audioRef.current?.resume();
      send({ type: 'CHOOSE', choice });
    },
    [send],
  );

  useEffect(() => {
    const start = () => audioRef.current?.resume();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, []);

  useEffect(() => {
    if (state.phase === 'running') audioRef.current?.revive();
  }, [state.phase]);

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
    <main
      className={`os-shell${scare ? ' os-shell--shake' : ''}${state.decision ? ' os-shell--decision' : ''}`}
    >
      <StatusBar state={state} />
      {audioButton}
      <div className="stage-wrap">
        <Scene scene={state.scene} image={state.image} mood={state.mood} />
        {state.resources.battery < LOW_BATTERY && (
          <div
            className="low-battery"
            style={{ opacity: Math.min(0.9, ((LOW_BATTERY - state.resources.battery) / LOW_BATTERY) * 0.9) }}
          />
        )}
        <Timer state={state} />
      </div>
      <ClueLog log={state.log} />
      {state.decision ? (
        <nav className="decision" aria-label="Scelta finale">
          <p className="decision__prompt">Restano pochi secondi. Cosa fai?</p>
          <div className="decision__row">
            <button type="button" className="decision__btn decision__btn--open" onClick={() => onChoose('open')}>
              Apri la porta
            </button>
            <button type="button" className="decision__btn" onClick={() => onChoose('stay')}>
              Resta immobile
            </button>
          </div>
        </nav>
      ) : (
        <ActionBar probes={state.scenario.probes} onProbe={onProbe} />
      )}

      {scare && (
        <div className="jumpscare" key={scare.id}>
          {scare.img && (
            <img className="jumpscare__img" src={`${import.meta.env.BASE_URL}scenes/${scare.img}.webp`} alt="" />
          )}
          <div className="jumpscare__flash" />
        </div>
      )}
    </main>
  );
}
