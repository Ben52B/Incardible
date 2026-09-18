# Incardible AR viewer

Web-native replacement for the Unity WebGL AR viewer. Same URL contract, same
API, same QR codes:

```
https://ar.incardible.com.au/?templateId=<CardCustomization _id>
```

| | Unity viewer | This viewer |
|---|---|---|
| Download before camera starts | ~115 MB | ~0.5 MB gzipped (+ ~0.6 MB tracking target per card) |
| Tracking | Imagine WebAR (CPU, obfuscated) | MindAR (GPU via WebGL, open source) |
| Works on desktop / no camera | no | yes (flat fallback) |

## How it works

1. The admin uploads a card's front and inside-right artwork. The API compiles
   both into one MindAR `.mind` target (`tools/target-compiler`, ~10 s per face)
   and stores it under `public/uploads/targets/`.
2. `GET /api/user/ar-experience/get/:id` returns the greeting plus
   `tracking: { status: 'ready', url, targets: [{face, width, height}] }`.
3. This page loads the target, starts the camera and anchors the content
   (video on the card, greeting text below it, photo carousel above it,
   particles, music) to whichever face is in view.
4. If the target is not ready, the camera is unavailable or denied, the same
   greeting is shown as a normal page ("flat" mode).

## Develop

```
npm install            # .npmrc skips native builds (MindAR's optional canvas dep)
npm run dev            # http://localhost:4173/?templateId=<id>&api=http://localhost:5000
npm run build          # -> dist/
npm test               # headless Chromium with a fake camera that sees a real card
```

`window.INCARDIBLE_CONFIG.apiBase` in `index.html` points at the API. On
localhost `?api=` overrides it.

## Deploy

`dist/` is static. Host it at `ar.incardible.com.au` (any static host or CDN)
with long cache headers for `app.js` and `app.css` and no cache for `index.html`.
The API must list the viewer origin in `CORS_OPTIONS`, and media under
`/uploads` must be served with CORS (already the case).

## Backfilling targets for existing cards

```
cd greetings-card-apis
node scripts/compile-targets.js --paid     # cards used by paid orders first
node scripts/compile-targets.js            # everything else
```

Cards whose artwork is very small or flat come back with `quality: 'weak'`
(fewer than 600 feature points). Re-export those at 1200 px or more on the
long edge and re-upload; tracking quality is decided by the artwork.
