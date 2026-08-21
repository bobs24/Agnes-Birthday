"use strict";
/* =========================================================================
   audio.js — generative, royalty-free soundtrack built with Web Audio.
   Layers: warm pad, a gentle music-box melody, sparkle arpeggios, and a
   convolver reverb rendered from noise. Nothing is downloaded, so there is
   zero copyright risk and no external audio files to host.
   ========================================================================= */

class Soundtrack {
  constructor(cfg) {
    this.cfg = cfg;
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.melodyTimer = null;
    this.padVoices = [];
    this.muted = false;
    this.started = false;
  }

  /* Web Audio requires a user gesture; call this from a click/tap. */
  start() {
    if (this.started) { this.ctx && this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.started = true;
    this.ctx = new AC();

    // Master bus with a soft limiter-ish compressor for polish.
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.cfg.masterVolume;

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 24; comp.ratio.value = 3;
    comp.attack.value = 0.004; comp.release.value = 0.25;

    this.master.connect(comp);
    comp.connect(this.ctx.destination);

    // Optional reverb send for a dreamy tail.
    if (this.cfg.reverb) {
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this._impulse(2.6, 2.4);
      const wet = this.ctx.createGain(); wet.gain.value = 0.32;
      this.reverb.connect(wet); wet.connect(this.master);
    }

    this._startPad();
    this._startMelody();
  }

  /* Build a reverb impulse response from decaying noise. */
  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  /* A slowly evolving two-note pad underneath everything. */
  _startPad() {
    const chord = [130.81, 196.0, 261.63]; // C3, G3, C4 — warm and open
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.0;
      // slow swell in
      gain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 2.5);
      // gentle vibrato
      lfo.frequency.value = 0.08 + i * 0.03;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(gain); gain.connect(this.master);
      if (this.reverb) gain.connect(this.reverb);
      osc.start(); lfo.start();
      this.padVoices.push({ osc, lfo, gain });
    });
  }

  /* A repeating music-box melody with an occasional sparkle arpeggio. */
  _startMelody() {
    // A gentle major phrase (C major) that feels tender and hopeful.
    const phrase = [523.25, 659.25, 783.99, 987.77, 880.0, 783.99, 659.25, 587.33];
    let step = 0;
    const play = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const note = phrase[step % phrase.length];
      this._pluck(note, t, 1.6, 0.22, "sine");
      // harmony a third below on alternate steps
      if (step % 2 === 0) this._pluck(note * 0.8, t, 1.4, 0.09, "triangle");
      // every 8 steps, a rising sparkle arpeggio
      if (step % 8 === 7) this.arpeggio(note);
      step++;
    };
    play();
    this.melodyTimer = setInterval(play, this.cfg.tempoMs);
  }

  /* One plucked note with a soft attack and long tail. */
  _pluck(freq, t, dur, peak, type) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(gain); gain.connect(this.master);
    if (this.reverb) gain.connect(this.reverb);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  /* A quick shimmering run of notes — used for magic moments. */
  arpeggio(base = 659.25) {
    if (!this.ctx) return;
    const steps = [1, 1.25, 1.5, 2, 2.5];
    steps.forEach((mult, k) => this._pluck(base * mult, this.ctx.currentTime + k * 0.07, 1.2, 0.16, "sine"));
  }

  /* A bright celebratory chime for the finale. */
  chime() {
    if (!this.ctx) return;
    [659.25, 783.99, 987.77, 1318.5, 1567.98].forEach((f, k) =>
      this._pluck(f, this.ctx.currentTime + k * 0.08, 1.6, 0.2, "sine"));
  }

  /* A soft low "whoosh" for a firework launch. */
  whoosh() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.5);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.65);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.cfg.masterVolume, this.ctx.currentTime, 0.1);
  }
}
