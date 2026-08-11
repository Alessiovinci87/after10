/**
 * AFTER 10 — Engine types.
 *
 * L'engine è TypeScript puro, disaccoppiato da React. La regola d'oro:
 *   reduce(state, action) -> { state, effects[] }
 * è una funzione pura: nessun side effect, nessun accesso a DOM/tempo reale.
 * React (e gli altri driver) osservano lo stato e traducono gli `effects`
 * in cose del mondo reale (audio, salvataggi, vibrazione...).
 */

/** Stato della porta d'ingresso — al M0 è statica. */
export type DoorState = 'chiusa' | 'aperta' | 'socchiusa';

/** Qualità della rete mostrata nella status bar. */
export type NetworkState = 'assente' | 'debole' | 'buona';

/**
 * Risorse del gioco.
 * Tempo e Batteria sono VISIBILI; Sicurezza e Conoscenza sono NASCOSTE
 * (guidano gli esiti ma non compaiono nella UI).
 */
export interface Resources {
  /** Tempo residuo in secondi. Parte da 600 (10:00) e scorre fino a 0. */
  readonly secondsRemaining: number;
  /** Batteria del telefono in percentuale (0..100). Visibile. */
  readonly battery: number;
  /** Risorsa nascosta: quanto il giocatore è al sicuro. */
  readonly security: number;
  /** Risorsa nascosta: quanto il giocatore ha capito la situazione. */
  readonly knowledge: number;
}

/** Fase della partita. */
export type Phase = 'running' | 'ended';

/**
 * Stato completo e serializzabile della partita.
 * Deve poter essere salvato/ripristinato as-is (nessuna funzione, nessuna ref).
 */
export interface GameState {
  readonly phase: Phase;
  readonly resources: Resources;
  /** Orologio diegetico mostrato nella status bar (minuti dalla mezzanotte). */
  readonly clockMinutes: number;
  readonly door: DoorState;
  readonly network: NetworkState;
}

/**
 * Azioni che l'engine sa ridurre.
 * TICK è l'unica sorgente di avanzamento del tempo: il driver (React) la
 * emette col delta realmente trascorso. Le azioni del giocatore verranno
 * aggiunte negli slice successivi.
 */
export type Action =
  | { readonly type: 'TICK'; readonly deltaMs: number };

/**
 * Effetti: intenti verso il mondo esterno, prodotti dal reducer ma eseguiti
 * altrove. Mantenerli come dati (non callback) tiene l'engine puro e testabile.
 */
export type Effect =
  | { readonly type: 'TIME_UP' };

/** Risultato di ogni riduzione. */
export interface ReduceResult {
  readonly state: GameState;
  readonly effects: readonly Effect[];
}
