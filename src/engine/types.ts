/**
 * AFTER 10 — Engine types.
 *
 * L'engine è TypeScript puro, disaccoppiato da React. La regola d'oro:
 *   reduce(state, action) -> { state, effects[] }
 * è una funzione pura: nessun side effect, nessun accesso a DOM/tempo reale.
 * React (e gli altri driver) osservano lo stato e traducono gli `effects`
 * in cose del mondo reale (audio, salvataggi, vibrazione...).
 */

export type DoorState = 'chiusa' | 'aperta' | 'socchiusa';
export type NetworkState = 'assente' | 'debole' | 'buona';

/** Le 3 verità nascoste sulla stessa situazione del pianerottolo. */
export type Truth = 'blackout' | 'intrusione' | 'falso_allarme';

/** Azioni "investigative" del giocatore che costano tempo. */
export type ProbeId = 'peep' | 'search';

/** Scena visiva (per il fallback vettoriale e le classi di intensità). */
export type SceneId = 'idle' | 'calm' | 'dark' | 'figure' | 'torch' | 'door';

/** Umore del momento: guida l'intensità visiva e la vibrazione. */
export type Mood = 'calm' | 'tense' | 'panic';

/**
 * Uno "stadio" della notte: la situazione a un certo istante. Guardare o
 * cercare in questo stadio restituisce `peep`/`search` (lo stato ATTUALE della
 * minaccia, non una lista che si esaurisce). Col tempo si passa allo stadio
 * successivo e lo stato cambia. Ogni stadio porta scena, immagine e umore, così
 * testo e foto restano allineati.
 */
export interface Stage {
  /** Secondi trascorsi dall'inizio a cui lo stadio diventa quello corrente. */
  readonly atSeconds: number;
  readonly scene: SceneId;
  readonly image?: string;
  readonly mood: Mood;
  /** Riga che compare da sola quando lo stadio inizia (avanzamento a tempo). */
  readonly ambient: string;
  /** Cosa vedi allo spioncino, ORA. */
  readonly peep: string;
  /** Cosa trovi cercando in casa, ORA. */
  readonly search: string;
  /** Se true, l'ingresso in questo stadio scatena un jumpscare. */
  readonly scare?: boolean;
}

/** La scelta finale del giocatore quando il tempo sta per scadere. */
export type Outcome = 'open' | 'stay';

/** Testi di chiusura per ciascun esito. `timeout` = non ha scelto in tempo. */
export interface Endings {
  readonly open: string;
  readonly stay: string;
  readonly timeout: string;
}

export interface ProbeSpec {
  readonly id: ProbeId;
  readonly label: string;
  readonly timeCost: number;
  readonly batteryCost: number;
  readonly knowledgeGain: number;
}

/** Scenario: pura DATA che l'engine consulta senza conoscerne il contenuto. */
export interface Scenario {
  readonly id: string;
  readonly probes: Record<ProbeId, ProbeSpec>;
  /** Gli stadi della notte per ciascuna verità, in ordine di tempo. */
  readonly stages: Record<Truth, readonly Stage[]>;
  /**
   * Righe di "tensione" per quando controlli e non è cambiato nulla: variano
   * per umore, così premere dà sempre atmosfera invece di un vicolo cieco.
   */
  readonly filler: Record<Mood, readonly string[]>;
  /** Righe per i jumpscare "a sorpresa" (startle) durante le azioni. */
  readonly startles: Record<Truth, readonly string[]>;
  readonly endings: Record<Truth, Endings>;
}

export interface Resources {
  readonly secondsRemaining: number;
  readonly battery: number;
  readonly security: number;
  readonly knowledge: number;
}

export type Phase = 'running' | 'ended';
export type EndReason = 'time_up' | 'chose';

export interface LogEntry {
  readonly id: number;
  readonly atMinutes: number;
  readonly text: string;
  readonly causedBy: ProbeId | 'time';
  readonly mood: Mood;
}

export interface GameState {
  readonly phase: Phase;
  readonly endReason: EndReason | null;
  readonly resources: Resources;
  readonly clockMinutes: number;
  readonly door: DoorState;
  readonly network: NetworkState;
  readonly truth: Truth;
  readonly scenario: Scenario;
  /** Indice dello stadio corrente (-1 = non ancora iniziato). */
  readonly stageIndex: number;
  readonly scene: SceneId;
  readonly image: string | null;
  readonly mood: Mood;
  /** Chiavi "probe:stadio" già mostrate in modo sostanziale. */
  readonly seen: Record<string, boolean>;
  /** true quando è disponibile la scelta finale (ultimo stadio). */
  readonly decision: boolean;
  /** L'esito scelto dal giocatore (null = non ha ancora scelto). */
  readonly outcome: Outcome | null;
  /** Id dell'ultimo startle, per il cooldown tra spaventi a sorpresa. */
  readonly lastStartleId: number;
  readonly log: readonly LogEntry[];
  readonly nextLogId: number;
}

export type Action =
  | { readonly type: 'TICK'; readonly deltaMs: number }
  | { readonly type: 'PROBE'; readonly probe: ProbeId }
  | { readonly type: 'CHOOSE'; readonly choice: Outcome }
  | { readonly type: 'RESET'; readonly truth: Truth };

export type Effect =
  | { readonly type: 'TIME_UP' }
  | { readonly type: 'HAPTIC'; readonly pattern: 'tap' | 'beat' | 'end' | 'shock' }
  | { readonly type: 'CLUE'; readonly text: string }
  | { readonly type: 'BEAT'; readonly scene: SceneId; readonly mood: Mood }
  | { readonly type: 'SCARE'; readonly image: string | null }
  | { readonly type: 'DECISION' };

export interface ReduceResult {
  readonly state: GameState;
  readonly effects: readonly Effect[];
}
