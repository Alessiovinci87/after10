import { memo } from 'react';
import type { ProbeId, ProbeSpec } from '@engine/index';

const PROBE_ORDER: readonly ProbeId[] = ['peep', 'search'];

/**
 * Le azioni del giocatore. Spioncino e Cerca costano tempo; Chiama aiuto costa
 * molta batteria per poca speranza. Non si disabilitano: la scelta di spendere
 * tempo/batteria È il gioco.
 */
export const ActionBar = memo(function ActionBar({
  probes,
  onProbe,
  onCall,
}: {
  probes: Record<ProbeId, ProbeSpec>;
  onProbe: (probe: ProbeId) => void;
  onCall: () => void;
}) {
  return (
    <nav className="action-bar" aria-label="Azioni">
      {PROBE_ORDER.map((id) => {
        const spec = probes[id];
        return (
          <button
            key={id}
            type="button"
            className="action-bar__btn"
            onClick={() => onProbe(id)}
          >
            <span className="action-bar__label">{spec.label}</span>
            <span className="action-bar__cost">−{spec.timeCost}s</span>
          </button>
        );
      })}
      <button type="button" className="action-bar__btn action-bar__btn--call" onClick={onCall}>
        <span className="action-bar__label">Chiama aiuto</span>
        <span className="action-bar__cost action-bar__cost--batt">−batteria</span>
      </button>
    </nav>
  );
});
