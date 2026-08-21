"use strict";
/* =========================================================================
   gallery.js — your photos, shown in an elegant glass frame that gently
   floats and cross-fades from one picture to the next.

   • Tries to load every path in CONFIG.photos.
   • Silently skips any that are missing or fail (so it never breaks if you
     add fewer than 8 pictures).
   • If NO photos are present, it disables itself and the rose + letter still
     shine on their own.
   ========================================================================= */

class Gallery {
  constructor(frameEl, imgA, imgB, rand) {
    this.frame = frameEl;
    this.imgA = imgA;      // two stacked <img> for cross-fading
    this.imgB = imgB;
    this.rand = rand;
    this.loaded = [];      // successfully loaded image URLs
    this.index = 0;
    this.showingA = true;
    this.timer = null;
    this.available = false;
  }

  /* Attempt to load all configured photos; keep only the ones that work. */
  async preload() {
    const tryLoad = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const results = await Promise.all((CONFIG.photos || []).map(tryLoad));
    this.loaded = results.filter(Boolean);
    this.available = this.loaded.length > 0;
    return this.available;
  }

  start() {
    if (!this.available) return;
    this.index = 0;
    this.showingA = true;
    this.imgA.src = this.loaded[0];
    this.imgA.classList.add("visible");
    this.imgB.classList.remove("visible");
    this.frame.classList.add("show");
    clearInterval(this.timer);
    if (this.loaded.length > 1) {
      this.timer = setInterval(() => this._next(), (CONFIG.photoSecondsEach || 3.2) * 1000);
    }
  }

  _next() {
    this.index = (this.index + 1) % this.loaded.length;
    const src = this.loaded[this.index];
    // Load the next photo into the hidden layer, then cross-fade.
    const incoming = this.showingA ? this.imgB : this.imgA;
    const outgoing = this.showingA ? this.imgA : this.imgB;
    incoming.src = src;
    // Wait a tick so the browser has the frame, then swap opacity.
    requestAnimationFrame(() => {
      incoming.classList.add("visible");
      outgoing.classList.remove("visible");
      this.showingA = !this.showingA;
    });
  }

  stop() {
    clearInterval(this.timer);
    this.frame.classList.remove("show");
    this.imgA.classList.remove("visible");
    this.imgB.classList.remove("visible");
  }
}
