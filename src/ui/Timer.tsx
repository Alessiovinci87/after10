import { formatTimer, type GameState } from '@engine/index';

/**
 * Timer 10:00 -> 00:00. Al M0 è l'unico elemento "vivo" sullo schermo nero.
 * Entra in stato "urgente" negli ultimi 60 secondi.
 */
export function Timer({ state }: { state: GameState }) {
  const seconds = state.resources.secondsRemaining;
  const urgent = seconds <= 60;
  return (
    <div
      className={`timer${urgent ? ' timer--urgent' : ''}`}
      role="timer"
      aria-label="Tempo rimanente"
    >
      {formatTimer(seconds)}
    </div>
  );
}
