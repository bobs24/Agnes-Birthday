"use strict";
/* =========================================================================
   config.js — the ONLY file you normally edit.
   Personal details, the photo list, the letter, and all tuning knobs.
   ========================================================================= */

const CONFIG = {
  /* ---- Personal ---- */
  herName:  "Agnes Charity",
  yourName: "Bob Sebastian",
  title:    "Happy Birthday",

  /* ---- Your photos ----
     Put 1–8 images in the /images folder named photo1.jpg ... photo8.jpg
     (jpg or png). List whichever ones you added below. Missing files are
     skipped automatically, so it never breaks. */
  photos: [
    "images/photo1.jpg",
    "images/photo2.jpg",
    "images/photo3.jpg",
    "images/photo4.jpg",
    "images/photo5.jpg",
    "images/photo6.jpg",
    "images/photo7.jpg",
    "images/photo8.jpg",
  ],
  photoSecondsEach: 3.2,     // how long each photo shows before cross-fading

  /* ---- The love letter (shown line by line under the rose) ---- */
  letter: [
    "Agnes,",
    "You have a way of turning ordinary days into ones I never want to end.",
    "My life is softer, warmer, and far more beautiful simply because you are in it.",
    "Happy birthday, my love — here’s to every year I get to spend beside you.",
  ],

  /* ---- Optional: your voice reading the letter ----
     Drop a recording at audio/letter.m4a (or .mp3) and set enabled:true. */
  narration: { enabled: false, file: "audio/letter.m4a", volume: 1.0 },

  /* ---- Rose look & feel ---- */
  rose: {
    petals:        Object.freeze({ desktop: 120, mobile: 78 }), // bloom fullness
    particlesPerPetal: Object.freeze({ desktop: 46, mobile: 30 }),
    spread:        9.2,        // spiral tightness (smaller = tighter core)
    beatPeriod:    1.15,       // seconds per heartbeat (smaller = faster)
    beatStrength:  0.16,       // how much it swells on each beat
    sway:          true,       // gentle breathing/sway
    // Pink gradient from deep center → bright mid → soft blush tips:
    colorCore:     "#c11f5b",
    colorMid:      "#ff5b98",
    colorEdge:     "#ffc1db",
    colorTip:      "#fff2f7",
  },

  /* ---- Atmosphere ---- */
  atmosphere: {
    fallingPetals: Object.freeze({ desktop: 42, mobile: 26 }),
    bokeh:         Object.freeze({ desktop: 16, mobile: 9 }),
    stardust:      Object.freeze({ desktop: 90, mobile: 55 }),
  },

  /* ---- Timing (ms) ---- */
  timeline: {
    roseFormMs:   2600,   // particles swirl in and form the bloom
    letterStart:  3200,   // first letter line begins
    letterGapMs:  2600,   // gap between letter lines
    photosStart:  3600,   // photo frame fades in
  },
};

Object.freeze(CONFIG);
