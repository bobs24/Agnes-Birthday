# A Beating Rose for Agnes Charity 🌹💗

Inspired by the **"Lighter & Princess" (点燃我，温暖你)** coding-heart scene — but the
pulsing shape is a **rose** made of glowing pink particles that beats like a real
heartbeat, with the love letter fading in beneath it. Made for **Agnes Charity**
by **Bob Sebastian**. Pure HTML + Canvas, no backend, no build.

## How it works
- A **rose curve** (`r = cos(4·t)`) forms an 8-petal flower.
- Thousands of particles sit on the outline + fill the petals, glowing in shades of pink.
- A **heartbeat function** scales the whole rose twice per cycle ("lub-dub") every ~1.15s.
- Particles shimmer and jitter; sparkles drift around to keep it alive.
- The letter reveals line by line; a replay button appears at the end.

## Files
```
├── index.html      # page + styles + the letter
├── rose.js         # the beating-rose particle engine
├── .nojekyll
└── .github/workflows/deploy.yml
```

## Personalize
- **The letter:** edit the `<div class="letter">` block in `index.html`.
- **Name / title:** edit the `.title` block in `index.html`.
- **Beat speed:** in `rose.js`, change `period = 1.15` (smaller = faster heartbeat).
- **Rose shape:** in `rose.js`, change `K = 4` (odd K = K petals, even K = 2·K petals).
- **Pink shades:** edit the `pinks` array in `rose.js`.

## Deploy (GitHub Pages)
1. Upload everything (including hidden `.github` and `.nojekyll`) to your repo.
2. **Settings → Pages → Source → GitHub Actions**.
3. Push to `main`. Open the URL from the workflow summary.

## Record for Instagram
Open on your phone, screen-record ~15s, post. Tap **replay** to run it again.

Happy birthday to Agnes. 🌸
