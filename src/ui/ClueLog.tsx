import { useEffect, useRef } from 'react';
import { formatClock, type GameState } from '@engine/index';

/**
 * Il registro: quello che osservi (azioni) e quello che accade da solo (tempo),
 * in ordine. Leggere qui non costa tempo. Si scorre sull'ultima voce. Le voci
 * dovute al tempo hanno un segno diverso da quelle dovute alle tue azioni.
 */
export function ClueLog({ state }: { state: GameState }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.log.length]);

  if (state.log.length === 0) {
    return (
      <div className="clue-log clue-log--empty">
        <p>Sei chiuso in casa. Qualcosa è successo sul pianerottolo.</p>
        <p className="clue-log__hint">Guarda, o cerca. Ma il tempo scorre da solo.</p>
      </div>
    );
  }

  return (
    <div className="clue-log">
      {state.log.map((entry) => (
        <p
          key={entry.id}
          className={`clue-log__line clue-log__line--${entry.causedBy === 'time' ? 'time' : 'act'}`}
        >
          <span className="clue-log__time">{formatClock(entry.atMinutes)}</span>
          <span className="clue-log__text">{entry.text}</span>
        </p>
      ))}
      <div ref={endRef} />
    </div>
  );
}
