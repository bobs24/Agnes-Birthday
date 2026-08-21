"use strict";
/* =========================================================================
   main.js — the conductor.
   Wires together: Atmosphere, ParticleText, RoseGarden, Fireworks, Soundtrack,
   and Sequencer. Manages three stacked canvases, a bloom/glow post-process,
   the DOM text overlays, controls, and the full 15-second choreography.
   ========================================================================= */

class Experience {
  constructor() {
    // Seeded RNG (seed = 24 Sep 1997) → the scene looks identical every replay.
    this.rand = Utils.seeded(24091997);

    // ---- Canvases (stacked): back (atmosphere) / main (text+roses+fx) / glow
    this.backCanvas = Utils.$("#bgCanvas");
    this.mainCanvas = Utils.$("#mainCanvas");
    this.glowCanvas = Utils.$("#glowCanvas");   // offscreen-style bloom buffer
    this.backCtx = this.backCanvas.getContext("2d");
    this.mainCtx = this.mainCanvas.getContext("2d");
    this.glowCtx = this.glowCanvas.getContext("2d");

    // ---- Systems
    this.atmos   = new Atmosphere(CONFIG.particles, this.rand);
    this.text    = new ParticleText(this.mainCanvas, CONFIG.particles, this.rand);
    this.garden  = new RoseGarden(CONFIG.roses, this.rand);
    this.fw       = new Fireworks(CONFIG.palette, this.rand, null);
    this.audio   = new Soundtrack(CONFIG.audio);
    this.fw.audio = this.audio;
    this.seq     = new Sequencer();

    // ---- DOM text overlays
    this.dom = {
      kicker:   Utils.$("#kicker"),
      quote:    Utils.$("#quoteLine"),
      ageSub:   Utils.$("#ageSub"),
      sign:     Utils.$("#signature"),
      signName: Utils.$("#signName"),
      heart:    Utils.$("#heartMark"),
      controls: Utils.$("#controls"),
      tap:      Utils.$("#tapStart"),
    };

    this.last = 0;
    this.running = true;

    this._resize();
    window.addEventListener("resize", () => this._resize(), { passive: true });
    this._bindControls();
    this._buildTimeline();

    // Auto-start visuals immediately (clean for screen recording).
    this.seq.play();

    // Kick off the render loop.
    requestAnimationFrame((t) => this._loop(t));
  }

