import { formatClock, type GameState, type Truth } from '@engine/index';

const TRUTH_LABEL: Record<Truth, string> = {
  blackout: 'Blackout',
  intrusione: 'Intrusione',
  falso_allarme: 'Falso allarme',
};

/**
 * Schermata finale. Quando il tempo finisce, si rivela la verità e si ricostruisce
 * la timeline causale: cosa hai osservato, quando, e cosa ti è costato.
 */
export function Ending({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const { truth, scenario, log, outcome } = state;
  const key = outcome ?? 'timeout';
  // Aprire durante un'intrusione, o esitare fino allo scadere: è fatale.
  const fatal = truth === 'intrusione' && outcome !== 'stay';
  return (
    <div className={`ending${fatal ? ' ending--fatal' : ''}`} role="dialog" aria-label="Finale">
      <p className="ending__clock">Sono le {formatClock(state.clockMinutes)}.</p>
      <h1 className="ending__truth">{TRUTH_LABEL[truth]}</h1>
      <p className="ending__text">{scenario.endings[truth][key]}</p>

      <div className="ending__timeline">
        <p className="ending__timeline-title">Cosa è successo</p>
        {log.length === 0 ? (
          <p className="ending__timeline-empty">
            Non hai guardato, non hai cercato. Hai solo aspettato che finisse.
          </p>
        ) : (
          <ol>
            {log.map((entry) => (
              <li key={entry.id}>
                <span className="ending__timeline-time">{formatClock(entry.atMinutes)}</span>
                <span className="ending__timeline-text">{entry.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <button type="button" className="ending__restart" onClick={onRestart}>
        Ancora dieci minuti
      </button>
    </div>
  );
}
