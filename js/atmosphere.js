"use strict";
/* =========================================================================
   atmosphere.js — the soft, dreamy backdrop behind the rose:
     • stardust (tiny twinkling points)
     • bokeh (large blurred orbs for depth)
     • falling rose petals (with a gentle 3D flip)
   Drawn on its own canvas so it never interferes with the bloom's glow.
   ========================================================================= */

class Atmosphere {
  constructor(canvas, rand) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.rand = rand;
    this.W = 0; this.H = 0;
    this.stars = []; this.bokeh = []; this.petals = [];
  }

  resize(W, H) {
    this.W = W; this.H = H;
    const a = CONFIG.atmosphere;
    const m = Utils.isMobile();
    const nStar = m ? a.stardust.mobile : a.stardust.desktop;
    const nBok  = m ? a.bokeh.mobile : a.bokeh.desktop;
    const nPet  = m ? a.fallingPetals.mobile : a.fallingPetals.desktop;

    this.stars = Array.from({ length: nStar }, () => ({
      x: this.rand() * W, y: this.rand() * H, r: 0.4 + this.rand() * 1.5,
      tw: this.rand() * Utils.TAU, sp: 0.5 + this.rand() * 1.6,
    }));
    this.bokeh = Array.from({ length: nBok }, () => ({
      x: this.rand() * W, y: this.rand() * H, rad: 30 + this.rand() * 90,
      drift: 4 + this.rand() * 10, phase: this.rand() * Utils.TAU,
      alpha: 0.05 + this.rand() * 0.10,
      hue: ["#ff6fa5", "#ffb1d1", "#ff9ec4", "#ffd7e6"][Math.floor(this.rand() * 4)],
    }));
    this.petals = Array.from({ length: nPet }, () => this._petal(true));
  }

  _petal(initial) {
    return {
      x: this.rand() * this.W, y: initial ? this.rand() * this.H : -30,
      size: 6 + this.rand() * 12, speed: 14 + this.rand() * 28, drift: -18 + this.rand() * 36,
      spin: this.rand() * Utils.TAU, spinSp: -1.2 + this.rand() * 2.4,
      flip: this.rand() * Utils.TAU, flipSp: 1 + this.rand() * 2,
      alpha: 0.22 + this.rand() * 0.5,
      color: ["#ff6fa5", "#ff9ec4", "#ffd7e6", "#fff2f7"][Math.floor(this.rand() * 4)],
    };
  }

  update(dt) {
    for (const s of this.stars) s.tw += s.sp * dt;
    for (const b of this.bokeh) {
      b.phase += dt * 0.4;
      b.x += Math.cos(b.phase) * b.drift * dt;
      b.y += Math.sin(b.phase * 0.7) * b.drift * dt;
    }
    for (const p of this.petals) {
      p.y += p.speed * dt;
      p.x += (p.drift + Math.sin(p.y * 0.012) * 16) * dt;
      p.spin += p.spinSp * dt; p.flip += p.flipSp * dt;
      if (p.y > this.H + 30) Object.assign(p, this._petal(false));
    }
  }

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.W, this.H);

    // Bokeh depth (soft radial orbs).
    for (const b of this.bokeh) {
      const rgb = Utils.hexToRgb(b.hue);
      const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rad);
      g.addColorStop(0, Utils.rgba(rgb.r, rgb.g, rgb.b, b.alpha));
      g.addColorStop(1, Utils.rgba(rgb.r, rgb.g, rgb.b, 0));
      c.fillStyle = g;
      c.beginPath(); c.arc(b.x, b.y, b.rad, 0, Utils.TAU); c.fill();
    }

    // Stardust.
    for (const s of this.stars) {
      c.globalAlpha = 0.2 + (Math.sin(s.tw) * 0.5 + 0.5) * 0.6;
      c.fillStyle = "#fff";
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, Utils.TAU); c.fill();
    }
    c.globalAlpha = 1;

    // Falling petals (with fake 3D flip by squashing width).
    for (const p of this.petals) {
      c.save();
      c.translate(p.x, p.y); c.rotate(p.spin);
      const sx = Math.max(0.15, Math.abs(Math.cos(p.flip)));
      c.scale(sx, 1);
      c.globalAlpha = p.alpha;
      c.fillStyle = p.color;
      c.beginPath(); c.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Utils.TAU); c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
  }
}
