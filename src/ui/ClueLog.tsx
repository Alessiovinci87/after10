import { memo, useEffect, useRef } from 'react';
import { formatClock, type LogEntry } from '@engine/index';

/**
 * Il registro: quello che osservi (azioni) e quello che accade da solo (tempo),
 * in ordine. Leggere qui non costa tempo. Si scorre sull'ultima voce. Le voci
 * dovute al tempo hanno un segno diverso da quelle dovute alle tue azioni.
 *
 * Memoizzato sul solo `log`: i tick del timer non lo ridisegnano (cambia solo
 * quando arriva una voce nuova), così i tap restano reattivi.
 */
export const ClueLog = memo(function ClueLog({ log }: { log: readonly LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [log.length]);

  if (log.length === 0) {
    return (
      <div className="clue-log clue-log--empty">
        <p>Sei chiuso in casa. Qualcosa è successo sul pianerottolo.</p>
        <p className="clue-log__hint">Guarda, o cerca. Ma il tempo scorre da solo.</p>
      </div>
    );
  }

  return (
    <div className="clue-log">
      {log.map((entry) => (
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
});
