import type { Scenario, Truth } from '@engine/index';

/**
 * Slice "Pianerottolo".
 *
 * Stessa situazione — sei chiuso in casa, qualcosa è appena successo sul
 * pianerottolo — ma tre verità diverse la spiegano. Le azioni investigative
 * (spioncino, cerca) raccontano dettagli coerenti con la verità in corso;
 * ripetere un'azione pesca l'indizio successivo, finché non resta nulla.
 *
 * È pura DATA: l'engine la consulta senza sapere cosa contiene.
 */
export const PIANEROTTOLO: Scenario = {
  id: 'pianerottolo',
  probes: {
    peep: {
      id: 'peep',
      label: 'Spioncino',
      timeCost: 8,
      batteryCost: 1,
      knowledgeGain: 8,
      clues: {
        blackout: [
          'Dallo spioncino: buio totale sul pianerottolo. La luce di emergenza è spenta.',
          'Una sagoma con una torcia sale le scale, lenta. Sembra il vicino del quarto.',
          'La torcia si allontana verso l’alto. Nessuno si è fermato alla tua porta.',
        ],
        intrusione: [
          'Dallo spioncino: il pianerottolo è vuoto, ma la luce del corridoio è stata svitata.',
          'C’è un guanto sul terzo gradino. Non era lì stamattina.',
          'Un’ombra si sposta appena fuori campo, a sinistra dello spioncino. Respira.',
        ],
        falso_allarme: [
          'Dallo spioncino: tutto normale. La luce è accesa, il tappetino al suo posto.',
          'Il rumore era il portone a molla del piano di sotto che sbatte con le correnti.',
          'La vicina rientra con le buste della spesa. Ti saluta senza vederti.',
        ],
      },
      exhausted: 'Guardi ancora, ma non c’è altro da vedere allo spioncino.',
    },
    search: {
      id: 'search',
      label: 'Cerca in casa',
      timeCost: 20,
      batteryCost: 2,
      knowledgeGain: 14,
      clues: {
        blackout: [
          'Cerchi in casa: il contatore è scattato. Metà quartiere è al buio dalla finestra.',
          'La radio a pile gracchia: “…interruzione sulla linea est, tecnici in arrivo…”.',
          'Trovi la torcia nel cassetto. Funziona. Almeno quello.',
        ],
        intrusione: [
          'Cerchi in casa: la porta di servizio in cucina è accostata. Tu l’avevi chiusa.',
          'Sul davanzale interno c’è un segno di scarpa. Bagnato.',
          'Il tuo telefono ha una chiamata persa da un numero senza prefisso, delle 22:39.',
        ],
        falso_allarme: [
          'Cerchi in casa: niente di strano. Hai solo lasciato la TV in stand-by.',
          'Il “colpo” era un quadro caduto in corridoio. Il chiodo ha ceduto.',
          'Un messaggio non letto: “Scusa il casino di prima, ho spostato gli scatoloni.”',
        ],
      },
      exhausted: 'Hai già rovistato ovunque. Non salta fuori altro.',
    },
  },
  endings: {
    blackout: 'Era un blackout. Le scale erano solo buie, non pericolose. Hai passato dieci minuti a temere il nulla — o forse hai fatto bene a non uscire.',
    intrusione: 'Qualcuno era davvero là fuori. Ogni secondo speso a capirlo era un secondo tolto alla fuga. Le 22:51 arrivano comunque.',
    falso_allarme: 'Falso allarme. Nessun pericolo, mai stato. Resta la domanda: quanto sei disposto a spaventarti per un quadro che cade?',
  },
};

/** Elenco delle verità possibili, per la selezione casuale. */
export const TRUTHS: readonly Truth[] = ['blackout', 'intrusione', 'falso_allarme'];

/** Sceglie una verità a caso (il driver la passa all'engine per restare puro). */
export function pickTruth(random: () => number = Math.random): Truth {
  const index = Math.floor(random() * TRUTHS.length) % TRUTHS.length;
  return TRUTHS[index] ?? 'falso_allarme';
}
