import type { Moment, Scenario, Truth } from '@engine/index';

/**
 * Slice "Pianerottolo".
 *
 * Stessa situazione — sei chiuso in casa, qualcosa è appena successo sul
 * pianerottolo — ma tre verità diverse la spiegano. La partita è una
 * SCENEGGIATURA: lungo i 10 minuti si attivano dei "momenti" che cambiano la
 * scena e ridefiniscono cosa raccontano le azioni. Il tempo lavora da solo:
 * anche senza fare nulla, la tensione avanza.
 *
 * È pura DATA: l'engine la consulta senza sapere cosa contiene.
 */

const blackout: readonly Moment[] = [
  {
    atSeconds: 0,
    scene: 'dark',
    ambient: 'Le luci del palazzo si spengono di colpo. Buio.',
    peep: 'Dallo spioncino: nero totale. Anche la luce di emergenza è morta.',
    search: 'Il contatore è scattato. La leva non risale.',
  },
  {
    atSeconds: 110,
    scene: 'torch',
    ambient: 'In fondo alle scale si accende una torcia. Sale.',
    peep: 'Una sagoma con torcia sale piano. Sembra il vicino del quarto.',
    search: 'La radio a pile gracchia: “…interruzione sulla linea est…”.',
  },
  {
    atSeconds: 240,
    scene: 'figure',
    ambient: 'I passi si fermano sul tuo pianerottolo.',
    peep: 'La torcia è ferma davanti alla porta di fronte. Bussano lì, non da te.',
    search: 'Trovi la tua torcia nel cassetto. Funziona. Almeno quello.',
  },
  {
    atSeconds: 400,
    scene: 'torch',
    ambient: 'I passi riprendono e si allontanano verso l’alto.',
    peep: 'La torcia sale al piano di sopra. Una porta si apre e si chiude.',
    search: 'Dalla finestra: metà quartiere è al buio. Non sei solo.',
  },
  {
    atSeconds: 540,
    scene: 'dark',
    ambient: 'Silenzio pieno. Solo il ronzio del nulla.',
    peep: 'Buio e basta. Nessuno.',
    search: 'Niente da fare se non aspettare che torni la corrente.',
  },
];

const intrusione: readonly Moment[] = [
  {
    atSeconds: 0,
    scene: 'calm',
    ambient: 'Un colpo secco fuori dalla porta. Poi silenzio.',
    peep: 'Pianerottolo vuoto. Ma la lampadina del corridoio è stata svitata.',
    search: 'La porta di servizio in cucina è accostata. Tu l’avevi chiusa.',
  },
  {
    atSeconds: 100,
    scene: 'figure',
    ambient: 'Un’ombra si sposta appena oltre lo spioncino.',
    peep: 'Un guanto sul terzo gradino. Non era lì stamattina.',
    search: 'Sul davanzale interno c’è un segno di scarpa. Bagnato.',
  },
  {
    atSeconds: 230,
    scene: 'door',
    ambient: 'La maniglia della tua porta si abbassa. Piano. Risale.',
    peep: 'Qualcuno è fermo a sinistra dello spioncino. Lo senti respirare.',
    search: 'Chiamata persa delle 22:39, da un numero senza prefisso.',
  },
  {
    atSeconds: 380,
    scene: 'door',
    ambient: 'Tre colpi alla porta. Lenti. Poi più niente.',
    peep: 'Nessuno, ora. Ma il tuo zerbino è spostato di traverso.',
    search: 'Il coltello del pane non è nel ceppo. Lo prendi in mano.',
  },
  {
    atSeconds: 530,
    scene: 'figure',
    ambient: 'Lo spioncino si oscura. Qualcosa lo copre dall’esterno.',
    peep: 'Nero. Poi una fessura di luce: un occhio?',
    search: 'Ti barrichi contro la porta. È tutto quello che puoi fare.',
  },
];

const falso_allarme: readonly Moment[] = [
  {
    atSeconds: 0,
    scene: 'calm',
    ambient: 'Un tonfo in corridoio ti gela il sangue.',
    peep: 'Dallo spioncino: tutto normale. Luce accesa, tappetino a posto.',
    search: 'Era un quadro caduto in corridoio. Il chiodo ha ceduto.',
  },
  {
    atSeconds: 110,
    scene: 'calm',
    ambient: 'Il frigo riparte con un ronzio. Il cuore ti rallenta un po’.',
    peep: 'Il rumore di prima era il portone a molla di sotto, con le correnti.',
    search: 'Hai lasciato la TV in stand-by. Tutto qui.',
  },
  {
    atSeconds: 250,
    scene: 'calm',
    ambient: 'Passi sulle scale — normali. La vicina rientra.',
    peep: 'La vicina entra in casa con le buste. Ti saluta senza vederti.',
    search: 'Messaggio non letto: “Scusa il casino, ho spostato gli scatoloni.”',
  },
  {
    atSeconds: 400,
    scene: 'idle',
    ambient: 'Il palazzo respira tranquillo. Tubi, un cane lontano.',
    peep: 'Pianerottolo deserto e illuminato. Niente.',
    search: 'Controlli di nuovo: niente di strano. Proprio niente.',
  },
  {
    atSeconds: 540,
    scene: 'idle',
    ambient: 'Ti senti quasi stupido per la paura. Quasi.',
    peep: 'Nulla, come sempre.',
    search: 'Hai guardato tre volte. Va tutto bene. Resta la paura, però.',
  },
];

export const PIANEROTTOLO: Scenario = {
  id: 'pianerottolo',
  probes: {
    peep: {
      id: 'peep',
      label: 'Spioncino',
      timeCost: 8,
      batteryCost: 1,
      knowledgeGain: 8,
      exhausted: 'Guardi ancora, ma per ora non c’è altro da vedere.',
    },
    search: {
      id: 'search',
      label: 'Cerca in casa',
      timeCost: 20,
      batteryCost: 2,
      knowledgeGain: 14,
      exhausted: 'Hai già controllato tutto. Per ora niente di nuovo.',
    },
  },
  script: { blackout, intrusione, falso_allarme },
  endings: {
    blackout:
      'Era un blackout. Le scale erano solo buie, non pericolose. Hai passato dieci minuti a temere il nulla — o forse hai fatto bene a non uscire.',
    intrusione:
      'Qualcuno era davvero là fuori. Ogni secondo speso a capirlo era un secondo tolto alla fuga. Le 22:51 arrivano comunque.',
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
