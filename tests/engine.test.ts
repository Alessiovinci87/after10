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
    expect(formatClock(s.clockMinutes)).toBe('22:41');
    expect(formatTimer(s.resources.secondsRemaining)).toBe('10:00');
    expect(s.log).toHaveLength(0);
    expect(s.stageIndex).toBe(-1);
    expect(s.scene).toBe('idle');
    expect(s.image).toBeNull();
  });
});

describe('engine — stadi nel tempo', () => {
  it('il primo stadio (t=0) si attiva al primo TICK e allinea scena+immagine', () => {
    const s0 = fresh('intrusione');
    const { state } = reduce(s0, { type: 'TICK', deltaMs: 1000 });
    const st0 = PIANEROTTOLO.stages.intrusione[0];
    expect(state.stageIndex).toBe(0);
    expect(state.scene).toBe(st0?.scene);
    expect(state.image).toBe(st0?.image);
    expect(state.mood).toBe(st0?.mood);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]?.causedBy).toBe('time');
    expect(state.log[0]?.text).toBe(st0?.ambient);
  });

  it('un TICK grande attiva tutti gli stadi già scaduti', () => {
    const s0 = fresh('intrusione');
    const { state } = reduce(s0, { type: 'TICK', deltaMs: 200_000 });
    expect(state.stageIndex).toBe(2); // 0s, 90s, 180s <= 200s
    expect(state.image).toBe(PIANEROTTOLO.stages.intrusione[2]?.image);
  });

  it('la batteria cala col tempo; TICK è puro e ignora delta non positivi', () => {
    const s0 = fresh();
    const { state } = reduce(s0, { type: 'TICK', deltaMs: 1000 });
    expect(state.resources.battery).toBeLessThan(63);
    reduce(s0, { type: 'TICK', deltaMs: 5000 });
    expect(s0.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(reduce(s0, { type: 'TICK', deltaMs: 0 }).state).toBe(s0);
    expect(reduce(s0, { type: 'TICK', deltaMs: -100 }).state).toBe(s0);
  });
});

describe('engine — PROBE (stato attuale, mai bloccato)', () => {
  it('lo spioncino riporta lo stato attuale dello stadio e allinea l\'immagine', () => {
    const s0 = fresh('blackout');
    const { state, effects } = reduce(s0, { type: 'PROBE', probe: 'peep' });
    expect(state.resources.secondsRemaining).toBe(TOTAL_SECONDS - 8);
    const reveal = state.log.find((e) => e.causedBy === 'peep');
    expect(reveal?.text).toBe(PIANEROTTOLO.stages.blackout[0]?.peep);
    expect(state.image).toBe(PIANEROTTOLO.stages.blackout[0]?.image);
    expect(state.resources.knowledge).toBeGreaterThan(0);
    expect(effects.some((e) => e.type === 'CLUE')).toBe(true);
  });

  it('ripremere nello stesso stadio NON blocca: dà una riga di tensione', () => {
    let s = fresh('intrusione'); // stadio 0 = mood calm
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const lenAfterFirst = s.log.length;
    const knowledge = s.resources.knowledge;
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    expect(s.log.length).toBe(lenAfterFirst + 1); // sempre una riga nuova
    const last = s.log[s.log.length - 1];
    expect(PIANEROTTOLO.filler[s.mood]).toContain(last?.text);
    expect(s.resources.knowledge).toBe(knowledge); // la tensione non dà conoscenza
  });

  it('più tardi lo stesso spioncino mostra uno stato diverso (evolve nel tempo)', () => {
    let s = fresh('intrusione');
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const early = s.log.find((e) => e.causedBy === 'peep')?.text;
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: 200_000 }));
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const late = s.log.filter((e) => e.causedBy === 'peep').pop()?.text;
    expect(late).not.toBe(early);
    expect(late).toBe(PIANEROTTOLO.stages.intrusione[2]?.peep);
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

describe('engine — jumpscare e scelta finale', () => {
  it('entrare in uno stadio "scare" emette SCARE + HAPTIC shock', () => {
    let s = fresh('intrusione');
    // Stadio 3 (t=270) è scare (maniglia).
    const r = reduce(s, { type: 'TICK', deltaMs: 275_000 });
    s = r.state;
    expect(r.effects.some((e) => e.type === 'SCARE')).toBe(true);
    expect(r.effects.some((e) => e.type === 'HAPTIC' && e.pattern === 'shock')).toBe(true);
  });

  it('l\'ultimo stadio sblocca la decisione ed emette DECISION', () => {
    const r = reduce(fresh('intrusione'), { type: 'TICK', deltaMs: 545_000 });
    expect(r.state.decision).toBe(true);
    expect(r.effects.some((e) => e.type === 'DECISION')).toBe(true);
  });

  it('CHOOSE è ignorato prima della decisione, poi chiude con l\'esito', () => {
    let s = fresh('intrusione');
    // Prima della decisione: nessun effetto.
    expect(reduce(s, { type: 'CHOOSE', choice: 'open' }).state).toBe(s);
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: 545_000 }));
    const chosen = reduce(s, { type: 'CHOOSE', choice: 'open' });
    expect(chosen.state.phase).toBe('ended');
    expect(chosen.state.endReason).toBe('chose');
    expect(chosen.state.outcome).toBe('open');
  });
});

describe('engine — fine partita e RESET', () => {
  it('a 0 termina ed emette TIME_UP una sola volta', () => {
    let s = fresh();
    ({ state: s } = reduce(s, { type: 'TICK', deltaMs: (TOTAL_SECONDS - 1) * 1000 }));
    const atEnd = reduce(s, { type: 'TICK', deltaMs: 2000 });
    expect(atEnd.state.phase).toBe('ended');
    expect(atEnd.state.endReason).toBe('time_up');
    const after = reduce(atEnd.state, { type: 'TICK', deltaMs: 1000 });
    expect(after.state).toBe(atEnd.state);
  });

  it('RESET ricomincia da capo con la verità indicata', () => {
    let s = fresh('intrusione');
    ({ state: s } = reduce(s, { type: 'PROBE', probe: 'peep' }));
    const { state } = reduce(s, { type: 'RESET', truth: 'blackout' });
    expect(state.truth).toBe('blackout');
    expect(state.resources.secondsRemaining).toBe(TOTAL_SECONDS);
    expect(state.log).toHaveLength(0);
    expect(state.stageIndex).toBe(-1);
    expect(state.image).toBeNull();
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
