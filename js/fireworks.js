"use strict";
/* =========================================================================
   fireworks.js — a physically-flavoured firework system.
   Shells launch upward, leave a sparkle trail, then explode into embers with
   gravity, drag, flicker, and a fading glow. Some bursts are "willow" (long
   drooping trails) and some are "peony" (round bursts) for variety.
   ========================================================================= */

class Fireworks {
  constructor(cfg, rand, audio) {
    this.cfg = cfg;
    this.rand = rand;
    this.audio = audio;
    this.shells = [];
    this.embers = [];
    this.trails = [];
    this.W = 0; this.H = 0;
  }

  resize(W, H) { this.W = W; this.H = H; }

  /* Launch `count` shells across the sky. */
  launch(count = 6) {
    for (let i = 0; i < count; i++) {
      const hue = this.cfg.fireworks[Math.floor(this.rand() * this.cfg.fireworks.length)];
      this.shells.push({
        x: this.W * (0.15 + this.rand() * 0.7),
        y: this.H + 10,
        vy: -(7 + this.rand() * 3.5),
        target: this.H * (0.14 + this.rand() * 0.3),
        delay: i * 0.22,
        hue,
        type: this.rand() < 0.35 ? "willow" : "peony",
      });
    }
    if (this.audio) this.audio.whoosh();
  }

  _explode(x, y, hue, type) {
    const n = type === "willow" ? 70 : 52;
    for (let i = 0; i < n; i++) {
      const a = (Utils.TAU * i) / n + this.rand() * 0.2;
      const sp = type === "willow" ? 1 + this.rand() * 2.4 : 1.8 + this.rand() * 3.8;
      this.embers.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: type === "willow" ? 0.006 + this.rand() * 0.008 : 0.012 + this.rand() * 0.02,
        hue: hue + (-16 + this.rand() * 32),
        drag: type === "willow" ? 0.985 : 0.965,
        grav: type === "willow" ? 1.4 : 2.2,
        flick: this.rand() * Utils.TAU,
        size: 1.6 + this.rand() * 1.2,
      });
    }
  }

  update(dt) {
    // Shells rise, dropping a bright trail, then burst at their target height.
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      if (s.delay > 0) { s.delay -= dt; continue; }
      s.y += s.vy;
      this.trails.push({ x: s.x, y: s.y, hue: s.hue, life: 1 });
      if (s.y <= s.target) {
        this._explode(s.x, s.y, s.hue, s.type);
        this.shells.splice(i, 1);
      }
    }

    // Trails fade fast.
    for (let i = this.trails.length - 1; i >= 0; i--) {
      this.trails[i].life -= dt * 3.5;
      if (this.trails[i].life <= 0) this.trails.splice(i, 1);
    }

    // Embers: gravity + drag + flicker.
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.vy += e.grav * dt;
      e.vx *= e.drag; e.vy *= e.drag;
      e.x += e.vx; e.y += e.vy;
      e.life -= e.decay;
      e.flick += dt * 20;
      if (e.life <= 0) this.embers.splice(i, 1);
    }
  }

  draw(ctx) {
    // Rising shells.
    for (const s of this.shells) {
      if (s.delay > 0) continue;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = `hsl(${s.hue} 90% 78%)`;
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Utils.TAU); ctx.fill();
    }

    // Trails.
    for (const t of this.trails) {
      ctx.globalAlpha = Utils.clamp(t.life, 0, 1) * 0.6;
      ctx.fillStyle = `hsl(${t.hue} 90% 80%)`;
      ctx.beginPath(); ctx.arc(t.x, t.y, 1.6, 0, Utils.TAU); ctx.fill();
    }

    // Embers with additive-style glow.
    for (const e of this.embers) {
      const flick = 0.7 + Math.sin(e.flick) * 0.3;
      ctx.globalAlpha = Utils.clamp(e.life, 0, 1) * flick;
      ctx.fillStyle = `hsl(${e.hue} 92% ${52 + e.life * 28}%)`;
      ctx.shadowColor = `hsl(${e.hue} 92% 70%)`;
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Utils.TAU); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  clear() { this.shells.length = 0; this.embers.length = 0; this.trails.length = 0; }
}
