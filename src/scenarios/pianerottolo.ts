import type { Beat, Moment, Scenario, Truth } from '@engine/index';

/**
 * Slice "Pianerottolo".
 *
 * Stessa situazione — sei chiuso in casa, qualcosa è successo sul pianerottolo
 * — ma tre verità diverse la spiegano, e ciascuna ha un RITMO emotivo:
 *   • intrusione   → sembra normale, poi precipita (il pericolo è reale);
 *   • falso_allarme→ sembra terribile, poi si sgonfia (non è mai niente);
 *   • blackout     → paura immaginata nel buio (finisce, ma ti ha consumato).
 *
 * Ogni beat porta la SUA scena, immagine e umore: testo e immagine restano
 * sempre allineati. I beat a tempo (`script`) fanno avanzare l'atmosfera anche
 * senza agire; le code delle azioni (`reveals`) danno una scoperta a ogni tap.
 *
 * È pura DATA: l'engine la consulta senza sapere cosa contiene.
 */

// --- BLACKOUT: la minaccia è nella tua testa. Salite e ricadute, poi buio. ---
const blackoutScript: readonly Moment[] = [
  { atSeconds: 0, scene: 'dark', image: 'blk-1', mood: 'tense',
    text: 'Le luci si spengono tutte insieme. Buio. Il palazzo ammutolisce.' },
  { atSeconds: 210, scene: 'dark', image: 'blk-4', mood: 'calm',
    text: 'Dalla finestra: mezzo quartiere è al buio. Non sei solo. È tutto il palazzo.' },
  { atSeconds: 470, scene: 'dark', image: 'blk-5', mood: 'tense',
    text: 'Un tonfo sordo, lontano. Poi il silenzio ti ricasca addosso.' },
];
const blackoutPeep: readonly Beat[] = [
  { scene: 'dark', image: 'blk-1', mood: 'calm',
    text: 'Buio sul pianerottolo. Niente di strano: manca solo la corrente.' },
  { scene: 'torch', image: 'blk-2', mood: 'tense',
    text: 'Una luce. Una torcia sale le scale, lenta. Qualcuno c’è.' },
  { scene: 'figure', image: 'blk-3', mood: 'panic',
    text: 'La torcia si ferma. È davanti alla TUA porta. Non respiri.' },
  { scene: 'door', image: 'blk-1', mood: 'calm',
    text: 'Bussano… alla porta di fronte. Non da te. È il vicino del quarto.' },
  { scene: 'dark', image: 'blk-5', mood: 'tense',
    text: 'La torcia se ne va, su per le scale. Di nuovo buio. Di nuovo solo.' },
];
const blackoutSearch: readonly Beat[] = [
  { scene: 'dark', image: 'blk-1', mood: 'calm',
    text: 'Il contatore è scattato. Solo quello. Riabbassi la leva: niente.' },
  { scene: 'dark', image: 'blk-4', mood: 'calm',
    text: 'La radio a pile: “…guasto sulla linea est, tecnici in arrivo…”. Ok. È normale.' },
  { scene: 'dark', image: 'blk-5', mood: 'tense',
    text: 'Cerchi la torcia al buio. La mano trova solo cose fredde.' },
  { scene: 'torch', image: 'blk-2', mood: 'tense',
    text: 'Trovata. Il fascio trema quanto la tua mano.' },
  { scene: 'dark', image: 'blk-4', mood: 'calm',
    text: 'Ti siedi vicino alla porta, torcia in pugno. Aspetti che torni la luce.' },
];

// --- INTRUSIONE: sembra normale… poi peggiora. Il pericolo è vero. ---
const intrusioneScript: readonly Moment[] = [
  { atSeconds: 0, scene: 'calm', image: 'int-1', mood: 'calm',
    text: 'Un colpo secco fuori dalla porta. Poi silenzio. Sarà stato il vento.' },
  { atSeconds: 210, scene: 'figure', image: 'int-2', mood: 'tense',
    text: 'Un fruscio oltre la porta. Come una manica che sfiora il legno.' },
  { atSeconds: 470, scene: 'door', image: 'int-4', mood: 'panic',
    text: 'La maniglia si abbassa piano. Poi risale. Qualcuno l’ha provata.' },
];
const intrusionePeep: readonly Beat[] = [
  { scene: 'calm', image: 'int-1', mood: 'calm',
    text: 'Pianerottolo vuoto. Visto? Non c’è nessuno.' },
  { scene: 'calm', image: 'int-1', mood: 'tense',
    text: 'Aspetta. La lampadina del corridoio… è stata svitata. Di proposito.' },
  { scene: 'figure', image: 'int-2', mood: 'tense',
    text: 'Un’ombra scivola via, a sinistra. Veloce.' },
  { scene: 'figure', image: 'int-3', mood: 'panic',
    text: 'Ora è lì. Fermo, a un palmo dallo spioncino. Lo senti respirare.' },
  { scene: 'door', image: 'int-5', mood: 'panic',
    text: 'Lo spioncino si oscura. Qualcosa lo copre. Uno spiraglio: un occhio.' },
];
const intrusioneSearch: readonly Beat[] = [
  { scene: 'calm', image: 'int-1', mood: 'calm',
    text: 'Giri per casa. Tutto a posto. Respira.' },
  { scene: 'door', image: 'int-4', mood: 'tense',
    text: 'La porta di servizio in cucina è accostata. Tu l’avevi chiusa a chiave.' },
  { scene: 'figure', image: 'int-2', mood: 'tense',
    text: 'Sul davanzale interno, un’impronta di scarpa. Bagnata. Fresca.' },
  { scene: 'door', image: 'int-4', mood: 'panic',
    text: 'Prendi il coltello del pane. La mano non ti obbedisce.' },
  { scene: 'figure', image: 'int-3', mood: 'panic',
    text: 'Spingi il comò contro la porta. È tutto ciò che puoi fare. Bussano. Tre volte.' },
];

