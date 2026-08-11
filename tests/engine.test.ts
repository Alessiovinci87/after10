import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  reduce,
  TOTAL_SECONDS,
  formatClock,
  formatTimer,
  type GameState,
} from '@engine/index';
import { PIANEROTTOLO } from '@scenarios/pianerottolo';

function fresh(truth: GameState['truth'] = 'intrusione'): GameState {
  return createInitialState(PIANEROTTOLO, truth);
}

describe('engine — stato iniziale', () => {
  it('parte da 22:41 · batteria 63% · rete debole · porta chiusa, timer 10:00', () => {
    const s = fresh();
    expect(s.phase).toBe('running');
    expect(s.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(s.resources.battery).toBe(63);
    expect(s.network).toBe('debole');
    expect(s.door).toBe('chiusa');
    expect(formatClock(s.clockMinutes)).toBe('22:41');
    expect(formatTimer(s.resources.secondsRemaining)).toBe('10:00');
    expect(s.log).toHaveLength(0);
    expect(s.momentIndex).toBe(-1);
    expect(s.scene).toBe('idle');
  });
});

describe('engine — momenti nel tempo', () => {
  it('il primo momento (t=0) si attiva al primo TICK e cambia scena', () => {
    const s0 = fresh('intrusione');
    const { state } = reduce(s0, { type: 'TICK', deltaMs: 1000 });
    expect(state.momentIndex).toBe(0);
    expect(state.scene).toBe(PIANEROTTOLO.script.intrusione[0]?.scene);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]?.causedBy).toBe('time');
    expect(state.log[0]?.text).toBe(PIANEROTTOLO.script.intrusione[0]?.ambient);
  });

  it('un TICK grande attiva tutti i momenti già scaduti', () => {
    const s0 = fresh('intrusione');
    const { state } = reduce(s0, { type: 'TICK', deltaMs: 111_000 });
    expect(state.momentIndex).toBe(1);
    expect(state.scene).toBe(PIANEROTTOLO.script.intrusione[1]?.scene);
    expect(state.log).toHaveLength(2);
    expect(state.log.every((e) => e.causedBy === 'time')).toBe(true);
  });

  it('la batteria cala lentamente col tempo', () => {
    const s0 = fresh();
    const { state } = reduce(s0, { type: 'TICK', deltaMs: 1000 });
    expect(state.resources.battery).toBeLessThan(63);
    expect(state.resources.battery).toBeGreaterThan(62.9);
  });

  it('è puro: non muta lo stato in ingresso', () => {
    const s0 = fresh();
    reduce(s0, { type: 'TICK', deltaMs: 5000 });
    expect(s0.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(s0.log).toHaveLength(0);
  });

  it('ignora delta non positivi', () => {
    const s0 = fresh();
    expect(reduce(s0, { type: 'TICK', deltaMs: 0 }).state).toBe(s0);
    expect(reduce(s0, { type: 'TICK', deltaMs: -100 }).state).toBe(s0);
  });
});

describe('engine — PROBE (azioni investigative)', () => {
  it('spioncino costa 8s + batteria e rivela il dettaglio del momento corrente', () => {
    const s0 = fresh('blackout');
    const { state, effects } = reduce(s0, { type: 'PROBE', probe: 'peep' });
    expect(state.resources.secondsRemaining).toBe(TOTAL_SECONDS - 8);
    expect(state.resources.battery).toBe(62);
    const reveal = state.log.find((e) => e.causedBy === 'peep');
    expect(reveal?.text).toBe(PIANEROTTOLO.script.blackout[0]?.peep);
    expect(state.resources.knowledge).toBeGreaterThan(0);
    expect(effects.some((e) => e.type === 'CLUE')).toBe(true);
  });

  it('ripetere nello stesso momento non spamma: avviso transitorio, niente riga nuova', () => {
    let s = fresh('falso_allarme');
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const lenAfterFirst = s.log.length;
    expect(s.notice).toBeNull();
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    expect(s.log.length).toBe(lenAfterFirst);
    expect(s.notice).toBe(PIANEROTTOLO.probes.peep.exhausted);
  });

  it('col tempo lo stesso spioncino rivela cose nuove (contenuto che evolve)', () => {
    let s = fresh('blackout');
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const first = s.log.find((e) => e.causedBy === 'peep')?.text;
    // Avanza oltre il secondo momento e riprova: nuovo dettaglio.
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: 130_000 }));
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const peeps = s.log.filter((e) => e.causedBy === 'peep').map((e) => e.text);
    expect(peeps).toHaveLength(2);
    expect(peeps[1]).not.toBe(first);
    expect(peeps[1]).toBe(PIANEROTTOLO.script.blackout[1]?.peep);
  });

  it('un\'azione che sfora il tempo lo azzera e chiude la partita', () => {
    let s = fresh();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: (TOTAL_SECONDS - 5) * 1000 }));
    const { state, effects } = reduce(s, { type: 'PROBE', probe: 'search' });
    expect(state.resources.secondsRemaining).toBe(0);
    expect(state.phase).toBe('ended');
    expect(effects.some((e) => e.type === 'TIME_UP')).toBe(true);
  });

  it('a partita finita le azioni non hanno effetto', () => {
    let s = fresh();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: TOTAL_SECONDS * 1000 }));
    const after = reduce(s, { type: 'PROBE', probe: 'peep' });
    expect(after.state).toBe(s);
    expect(after.effects).toHaveLength(0);
  });
});

describe('engine — fine partita', () => {
  it('a 0 termina ed emette TIME_UP una sola volta', () => {
    let s = fresh();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: (TOTAL_SECONDS - 1) * 1000 }));
    const atEnd = reduce(s, { type: 'TICK', deltaMs: 2000 });
    expect(atEnd.state.phase).toBe('ended');
    expect(atEnd.state.endReason).toBe('time_up');
    expect(atEnd.effects.some((e) => e.type === 'TIME_UP')).toBe(true);
    const after = reduce(atEnd.state, { type: 'TICK', deltaMs: 1000 });
    expect(after.state).toBe(atEnd.state);
  });
});

describe('engine — RESET', () => {
  it('ricomincia da capo con la verità indicata', () => {
    let s = fresh('intrusione');
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const { state } = reduce(s, { type: 'RESET', truth: 'blackout' });
    expect(state.truth).toBe('blackout');
    expect(state.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(state.log).toHaveLength(0);
    expect(state.momentIndex).toBe(-1);
    expect(state.scene).toBe('idle');
    expect(state.phase).toBe('running');
  });
});

describe('format', () => {
  it('formatTimer arrotonda per eccesso i secondi frazionari', () => {
    expect(formatTimer(59.2)).toBe('1:00');
    expect(formatTimer(65)).toBe('1:05');
    expect(formatTimer(0)).toBe('0:00');
  });

  it('l\'orologio avanza col tempo consumato', () => {
    let s = fresh();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: 60_000 }));
    expect(formatClock(s.clockMinutes)).toBe('22:42');
  });
});
