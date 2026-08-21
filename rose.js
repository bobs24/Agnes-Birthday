"use strict";
/* =========================================================================
   rose.js — a pink ROSE that beats like a heartbeat, made of glowing
   particles. Inspired by the "Lighter & Princess" coding-heart animation,
   but the pulsing shape is a rose curve (rhodonea) instead of a heart.

   How it works:
   • We sample a rose curve  r = cos(k·t)  to get the flower outline.
   • Thousands of particles are placed on the outline + filled inside.
   • A "heartbeat" function scales the whole rose twice per cycle (lub-dub).
   • Each particle shimmers, jitters, and glows in shades of pink.
   • A few drifting sparkle particles float around to keep it alive.
   ========================================================================= */

(() => {
  const canvas = document.getElementById("rose");
  const ctx = canvas.getContext("2d");

  let W, H, DPR, cx, cy, size;
  const TAU = Math.PI * 2;
  const K = 4;                 // rose curve constant → 8 symmetric petals
  const rand = (a = 1, b = 0) => Math.random() * (a - b) + b;

  /* ---------------- Particle model ---------------- */
  // Each particle remembers its "home" on the rose (as a base radius factor
  // and angle) so the beat can scale it in and out smoothly.
  let outline = [];   // crisp particles on the rose edge
  let fill = [];      // softer particles inside the petals
  let sparks = [];    // free-floating shimmer

  function buildRose() {
    outline = [];
    fill = [];
    sparks = [];

    const mobile = W < 760;
    const OUTLINE_N = mobile ? 1400 : 2600;
    const FILL_N    = mobile ? 900  : 1700;
    const SPARK_N   = mobile ? 40   : 70;

    // --- Outline: dense particles right on the curve ---
    for (let i = 0; i < OUTLINE_N; i++) {
      const t = (i / OUTLINE_N) * TAU;
      outline.push(makeParticle(t, 1, true));
    }

    // --- Fill: particles at random depth inside each petal ---
    for (let i = 0; i < FILL_N; i++) {
      const t = rand(TAU);
      // Bias toward the outer half so petals read clearly, with a soft core.
      const f = Math.sqrt(rand(1)) * 0.92 + 0.04;
      fill.push(makeParticle(t, f, false));
    }

    // --- Sparks: drifting gl_points around the bloom ---
    for (let i = 0; i < SPARK_N; i++) sparks.push(makeSpark());
  }

  function makeParticle(t, f, isOutline) {
    // The rose radius at this angle (can be negative → overlapping petals).
    const rr = Math.cos(K * t);
    const baseR = rr * f;                 // signed radius factor (−1..1)
    const jitter = isOutline ? rand(1.6, -1.6) : rand(3.2, -3.2);
    const pinks = ["#ff4f92", "#ff6fa5", "#ff8cb8", "#ffb1d1", "#ffd7e6", "#fff2f7"];
    return {
      t, baseR,
      jx: jitter, jy: rand(1.6, -1.6),
      phase: rand(TAU),
      speed: rand(2.6, 1.2),
      size: isOutline ? rand(1.7, 0.8) : rand(1.4, 0.5),
      alpha: isOutline ? rand(0.95, 0.55) : rand(0.6, 0.2),
      color: isOutline
        ? pinks[Math.floor(rand(4))]      // brighter pinks on the edge
        : pinks[Math.floor(rand(6, 2))],  // softer/lighter inside
    };
  }

  function makeSpark() {
    const a = rand(TAU);
    const rad = size * rand(1.35, 0.4);
    return {
      x: cx + Math.cos(a) * rad,
      y: cy + Math.sin(a) * rad * 0.95,
      vx: rand(0.3, -0.3), vy: rand(-0.15, -0.6),
      size: rand(1.8, 0.5), phase: rand(TAU), speed: rand(2.4, 1),
      alpha: rand(0.7, 0.2),
    };
  }

  /* ---------------- Heartbeat pulse ----------------
     Returns a scale that thumps twice ("lub-dub") each cycle, then rests. */
  function heartbeat(pcycle) {
    const thump = (c, w) => Math.exp(-Math.pow((pcycle - c) / w, 2));
    return 1 + 0.15 * thump(0.0, 0.05) + 0.11 * thump(0.17, 0.06);
  }

  /* ---------------- Rendering ---------------- */
  let start = performance.now();

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    cx = W / 2;
    cy = H * (W < 760 ? 0.34 : 0.42);      // sit a bit high so the letter fits
    size = Math.min(W, H) * (W < 760 ? 0.30 : 0.32);
    buildRose();
  }

  function draw(now) {
    const elapsed = (now - start) / 1000;
    // One heartbeat every ~1.15s (like a calm, happy pulse).
    const period = 1.15;
    const pcycle = (elapsed % period) / period;
    const beat = heartbeat(pcycle);
    const s = size * beat;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter"; // additive glow like the cdrama

    // --- Fill particles (drawn first, behind the outline) ---
    for (const p of fill) {
      drawParticle(p, s, now, 0.7);
    }

    // --- Outline particles (crisp, bright edge) ---
    for (const p of outline) {
      drawParticle(p, s, now, 1);
    }

    // --- Drifting sparks ---
    for (const sp of sparks) {
      sp.x += sp.vx; sp.y += sp.vy; sp.phase += 0.02 * sp.speed;
      if (sp.y < -10 || sp.x < -10 || sp.x > W + 10) Object.assign(sp, makeSpark(), { y: H + 8 });
      const tw = 0.5 + Math.sin(sp.phase) * 0.5;
      ctx.globalAlpha = sp.alpha * tw;
      ctx.fillStyle = "#ffd7e6";
      ctx.shadowColor = "#ff8cb8"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, TAU); ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(draw);
  }

  function drawParticle(p, s, now, mul) {
    // Position from the rose curve, scaled by the beating size.
    const x = cx + Math.cos(p.t) * p.baseR * s + p.jx;
    const y = cy + Math.sin(p.t) * p.baseR * s * 0.95 + p.jy;
    // Gentle shimmer in brightness.
    const tw = 0.65 + Math.sin(now * 0.001 * p.speed + p.phase) * 0.35;
    ctx.globalAlpha = p.alpha * tw * mul;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, TAU);
    ctx.fill();
  }

  /* ---------------- Letter reveal (line by line) ---------------- */
  function revealLetter() {
    const lines = document.querySelectorAll("#letter [data-line]");
    // Start after the rose has settled; stagger each line gently.
    let delay = 1800;
    lines.forEach((el) => {
      setTimeout(() => el.classList.add("show"), delay);
      delay += 2600;
    });
    // Show the replay control once the letter has finished.
    setTimeout(() => document.getElementById("controls").classList.add("show"), delay + 600);
  }

  function replay() {
    document.querySelectorAll("#letter [data-line]").forEach((el) => el.classList.remove("show"));
    document.getElementById("controls").classList.remove("show");
    start = performance.now();
    revealLetter();
  }

  /* ---------------- Boot ---------------- */
  window.addEventListener("resize", resize, { passive: true });
  document.getElementById("replay").addEventListener("click", replay);

  resize();
  requestAnimationFrame(draw);
  revealLetter();
})();
