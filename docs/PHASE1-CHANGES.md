# Phase 1: web-native AR viewer

Replaces the 115 MB Unity WebGL viewer at `ar.incardible.com.au` with a ~0.5 MB
(gzipped) web page. Same URL, same API, same QR codes.

## Pieces

| Path | What |
|---|---|
| `tools/target-compiler/` | Node package that compiles card artwork into a MindAR `.mind` tracking target (sharp + TensorFlow.js CPU, no native canvas). ~10 s per face. |
| `greetings-card-apis/utils/trackingTargets.js` | Serial background queue that runs the compiler in a child process and stores the result on `Card.trackingTarget`. Triggered by front / inside-right uploads. |
| `greetings-card-apis/scripts/compile-targets.js` | Backfill: `--paid` (cards used by paid orders), `--force`, `--uuid <id>`. |
| `POST /api/cards/compile-target/:uuid`, `GET /api/cards/target-status/:uuid` | Admin: rebuild / inspect a card's target. |
| `GET /api/user/ar-experience/get/:id` | Now returns `tracking: {status, url, targets:[{face,width,height,quality}]}` and never emits `.../null` URLs. |
| `ar-viewer/` | The viewer (three.js + MindAR, built with esbuild). `npm test` runs it in headless Chromium against a fake camera that sees a real card. |
| Admin `cards.js` | "AR target" status chip per card (ready / weak / compiling / failed) and a rebuild button. |

## Deploy

1. **API server**: `cd tools/target-compiler && npm ci` (the `.npmrc` skips native
   builds). Restart the API. Optional: `TARGET_COMPILER_PATH` if the tools folder is
   elsewhere. Add `https://ar.incardible.com.au` to `CORS_OPTIONS`.
2. **Backfill**: `cd greetings-card-apis && node scripts/compile-targets.js --paid`
   then without `--paid`. ~20 s per card; runs while the API keeps serving.
3. **Viewer**: `cd ar-viewer && npm ci && npm run build`, upload `dist/` to the
   `ar.incardible.com.au` host, replacing the Unity files. Long cache for
   `app.js`/`app.css`, no cache for `index.html`.
4. **Admin**: redeploy (status chip + rebuild button).

## What recipients get

- Tap to start → camera in ~2–4 s on a phone (was 30–90 s).
- Content anchored to the front or the inside-right face: the greeting video on
  the card, the text below it, uploaded photos cycling above it, a particle effect,
  optional music.
- No camera / denied / desktop / target not ready → the same greeting as a page.
- Leaving the tab pauses media; coming back resumes tracking.

## Tracking quality now depends on the artwork

`quality: 'weak'` (fewer than 600 feature points) means the face is too small or
too flat to track well. Re-upload at ≥ 1200 px on the long edge with detailed
artwork. The admin shows this per card.
