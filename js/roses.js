"use strict";
/* =========================================================================
   roses.js — procedural roses drawn on canvas with layered bezier petals.
   Each rose "grows": a stem draws upward, then petals unfurl ring by ring.
   No images: everything is math, so it scales crisply on any screen.
   ========================================================================= */

class Rose {
  constructor(x, y, scale, palette, rand, growMs) {
    this.x = x; this.y = y; this.scale = scale;
    this.palette = palette;      // [light, mid, dark]
    this.rand = rand;
    this.growMs = growMs;
    this.age = 0;                // ms since growth began
    this.sway = rand() * Utils.TAU;
    this.petalRings = 3;
    this.petalsPerRing = [5, 7, 9];
    this.stemLen = 40 + rand() * 40;
  }

  update(dt) {
    this.age += dt * 1000;
    this.sway += dt;
  }

  _progress() { return Utils.clamp(this.age / this.growMs, 0, 1); }

  draw(ctx) {
    const p = this._progress();
    if (p <= 0) return;
    const s = this.scale;
    const swayX = Math.sin(this.sway) * 3;

    ctx.save();
    ctx.translate(this.x + swayX, this.y);

    // ---- Stem grows first (0 .. 0.35 of progress) ----
    const stemP = Utils.clamp(Utils.map(p, 0, 0.35, 0, 1), 0, 1);
    if (stemP > 0) {
      ctx.strokeStyle = "#2f5a3b";
      ctx.lineWidth = 2.4 * s;
      ctx.beginPath();
      ctx.moveTo(0, this.stemLen * s);
      ctx.quadraticCurveTo(-4 * s, this.stemLen * 0.5 * s, 0, this.stemLen * (1 - stemP) * s);
      ctx.stroke();

      // A leaf pops out midway.
      if (stemP > 0.5) {
        const lp = Utils.map(stemP, 0.5, 1, 0, 1);
        this._leaf(ctx, s, lp);
      }
    }

    // ---- Petals unfurl ring by ring (0.3 .. 1.0) ----
    const [light, mid, dark] = this.palette;
    for (let ring = this.petalRings - 1; ring >= 0; ring--) {
      const ringStart = 0.3 + ring * 0.18;
      const ringP = Utils.clamp(Utils.map(p, ringStart, ringStart + 0.35, 0, 1), 0, 1);
      if (ringP <= 0) continue;

      const petals = this.petalsPerRing[ring];
      const radius = (8 + ring * 9) * s * Utils.ease.outBack(ringP);
      const petalLen = (10 + ring * 6) * s;
      const petalWid = (7 + ring * 3) * s;

      for (let i = 0; i < petals; i++) {
        const a = (Utils.TAU * i) / petals + ring * 0.4 + this.sway * 0.15;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius * 0.72; // squash for perspective

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a + Math.PI / 2);
        ctx.scale(ringP, ringP);

        // Petal gradient from light center to dark edge.
        const grad = ctx.createLinearGradient(0, -petalLen, 0, petalLen * 0.4);
        grad.addColorStop(0, light);
        grad.addColorStop(0.55, mid);
        grad.addColorStop(1, dark);
        ctx.fillStyle = grad;

        // Bezier petal shape.
        ctx.beginPath();
        ctx.moveTo(0, petalLen * 0.4);
        ctx.bezierCurveTo(petalWid, petalLen * 0.1, petalWid * 0.7, -petalLen, 0, -petalLen);
        ctx.bezierCurveTo(-petalWid * 0.7, -petalLen, -petalWid, petalLen * 0.1, 0, petalLen * 0.4);
        ctx.fill();

        // Soft highlight down the spine.
        ctx.strokeStyle = "rgba(255,255,255,.18)";
        ctx.lineWidth = 0.8 * s;
        ctx.beginPath();
        ctx.moveTo(0, petalLen * 0.3);
        ctx.lineTo(0, -petalLen * 0.7);
        ctx.stroke();

        ctx.restore();
      }
    }

    // ---- Glowing core ----
    const coreP = Utils.clamp(Utils.map(p, 0.6, 1, 0, 1), 0, 1);
    if (coreP > 0) {
      const cr = 6 * s * coreP;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, cr);
      g.addColorStop(0, light);
      g.addColorStop(0.5, mid);
      g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, cr, 0, Utils.TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  _leaf(ctx, s, lp) {
    ctx.save();
    ctx.translate(0, this.stemLen * 0.55 * s);
    ctx.rotate(-0.5);
    ctx.scale(lp, lp);
    const g = ctx.createLinearGradient(0, 0, 18 * s, 0);
    g.addColorStop(0, "#3e6a4d"); g.addColorStop(1, "#153523");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(12 * s, -8 * s, 22 * s, 0);
    ctx.quadraticCurveTo(12 * s, 8 * s, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

/* A field of roses arranged in a ring around the center, growing together. */
class RoseGarden {
  constructor(cfg, rand) {
    this.cfg = cfg;
    this.rand = rand;
    this.roses = [];
    this.active = false;
  }

  build(W, H) {
    this.roses = [];
    const count = Utils.isMobile() ? this.cfg.countMobile : this.cfg.countDesktop;
    const palettes = [
      CONFIG.palette.roseWhite, CONFIG.palette.roseBlush, CONFIG.palette.rosePink,
      CONFIG.palette.rosePearl, CONFIG.palette.roseRed,
    ];
    for (let i = 0; i < count; i++) {
      const a = (Utils.TAU * i) / count + (this.rand() - 0.5) * 0.12;
      const mobile = Utils.isMobile();
      const rx = mobile ? Math.min(W * 0.44, 220) : Math.min(W * 0.42, 620);
      const ry = mobile ? Math.min(H * 0.4, 360) : Math.min(H * 0.42, 420);
      const layer = i % 3;
      const x = W / 2 + Math.cos(a) * (rx - layer * 30);
      const y = H / 2 + Math.sin(a) * (ry - layer * 26);
      const scale = (Utils.isMobile() ? 0.7 : 1) * (0.7 + this.rand() * 0.5);
      const rose = new Rose(x, y, scale, palettes[i % palettes.length], this.rand, this.cfg.growMs);
      // Stagger growth start so they open like a wave.
      rose.age = -(i % 8) * 90;
      this.roses.push(rose);
    }
  }

  start() { this.active = true; }

  update(dt) {
    if (!this.active) return;
    for (const r of this.roses) r.update(dt);
  }

  draw(ctx) {
    if (!this.active) return;
    // Sort by y so lower roses overlap correctly (fake depth).
    const sorted = [...this.roses].sort((a, b) => a.y - b.y);
    for (const r of sorted) r.draw(ctx);
  }

  reset() { for (const r of this.roses) r.age = 0; this.active = false; }
}