// --- FALSO ALLARME: sembra terribile… non è mai niente. Sollievi ripetuti. ---
const falsoScript: readonly Moment[] = [
  { atSeconds: 0, scene: 'calm', image: 'fls-1', mood: 'tense',
    text: 'Un tonfo in corridoio ti gela. Il cuore parte a mille.' },
  { atSeconds: 220, scene: 'calm', image: 'fls-4', mood: 'calm',
    text: 'Il frigo riparte con un ronzio. Il palazzo respira. Tutto tace.' },
  { atSeconds: 470, scene: 'calm', image: 'fls-2', mood: 'tense',
    text: 'Passi sulle scale. Si avvicinano. Si fermano. Proprio davanti.' },
];
const falsoPeep: readonly Beat[] = [
  { scene: 'calm', image: 'fls-1', mood: 'tense',
    text: 'Guardi. Il cuore in gola.' },
  { scene: 'calm', image: 'fls-4', mood: 'calm',
    text: '…Niente. Pianerottolo illuminato, tappetino a posto.' },
  { scene: 'calm', image: 'fls-2', mood: 'tense',
    text: 'Un’ombra sulle scale. Si muove verso di te.' },
  { scene: 'calm', image: 'fls-3', mood: 'calm',
    text: 'È la vicina, con le buste della spesa. Ti saluta senza vederti.' },
  { scene: 'calm', image: 'fls-4', mood: 'calm',
    text: 'Deserto. Non c’è mai stato niente. Solo la tua paura.' },
];
const falsoSearch: readonly Beat[] = [
  { scene: 'calm', image: 'fls-1', mood: 'tense',
    text: 'Cerchi la fonte del tonfo, col fiato corto.' },
  { scene: 'calm', image: 'fls-1', mood: 'calm',
    text: 'Un quadro caduto in corridoio. Il chiodo ha ceduto. Tutto qui.' },
  { scene: 'calm', image: 'fls-2', mood: 'tense',
    text: 'Un rumore in cucina. Ti volti di scatto.' },
  { scene: 'calm', image: 'fls-5', mood: 'calm',
    text: 'La TV in stand-by. L’avevi lasciata accesa tu.' },
  { scene: 'calm', image: 'fls-5', mood: 'calm',
    text: 'Messaggio non letto: “Scusa il casino, ho spostato gli scatoloni.” Sorridi, quasi.' },
];

export const PIANEROTTOLO: Scenario = {
  id: 'pianerottolo',
  probes: {
    peep: {
      id: 'peep', label: 'Spioncino', timeCost: 8, batteryCost: 1, knowledgeGain: 8,
      exhausted: 'Guardi ancora, ma per ora non c’è altro allo spioncino.',
    },
    search: {
      id: 'search', label: 'Cerca in casa', timeCost: 20, batteryCost: 2, knowledgeGain: 14,
      exhausted: 'Hai già rovistato ovunque. Per ora niente di nuovo.',
    },
  },
  script: {
    blackout: blackoutScript,
    intrusione: intrusioneScript,
    falso_allarme: falsoScript,
  },
  reveals: {
    blackout: { peep: blackoutPeep, search: blackoutSearch },
    intrusione: { peep: intrusionePeep, search: intrusioneSearch },
    falso_allarme: { peep: falsoPeep, search: falsoSearch },
  },
  endings: {
    blackout:
      'Era solo un blackout. Le scale erano buie, non pericolose. Hai passato dieci minuti a temere il nulla. O forse hai fatto bene a non aprire.',
    intrusione:
      'Qualcuno era davvero là fuori. Ogni secondo passato a capirlo era un secondo tolto alla fuga. Le 22:51 arrivano comunque.',
    falso_allarme:
      'Falso allarme. Nessun pericolo, mai stato. Resta la domanda: quanto sei disposto a spaventarti per un quadro che cade?',
  },
};

/** Elenco delle verità possibili, per la selezione casuale. */
export const TRUTHS: readonly Truth[] = ['blackout', 'intrusione', 'falso_allarme'];

/** Sceglie una verità a caso (il driver la passa all'engine per restare puro). */
export function pickTruth(random: () => number = Math.random): Truth {
  const index = Math.floor(random() * TRUTHS.length) % TRUTHS.length;
  return TRUTHS[index] ?? 'falso_allarme';
}
