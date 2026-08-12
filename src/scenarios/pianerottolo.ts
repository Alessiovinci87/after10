import type { Mood, Scenario, Stage, Truth } from '@engine/index';

/**
 * Slice "Pianerottolo".
 *
 * Stessa situazione — sei chiuso in casa, qualcosa è successo sul pianerottolo
 * — ma tre verità la spiegano, ciascuna con un RITMO emotivo:
 *   • intrusione   → sembra normale, poi precipita (il pericolo è reale);
 *   • falso_allarme→ sembra terribile, poi si sgonfia (non è mai niente);
 *   • blackout     → paura immaginata nel buio.
 *
 * La notte è divisa in STADI a tempo (griglia fitta, ~ogni 90s). Guardare o
 * cercare riporta lo stato ATTUALE della minaccia in quello stadio: non una
 * lista che si esaurisce, ma un readout che evolve. Se controlli e non è
 * cambiato nulla, arriva una riga di tensione (che varia) — così premere fa
 * sempre qualcosa. Ogni stadio porta scena/immagine/umore: testo e foto sempre
 * allineati.
 *
 * È pura DATA: l'engine la consulta senza sapere cosa contiene.
 */

const T = [0, 90, 180, 270, 360, 450, 540];

const blackout: readonly Stage[] = [
  { atSeconds: T[0]!, scene: 'dark', image: 'blk-1', mood: 'tense',
    ambient: 'Le luci si spengono tutte insieme. Buio. Il palazzo ammutolisce.',
    peep: 'Buio totale sul pianerottolo. Niente luci di emergenza.',
    search: 'Il contatore è scattato. La leva non risale.' },
  { atSeconds: T[1]!, scene: 'dark', image: 'blk-4', mood: 'calm',
    ambient: 'Dalla finestra: mezzo quartiere è al buio. È tutto il palazzo.',
    peep: 'Buio, ma normale. Manca solo la corrente.',
    search: 'La radio a pile: “…guasto sulla linea est, tecnici in arrivo…”.' },
  { atSeconds: T[2]!, scene: 'torch', image: 'blk-2', mood: 'tense',
    ambient: 'In fondo alle scale si accende una torcia. Sale, lenta.',
    peep: 'Una sagoma con torcia sale piano. Sembra il vicino del quarto.',
    search: 'Cerchi la tua torcia. Al buio la mano trova solo cose fredde.' },
  { atSeconds: T[3]!, scene: 'figure', image: 'blk-3', mood: 'panic', scare: true,
    ambient: 'I passi si fermano. Sul TUO pianerottolo. Una luce filtra sotto la porta.',
    peep: 'La torcia è ferma davanti alla tua porta. Non respiri.',
    search: 'Trovata la torcia. Il fascio trema quanto la tua mano.' },
  { atSeconds: T[4]!, scene: 'door', image: 'blk-1', mood: 'calm',
    ambient: 'Bussano… alla porta di fronte. Non da te.',
    peep: 'È il vicino del quarto. Bussa da lui. Ti sciogli un po’.',
    search: 'Tendi l’orecchio: voci normali, di là. Solo il vicino.' },
  { atSeconds: T[5]!, scene: 'torch', image: 'blk-4', mood: 'tense',
    ambient: 'La torcia se ne va, su per le scale.',
    peep: 'La luce sale al piano di sopra. Di nuovo buio da te.',
    search: 'Dalla finestra: qualche finestra si riaccende, a tratti.' },
  { atSeconds: T[6]!, scene: 'dark', image: 'blk-5', mood: 'tense',
    ambient: 'Silenzio pieno. Solo il ronzio del nulla.',
    peep: 'Buio e basta. Nessuno. Ma continui a guardare.',
    search: 'Niente da fare se non aspettare che torni la luce.' },
];

