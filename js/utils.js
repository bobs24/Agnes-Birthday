"use strict";
/* =========================================================================
   utils.js — tiny math + helper library shared by every system.
   Kept dependency-free so the whole site is pure vanilla JS.
   ========================================================================= */

const Utils = (() => {
  /* ---- DOM ---- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---- Math ---- */
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const map   = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  const dist  = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const TAU   = Math.PI * 2;

  /* ---- Easing functions (t in 0..1) ---- */
  const ease = {
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outCubic:   (t) => 1 - Math.pow(1 - t, 3),
    outQuint:   (t) => 1 - Math.pow(1 - t, 5),
    outBack:    (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => { const c4 = TAU / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; },
  };

  /* ---- Deterministic seeded RNG (Mulberry32) ---- */
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---- Colour helpers ---- */
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const rgba = (r, g, b, a) => `rgba(${r|0},${g|0},${b|0},${a})`;

  /* ---- Device / capability detection ---- */
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  /* ---- A minimal event bus so systems can talk without tight coupling ---- */
  function createBus() {
    const map = new Map();
    return {
      on(evt, fn) { (map.get(evt) || map.set(evt, []).get(evt)).push(fn); },
      emit(evt, payload) { (map.get(evt) || []).forEach((fn) => fn(payload)); },
    };
  }

  return { $, $$, clamp, lerp, map, dist, TAU, ease, seeded, hexToRgb, rgba, isMobile, reduceMotion, dpr, createBus };
})();
