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

describe('engine — stato iniziale (M0/M1)', () => {
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
    expect(s.probeCounts).toEqual({ peep: 0, search: 0 });
  });
});

describe('engine — TICK (soft real-time)', () => {
  it('consuma tempo pari al delta reale e cala la batteria lentamente', () => {
    const s0 = fresh();
    const { state: s1 } = reduce(s0, { type: 'TICK', deltaMs: 1000 });
    expect(s1.resources.secondsRemaining).toBeCloseTo(TOTAL_SECONDS - 1, 5);
    expect(s1.resources.battery).toBeLessThan(63);
    expect(s1.resources.battery).toBeGreaterThan(62.9);
  });

  it('è puro: non muta lo stato in ingresso', () => {
    const s0 = fresh();
    reduce(s0, { type: 'TICK', deltaMs: 5000 });
    expect(s0.resources.secondsRemaining).toBe(TOTAL_SECONDS);
  });

  it('ignora delta non positivi', () => {
    const s0 = fresh();
    expect(reduce(s0, { type: 'TICK', deltaMs: 0 }).state).toBe(s0);
    expect(reduce(s0, { type: 'TICK', deltaMs: -100 }).state).toBe(s0);
  });

  it('a 0 termina la partita ed emette TIME_UP', () => {
    let s = fresh();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: (TOTAL_SECONDS - 1) * 1000 }));
    const atEnd = reduce(s, { type: 'TICK', deltaMs: 2000 });
    expect(atEnd.state.phase).toBe('ended');
    expect(atEnd.state.endReason).toBe('time_up');
    expect(atEnd.state.resources.secondsRemaining).toBe(0);
    expect(atEnd.effects.some((e) => e.type === 'TIME_UP')).toBe(true);

    const after = reduce(atEnd.state, { type: 'TICK', deltaMs: 1000 });
    expect(after.state).toBe(atEnd.state);
    expect(after.effects).toHaveLength(0);
  });
});

describe('engine — PROBE (azioni investigative)', () => {
  it('spioncino costa 8s + batteria e rivela il primo indizio della verità', () => {
    const s0 = fresh('blackout');
    const { state, effects } = reduce(s0, { type: 'PROBE', probe: 'peep' });
    expect(state.resources.secondsRemaining).toBe(TOTAL_SECONDS - 8);
    expect(state.resources.battery).toBe(62);
    expect(state.probeCounts.peep).toBe(1);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]?.text).toBe(PIANEROTTOLO.probes.peep.clues.blackout[0]);
    expect(state.log[0]?.causedBy).toBe('peep');
    expect(state.resources.knowledge).toBeGreaterThan(0);
    expect(effects.some((e) => e.type === 'CLUE')).toBe(true);
  });

  it('ripetere pesca indizi successivi, poi resta "esaurito" senza dare conoscenza', () => {
    let s = fresh('falso_allarme');
    const total = PIANEROTTOLO.probes.search.clues.falso_allarme.length;
    for (let i = 0; i < total; i++) {
      ({ state: s } = reduce(s, { type: 'PROBE', probe: 'search' }));
    }
    const knowledgeBefore = s.resources.knowledge;
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'search' }));
    expect(s.log[s.log.length - 1]?.text).toBe(PIANEROTTOLO.probes.search.exhausted);
    expect(s.resources.knowledge).toBe(knowledgeBefore);
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

describe('engine — RESET', () => {
  it('ricomincia da capo con la verità indicata', () => {
    let s = fresh('intrusione');
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const { state } = reduce(s, { type: 'RESET', truth: 'blackout' });
    expect(state.truth).toBe('blackout');
    expect(state.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(state.log).toHaveLength(0);
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
