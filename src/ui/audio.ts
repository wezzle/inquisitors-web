/** Generative cathedral ambience: an organ drone, a breathing choir pad and soft bells. No samples. */
export class Choir {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private verb!: ConvolverNode;
  private wet!: GainNode;
  on = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    // gentle limiter so stacked bells and the choir never clip
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 6;
    comp.attack.value = 0.01;
    comp.release.value = 0.4;
    this.master.connect(comp).connect(ctx.destination);

    this.verb = ctx.createConvolver();
    this.verb.buffer = impulse(ctx, 6.5, 2.6);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.9;
    this.verb.connect(this.wet).connect(this.master);

    // organ drone: A1 + E2 + A2, detuned saws through a slowly breathing low-pass
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 140;
    lfo.connect(lfoAmt).connect(lp.frequency);
    lfo.start();
    const drone = ctx.createGain();
    drone.gain.value = 0.05;
    for (const [f, det] of [
      [55, -6],
      [55, 5],
      [82.41, 3],
      [110, -3],
      [110, 7],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start();
    }
    lp.connect(drone);
    drone.connect(this.master);
    drone.connect(this.verb);

    // choir: vowel-ish formant filtered pads on an A minor / F major drift
    const chords = [
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [196, 246.94, 293.66],
      [220, 261.63, 329.63],
    ];
    const voices: OscillatorNode[] = [];
    const voiceBus = ctx.createGain();
    voiceBus.gain.value = 0.022;
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 700;
    f1.Q.value = 3;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 1150;
    f2.Q.value = 4;
    const formant = ctx.createGain();
    formant.gain.value = 3.2;
    for (let i = 0; i < 3; i++) {
      for (const d of [-9, 0, 8]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = chords[0][i];
        o.detune.value = d;
        o.connect(f1);
        o.connect(f2);
        o.start();
        voices.push(o);
      }
    }
    f1.connect(formant);
    f2.connect(formant);
    formant.connect(voiceBus);
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.07;
    const breathAmt = ctx.createGain();
    breathAmt.gain.value = 0.012;
    breath.connect(breathAmt).connect(voiceBus.gain);
    breath.start();
    voiceBus.connect(this.verb);
    voiceBus.connect(this.master);

    let ci = 0;
    setInterval(() => {
      ci = (ci + 1) % chords.length;
      const t = ctx.currentTime;
      voices.forEach((o, k) => o.frequency.setTargetAtTime(chords[ci][Math.floor(k / 3)], t, 2.2));
      // vowel drift
      f1.frequency.setTargetAtTime([700, 450, 600, 380][ci], t, 3);
      f2.frequency.setTargetAtTime([1150, 900, 1000, 1500][ci], t, 3);
    }, 14000);

    return ctx;
  }

  toggle(v = !this.on) {
    const ctx = this.ensure();
    void ctx.resume();
    this.on = v;
    this.master.gain.setTargetAtTime(v ? 0.75 : 0, ctx.currentTime, v ? 1.6 : 0.4);
  }

  /** A struck bell — used when a dossier opens. Pitch drops for darker souls. */
  bell(dark = false) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const base = dark ? 98 : 196;
    for (const [mult, amp, decay] of [
      [1, 0.12, 4.5],
      [2.01, 0.05, 3],
      [2.76, 0.04, 2.2],
      [4.07, 0.02, 1.4],
      [5.4, 0.012, 0.9],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g);
      g.connect(this.verb);
      g.connect(this.master);
      o.start(t);
      o.stop(t + decay + 0.1);
    }
  }

  /** Faint cogitator tick on hover. */
  tick() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.018, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }

  /** Low whoosh for layout transitions. */
  whoosh() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const len = 2.2;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + len * 0.5);
    bp.frequency.exponentialRampToValueAtTime(140, t + len);
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.connect(bp).connect(g);
    g.connect(this.verb);
    g.connect(this.master);
    src.start(t);
  }
}

function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const rate = ctx.sampleRate;
  const len = rate * seconds;
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}
