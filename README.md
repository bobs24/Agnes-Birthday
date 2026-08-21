# For Agnes Charity — A Cinematic Birthday Experience 🌹✨

A **15-second, auto-playing cinematic** built as a real multi-system animation engine.
Her name is **assembled from thousands of glowing particles**, roses **grow petal-by-petal
on canvas**, and it ends in a **fireworks finale** — all scored by an original,
royalty-free soundtrack generated live in the browser. Made for **Agnes Charity**
by **Bob Sebastian**. No backend, no build step, no paid assets, 100% static.

---

## 🎬 The 15 seconds, beat by beat

| Time | Moment |
|-----:|--------|
| 0.3s | **Ignite** — a starfield breathes; particles swirl in the dark. |
| 1.4s | **Assemble** — thousands of particles fly in and spell **“Agnes”**. |
| 4.2s | **Full name** — particles *morph* into **“Agnes Charity”**; a gold line draws itself. |
| 6.6s | **The milestone** — the name bursts apart, **roses grow** in a ring, and a giant gradient **“29”** rises. |
| 9.2s | **Happy Birthday** — particles reassemble her name; your **quote** fades in. |
| 11.6s | **Signature + finale** — your name in flowing script, a beating heart, and a **triple fireworks** finale. |
| 14.6s | Controls quietly appear (after the clean 15s, so your recording stays pristine). |

---

## 🧠 What's actually under the hood (the “1000-line” engine)

This isn't a single animation — it's **eight cooperating systems**:

| File | System | Highlights |
|------|--------|-----------|
| `js/config.js` | **Config** | Every personal detail + all timing/tuning knobs in one place. |
| `js/utils.js` | **Utilities** | Seeded RNG (Mulberry32), easing curves, colour math, device detection. |
| `js/audio.js` | **Generative soundtrack** | Warm pad + music-box melody + sparkle arpeggios + **convolver reverb** built from noise. Zero copyright. |
| `js/particles.js` | **Atmosphere** | Twinkling stars, drifting petals (with fake 3D flip), floating **bokeh** depth, rising pollen. |
| `js/particleText.js` | **Particle text** ⭐ | Renders text to a hidden canvas, samples its pixels, and turns each into a glowing particle that **swirls in, holds the shape, and can morph or explode**. Reacts to cursor + device tilt. |
| `js/roses.js` | **Procedural roses** | Each rose **grows**: stem draws up, leaf unfurls, then **bezier petals** open ring-by-ring with gradients and a glowing core. |
| `js/fireworks.js` | **Fireworks** | Shells launch with trails, then burst into **peony** and **willow** types with gravity, drag, and flicker. |
| `js/sequencer.js` | **Director** | A tiny timeline engine that fires each cue once; supports clean replays. |
| `js/main.js` | **Conductor** | Three stacked canvases, a **bloom/glow post-process**, DOM typography overlays, and the full choreography. |

Extras: hi-DPI crispness, reduced-motion support, mobile-tuned particle counts,
seeded scene (identical every replay), and graceful audio that waits for a tap.

---

## 📱 Record it for Instagram (9:16)

1. Open the deployed link on your phone.
2. Tap once (**“tap for sound”**) to start the music.
3. Start your phone's **screen recorder**, then tap the **replay** button (bottom-right).
4. Let it run the full 15 seconds → stop → post. (Skip the sound tap for a silent post.)

---

## 🎁 Personalize (one file)

Open **`js/config.js`** and edit the top block:

```js
const CONFIG = {
  herName:  "Agnes Charity",
  herFirst: "Agnes",
  yourName: "Bob Sebastian",
  age:      29,
  quote:    "Life feels more beautiful simply because you are in it.",
  signOff:  "with all my heart,",
  ...
};
```

Want to re-time the show? Every cue is in the `timeline` object (milliseconds).
Want more/denser particles or roses? Tune `particles` and `roses`.

---

## 🚀 Deploy on GitHub Pages (free)

1. Create a new repository (a neutral name keeps the surprise safe).
2. Upload **everything in this folder**, including the hidden **`.github`** folder and **`.nojekyll`**.
3. **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push to **`main`**. The included workflow publishes it automatically.
5. Open the URL from the workflow summary (or Settings → Pages).

```
agnes-cinematic/
├── .github/workflows/deploy.yml
├── .nojekyll
├── index.html
├── styles.css
└── js/
    ├── config.js
    ├── utils.js
    ├── audio.js
    ├── particles.js
    ├── particleText.js
    ├── roses.js
    ├── fireworks.js
    ├── sequencer.js
    └── main.js
```

---

## 🔎 Local preview

The particle text samples a web font, so run a tiny server (don't just double-click):

```bash
python -m http.server 8080
# open http://localhost:8080
```

---

## ✅ Tested

Every JS file passes a syntax check, and the entire engine was executed under a
mocked DOM/Canvas/WebAudio harness — the **full timeline and a replay ran with no
exceptions** (particle text correctly capped, roses built, atmosphere live).

Happy birthday to Agnes. 🌸