const intrusione: readonly Stage[] = [
  { atSeconds: T[0]!, scene: 'calm', image: 'int-1', mood: 'calm',
    ambient: 'Un colpo secco fuori dalla porta. Poi silenzio. Sarà il vento.',
    peep: 'Pianerottolo vuoto. Non c’è nessuno. Respira.',
    search: 'Giri per casa. Tutto a posto, a prima vista.' },
  { atSeconds: T[1]!, scene: 'calm', image: 'int-1', mood: 'tense',
    ambient: 'Una corrente d’aria fredda dal corridoio. Strano.',
    peep: 'La lampadina del corridoio… è stata svitata. Di proposito.',
    search: 'La porta di servizio in cucina è accostata. Tu l’avevi chiusa.' },
  { atSeconds: T[2]!, scene: 'figure', image: 'int-2', mood: 'tense',
    ambient: 'Un fruscio oltre la porta. Come una manica sul legno.',
    peep: 'Un’ombra scivola via, a sinistra. Veloce.',
    search: 'Sul davanzale interno, un’impronta di scarpa. Bagnata. Fresca.' },
  { atSeconds: T[3]!, scene: 'door', image: 'int-4', mood: 'panic', scare: true,
    ambient: 'La maniglia si abbassa di colpo. Poi risale. Qualcuno è appena fuori.',
    peep: 'Una mano guantata prova la maniglia. La tua maniglia.',
    search: 'Chiamata persa delle 22:39, da un numero senza prefisso.' },
  { atSeconds: T[4]!, scene: 'figure', image: 'int-3', mood: 'panic',
    ambient: 'Qualcosa si appoggia alla porta. Un peso. Respira.',
    peep: 'È lì, a un palmo dallo spioncino. Fermo. Lo senti respirare.',
    search: 'Prendi il coltello del pane. La mano non ti obbedisce.' },
  { atSeconds: T[5]!, scene: 'door', image: 'int-4', mood: 'panic',
    ambient: 'Tre colpi alla porta. Lenti. Poi il silenzio, peggiore.',
    peep: 'Nessuno. Ma il tuo zerbino è spostato di traverso.',
    search: 'Spingi il comò contro la porta. Pesa, ma regge. Per ora.' },
  { atSeconds: T[6]!, scene: 'figure', image: 'int-5', mood: 'panic', scare: true,
    ambient: 'Lo spioncino si oscura di colpo. Qualcosa lo copre da fuori.',
    peep: 'Nero. Poi uno spiraglio di luce: un occhio. Ti sta guardando.',
    search: 'Non c’è più niente da cercare. Solo la porta, tra te e lui.' },
];

const falso_allarme: readonly Stage[] = [
  { atSeconds: T[0]!, scene: 'calm', image: 'fls-1', mood: 'tense',
    ambient: 'Un tonfo in corridoio ti gela. Il cuore parte a mille.',
    peep: 'Guardi col cuore in gola… pianerottolo normale, tutto a posto.',
    search: 'Cerchi la fonte del tonfo, il fiato corto.' },
  { atSeconds: T[1]!, scene: 'calm', image: 'fls-1', mood: 'calm',
    ambient: 'Il frigo riparte con un ronzio. Il palazzo respira.',
    peep: 'Niente. Tappetino a posto, luce accesa.',
    search: 'Un quadro caduto in corridoio. Il chiodo ha ceduto. Tutto qui.' },
  { atSeconds: T[2]!, scene: 'calm', image: 'fls-2', mood: 'tense', scare: true,
    ambient: 'Un fracasso in cucina! Ti volti di scatto, il cuore in gola.',
    peep: 'Un’ombra sulle scale. Si muove verso di te…',
    search: 'Solo una pila di piatti scivolata nel lavello. Nient’altro.' },
  { atSeconds: T[3]!, scene: 'calm', image: 'fls-3', mood: 'calm',
    ambient: 'Passi sulle scale. Normali. Una chiave nella toppa, di là.',
    peep: 'È la vicina, con le buste della spesa. Ti saluta senza vederti.',
    search: 'Messaggio non letto: “Scusa il casino, ho spostato gli scatoloni.”' },
  { atSeconds: T[4]!, scene: 'calm', image: 'fls-2', mood: 'tense',
    ambient: 'Uno scricchiolio dietro di te. Ti giri di colpo.',
    peep: 'Fuori, niente. Il pianerottolo è deserto.',
    search: 'È il parquet che si assesta. Solo quello.' },
  { atSeconds: T[5]!, scene: 'calm', image: 'fls-4', mood: 'calm',
    ambient: 'Il palazzo respira tranquillo. Tubi, un cane lontano.',
    peep: 'Deserto e illuminato. Non c’è mai stato niente.',
    search: 'Controlli di nuovo: niente di strano. Proprio niente.' },
  { atSeconds: T[6]!, scene: 'calm', image: 'fls-5', mood: 'calm',
    ambient: 'Ti siedi. Quasi ti vergogni della paura. Quasi.',
    peep: 'Nulla, come sempre. Solo la tua paura a farti compagnia.',
    search: 'Ti versi un bicchiere d’acqua. La mano trema ancora un po’.' },
];

