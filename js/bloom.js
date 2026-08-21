"use strict";
/* =========================================================================
   bloom.js — a FULL, lush rose made of glowing particles.

   The previous version used a single thin rose curve. This one grows a real
   bloom the way nature does: dozens of petals arranged on a golden-angle
   spiral (phyllotaxis), each petal a soft cluster of particles. Petals near
   the center are small and deep-pink; outer petals are larger and blush.
   The whole flower "breathes" and beats like a heartbeat, and every particle
   softly shimmers with additive glow.
   ========================================================================= */

class RoseBloom {
  constructor(canvas, rand) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.rand = rand;
    this.particles = [];
    this.formStart = performance.now();
    this.W = 0; this.H = 0; this.cx = 0; this.cy = 0; this.R = 0;
    this.sway = 0;
  }

  /* Build the bloom: place petals on a spiral, fill each with particles. */
  build(W, H) {
    this.W = W; this.H = H;
    this.cx = W / 2;
    this.cy = H * (Utils.isMobile() ? 0.36 : 0.44);
    this.R  = Math.min(W, H) * (Utils.isMobile() ? 0.30 : 0.33);

    const cfg = CONFIG.rose;
    const petalCount = Utils.isMobile() ? cfg.petals.mobile : cfg.petals.desktop;
    const per        = Utils.isMobile() ? cfg.particlesPerPetal.mobile : cfg.particlesPerPetal.desktop;
    const spread     = cfg.spread;

    this.particles = [];
    const maxSpiral = spread * Math.sqrt(petalCount);

    for (let i = 0; i < petalCount; i++) {
      // Phyllotaxis position of this petal within the bloom (0..1 from center).
      const spiralR = spread * Math.sqrt(i);
      const spiralA = i * Utils.GOLDEN;
      const depth = spiralR / maxSpiral;             // 0 center → 1 outer edge

      // Petal grows larger toward the outside; center petals are tight buds.
      const petalScale = Utils.lerp(0.22, 1.15, depth);
      // Petals face outward, curling slightly — orientation along the spiral.
      const orient = spiralA + Math.PI / 2;

      // Colour by depth: deep core → bright mid → soft blush → white tips.
      const cCore = cfg.colorCore, cMid = cfg.colorMid, cEdge = cfg.colorEdge, cTip = cfg.colorTip;

      for (let j = 0; j < per; j++) {
        // Sample a point inside a teardrop petal shape in local space.
        const tp = this._petalPoint();
        // tp.ly runs 0 (base) .. 1 (tip); use it for colour + tip glow.
        const localX = tp.lx * petalScale;
        const localY = tp.ly * petalScale;

        // Rotate the petal to its orientation and offset onto the spiral.
        const cos = Math.cos(orient), sin = Math.sin(orient);
        const px = spiralR * Math.cos(spiralA) + (localX * cos - localY * sin) * 3.4;
        const py = spiralR * Math.sin(spiralA) + (localX * sin + localY * cos) * 3.4;

        // Colour: blend core→edge by overall depth, then lighten toward tip.
        let col;
        if (depth < 0.5) col = Utils.mix(cCore, cMid, depth / 0.5);
        else col = Utils.mix(cMid, cEdge, (depth - 0.5) / 0.5);
        const tipMix = Math.pow(tp.tip, 1.5) * 0.7;
        col = { r: Utils.lerp(col.r, 255, tipMix), g: Utils.lerp(col.g, 242, tipMix), b: Utils.lerp(col.b, 247, tipMix) };

        this.particles.push({
          // Home position (in bloom-local units, scaled by R at draw time):
          hx: px, hy: py,
          // Start scattered for the "form-in" swirl:
          sx: this.rand() * Utils.TAU,               // start angle
          sr: 1.4 + this.rand() * 1.2,               // start radius factor
          // Visuals:
          r: col.r, g: col.g, b: col.b,
          size: Utils.lerp(2.4, 0.9, depth) * (0.7 + this.rand() * 0.7),
          alpha: Utils.lerp(0.9, 0.45, depth) * (0.7 + this.rand() * 0.5),
          phase: this.rand() * Utils.TAU,
          twSpeed: 0.8 + this.rand() * 2.2,
          depth,
          jx: this.rand() * 1.4 - 0.7,
          jy: this.rand() * 1.4 - 0.7,
        });
      }
    }

    // Normalise home coords so the bloom fits R nicely.
    let maxd = 0;
    for (const p of this.particles) maxd = Math.max(maxd, Math.hypot(p.hx, p.hy));
    const norm = (this.R * 1.05) / (maxd || 1);
    for (const p of this.particles) { p.hx *= norm; p.hy *= norm; }

    this.formStart = performance.now();
  }

  /* A point inside one soft teardrop petal, in local space (~ -1..1). */
  _petalPoint() {
    // ly: position along the petal length (0 base .. 1 tip), biased outward.
    const ly = Math.sqrt(this.rand());
    // width tapers at base and tip, fattest around 55% up the petal.
    const widthProfile = Math.sin(Math.PI * Utils.clamp(ly * 0.9 + 0.05, 0, 1));
    const lx = (this.rand() * 2 - 1) * 0.5 * widthProfile;
    return { lx, ly: ly - 0.25, tip: ly };   // tip used for colour lightening
  }

  /* Heartbeat scale: a double "lub-dub" thump per cycle, then rest. */
  _beat(t) {
    const cfg = CONFIG.rose;
    const p = (t % cfg.beatPeriod) / cfg.beatPeriod;
    const thump = (c, w) => Math.exp(-Math.pow((p - c) / w, 2));
    return 1 + cfg.beatStrength * thump(0, 0.05) + cfg.beatStrength * 0.72 * thump(0.17, 0.06);
  }

  resize(W, H) { this.build(W, H); }

  draw(now) {
    const ctx = this.ctx;
    const t = (now - this.formStart) / 1000;

    // Form-in progress: particles swirl from scattered → home over roseFormMs.
    const formP = Utils.clamp((now - this.formStart) / CONFIG.timeline.roseFormMs, 0, 1);
    const eased = Utils.ease.outCubic(formP);

    // Heartbeat only kicks in once the bloom has formed.
    const beat = formP >= 1 ? this._beat(t) : 1;

    // Gentle sway/breathing.
    this.sway += 0.006;
    const swayX = CONFIG.rose.sway ? Math.sin(this.sway) * 4 : 0;
    const swayR = CONFIG.rose.sway ? Math.sin(this.sway * 0.7) * 0.012 : 0;

    ctx.clearRect(0, 0, this.W, this.H);
    ctx.globalCompositeOperation = "lighter";   // additive → soft neon glow

    for (const p of this.particles) {
      // Target (home) position, scaled by heartbeat + sway.
      const scale = beat + swayR;
      const hx = this.cx + p.hx * scale + swayX + p.jx;
      const hy = this.cy + p.hy * scale + p.jy;

      // Scattered start position (for the form-in swirl).
      const startX = this.cx + Math.cos(p.sx) * this.R * p.sr;
      const startY = this.cy + Math.sin(p.sx) * this.R * p.sr;

      // Interpolate start → home with a little residual swirl.
      const swirl = (1 - eased) * 0.6;
      const ang = p.sx + swirl * 3;
      const ix = Utils.lerp(startX + Math.cos(ang) * 8, hx, eased);
      const iy = Utils.lerp(startY + Math.sin(ang) * 8, hy, eased);

      const tw = 0.6 + Math.sin(now * 0.001 * p.twSpeed + p.phase) * 0.4;
      ctx.globalAlpha = p.alpha * tw * (0.35 + eased * 0.65);
      ctx.fillStyle = Utils.rgba(p.r, p.g, p.b, 1);
      ctx.shadowColor = Utils.rgba(p.r, p.g, p.b, 1);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(ix, iy, p.size, 0, Utils.TAU);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  reset() { this.formStart = performance.now(); }
}
