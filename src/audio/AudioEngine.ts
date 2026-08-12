import type { Mood, SceneId } from '@engine/index';

/**
 * Audio procedurale (Web Audio API): nessun file, tutto sintetizzato in tempo
 * reale — leggero, offline, e reattivo all'umore. È un DRIVER: reagisce agli
 * effetti e allo stato dell'engine, non fa parte della logica pura.
 *
 * iOS richiede un gesto utente per avviare l'audio: chiamare `resume()` al
 * primo tocco. Finché non parte, resta silenzioso senza errori.
 */
type HeartParams = { rateMs: number; gain: number };

const HEART: Record<Mood, HeartParams> = {
  calm: { rateMs: 0, gain: 0 }, // spento
  tense: { rateMs: 900, gain: 0.16 },
  panic: { rateMs: 430, gain: 0.32 },
};

const DRONE_GAIN: Record<Mood, number> = { calm: 0.05, tense: 0.09, panic: 0.15 };
const NOISE_GAIN: Record<Mood, number> = { calm: 0.015, tense: 0.03, panic: 0.06 };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private mood: Mood = 'calm';
  private muted = false;
  private heartTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  /** Avvia/riprende il contesto audio (da chiamare al primo gesto utente). */
  async resume(): Promise<void> {
    try {
      if (!this.ctx) this.build();
      if (this.ctx && this.ctx.state !== 'running') await this.ctx.resume();
      if (!this.started) {
        this.started = true;
        this.scheduleHeart();
      }
    } catch {
      /* audio non disponibile: silenzio, nessun errore */
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Aggiorna l'atmosfera continua in base all'umore. */
  setMood(mood: Mood): void {
    this.mood = mood;
    const c = this.ctx;
    if (!c || !this.droneGain || !this.noiseGain || !this.noiseFilter) return;
    const t = c.currentTime;
    this.droneGain.gain.setTargetAtTime(DRONE_GAIN[mood], t, 1.2);
    this.noiseGain.gain.setTargetAtTime(NOISE_GAIN[mood], t, 1.2);
    const cutoff = mood === 'panic' ? 1400 : mood === 'tense' ? 700 : 420;
    this.noiseFilter.frequency.setTargetAtTime(cutoff, t, 1.2);
  }

  /** Suono di un'azione del giocatore. */
  probe(kind: 'peep' | 'search'): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    if (kind === 'peep') this.noiseBurst(1800, 0.05, 0.09); // scatto dello spioncino
    else {
      this.thump(90, 0.12); // rovistare: tonfo basso
      this.noiseBurst(600, 0.14, 0.05);
    }
  }

  /** Reagisce a un nuovo beat: aggiorna l'umore e dà un accento alla scena. */
  beat(scene: SceneId, mood: Mood): void {
    this.setMood(mood);
    switch (scene) {
      case 'door':
        this.knock();
        break;
      case 'figure':
        this.breath();
        break;
      case 'torch':
        this.thump(70, 0.09);
        break;
      case 'dark':
        this.subHit();
        break;
      default:
        break;
    }
    if (mood === 'panic') this.stinger();
  }

  /** Botta improvvisa del jumpscare: forte, sporca, immediata. */
  shock(): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    this.noiseBurst(2600, 0.35, 0.5); // schianto ad ampio spettro
    this.sweep(220, 32, 0.7, 0.4); // caduta grave
    this.thump(140, 0.5);
  }

  /** Momento della scelta finale: sale la tensione, il cuore accelera. */
  decision(): void {
    this.mood = 'panic';
    this.setMood('panic');
    this.sweep(90, 130, 3.0, 0.12); // drone che sale, senza sollievo
  }

  /** Ripristina l'atmosfera dopo un finale (es. dopo un RESET). */
  revive(): void {
    if (!this.ctx || !this.started) return;
    this.setMood(this.mood);
    if (!this.heartTimer) this.scheduleHeart();
  }

  /** Chiusura: un ultimo respiro grave, poi silenzio. */
  end(): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    this.stopHeart();
    this.droneGain?.gain.setTargetAtTime(0.0, c.currentTime, 2.0);
    this.noiseGain?.gain.setTargetAtTime(0.0, c.currentTime, 2.0);
    this.sweep(140, 40, 1.6, 0.22);
  }

  dispose(): void {
    this.stopHeart();
    try {
      this.ctx?.close();
    } catch {
      /* ignora */
    }
    this.ctx = null;
    this.started = false;
  }

  // --- costruzione grafo ---
  private build(): void {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const c = new Ctor();
    this.ctx = c;

    const master = c.createGain();
    master.gain.value = this.muted ? 0 : 0.9;
    master.connect(c.destination);
    this.master = master;

    // Drone: due oscillatori quasi accordati (battimenti) + sub, via lowpass.
    const droneGain = c.createGain();
    droneGain.gain.value = DRONE_GAIN[this.mood];
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    lp.Q.value = 0.7;
    const o1 = c.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 52;
    const o2 = c.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = 52 * 1.006;
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(droneGain);
    droneGain.connect(master);
    o1.start();
    o2.start();
    this.droneGain = droneGain;

    // Tono d'ambiente: rumore filtrato passa-basso, molto tenue.
    const noiseGain = c.createGain();
    noiseGain.gain.value = NOISE_GAIN[this.mood];
    const nf = c.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 420;
    const noise = c.createBufferSource();
    noise.buffer = this.makeNoise(c, 2);
    noise.loop = true;
    noise.connect(nf);
    nf.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
    this.noiseGain = noiseGain;
    this.noiseFilter = nf;
  }

  private makeNoise(c: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // --- battito cardiaco ---
  private scheduleHeart(): void {
    const params = HEART[this.mood];
    if (!this.ctx || params.rateMs <= 0 || this.muted) {
      this.heartTimer = setTimeout(() => this.scheduleHeart(), 300);
      return;
    }
    this.lubDub(params.gain);
    this.heartTimer = setTimeout(() => this.scheduleHeart(), params.rateMs);
  }

  private stopHeart(): void {
    if (this.heartTimer) clearTimeout(this.heartTimer);
    this.heartTimer = null;
  }

  private lubDub(gain: number): void {
    this.thump(60, gain);
    setTimeout(() => this.thump(48, gain * 0.75), 150);
  }

  // --- SFX di base ---
  private thump(freq: number, gain: number): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.5), t + 0.16);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.24);
  }

  private noiseBurst(cutoff: number, dur: number, gain: number): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.makeNoise(c, dur + 0.05);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = cutoff;
    bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  private knock(): void {
    this.thump(120, 0.28);
    setTimeout(() => this.thump(110, 0.26), 260);
    setTimeout(() => this.thump(115, 0.24), 520);
  }

  private breath(): void {
    this.noiseBurst(320, 0.5, 0.05);
    setTimeout(() => this.noiseBurst(260, 0.6, 0.045), 600);
  }

  private subHit(): void {
    this.sweep(70, 30, 0.9, 0.18);
  }

  private stinger(): void {
    this.sweep(180, 46, 0.7, 0.14);
  }

  private sweep(from: number, to: number, dur: number, gain: number): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}
