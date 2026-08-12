import type { Moment, ProbeId, Scenario, Truth } from '@engine/index';

/**
 * Slice "Pianerottolo".
 *
 * Stessa situazione — sei chiuso in casa, qualcosa è appena successo sul
 * pianerottolo — ma tre verità diverse la spiegano.
 *
 * Due flussi indipendenti:
 * - `script`: momenti a TEMPO che cambiano scena e aggiungono atmosfera (anche
 *   senza fare nulla, la tensione avanza);
 * - `reveals`: una CODA di scoperte per ogni azione, così ogni tap dà sempre
 *   qualcosa di nuovo, senza restare bloccato in attesa del prossimo momento.
 *
 * È pura DATA: l'engine la consulta senza sapere cosa contiene.
 */

const blackout: readonly Moment[] = [
  { atSeconds: 0, scene: 'dark', image: 'blk-1', ambient: 'Le luci del palazzo si spengono di colpo. Buio.' },
  { atSeconds: 110, scene: 'torch', image: 'blk-2', ambient: 'In fondo alle scale si accende una torcia. Sale.' },
  { atSeconds: 240, scene: 'figure', image: 'blk-3', ambient: 'I passi si fermano sul tuo pianerottolo.' },
  { atSeconds: 400, scene: 'torch', image: 'blk-4', ambient: 'I passi riprendono e si allontanano verso l’alto.' },
  { atSeconds: 540, scene: 'dark', image: 'blk-5', ambient: 'Silenzio pieno. Solo il ronzio del nulla.' },
];

const intrusione: readonly Moment[] = [
  { atSeconds: 0, scene: 'calm', image: 'int-1', ambient: 'Un colpo secco fuori dalla porta. Poi silenzio.' },
  { atSeconds: 100, scene: 'figure', image: 'int-2', ambient: 'Un’ombra si sposta appena oltre lo spioncino.' },
  { atSeconds: 230, scene: 'door', image: 'int-3', ambient: 'La maniglia della tua porta si abbassa. Piano. Risale.' },
  { atSeconds: 380, scene: 'door', image: 'int-4', ambient: 'Tre colpi alla porta. Lenti. Poi più niente.' },
  { atSeconds: 530, scene: 'figure', image: 'int-5', ambient: 'Lo spioncino si oscura. Qualcosa lo copre dall’esterno.' },
];

const falso_allarme: readonly Moment[] = [
  { atSeconds: 0, scene: 'calm', image: 'fls-1', ambient: 'Un tonfo in corridoio ti gela il sangue.' },
  { atSeconds: 110, scene: 'calm', image: 'fls-2', ambient: 'Il frigo riparte con un ronzio. Il cuore ti rallenta un po’.' },
  { atSeconds: 250, scene: 'calm', image: 'fls-3', ambient: 'Passi sulle scale — normali. La vicina rientra.' },
  { atSeconds: 400, scene: 'idle', image: 'fls-4', ambient: 'Il palazzo respira tranquillo. Tubi, un cane lontano.' },
  { atSeconds: 540, scene: 'idle', image: 'fls-5', ambient: 'Ti senti quasi stupido per la paura. Quasi.' },
];

/** Le scoperte di ogni azione, in ordine di rivelazione, per ciascuna verità. */
const reveals: Record<Truth, Record<ProbeId, readonly string[]>> = {
  blackout: {
    peep: [
      'Dallo spioncino: nero totale. Anche la luce di emergenza è morta.',
      'Una sagoma con torcia sale piano. Sembra il vicino del quarto.',
      'La torcia è ferma davanti alla porta di fronte. Bussano lì, non da te.',
      'La torcia sale al piano di sopra. Una porta si apre e si chiude.',
      'Solo buio, ora. Nessuno sul pianerottolo.',
      'Premi la fronte al vetro: senti solo il tuo respiro che lo appanna.',
    ],
    search: [
      'Il contatore è scattato. La leva non risale.',
      'La radio a pile gracchia: “…interruzione sulla linea est…”.',
      'Trovi la tua torcia nel cassetto. Funziona. Almeno quello.',
      'Dalla finestra: metà quartiere è al buio. Non sei solo.',
      'Il telefono è al 30%. Meglio non sprecarlo per fare luce.',
      'Non resta che aspettare che torni la corrente. E respirare.',
    ],
  },
  intrusione: {
    peep: [
      'Pianerottolo vuoto. Ma la lampadina del corridoio è stata svitata.',
      'Un guanto sul terzo gradino. Non era lì stamattina.',
      'Qualcuno è fermo a sinistra dello spioncino. Lo senti respirare.',
      'Nessuno, ora. Ma il tuo zerbino è spostato di traverso.',
      'Il vetro dello spioncino è tiepido. È stato coperto da poco.',
      'Nero. Poi una fessura di luce: un occhio?',
    ],
    search: [
      'La porta di servizio in cucina è accostata. Tu l’avevi chiusa.',
      'Sul davanzale interno c’è un segno di scarpa. Bagnato.',
      'Chiamata persa delle 22:39, da un numero senza prefisso.',
      'Il coltello del pane non è nel ceppo. Lo prendi in mano.',
      'Sposti il comò davanti all’ingresso. Pesa, ma regge.',
      'Ti barrichi contro la porta. È tutto quello che puoi fare.',
    ],
  },
  falso_allarme: {
    peep: [
      'Dallo spioncino: tutto normale. Luce accesa, tappetino a posto.',
      'Il rumore di prima era il portone a molla di sotto, con le correnti.',
      'La vicina entra in casa con le buste. Ti saluta senza vederti.',
      'Pianerottolo deserto e illuminato. Niente.',
      'Un moscerino cammina sul vetro dello spioncino. Tutto qui.',
      'Nulla, come sempre. Solo la tua paura a farti compagnia.',
    ],
    search: [
      'Era un quadro caduto in corridoio. Il chiodo ha ceduto.',
      'Hai lasciato la TV in stand-by. Tutto qui.',
      'Messaggio non letto: “Scusa il casino, ho spostato gli scatoloni.”',
      'Controlli di nuovo: niente di strano. Proprio niente.',
      'Ti versi un bicchiere d’acqua. La mano trema ancora un po’.',
      'Hai guardato tre volte. Va tutto bene. Resta la paura, però.',
    ],
  },
};

export const PIANEROTTOLO: Scenario = {
  id: 'pianerottolo',
  probes: {
    peep: {
      id: 'peep',
      label: 'Spioncino',
      timeCost: 8,
      batteryCost: 1,
      knowledgeGain: 8,
      exhausted: 'Guardi ancora, ma non c’è davvero altro da vedere.',
    },
    search: {
      id: 'search',
      label: 'Cerca in casa',
      timeCost: 20,
      batteryCost: 2,
      knowledgeGain: 14,
      exhausted: 'Hai già rovistato ovunque. Non salta fuori altro.',
    },
  },
  script: { blackout, intrusione, falso_allarme },
  reveals,
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
