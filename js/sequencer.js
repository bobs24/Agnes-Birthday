"use strict";
/* =========================================================================
   sequencer.js — a tiny timeline director.
   You register cues at specific times (ms). On play() it fires each cue once
   as the clock passes its time. Supports reset() for replays. This keeps the
   whole 15-second choreography in one readable place (see main.js).
   ========================================================================= */

class Sequencer {
  constructor() {
    this.cues = [];          // { time, fn, fired }
    this.startAt = 0;
    this.playing = false;
    this.onComplete = null;
    this.duration = 0;
  }

  /* Register a cue. Returns `this` so calls can be chained. */
  add(time, fn, label = "") {
    this.cues.push({ time, fn, fired: false, label });
    this.duration = Math.max(this.duration, time);
    return this;
  }

  play() {
    this.cues.sort((a, b) => a.time - b.time);
    this.cues.forEach((c) => (c.fired = false));
    this.startAt = performance.now();
    this.playing = true;
  }

  reset() {
    this.playing = false;
    this.cues.forEach((c) => (c.fired = false));
  }

  /* Call every animation frame with the current high-res timestamp. */
  tick(now) {
    if (!this.playing) return;
    const elapsed = now - this.startAt;
    for (const c of this.cues) {
      if (!c.fired && elapsed >= c.time) {
        c.fired = true;
        try { c.fn(elapsed); } catch (e) { console.error("Cue error:", c.label, e); }
      }
    }
    if (elapsed >= this.duration + 400 && this.onComplete) {
      const cb = this.onComplete; this.onComplete = null; cb();
    }
  }

  elapsed(now) { return this.playing ? now - this.startAt : 0; }
}
