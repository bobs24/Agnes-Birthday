"use strict";
/* =========================================================================
   particleText.js — the centerpiece.
   Renders text to a hidden canvas, samples its pixels, and turns each filled
   pixel into a glowing particle. Particles start scattered + swirling, then
   fly home to spell the word. We can "morph" from one word to another, and
   "explode" the particles outward for transitions.
   ========================================================================= */

class ParticleText {
  constructor(canvas, cfg, rand) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cfg = cfg;
    this.rand = rand;
    this.particles = [];
    this.mode = "idle";        // idle | assembling | holding | exploding
    this.mouse = { x: 0, y: 0, active: false };
    this.tilt = { x: 0, y: 0 };
    this._bindPointer();
  }

  _bindPointer() {
    // Subtle interactivity: particles gently avoid the cursor / follow tilt.
    window.addEventListener("pointermove", (e) => {
      this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.active = true;
    }, { passive: true });
    window.addEventListener("deviceorientation", (e) => {
      // gamma: left/right tilt, beta: front/back tilt
      this.tilt.x = Utils.clamp((e.gamma || 0) / 45, -1, 1);
      this.tilt.y = Utils.clamp(((e.beta || 0) - 45) / 45, -1, 1);
    }, { passive: true });
  }

  /* Sample a word into an array of target points {x, y}. */
  _sample(text, fontSize) {
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    off.width = W; off.height = H;
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = `500 ${fontSize}px "Cormorant Garamond", serif`;
    octx.fillText(text, W / 2, H / 2);

    const data = octx.getImageData(0, 0, W, H).data;
    const step = this.cfg.density;
    const pts = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const alpha = data[(y * W + x) * 4 + 3];
        if (alpha > 128) pts.push({ x, y });
      }
    }
    return pts;
  }

  /* Cap the number of points to keep performance smooth. */
  _cap(points) {
    const max = Utils.isMobile() ? this.cfg.maxMobile : this.cfg.maxDesktop;
    if (points.length <= max) return points;
    // Evenly thin the array instead of slicing (keeps the shape balanced).
    const out = [];
    const stride = points.length / max;
    for (let i = 0; i < max; i++) out.push(points[Math.floor(i * stride)]);
    return out;
  }

  /* Assemble a word: create/retarget particles to spell it. */
  assemble(text) {
    const font = Utils.isMobile() ? this.cfg.fontMobile : this.cfg.fontDesktop;
    let targets = this._cap(this._sample(text, font));
    this.mode = "assembling";

    // Grow or shrink the particle pool to match the target count.
    while (this.particles.length < targets.length) {
      this.particles.push(this._spawn());
    }
    if (this.particles.length > targets.length) {
      this.particles.length = targets.length;
    }

    const colors = this.cfg?.particleColors || CONFIG.palette.particle;
    for (let i = 0; i < targets.length; i++) {
      const p = this.particles[i];
      p.tx = targets[i].x;
      p.ty = targets[i].y;
      p.color = colors[Math.floor(this.rand() * colors.length)];
      p.homeDelay = this.rand() * 0.5;      // staggered arrival looks organic
      p.assembled = false;
    }
  }

  /* Morph to a new word without a full reset (particles slide to new homes). */
  morph(text) { this.assemble(text); }

  /* Blow the particles outward (used between chapters). */
  explode() {
    this.mode = "exploding";
    const cx = this.canvas.clientWidth / 2, cy = this.canvas.clientHeight / 2;
    for (const p of this.particles) {
      const a = Math.atan2(p.y - cy, p.x - cx) + (this.rand() - 0.5) * 0.6;
      const sp = 4 + this.rand() * 9;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.assembled = false;
    }
  }

  _spawn() {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    // Start off-screen-ish, swirling around the center.
    const a = this.rand() * Utils.TAU;
    const r = Math.max(W, H) * (0.6 + this.rand() * 0.6);
    return {
      x: W / 2 + Math.cos(a) * r,
      y: H / 2 + Math.sin(a) * r,
      vx: 0, vy: 0,
      tx: W / 2, ty: H / 2,
      size: 0.9 + this.rand() * 1.7,
      color: "#ffd5e2",
      twinkle: this.rand() * Utils.TAU,
      homeDelay: this.rand() * 0.5,
      assembled: false,
    };
  }

  resize() { /* targets are recomputed on each assemble(); nothing to do here */ }

  update(dt) {
    const k = this.cfg.returnSpeed;
    const swirl = this.cfg.swirl;
    const cx = this.canvas.clientWidth / 2, cy = this.canvas.clientHeight / 2;

    for (const p of this.particles) {
      p.twinkle += dt * 3;

      if (this.mode === "exploding") {
        p.vy += 0.06;                 // slight gravity
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.98; p.vy *= 0.98;
        continue;
      }

      // Spring toward the target (the letters).
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy) || 1;

      // A little swirl before they settle gives a magical "gathering" feel.
      const swirlForce = this.mode === "assembling" && !p.assembled
        ? Math.min(d / 300, 1) * swirl : 0;
      const perpX = -dy / d, perpY = dx / d;

      p.vx += dx * k + perpX * swirlForce;
      p.vy += dy * k + perpY * swirlForce;

      // Gentle cursor repulsion for interactivity.
      if (this.mouse.active) {
        const mdx = p.x - this.mouse.x, mdy = p.y - this.mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 90) {
          const f = (90 - md) / 90 * 2.4;
          p.vx += (mdx / (md || 1)) * f;
          p.vy += (mdy / (md || 1)) * f;
        }
      }

      // Parallax drift from device tilt.
      p.vx += this.tilt.x * 0.15;
      p.vy += this.tilt.y * 0.15;

      p.vx *= 0.82; p.vy *= 0.82;      // damping
      p.x += p.vx; p.y += p.vy;

      if (d < 1.5) p.assembled = true;
    }
  }

  draw() {
    const c = this.ctx;
    for (const p of this.particles) {
      const tw = 0.6 + (Math.sin(p.twinkle) * 0.5 + 0.5) * 0.4;
      const rgb = Utils.hexToRgb(p.color);
      c.beginPath();
      c.fillStyle = Utils.rgba(rgb.r, rgb.g, rgb.b, tw);
      c.shadowColor = p.color;
      c.shadowBlur = 6;
      c.arc(p.x, p.y, p.size, 0, Utils.TAU);
      c.fill();
    }
    c.shadowBlur = 0;
  }

  clear() { this.particles.length = 0; this.mode = "idle"; }
}
