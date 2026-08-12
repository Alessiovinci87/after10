import type { GameState, Scenario, Truth } from './types';

/** Durata totale della partita in secondi (10:00). */
export const TOTAL_SECONDS = 600;

/** 22:41 diegetico = 22*60 + 41 minuti dalla mezzanotte. */
export const START_CLOCK_MINUTES = 22 * 60 + 41;

/**
 * Stato iniziale generico: l'engine non conosce nessuno scenario in
 * particolare, glielo passa il driver (composition root) insieme alla verità
 * scelta. Così l'engine resta puro e riusabile per slice futuri.
 */
export function createInitialState(scenario: Scenario, truth: Truth): GameState {
  return {
    phase: 'running',
    endReason: null,
    resources: {
      secondsRemaining: TOTAL_SECONDS,
      battery: 63,
      security: 100,
      knowledge: 0,
    },
    clockMinutes: START_CLOCK_MINUTES,
    door: 'chiusa',
    network: 'debole',
    truth,
    scenario,
    stageIndex: -1,
    scene: 'idle',
    image: null,
    mood: 'calm',
    seen: {},
    decision: false,
    outcome: null,
    lastStartleId: 0,
    log: [],
    nextLogId: 1,
  };
}
