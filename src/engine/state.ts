import type { GameState } from './types';

/** Durata totale della partita in secondi (10:00). */
export const TOTAL_SECONDS = 600;

/** 22:41 diegetico = 22*60 + 41 minuti dalla mezzanotte. */
const START_CLOCK_MINUTES = 22 * 60 + 41;

/**
 * Stato iniziale del M0: schermo nero, status bar a 22:41 · batteria 63% ·
 * rete debole · porta chiusa, e un timer di 10:00 pronto a scorrere.
 */
export function initialState(): GameState {
  return {
    phase: 'running',
    resources: {
      secondsRemaining: TOTAL_SECONDS,
      battery: 63,
      security: 100,
      knowledge: 0,
    },
    clockMinutes: START_CLOCK_MINUTES,
    door: 'chiusa',
    network: 'debole',
  };
}
