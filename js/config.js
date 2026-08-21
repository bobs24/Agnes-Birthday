"use strict";
/* =========================================================================
   config.js — the ONLY file you normally need to edit.
   Everything personal + all timing/tuning knobs live here.
   ========================================================================= */

const CONFIG = {
  /* ---- Personal details ---- */
  herName:   "Agnes Charity",   // shown as the big particle title
  herFirst:  "Agnes",           // used for the particle "assemble" word
  yourName:  "Bob Sebastian",
  age:       29,
  birthday:  "24 September 1997",
  quote:     "Life feels more beautiful simply because you are in it.",
  signOff:   "with all my heart,",

  /* ---- Timeline (milliseconds from start). Total show ~ 15s. ---- */
  timeline: {
    ignite:     300,   // dust awakens, faint stars breathe
    assemble:   1400,  // particles fly in and spell "Agnes"
    fullName:   4200,  // morph into full name + gold underline
    ageReveal:  6600,  // giant "29" + roses begin to grow
    birthday:   9200,  // "Happy Birthday" + quote
    signature:  11600, // script signature + heart + fireworks finale
    controls:   14600, // UI quietly appears after the clean 15s
  },

  /* ---- Visual tuning ---- */
  particles: {
    density:      3,     // sample every Nth pixel of the text (smaller = more particles)
    maxDesktop:   4200,  // hard caps keep it smooth
    maxMobile:    2200,
    fontDesktop:  180,
    fontMobile:   96,
    returnSpeed:  0.055, // how eagerly particles snap to their target
    swirl:        0.9,   // pre-assembly swirl strength
  },
  roses: {
    countDesktop: 26,
    countMobile:  18,
    growMs:       1900,
  },
  palette: {
    roseWhite:  ["#fff8fb", "#e9c8d3", "#b36a83"],
    roseBlush:  ["#ffd5e0", "#ef91ad", "#ad365d"],
    rosePink:   ["#f59ab3", "#ce4f79", "#7f183d"],
    rosePearl:  ["#fffdfa", "#f2dde1", "#c095a2"],
    roseRed:    ["#e45f85", "#a92451", "#5d0b2d"],
    particle:   ["#ffd5e2", "#f3a1b8", "#fff4f7", "#ffe2b3", "#ff9fc0"],
    fireworks:  [340, 330, 350, 20, 45, 300],
  },
  audio: {
    masterVolume: 0.18,
    tempoMs:      680,      // gap between melodic notes
    reverb:       true,
  },
};

// Freeze so accidental edits at runtime don't cause silent bugs.
Object.freeze(CONFIG);
