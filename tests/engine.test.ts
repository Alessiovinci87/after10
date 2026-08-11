import { describe, expect, it } from 'vitest';
import { initialState, reduce, TOTAL_SECONDS } from '@engine/index';
import { formatClock, formatTimer } from '@engine/index';

describe('engine — stato iniziale (M0)', () => {
  it('parte da 22:41 · batteria 63% · rete debole · porta chiusa, timer 10:00', () => {
    const s = initialState();
    expect(s.phase).toBe('running');
    expect(s.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(s.resources.battery).toBe(63);
    expect(s.network).toBe('debole');
    expect(s.door).toBe('chiusa');
    expect(formatClock(s.clockMinutes)).toBe('22:41');
    expect(formatTimer(s.resources.secondsRemaining)).toBe('10:00');
  });
});

describe('engine — TICK (soft real-time)', () => {
  it('consuma tempo pari al delta reale trascorso', () => {
    const s0 = initialState();
    const { state: s1, effects } = reduce(s0, { type: 'TICK', deltaMs: 1000 });
    expect(s1.resources.secondsRemaining).toBeCloseTo(TOTAL_SECONDS - 1, 5);
    expect(effects).toHaveLength(0);
  });

  it('è puro: non muta lo stato in ingresso', () => {
    const s0 = initialState();
    reduce(s0, { type: 'TICK', deltaMs: 5000 });
    expect(s0.resources.secondsRemaining).toBe(TOTAL_SECONDS);
  });

  it('ignora delta non positivi', () => {
    const s0 = initialState();
    expect(reduce(s0, { type: 'TICK', deltaMs: 0 }).state).toBe(s0);
    expect(reduce(s0, { type: 'TICK', deltaMs: -100 }).state).toBe(s0);
  });

  it('a 0 termina la partita ed emette TIME_UP una sola volta', () => {
    let s = initialState();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: (TOTAL_SECONDS - 1) * 1000 }));
    const atEnd = reduce(s, { type: 'TICK', deltaMs: 2000 });
    expect(atEnd.state.phase).toBe('ended');
    expect(atEnd.state.resources.secondsRemaining).toBe(0);
    expect(atEnd.effects).toEqual([{ type: 'TIME_UP' }]);

    // Una volta finita, altri TICK non riaprono nulla.
    const after = reduce(atEnd.state, { type: 'TICK', deltaMs: 1000 });
    expect(after.state).toBe(atEnd.state);
    expect(after.effects).toHaveLength(0);
  });
});

describe('format', () => {
  it('formatTimer arrotonda per eccesso i secondi frazionari', () => {
    expect(formatTimer(59.2)).toBe('1:00');
    expect(formatTimer(65)).toBe('1:05');
    expect(formatTimer(0)).toBe('0:00');
  });
});
