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

/**
 * Le 3 verità nascoste sulla stessa situazione del pianerottolo.
 * Il giocatore non la vede mai in chiaro finché non arriva al finale.
 */
export type Truth = 'blackout' | 'intrusione' | 'falso_allarme';

/** Azioni "investigative" del giocatore che costano tempo. */
export type ProbeId = 'peep' | 'search';

/** Scena visiva mostrata dallo stage SVG (segue i momenti della storia). */
export type SceneId = 'idle' | 'calm' | 'dark' | 'figure' | 'torch' | 'door';

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

/** Perché la partita è finita. */
export type EndReason = 'time_up';

/**
 * Un "momento" della storia: si attiva quando il tempo trascorso supera
 * `atSeconds`. Cambia la scena visibile, aggiunge una riga ambientale al
 * registro e ridefinisce cosa rivelano le azioni finché è quello corrente.
 * Così il contenuto evolve col tempo invece di esaurirsi.
 */
export interface Moment {
  /** Secondi trascorsi dall'inizio a cui il momento si attiva. */
  readonly atSeconds: number;
  readonly scene: SceneId;
  /**
   * Nome file (senza estensione) dell'immagine cinematografica in
   * public/scenes/ (es. 'blk-1' → public/scenes/blk-1.webp). Se manca il file,
   * si ripiega automaticamente sullo stage vettoriale della scena.
   */
  readonly image?: string;
  /** Riga che compare da sola nel registro quando il momento parte (a tempo). */
  readonly ambient: string;
}

/** Costo e resa di un'azione investigativa (i contenuti stanno nei momenti). */
export interface ProbeSpec {
  readonly id: ProbeId;
  readonly label: string;
  /** Costo in secondi sottratto al tempo residuo. */
  readonly timeCost: number;
  /** Costo in punti percentuali di batteria. */
  readonly batteryCost: number;
  /** Quanto fa salire la Conoscenza (nascosta) a ogni nuova scoperta. */
  readonly knowledgeGain: number;
  /** Testo quando in questo momento hai già scoperto tutto. */
  readonly exhausted: string;
}

/**
 * Uno scenario è pura DATA (serializzabile): l'engine lo consulta senza
 * conoscerne il contenuto. Qui vive lo slice "Pianerottolo".
 */
export interface Scenario {
  readonly id: string;
  readonly probes: Record<ProbeId, ProbeSpec>;
  /** La sceneggiatura a tempo per ciascuna verità: scena + atmosfera. */
  readonly script: Record<Truth, readonly Moment[]>;
  /**
   * Le scoperte delle azioni: una coda ordinata per ogni azione e verità.
   * Ogni tap consuma la successiva, così agire dà SEMPRE qualcosa di nuovo,
   * indipendentemente dai momenti a tempo. Le azioni non sono più "bloccate"
   * in attesa che scatti il momento seguente.
   */
  readonly reveals: Record<Truth, Record<ProbeId, readonly string[]>>;
  /** Testo di chiusura per ciascuna verità, mostrato al finale. */
  readonly endings: Record<Truth, string>;
}

/**
 * Voce del registro causale: cosa è stato osservato/fatto/successo e quando.
 * `causedBy` collega la conseguenza alla sua causa (per la timeline finale):
 * un'azione del giocatore, oppure il semplice scorrere del tempo.
 */
export interface LogEntry {
  readonly id: number;
  /** Orologio diegetico (minuti dalla mezzanotte) al momento della voce. */
  readonly atMinutes: number;
  readonly text: string;
  readonly causedBy: ProbeId | 'time';
}

/**
 * Stato completo e serializzabile della partita.
 * Deve poter essere salvato/ripristinato as-is (nessuna funzione, nessuna ref).
 */
export interface GameState {
  readonly phase: Phase;
  readonly endReason: EndReason | null;
  readonly resources: Resources;
  /** Orologio diegetico mostrato nella status bar (minuti dalla mezzanotte). */
  readonly clockMinutes: number;
  readonly door: DoorState;
  readonly network: NetworkState;
  /** La verità nascosta di questa partita. */
  readonly truth: Truth;
  /** Dati dello scenario in corso (momenti, costi, finali). */
  readonly scenario: Scenario;
  /** Indice del momento corrente nella sceneggiatura (-1 = non ancora partita). */
  readonly momentIndex: number;
  /** Scena visiva corrente. */
  readonly scene: SceneId;
  /** Quante scoperte hai già fatto con ciascuna azione (cursore nelle code). */
  readonly probeCounts: Record<ProbeId, number>;
  /** Messaggio transitorio (es. "niente di nuovo"), fuori dal registro. */
  readonly notice: string | null;
  /** Registro causale delle cose osservate/fatte/successe. */
  readonly log: readonly LogEntry[];
  /** Contatore monotono per gli id delle voci di log. */
  readonly nextLogId: number;
}

/**
 * Azioni che l'engine sa ridurre.
 * - TICK: unica sorgente di avanzamento del tempo (soft real-time).
 * - PROBE: azione investigativa del giocatore (spioncino / cerca), costa tempo.
 * - RESET: ricomincia con una nuova verità (scelta dal driver, per restare puri).
 */
export type Action =
  | { readonly type: 'TICK'; readonly deltaMs: number }
  | { readonly type: 'PROBE'; readonly probe: ProbeId }
  | { readonly type: 'RESET'; readonly truth: Truth };

/**
 * Effetti: intenti verso il mondo esterno, prodotti dal reducer ma eseguiti
 * altrove. Mantenerli come dati (non callback) tiene l'engine puro e testabile.
 */
export type Effect =
  | { readonly type: 'TIME_UP' }
  | { readonly type: 'HAPTIC'; readonly pattern: 'tap' | 'beat' | 'end' }
  | { readonly type: 'CLUE'; readonly text: string }
  | { readonly type: 'BEAT'; readonly scene: SceneId };

/** Risultato di ogni riduzione. */
export interface ReduceResult {
  readonly state: GameState;
  readonly effects: readonly Effect[];
}
