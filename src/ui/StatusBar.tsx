import { formatClock, LOW_BATTERY, type GameState } from '@engine/index';

const NETWORK_LABEL: Record<GameState['network'], string> = {
  assente: 'rete assente',
  debole: 'rete debole',
  buona: 'rete buona',
};

const DOOR_LABEL: Record<GameState['door'], string> = {
  chiusa: 'porta chiusa',
  socchiusa: 'porta socchiusa',
  aperta: 'porta aperta',
};

/**
 * Status bar del finto OS: 22:41 · batteria 63% · rete debole · porta chiusa.
 * È una vista pura dello stato dell'engine.
 */
export function StatusBar({ state }: { state: GameState }) {
  return (
    <header className="status-bar" role="status" aria-live="off">
      <span className="status-bar__clock">{formatClock(state.clockMinutes)}</span>
      <span className="status-bar__dot" aria-hidden="true">·</span>
      <span className={state.resources.battery < LOW_BATTERY ? 'status-bar__low' : undefined}>
        batteria {Math.round(state.resources.battery)}%
      </span>
      <span className="status-bar__dot" aria-hidden="true">·</span>
      <span>{NETWORK_LABEL[state.network]}</span>
      <span className="status-bar__dot" aria-hidden="true">·</span>
      <span>{DOOR_LABEL[state.door]}</span>
    </header>
  );
}
