# Phase 2: mobile-first design studio

Replaces the Unity iframe editor (`/card-editor/[id]`, 163 MB download, desktop
only) with a normal web page at `/studio/<uuid>?selected=<cardUuid>`. All
"customise this card" buttons on the site now open the studio; the old editor
route is left in place for now and can be deleted once the studio is live.

## What customers get

- Four short steps on one page: **Message → Photos & video → Style → Review**,
  with a live 3D preview (the same renderer the AR viewer uses, so the preview
  is what the recipient sees).
- Works on phones: uploads come straight from the camera roll, photos are
  rotated and downscaled in the browser before upload (≈100 KB instead of
  several MB), video is checked against the size limit before sending.
- Auto-save after every change (visible "Saved" chip). Refreshing or coming
  back later restores the draft.
- Guests can design first and log in at the end; the draft migrates to the
  account and checkout continues automatically.
- Styles (templates) and effects come from a shared catalogue
  (`packages/incardible-ar/templates.json`, served at `GET /api/templates`), so
  a new style is a JSON entry, not a Unity build.
- Music list comes from `GET /api/music` with in-page preview.
- On "Continue to checkout" the studio renders the printed inside page
  (A4 landscape, 300 dpi, text centred on the left half) and uploads it to the
  existing `templateTextSS` field, so the admin print flow is unchanged.

## Data contract (unchanged endpoints)

`arTemplateData` is now written as version 2 but keeps the Unity field names the
viewer, admin and API already read:

```
{ version: 2, templateId, templateIndex, templateName, mainHeading, paragraph1,
  paragraph2, textColor, fontName, effectName, musicUrl, musicName, musicIndex,
  isCustomizationComplete }
```

Endpoints used: `upload-card-id`, `upload-ar-data`, `upload-image`,
`upload-template-video`, `user/edit-data`, `upload-text-ss`, `get/data/game/:uuid`,
`templates`, `music`. No API schema changes were needed.

## Code

| Path | What |
|---|---|
| `packages/incardible-ar/` | Shared renderer (`experience.js`), template catalogue and helpers. Linked into `ar-viewer` and `greetings-card` with `file:` dependencies. |
| `greetings-card/src/pages/studio/[uuid].js` | The studio page. |
| `greetings-card/src/studio/` | API client, photo preparation, print-artwork renderer, 3D preview component. |
| `greetings-card/test/` | Mock API + Playwright end-to-end test (`npm run test:studio`, 12 checks) run in CI. |
| `greetings-card/next.config.js` | `transpilePackages` + resolution for the shared package. |

## Deploy

1. `cd greetings-card && npm ci && npm run build` (the shared package is pulled in
   via `file:../packages/incardible-ar`, so deploy from the repository root or
   include `packages/` alongside).
2. No new environment variables. `NEXT_PUBLIC_API_BASE_URL` must point at an API
   that has the Phase 1 code (`/api/templates`).

## Still to do (Phase 3)

- Delete `/card-editor`, `/backup` and `public/editor` once the studio is live.
- Success page with order number and AR link; admin fulfilment screen; media on
  object storage; website cleanup (GIFs, dead code, SEO).
- Replace the fresh templates with the original artwork once the Unity `Assets`
  folder is available.