/** Righe di tensione quando controlli e non è ancora cambiato nulla. */
const filler: Record<Mood, readonly string[]> = {
  calm: [
    'Tutto tace. Solo il tuo respiro.',
    'Niente di nuovo. Per ora.',
    'Il silenzio ti si siede addosso.',
  ],
  tense: [
    'Il cuore ti martella. Aspetti.',
    'Trattieni il fiato. Nulla… ancora.',
    'Ogni rumore ti fa sobbalzare.',
  ],
  panic: [
    'Non riesci a staccare gli occhi.',
    'Le mani ti tremano. Guardi ancora.',
    'Il respiro non ti obbedisce.',
  ],
};

export const PIANEROTTOLO: Scenario = {
  id: 'pianerottolo',
  probes: {
    peep: { id: 'peep', label: 'Spioncino', timeCost: 8, batteryCost: 1, knowledgeGain: 8 },
    search: { id: 'search', label: 'Cerca in casa', timeCost: 20, batteryCost: 2, knowledgeGain: 14 },
  },
  stages: { blackout, intrusione, falso_allarme },
  filler,
  endings: {
    blackout: {
      open: 'Apri. Sul pianerottolo c’è il vicino del quarto, torcia in mano. “Anche da te è saltata?” Ti senti uno stupido. Ma vivo.',
      stay: 'Non apri. Poco dopo la luce torna, di colpo. Era solo un blackout. Dieci minuti di paura per niente.',
      timeout: 'La luce torna da sola. Era un blackout. Le scale erano buie, non pericolose. Hai temuto il nulla per dieci minuti.',
    },
    intrusione: {
      open: 'Apri la porta. L’ultima cosa che vedi è il suo sorriso, a un palmo dal tuo. Non dovevi aprire.',
      stay: 'Non apri. Il comò regge. I passi, alla fine, si allontanano. Sei vivo — tremante, madido, ma vivo.',
      timeout: 'Le 22:51. La porta ha retto, per un soffio. Qualcuno era davvero là fuori. E tu eri a un centimetro da lui.',
    },
    falso_allarme: {
      open: 'Apri, il cuore in gola. Il pianerottolo è vuoto. Certo che è vuoto. Non c’è mai stato niente.',
      stay: 'Resti immobile fino alla fine. Non bussa nessuno. Non è mai successo niente. Solo la tua testa.',
      timeout: 'Falso allarme. Nessun pericolo, mai stato. Resta la domanda: quanto ti fai spaventare da un quadro che cade?',
    },
  },
};

/** Elenco delle verità possibili, per la selezione casuale. */
export const TRUTHS: readonly Truth[] = ['blackout', 'intrusione', 'falso_allarme'];

/** Sceglie una verità a caso (il driver la passa all'engine per restare puro). */
export function pickTruth(random: () => number = Math.random): Truth {
  const index = Math.floor(random() * TRUTHS.length) % TRUTHS.length;
  return TRUTHS[index] ?? 'falso_allarme';
}
