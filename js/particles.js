"use strict";
/* =========================================================================
   particles.js — the always-on atmosphere:
     • twinkling starfield
     • drifting rose petals (with subtle 3D flip)
     • floating bokeh orbs (soft, blurred depth)
     • rising pollen sparks
   All layered to create real cinematic depth behind the text and roses.
   ========================================================================= */

class Atmosphere {
  constructor(cfg, rand) {
    this.cfg = cfg;
    this.rand = rand;
    this.stars = [];
    this.petals = [];
    this.bokeh = [];
    this.pollen = [];
    this.W = 0; this.H = 0;
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this._seed();
  }

  _seed() {
    const r = this.rand;
    const mobile = Utils.isMobile();

    this.stars = Array.from({ length: mobile ? 80 : 150 }, () => ({
      x: r() * this.W, y: r() * this.H, rad: 0.4 + r() * 1.6,
      tw: r() * Utils.TAU, sp: 0.5 + r() * 1.6,
    }));

    this.petals = Array.from({ length: mobile ? 26 : 46 }, () => this._petal(true));

    this.bokeh = Array.from({ length: mobile ? 10 : 18 }, () => ({
      x: r() * this.W, y: r() * this.H, rad: 20 + r() * 70,
      drift: 4 + r() * 10, phase: r() * Utils.TAU,
      alpha: 0.04 + r() * 0.09,
      color: CONFIG.palette.particle[Math.floor(r() * CONFIG.palette.particle.length)],
    }));

    this.pollen = Array.from({ length: mobile ? 30 : 60 }, () => this._pollen(true));
  }

  _petal(initial) {
    const r = this.rand;
    return {
      x: r() * this.W, y: initial ? r() * this.H : -30,
      size: 5 + r() * 11, speed: 14 + r() * 30, drift: -18 + r() * 36,
      spin: r() * Utils.TAU, spinSp: -1.2 + r() * 2.4,
      flip: r() * Utils.TAU, flipSp: 1 + r() * 2,
      alpha: 0.25 + r() * 0.55,
      color: CONFIG.palette.particle[Math.floor(r() * CONFIG.palette.particle.length)],
    };
  }

  _pollen(initial) {
    const r = this.rand;
    return {
      x: r() * this.W, y: initial ? r() * this.H : this.H + 10,
      rise: 10 + r() * 24, drift: -8 + r() * 16,
      size: 0.6 + r() * 1.6, phase: r() * Utils.TAU,
      alpha: 0.2 + r() * 0.5,
    };
  }

  update(dt) {
    for (const s of this.stars) s.tw += s.sp * dt;

    for (const p of this.petals) {
      p.y += p.speed * dt;
      p.x += (p.drift + Math.sin(p.y * 0.012) * 16) * dt;
      p.spin += p.spinSp * dt;
      p.flip += p.flipSp * dt;
      if (p.y > this.H + 30) Object.assign(p, this._petal(false));
    }

    for (const b of this.bokeh) {
      b.phase += dt * 0.4;
      b.x += Math.cos(b.phase) * b.drift * dt;
      b.y += Math.sin(b.phase * 0.7) * b.drift * dt;
    }

    for (const p of this.pollen) {
      p.y -= p.rise * dt;
      p.phase += dt * 2;
      p.x += Math.sin(p.phase) * p.drift * dt;
      if (p.y < -10) Object.assign(p, this._pollen(false));
    }
  }

  /* Draw the deep background layers (stars + bokeh). */
  drawBack(ctx) {
    // Bokeh first (soft depth), behind stars.
    for (const b of this.bokeh) {
      const rgb = Utils.hexToRgb(b.color);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rad);
      g.addColorStop(0, Utils.rgba(rgb.r, rgb.g, rgb.b, b.alpha));
      g.addColorStop(1, Utils.rgba(rgb.r, rgb.g, rgb.b, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.rad, 0, Utils.TAU); ctx.fill();
    }
    for (const s of this.stars) {
      const a = 0.2 + (Math.sin(s.tw) * 0.5 + 0.5) * 0.65;
      ctx.globalAlpha = a; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.rad, 0, Utils.TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* Draw the foreground layers (petals + pollen) on top of everything. */
  drawFront(ctx) {
    for (const p of this.pollen) {
      ctx.globalAlpha = p.alpha * (0.6 + Math.sin(p.phase) * 0.4);
      ctx.fillStyle = "#ffe6b8";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Utils.TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const p of this.petals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      // Fake a 3D flip by squashing width with a cosine of the flip angle.
      const sx = Math.cos(p.flip);
      ctx.scale(Math.max(0.15, Math.abs(sx)), 1);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Utils.TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
