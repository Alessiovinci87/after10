/**
 * AFTER 10 — Engine types.
 *
 * L'engine è TypeScript puro, disaccoppiato da React. La regola d'oro:
 *   reduce(state, action) -> { state, effects[] }
 * è una funzione pura: nessun side effect, nessun accesso a DOM/tempo reale.
 * React (e gli altri driver) osservano lo stato e traducono gli `effects`
 * in cose del mondo reale (audio, salvataggi, vibrazione...).
 */

/** Stato della porta d'ingresso. */
export type DoorState = 'chiusa' | 'aperta' | 'socchiusa';

/** Qualità della rete mostrata nella status bar. */
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
 * Un "beat" della storia: una riga di testo con la SUA scena e immagine, e il
 * suo umore. Ogni volta che un beat compare (per azione o per tempo) la scena
 * si aggiorna: così immagine e testo restano SEMPRE allineati.
 */
export interface Beat {
  readonly text: string;
  readonly scene: SceneId;
  /** Nome file immagine in public/scenes/ (es. 'int-3' → int-3.webp). */
  readonly image?: string;
  readonly mood: Mood;
}

/** Un beat che scatta da solo quando il tempo raggiunge `atSeconds`. */
export interface Moment extends Beat {
  readonly atSeconds: number;
}

/** Costo e resa di un'azione investigativa (i contenuti stanno nei beat). */
export interface ProbeSpec {
  readonly id: ProbeId;
  readonly label: string;
  readonly timeCost: number;
  readonly batteryCost: number;
  readonly knowledgeGain: number;
  readonly exhausted: string;
}

/** Scenario: pura DATA che l'engine consulta senza conoscerne il contenuto. */
export interface Scenario {
  readonly id: string;
  readonly probes: Record<ProbeId, ProbeSpec>;
  /** Beat a tempo (atmosfera che avanza anche senza agire). */
  readonly script: Record<Truth, readonly Moment[]>;
  /** Le scoperte di ogni azione, in coda: ogni tap rivela il beat successivo. */
  readonly reveals: Record<Truth, Record<ProbeId, readonly Beat[]>>;
  readonly endings: Record<Truth, string>;
}

/** Risorse del gioco: Tempo e Batteria visibili; Sicurezza e Conoscenza nascoste. */
export interface Resources {
  readonly secondsRemaining: number;
  readonly battery: number;
  readonly security: number;
  readonly knowledge: number;
}

export type Phase = 'running' | 'ended';
export type EndReason = 'time_up';

/** Voce del registro causale: cosa è successo/è stato fatto, e quando. */
export interface LogEntry {
  readonly id: number;
  readonly atMinutes: number;
  readonly text: string;
  readonly causedBy: ProbeId | 'time';
  readonly mood: Mood;
}

/** Stato completo e serializzabile della partita. */
export interface GameState {
  readonly phase: Phase;
  readonly endReason: EndReason | null;
  readonly resources: Resources;
  readonly clockMinutes: number;
  readonly door: DoorState;
  readonly network: NetworkState;
  readonly truth: Truth;
  readonly scenario: Scenario;
  /** Indice del prossimo beat a tempo ancora da attivare. */
  readonly momentIndex: number;
  /** Scena e immagine correnti (sempre allineate all'ultimo beat comparso). */
  readonly scene: SceneId;
  readonly image: string | null;
  readonly mood: Mood;
  /** Cursore nelle code delle azioni. */
  readonly probeCounts: Record<ProbeId, number>;
  readonly notice: string | null;
  readonly log: readonly LogEntry[];
  readonly nextLogId: number;
}

export type Action =
  | { readonly type: 'TICK'; readonly deltaMs: number }
  | { readonly type: 'PROBE'; readonly probe: ProbeId }
  | { readonly type: 'RESET'; readonly truth: Truth };

export type Effect =
  | { readonly type: 'TIME_UP' }
  | { readonly type: 'HAPTIC'; readonly pattern: 'tap' | 'beat' | 'end' }
  | { readonly type: 'CLUE'; readonly text: string }
  | { readonly type: 'BEAT'; readonly scene: SceneId; readonly mood: Mood };

export interface ReduceResult {
  readonly state: GameState;
  readonly effects: readonly Effect[];
}