  /* ---- Sizing: keep every canvas crisp on hi-dpi screens ---- */
  _resize() {
    const ratio = Utils.dpr();
    const W = window.innerWidth, H = window.innerHeight;
    for (const c of [this.backCanvas, this.mainCanvas, this.glowCanvas]) {
      c.width = W * ratio; c.height = H * ratio;
      c.style.width = W + "px"; c.style.height = H + "px";
      c.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    this.W = W; this.H = H;
    this.atmos.resize(W, H);
    this.fw.resize(W, H);
    if (this.garden.roses.length) this.garden.build(W, H);
  }

  /* ---- Controls: replay + mute + the one-time "tap for sound" ---- */
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

  /* ---- DOM helpers ---- */
  _showKicker(text) {
    this.dom.kicker.textContent = text;
    this.dom.kicker.classList.remove("show"); void this.dom.kicker.offsetWidth;
    this.dom.kicker.classList.add("show");
  }
  _hide(el) { el.classList.remove("show"); }

  /* =======================================================================
     THE 15-SECOND CHOREOGRAPHY
     Each cue is a moment in time (ms). Read top-to-bottom like a script.
     ======================================================================= */
  _buildTimeline() {
    const T = CONFIG.timeline;
    this.seq.reset();

    // 0.3s — ignite: faint kicker; particles already swirling in the dark.
    this.seq.add(T.ignite, () => {
      this._showKicker("once upon a time…");
    }, "ignite");

    // 1.4s — assemble: particles fly in and spell her first name.
    this.seq.add(T.assemble, () => {
      this._hide(this.dom.kicker);
      this.text.assemble(CONFIG.herFirst);
      this.audio.arpeggio && this.audio.arpeggio(523.25);
    }, "assemble");

    // 4.2s — full name: morph particles into the full name + show underline.
    this.seq.add(T.fullName, () => {
      this._showKicker("on the 24th of September");
      this.text.morph(CONFIG.herName);
      Utils.$("#goldRule").classList.add("draw");
    }, "fullName");

    // 6.6s — age reveal: explode the name, roses begin to grow, giant "29".
    this.seq.add(T.ageReveal, () => {
      this._hide(this.dom.kicker);
      Utils.$("#goldRule").classList.remove("draw");
      this.text.explode();
      this.garden.build(this.W, this.H);
      this.garden.start();
      // The big number is a DOM element for crisp gradient text.
      const ageEl = Utils.$("#ageNumber");
      ageEl.textContent = CONFIG.age;
      ageEl.classList.add("show");
      this.dom.ageSub.textContent = "years of being wonderful";
      this.dom.ageSub.classList.add("show");
      this.audio.arpeggio && this.audio.arpeggio(659.25);
    }, "ageReveal");

    // 9.2s — birthday: hide the number, reassemble name, show the quote.
    this.seq.add(T.birthday, () => {
      Utils.$("#ageNumber").classList.remove("show");
      this.dom.ageSub.classList.remove("show");
      this.text.assemble(CONFIG.herName);
      this._showKicker("happy birthday");
      this.dom.quote.textContent = "\u201C" + CONFIG.quote + "\u201D";
      this.dom.quote.classList.add("show");
    }, "birthday");

    // 11.6s — signature + fireworks finale.
    this.seq.add(T.signature, () => {
      this._hide(this.dom.kicker);
      this.dom.quote.classList.remove("show");
      this.text.explode();
      this.dom.sign.textContent = CONFIG.signOff;
      this.dom.signName.textContent = CONFIG.yourName;
      this.dom.sign.classList.add("show");
      this.dom.signName.classList.add("show");
      this.dom.heart.classList.add("show");
      this.audio.chime();
      this.fw.launch(9);
      setTimeout(() => this.fw.launch(7), 900);
      setTimeout(() => this.fw.launch(5), 1900);
    }, "signature");

    // 14.6s — controls quietly appear (after the clean 15s window).
    this.seq.add(T.controls, () => {
      this.dom.controls.classList.add("show");
    }, "controls");
  }

  /* ---- Replay: reset every system, re-run the timeline ---- */
  replay() {
    this.rand = Utils.seeded(24091997);       // identical scene each time
    this.text.clear();
    this.garden.reset();
    this.fw.clear();
    // Reset DOM overlays.
    ["#ageNumber", "#kicker", "#quoteLine", "#ageSub", "#signature", "#signName", "#heartMark"]
      .forEach((s) => Utils.$(s).classList.remove("show"));
    Utils.$("#goldRule").classList.remove("draw");
    this.dom.controls.classList.remove("show");
    this._buildTimeline();
    this.seq.play();
  }

  /* ---- The master render loop ---- */
  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.033);
    this.last = now;

    // Advance the director.
    this.seq.tick(now);

    // Update systems.
    this.atmos.update(dt);
    this.text.update(dt);
    this.garden.update(dt);
    this.fw.update(dt);

    // ---- Draw BACK layer: deep atmosphere ----
    this.backCtx.clearRect(0, 0, this.W, this.H);
    this.atmos.drawBack(this.backCtx);

    // ---- Draw MAIN layer: roses (behind) + particle text + fireworks ----
    this.mainCtx.clearRect(0, 0, this.W, this.H);
    this.garden.draw(this.mainCtx);
    this.text.draw(this.mainCtx);
    this.fw.draw(this.mainCtx);
    this.atmos.drawFront(this.mainCtx);

    // ---- BLOOM post-process ----
    // Cheap but gorgeous glow: copy the main canvas into the glow buffer with
    // a blur filter and screen-blend it back on top. This makes every particle
    // and firework softly radiate light.
    this.glowCtx.clearRect(0, 0, this.W, this.H);
    this.glowCtx.save();
    this.glowCtx.filter = "blur(9px) brightness(1.4)";
    this.glowCtx.drawImage(this.mainCanvas, 0, 0, this.W, this.H);
    this.glowCtx.restore();

    requestAnimationFrame((t) => this._loop(t));
  }
}

/* ---- Boot after fonts have a moment to load (so text samples cleanly) ---- */
document.addEventListener("DOMContentLoaded", () => {
  // A short delay lets the web font register before we sample pixels for text.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(() => new Experience(), 120));
  } else {
    setTimeout(() => new Experience(), 400);
  }
});
