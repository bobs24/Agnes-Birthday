"use strict";
/* =========================================================================
   main.js — the conductor.
   Layers three canvases (atmosphere / bloom / glow), builds the rose, runs
   the letter + photo choreography, adds a soft bloom post-process, and wires
   the controls. Everything is tuned to stay smooth on phones.
   ========================================================================= */

class Experience {
  constructor() {
    this.rand = Utils.seeded(240997);

    this.bgCanvas   = Utils.$("#bgCanvas");
    this.roseCanvas = Utils.$("#roseCanvas");
    this.glowCanvas = Utils.$("#glowCanvas");
    this.glowCtx    = this.glowCanvas.getContext("2d");

    this.atmos = new Atmosphere(this.bgCanvas, this.rand);
    this.bloom = new RoseBloom(this.roseCanvas, this.rand);
    this.audio = new Soundtrack(CONFIG.audio);
    this.gallery = new Gallery(
      Utils.$("#photoFrame"), Utils.$("#photoA"), Utils.$("#photoB"), this.rand
    );

    this.dom = {
      letter: Utils.$("#letter"),
      controls: Utils.$("#controls"),
      tap: Utils.$("#tapStart"),
    };

    this.timers = [];
    this.last = 0;
    this.running = true;

    this._buildLetterDOM();
    this._resize();
    window.addEventListener("resize", () => this._resize(), { passive: true });

    // Load photos (async) then reveal the frame when the timeline says so.
    this.gallery.preload();

    this._bindControls();
    this._runTimeline();

    requestAnimationFrame((t) => this._loop(t));
  }

  _buildLetterDOM() {
    // Turn the config letter array into styled lines.
    const wrap = this.dom.letter;
    wrap.innerHTML = "";
    CONFIG.letter.forEach((line, i) => {
      const el = document.createElement(i === 0 ? "div" : "p");
      el.className = i === 0 ? "greet" : "line";
      el.innerHTML = line;
      wrap.appendChild(el);
    });
    const sign = document.createElement("div");
    sign.className = "sign";
    sign.textContent = CONFIG.yourName;
    wrap.appendChild(sign);
    this.lines = [...wrap.children];
  }

  _resize() {
    const ratio = Utils.dpr();
    const W = window.innerWidth, H = window.innerHeight;
    for (const c of [this.bgCanvas, this.roseCanvas, this.glowCanvas]) {
      c.width = W * ratio; c.height = H * ratio;
      c.style.width = W + "px"; c.style.height = H + "px";
      c.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    this.W = W; this.H = H;
    this.atmos.resize(W, H);
    this.bloom.resize(W, H);
  }

  _bindControls() {
    this.dom.tap.addEventListener("click", () => {
      this.audio.start();
      this.dom.tap.classList.add("hide");
    });
    Utils.$("#replayBtn").addEventListener("click", () => this.replay());
    Utils.$("#soundBtn").addEventListener("click", () => {
      const muted = !document.body.classList.contains("is-muted");
      document.body.classList.toggle("is-muted", muted);
      this.audio.setMuted(muted);
    });
  }

  _clearTimers() { this.timers.forEach(clearTimeout); this.timers = []; }
  _at(ms, fn) { this.timers.push(setTimeout(fn, ms)); }

  _runTimeline() {
    this._clearTimers();
    const T = CONFIG.timeline;

    // Reveal letter lines one by one.
    let delay = T.letterStart;
    this.lines.forEach((el) => {
      this._at(delay, () => el.classList.add("show"));
      delay += T.letterGapMs;
    });

    // Reveal the photo frame.
    this._at(T.photosStart, () => { if (this.gallery.available) this.gallery.start(); });

    // Show controls after the letter finishes.
    this._at(delay + 800, () => this.dom.controls.classList.add("show"));
  }

  replay() {
    this._clearTimers();
    this.lines.forEach((el) => el.classList.remove("show"));
    this.dom.controls.classList.remove("show");
    this.gallery.stop();
    this.bloom.reset();
    this._runTimeline();
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.033);
    this.last = now;

    this.atmos.update(dt);
    this.atmos.draw();
    this.bloom.draw(now);

    // Bloom post-process: blur + brighten the rose canvas and screen-blend it
    // back on top, so the whole flower radiates a soft romantic light.
    this.glowCtx.clearRect(0, 0, this.W, this.H);
    this.glowCtx.save();
    this.glowCtx.filter = "blur(11px) brightness(1.5)";
    this.glowCtx.drawImage(this.roseCanvas, 0, 0, this.W, this.H);
    this.glowCtx.restore();

    requestAnimationFrame((t) => this._loop(t));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(() => new Experience(), 100));
  } else {
    setTimeout(() => new Experience(), 300);
  }
});
