"use strict";
/* =========================================================================
   audio.js — a soft, royalty-free soundtrack (warm pad + music-box melody +
   convolver reverb), plus optional playback of YOUR voice recording.
   Nothing is downloaded except your own file, so there's no copyright risk.
   ========================================================================= */

class Soundtrack {
  constructor(cfg) {
    this.cfg = cfg;
    this.ctx = null; this.master = null; this.reverb = null;
    this.timer = null; this.muted = false; this.started = false; this._ducked = null;
    this.voice = null;
  }

  start() {
    if (this.started) { this.ctx && this.ctx.resume(); this._playVoice(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this._playVoice(); return; }
    this.started = true;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.16;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(this.ctx.destination);

    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this._impulse(2.6, 2.4);
    const wet = this.ctx.createGain(); wet.gain.value = 0.3;
    this.reverb.connect(wet); wet.connect(this.master);

    this._pad(); this._melody();
    this._playVoice();
  }

  _impulse(sec, decay) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * sec);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  _pad() {
    [130.81, 196.0, 261.63].forEach((f, i) => {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = i === 2 ? "triangle" : "sine"; osc.frequency.value = f;
      g.gain.value = 0; g.gain.setTargetAtTime(0.05, this.ctx.currentTime, 2.5);
      osc.connect(g); g.connect(this.master); g.connect(this.reverb); osc.start();
    });
  }

  _melody() {
    const phrase = [523.25, 659.25, 783.99, 987.77, 880.0, 783.99, 659.25, 587.33];
    let i = 0;
    const play = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this._note(phrase[i % phrase.length], t, 1.6, 0.2, "sine");
      if (i % 2 === 0) this._note(phrase[i % phrase.length] * 0.8, t, 1.4, 0.08, "triangle");
      i++;
    };
    play(); this.timer = setInterval(play, 700);
  }

  _note(freq, t, dur, peak, type) {
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g); g.connect(this.master); g.connect(this.reverb);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  chime() {
    if (!this.ctx) return;
    [659.25, 783.99, 987.77, 1318.5].forEach((f, k) => this._note(f, this.ctx.currentTime + k * 0.08, 1.5, 0.18, "sine"));
  }

  /* Optional: your voice reading the letter. */
  _playVoice() {
    const n = CONFIG.narration;
    if (!n || !n.enabled || !n.file) return;
    if (!this.voice) {
      this.voice = new Audio();
      this.voice.src = n.file; this.voice.volume = n.volume != null ? n.volume : 1;
      this.voice.addEventListener("play", () => this.duck(0.05));
      this.voice.addEventListener("ended", () => this.duck(null));
      this.voice.addEventListener("error", () => {});
    }
    this.voice.currentTime = 0;
    const p = this.voice.play();
    if (p && p.catch) p.catch(() => {});
  }

  duck(to) {
    this._ducked = to;
    if (this.muted || !this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(to != null ? to : 0.16, this.ctx.currentTime, 0.4);
  }

  setMuted(m) {
    this.muted = m;
    const target = m ? 0 : (this._ducked != null ? this._ducked : 0.16);
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    if (this.voice) this.voice.muted = m;
  }
}
