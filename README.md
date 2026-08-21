# A Beating Rose for Agnes Charity — Deluxe 🌹💗

A lush, glowing **rose made of ~5,500 particles** that beats like a heartbeat,
with **your own photos** cross-fading in an elegant floating frame and the love
letter revealing line by line. Inspired by the "Lighter & Princess" coding-heart
scene — but fuller, softer, and personalized. Made for **Agnes Charity** by
**Bob Sebastian**. Pure HTML + Canvas. No backend, no build, no paid assets.

---

## 🌸 What makes this one special

- **A FULL rose, not a thin outline.** The bloom is grown with **phyllotaxis**
  (the golden-angle spiral real roses grow by): 78–120 petals, each a soft
  cluster of particles, packed densely from a deep-pink core to blush-white tips.
- **Heartbeat + breathing.** The whole flower pulses (lub-dub) and gently sways.
- **Soft bloom lighting.** A blurred glow layer is screen-blended on top so every
  particle radiates light — that dreamy neon softness.
- **Your photos.** 1–8 pictures cross-fade in a floating glass frame in front of
  the rose. Missing photos are skipped automatically.
- **Atmosphere.** Falling petals (with 3D flip), bokeh depth orbs, twinkling stardust.
- **Music.** A soft, royalty-free melody with reverb, generated live in the browser.
- **Optional: your voice** reading the letter (see `audio/` folder).

---

## 📸 Add your photos (this is what you asked for!)

Open the **`images/`** folder and drop in 1–8 pictures named:

```
photo1.jpg  photo2.jpg  photo3.jpg  photo4.jpg
photo5.jpg  photo6.jpg  photo7.jpg  photo8.jpg
```

- **.jpg or .png** both work (for .png, update the names in `js/config.js → photos`).
- **Portrait photos** (taller than wide) fit the 3:4 frame best.
- You don't need all 8 — add as many as you like. **Missing ones are skipped**,
  and if you add none, the rose + letter still look gorgeous.
- Change how long each photo shows: `js/config.js → photoSecondsEach`.

---

## 🎁 Personalize (one file: `js/config.js`)

```js
herName:  "Agnes Charity",
yourName: "Bob Sebastian",
letter:   [ "Agnes,", "…", "…" ],       // your lines
photos:   [ "images/photo1.jpg", ... ], // your pictures
rose: {
  beatPeriod:   1.15,   // heartbeat speed (smaller = faster)
  beatStrength: 0.16,   // how much it swells
  petals: { desktop: 120, mobile: 78 }, // fullness
  colorCore: "#c11f5b", colorMid: "#ff5b98",
  colorEdge: "#ffc1db", colorTip: "#fff2f7",
},
```

Want a **deeper red** rose? Nudge the four `color*` values.
Want it **fuller**? Raise `petals` and `particlesPerPetal`.

---

## 🎙️ (Optional) Your voice reading the letter
Drop a recording at `audio/letter.m4a` (or `.mp3`) and set
`narration: { enabled: true }` in `js/config.js`. The music ducks while you speak.

---

## 🚀 Deploy on GitHub Pages
1. Upload **everything** (including hidden `.github`, `.nojekyll`, and your
   `images/` photos) to your repo.
2. **Settings → Pages → Source → GitHub Actions**.
3. Push to `main`. Open the URL from the workflow summary.

```
agnes-rose-deluxe/
├── index.html
├── styles.css
├── images/           ← your photos go here (photo1.jpg …)
├── audio/            ← optional voice recording
├── .github/workflows/deploy.yml
└── js/
    ├── config.js     ← edit this
    ├── utils.js
    ├── audio.js
    ├── atmosphere.js
    ├── bloom.js      ← the full phyllotaxis rose
    ├── gallery.js    ← your photo cross-fader
    └── main.js
```

## 🔎 Local preview
```bash
python -m http.server 8080
# open http://localhost:8080
```

## ✅ Tested
Every JS file passes syntax check, and the whole engine was executed under a
mocked DOM/Canvas/WebAudio harness: **5,520 bloom particles generated, atmosphere
live, letter built, and the photo gallery correctly skips missing images — all
with zero exceptions**, including a full replay.

Happy birthday to Agnes. 🌸
