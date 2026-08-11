import { memo } from 'react';
import type { ProbeId, ProbeSpec } from '@engine/index';

const PROBE_ORDER: readonly ProbeId[] = ['peep', 'search'];

/**
 * Le azioni del giocatore. Ognuna costa tempo (mostrato in etichetta) e un po'
 * di batteria. Non si disabilitano: la scelta di "spendere secondi" è il gioco.
 *
 * Memoizzato: le specifiche delle azioni non cambiano coi tick, quindi la barra
 * non si ridisegna mentre scorre il tempo — i tap restano immediati.
 */
export const ActionBar = memo(function ActionBar({
  probes,
  onProbe,
}: {
  probes: Record<ProbeId, ProbeSpec>;
  onProbe: (probe: ProbeId) => void;
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
    </nav>
  );
});
