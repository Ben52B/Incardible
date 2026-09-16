# Incardible technical audit

**Scope:** everything in this repository as of the `first commit` (ben52b/incardible):
`ar-greeting-card/` (AR viewer, ar.incardible.com.au), `greetings-card/` (customer website + embedded Unity design studio), `greetings-card-admin/` (admin panel), `greetings-card-apis/` (Node/Express/MongoDB API). Live servers could not be reached from the audit environment, so hosting headers (compression, caching, TLS) are inferred from the code and build files and should be confirmed in a browser's Network tab.

**Not in the repo, and therefore not audited:** the Unity *source projects* for the design studio and the AR viewer. Only compiled WebGL builds are present, and the studio build itself is missing (see §2). The two zip files shared on Google Drive ("Incardible-source-code.zip", 6.9 GB, and "Greeting Card Project Main Folder.zip", 1.6 GB) probably contain them; please confirm you hold the Unity source, otherwise every studio change depends on the original developers.

---

## 1. Executive summary

The product flow works end to end, but the implementation is a prototype that was pushed to production. Five issues need attention before taking more orders, and they are all cheap to fix:

| # | Issue | Impact | Effort |
|---|---|---|---|
| 1 | **A scheduled job deletes every paid card's AR experience 90 days after purchase**, and a second job deletes any card whose Unity JSON still says "customisation incomplete" after 8 days, paid or not. | Printed QR codes stop working. This is the product. | Small |
| 2 | **Anyone can create an admin account** (`POST /api/admin/register` is open), and **any customer's login token is accepted as an admin token** (the admin middleware never checks a role). | Full read/write of all orders, addresses, phone numbers, password hashes. | Small |
| 3 | **The customer sets their own price.** Stripe amounts come from the browser, not from the card's price in the database. A second endpoint marks any order paid given any successful payment intent. | Free or $0.50 cards. | Medium |
| 4 | **Uploads are unauthenticated and unlimited.** No file-type filter, no size limit, original filenames kept, files served straight back from the API domain. Debug endpoints dump recent transactions and customer names to the public. | Disk fill, stored XSS/phishing on your domain, PII leak. | Small |
| 5 | **The Unity builds are shipped uncompressed and bloated.** Studio: ~163 MB. AR viewer: ~115 MB. Both include unused engine packages. Neither is cached between visits. | This is the "slow to load" complaint for both the studio and the QR scan. | Medium |

Beyond those, the mobile/scaling complaints have a clear cause (the studio canvas is locked to 16:9 and explicitly tells phone users to use a laptop), the tracking-quality complaint has a clear cause (card fronts uploaded at 100–331 px are used as the tracking targets), and the admin's on-screen QR code encodes the wrong URL.

Dependency audits: API has 12 known vulnerabilities (1 critical: mongoose search injection), website has 25 (4 critical: next, next-auth, swiper, form-data). No tests, no CI, no lint enforcement anywhere.

---

## 2. What is actually in the repository

| Folder | What it is | Size | Notes |
|---|---|---|---|
| `ar-greeting-card/` | Unity WebGL AR viewer + "Imagine WebAR" JS tracker | 114 MB | Full build present, uncompressed |
| `greetings-card/` | Next.js 14 customer site | 71 MB | `public/editor/Build/*` are **Git LFS pointer files**; the real 163 MB studio build is not in the repo and there is no `.gitattributes`, so a fresh clone cannot run the studio |
| `greetings-card-admin/` | Next.js 14 static-export admin | 16 MB | |
| `greetings-card-apis/` | Express + Mongoose API | 5.9 GB | **5.8 GB of customer uploads are committed to git** (`public/uploads`, 6,685 files, including 47 MB test videos). `.gitignore` lists `./public/uploads`, which does not match. The `.git` pack is 511 MB. |

Other repo hygiene: single commit, no README of value, READMEs point at unrelated repos (`talhaa99/brand-on-game`), `.env.example` files are incomplete or list `tecshield.net` hosts, hardcoded `tecshield` URLs and support email remain in code.

**Recommendation:** move uploads out of git (and out of the API server) to object storage; add `.gitattributes` and either commit the studio build via LFS or, better, deploy builds from CI to a CDN and keep them out of the repo entirely.

---

## 3. Your five complaints, root causes, fixes

| Complaint | Root cause (evidence) | Fix |
|---|---|---|
| Design studio not mobile friendly | Canvas CSS-locked to 16:9 (`public/editor/TemplateData/style.css`, `aspect-ratio: 16/9`); at ≤768 px a modal says "Please use a laptop or desktop"; the React page has no mobile branch (`isSmallScreen` declared, never used). | Short term: remove the 16:9 lock and the modal, cap `devicePixelRatio`, give the iframe the full viewport, set the Unity Canvas Scaler to a portrait reference. Real fix: a web-native studio (§5). |
| Slow from website into the studio | 163 MB uncompressed Unity download (`Greeting.data` 102 MB + `Greeting.wasm` 60 MB); API calls only start *after* Unity signals ready (`card-editor/[id].js` waits on `isUnityReady`); the studio page also loads jQuery, Bootstrap 3 and Font Awesome from CDNs; `_app.js` renders a blank splash until `/api/user/auth` returns. | Brotli build (≈4× smaller), strip unused packages, Addressables for templates, run API calls in parallel with the download, preload the loader, cache with a real service worker. |
| Scaling is not right | Fixed nav (`position: fixed`) overlaps the top of the iframe, which is `100vh` with no top offset; 16:9 letterboxing means the UI is a different size on every aspect ratio; DPR is unbounded so retina laptops render 2880×1620. | Offset the container by the nav height (or hide the nav on the editor route), cap DPR at 1–1.5, use "Scale with screen size / match width" in Unity. |
| Slow to load after scanning the QR | AR build 96 MB uncompressed + 3.5 MB OpenCV + 11 MB of unused demo targets; then the card's own media (47 MB videos, 9–23 MB GIFs) streamed raw from the API server with no transcoding; experience JSON fetched twice; empty service worker so nothing is cached. | Brotli + package stripping (target ≤ 15 MB wasm), remove demo targets, transcode uploads to ≤ 5 MB H.264 720p with a poster frame, serve media from a CDN, cache the build. |
| AR tracking quality | Tracking targets are the admin-uploaded card fronts at whatever size they were uploaded: of 300 sampled, 65 are 331×431, 19 are 300×300, 18 are 100×100. Tracker runs at stock settings on the CPU in JavaScript; 8 targets active at once; camera resolution unconstrained. | Enforce ≥ 1200 px on the long edge and a feature-richness check at upload; register only the two needed targets; constrain camera to 1280×720; tune detector settings; evaluate MindAR or a commercial WebAR SDK. |

---
## 3. AR viewer (`ar-greeting-card/`, deployed at ar.incardible.com.au)

### What it is
A Unity WebGL build wrapped by a third-party browser image-tracking plugin ("Imagine WebAR – Image Tracker": `itracker.js`, `arcamera.js`, `opencv.js`). Tracking runs in JavaScript on the CPU using OpenCV.js feature matching (ORB/SIFT + optical flow + Kalman smoothing). Unity only renders the 3D content on top of a camera canvas. The plugin JS is obfuscated, so the developers cannot debug or tune it beyond its public settings.

### Why scanning the QR is slow
Measured from the files in the repo:

| Asset | On disk | Compressed (gzip) | Notes |
|---|---|---|---|
| `Ar Build.wasm` | 60.4 MB | 15.3 MB | shipped **uncompressed** |
| `Ar Build.data` | 36.0 MB | 23.7 MB | shipped **uncompressed** |
| `opencv.js` | 3.5 MB | ~1 MB | full OpenCV build |
| 6 built-in target PNGs | 11.2 MB | n/a | all loaded on every visit |
| StreamingAssets mp4 | 4 MB | n/a | |
| **Total before the card's own media** | **~115 MB** | | |

Then, after Unity is up, the page fetches the AR experience JSON and the customer's media (photos and video). Template videos in the uploads folder are frequently 47 MB, one user upload is 49.5 MB, and several GIFs are 9–23 MB. On a 4G phone that alone is 30–90 seconds.

Root causes:
1. **No Brotli/gzip build compression.** Unity's build setting is "Disabled". Brotli would cut wasm+data from 96 MB to roughly 25 MB. Zero code change.
2. **Massively over-included engine modules.** The build contains 122 assemblies including AR Foundation, XR Interaction Toolkit **and its sample scenes**, Cinemachine, Timeline, Splines, Unity Tutorials, Multiplayer Center, Burst, Coffee UIParticle **demo**, In-game Debug Console, NativeFilePicker, DOTween Pro, and the full URP shader set (Terrain, SpeedTree, Bokeh DoF, screen-space shadows). None of the XR/AR Foundation stack is used: tracking is done by the JS plugin. A lean URP or built-in-pipeline viewer that only plays video/images/particles should be **10–15 MB wasm** and a few MB of data. Managed code stripping is evidently low or off.
3. **No caching strategy.** `ServiceWorker.js` is an empty stub, so nothing is cached between visits. Same-build files have no content hash in the name, so long `Cache-Control` headers are risky too.
4. **User media is served raw** from `api.incardible.com.au/uploads/...` with no transcoding, no size limit (multer has no `limits`), no poster image, and no progressive loading. A 47 MB video must download before it plays.
5. **The experience JSON is fetched twice** (once before Unity loads, once after) and the second one blocks content until it returns.
6. Six demo targets (`bear`, `bfly`, `flower`, `lady`, `reel`, `rmn`, 11 MB) are still registered as `<imagetarget>` and are feature-extracted on every load even though the card only needs `frontCard` and `rightCard`.

### Why tracking quality is inconsistent
1. **The tracking target is whatever the admin uploaded as the card front, at whatever resolution.** Sampled 300 card fronts from the uploads folder:

   | Dimensions | Count (of 300) |
   |---|---|
   | 331 × 431 | 65 |
   | 800 × 450 | 49 |
   | 682 × 1020 | 20 |
   | 300 × 300 | 19 |
   | 100 × 100 | 18 |

   100 px and 300 px images are far too small to extract stable features from; the plugin's own demo targets are 1024–2500 px. Aspect ratios are also all over the place, while the printed card is a fixed physical size. Nothing in the admin upload enforces minimum resolution, aspect ratio, or feature richness.
2. **The plugin is running near stock settings.** Only `INTERNAL_SMOOTHFACTOR_POS` is overridden. `DETECT_INTERVAL`, `MAX_TARGET_PIXELS`, `FRAMERATE`, `TRACK_TARGET_MATCH_COUNT`, detector choice (ORB vs SIFT) have not been tuned for a printed A5/A6 card held at arm's length.
3. **Two targets are always active** (`frontCard` and `rightCard`) plus six demo targets, so detection time is split eight ways.
4. **Camera resolution is not constrained.** `WEBCAM_SETTINGS` only sets `facingMode`. Without `width/height ideal` constraints some phones deliver 4K frames, which the JS tracker must downscale each frame, and others deliver 480p, which hurts detection.
5. **CPU-based JS tracking has a hard ceiling.** For a product whose entire promise is "point the phone at the card", the two mainstream, well-supported alternatives are (a) 8th Wall / Zappar / Blippar-style commercial WebAR SDKs with native-quality image tracking, or (b) MindAR (open source, GPU-accelerated via TensorFlow.js, works with three.js or A-Frame, no Unity). Either would also remove the 96 MB Unity download entirely.

### UX defects in the viewer page (`ar-greeting-card/index.html`)
- **Leaving the tab for more than 10 seconds redirects the recipient to google.com.** `TIMEOUT_LIMIT = 10 * 1000` (the comment says 1 minute). Answering a text message while holding the card kills the experience.
- Failure alerts use raw `alert()` with generic text ("Failed to load AR experience. Please try again.").
- Page title is "Unity WebGL Player | My project"; `productName: "My project"`, `companyName: "DefaultCompany"`. No Open Graph/preview metadata for a link people will share.
- Camera permission is requested twice (a "priming" request, then a real one), each with a black "Tap anywhere to continue" overlay. That is one extra tap and one extra permission dialog on iOS.
- Synthetic mouse events and `forceRedraw()` hacks (black overlay + 12-frame stabilisation) paper over a Unity canvas/webcam resize bug rather than fixing the canvas sizing.
- `#unity-canvas` is hard-coded `width="1920" height="1080"` in the markup; sizing is then fought over between Unity, the plugin and the page CSS.
- The page still contains the plugin's demo UI (screenshot dialog, "Are you sure you want to visit url.com?" dialog, camera selector) that this product doesn't use.
- No "no camera / desktop" fallback (e.g. play the video flat) for recipients who open the QR link on a laptop.
- `manifest.webmanifest` is linked but not present in the folder.

## 4. Design studio (`greetings-card/public/editor/`, embedded in `/card-editor/[id]`)

### The build is not actually in the repository
`Greeting.wasm`, `Greeting.data`, `Greeting.framework.js`, `Greeting.loader.js` are **Git LFS pointer files** (130 bytes each) but the repo has no `.gitattributes` and no LFS objects. The pointers say the real files are:

| File | Size |
|---|---|
| `Greeting.data` | **102.2 MB** |
| `Greeting.wasm` | 60.4 MB |
| `Greeting.framework.js` | 0.5 MB |

So the design studio is a **~163 MB uncompressed download** before a customer can start designing. That is the "takes time to load from the website to the design centre" complaint, and it is also why anyone cloning this repo cannot run or rebuild the studio. The Unity *project* (source) for either build is not in the repo at all; only the two zip files in your Drive may contain it. You should confirm you own and possess the Unity source projects, otherwise you cannot change the studio without the original developers.

### Why it is not mobile friendly
- The studio explicitly tells phone users to go away: `public/editor/index.html` shows a modal "Please use a laptop or desktop device for optimal experience" whenever the viewport is 768 px or narrower (`TemplateData/style.css`, `@media (max-width: 768px) #message { display: block }`).
- The canvas is locked to **16:9** (`aspect-ratio: 16 / 9`, `object-fit: contain`). On a portrait phone that yields a letterboxed strip roughly 390 × 220 px with the whole editor UI scaled into it. That is the "scaling is not right" complaint. Unity UI built with a fixed 1920×1080 Canvas Scaler reference will shrink text and buttons below tappable size.
- `devicePixelRatio` is left at default, so on a 3× phone Unity renders a 1170 × 2532 framebuffer for a 16:9 letterbox, wasting GPU and battery.
- The page loads jQuery 3.7, Bootstrap 3.4 and Font Awesome 6 from three CDNs just to show that one warning box.
- The embedding page (`/card-editor/[id]`) puts the studio in an `<iframe>` inside an MUI layout with a header, so the studio never gets the full viewport on mobile, and iOS Safari iframes ignore fixed heights unless explicitly sized.
- Uploading photos/videos from a phone is done by a *second* device scanning a QR code shown inside the studio (`/upload-ar-content/[uuid]/[index]`). That flow exists precisely because the studio was never meant to run on the phone.

### Recommendation for the studio
Short term (weeks): Brotli compression, strip unused packages, cap `devicePixelRatio` to 1 on mobile, replace the 16:9 lock with a responsive Canvas Scaler (match width on portrait), remove the "use a laptop" modal, give the iframe the full viewport height on mobile.

Medium term (1–3 months): the studio's feature set (pick template, upload photo/video, choose 3D sticker, choose music, type greeting, preview) is a normal web UI. Rebuilding it in React with three.js/`<model-viewer>` for the 3D preview would make it ~1 MB, instantly responsive, SEO-crawlable, and maintainable by any web developer instead of requiring a Unity developer for every button change. Keep Unity only if you have genuinely complex 3D authoring needs, which the current product does not.

---

## 5. Customer website (`greetings-card/`)

### Flow and UX defects
- **Guest → login mid-design is a dead end.** Google sign-in is a full-page redirect, so the 163 MB studio reloads and unsaved work is lost. Email login is gated on `isUnityReady`, but `saveImage` and `UploadVideo` set it to `false` and nothing ever sets it back (`card-editor/[id].js` lines 1122, 1186 vs 687), so post-login re-association and the `redirectToCheckout` flag never run.
- **Stale closures.** All iframe bridge callbacks are created once in `gameOnLoad`; after login the data is refetched but callbacks still read the old `userTemplateData`, so `checkout` can route to a stale id or skip checkout because it thinks the card is paid.
- **Unsaved-changes guard is inert.** `hasUnsavedChanges` is only ever set to `false`; the `beforeunload`/route-change handlers never fire; the "Save" button in the dialog sets a flag nothing reads.
- **Errors are invisible.** Every failure in the editor bridge (upload, save, template change) goes to `console.error` only. The user sees nothing.
- **Success page has no QR, no order number, no AR link.** Buyers leave with no record. The AR link is only ever sent into Unity.
- **Phone upload page** (`/upload-ar-content/[uuid]/[index]`): after upload it navigates the customer to google.com after 10 seconds; the "back to design" link has no card id; the `Authorization` header is spread into the axios config root instead of `headers`, so it is never sent.
- **Checkout with no token** renders a $0 line item and only complains when "Pay" is clicked; no redirect to login. `/cancel` is unreachable dead code with the copy "Payment Failed!!".
- `/myCards` has no auth guard and fetches `/api/user/get-all-cards/null` before auth resolves. `/backup` is an older copy of the whole editor, live in production. `login`, `register`, `forget`, `reset`, `account` pages are routable but unused (modals are used instead).

### Performance
- **Home page ships ~45 MB of GIFs.** `section1.js` references `butterfly.gif` (18.7 MB), `hearts.gif` (10.5 MB), `cardBaloons.gif` (4.9 MB) 51 times across breakpoint branches, including the mobile branch. `about.js` renders `trb.gif` (11.1 MB) four times and references three GIFs that do not exist. `1_1.gif` (9.3 MB) and `thankYou.gif` (2.9 MB) are dead weight.
- Zero `next/image` usage across 184 `<img>` elements; only 6 have `loading="lazy"`.
- Bootstrap 5 (CDN and npm) + MUI + AOS + simplebar CSS all loaded; the studio page adds Bootstrap 3 + jQuery. Five Google Font families plus 3.6 MB of self-hosted Calibri TTFs with no `font-display` and no WOFF2.
- `jsonwebtoken` imported at top level in three client files (never used) drags a Node crypto polyfill into the bundle. `apexcharts`, date pickers, Google Maps, PayPal SDK are installed and unused.
- `pageview-tracker.js` POSTs on every tab focus.

### Client-side security
- **The user's session JWT is embedded in the QR code** shown in the studio (`QrLink` message sends `token` from localStorage; the phone lands on `/upload-ar-content/...?token=<session JWT>`). That token is now in phone history, screenshots and server logs. Mint a short-lived, scoped upload token instead.
- Every studio/upload call sends `isAuthenticated: !!localStorage.token` as a body field and the API trusts it. Anyone can attach uploads to any `uuid`.
- `pages/api/verify-token.js` hard-codes a JWT secret in source and logs it; `generate-token.js` mints tokens with no auth or method check. Neither is used by the client. Delete both.
- `.env.example` lists `NEXT_PUBLIC_STRIPE_SECRET_KEY`. Anything prefixed `NEXT_PUBLIC_` is inlined into the browser bundle. If that key was ever set in a real `.env`, rotate it now and rename it to `STRIPE_SECRET_KEY`.
- `postMessage` listener accepts any origin; iframe posts with `'*'`. CSP is only `upgrade-insecure-requests`; four third-party CDN scripts with no SRI.

### Code quality
- `card-editor/[id].js`: 1,854 lines, 44% commented out (the first 571 lines are a dead copy of the component), 165 `console.*` calls, 12 unused state variables. `section1.js` 3,321 lines, half commented. `checkout/[id].js` 2,682 lines with ~600 lines of dead PayPal code. `landingLayout.js` 1,847 lines holds four dialogs plus the nav.
- Theme defines 25 ad-hoc breakpoints (`test`, `surfacePro`, `HD`, `5k`), which is why layout code branches per device.
- No TypeScript, ESLint disables `no-img-element` and `alt-text`, `reactStrictMode: false`.

### SEO and accessibility
No meta description, Open Graph, canonical, robots or sitemap. Six components each set `<title>Homepage…`, so the title is whichever renders last. The home page has no `<h1>`. Favicon links point at files that do not exist. 404 page copy: "You either tried some shady route" with its home button commented out. The studio forces `user-scalable=no`.

---

## 6. Backend API (`greetings-card-apis/`)

### Authentication and authorisation
- `POST /api/admin/register` is unauthenticated (`routes/admin/admin.js:9`). Anyone can create an admin.
- `middleware/admin.js` only verifies the JWT signature with `TOKEN_KEY`, the same key used for customer tokens, and never checks a role or looks up the Admin collection. **Every customer token is an admin token.** Affected: all card CRUD, all transactions (`get-all`, `update-shipping-status`, `delete-transaction`), categories, marketing sends.
- `routes/admin/statistics.js:3` imports the *customer* middleware, so any customer can read revenue and `top-buying-users` (other customers' names, emails, spend).
- `GET /api/transactions/get-all` populates the user document with no field selection, returning **bcrypt password hashes and stored JWTs** for every customer.
- Unauthenticated: `GET /api/user/ar-experience/get-all-express-shipping-users` (addresses, phones), `GET /api/cards/get/auth/:email` (any user's customisation by email), `DELETE /api/user/ar-experience/remove-card/:id`, `POST /api/cards/update-data` (wipes media by id), all studio write endpoints keyed only by client-supplied `uuid` and `isAuthenticated`.
- `GET /api/user/get-all-cards/:email` is authenticated but never compares `req.user.email` to `:email`.
- Google sign-in (`controllers/user/user.js:599`) trusts `email` from the request body with **no Google ID-token verification**: anyone can log in as any Google user by POSTing their email address.
- Password reset looks up a 6-digit code with no email binding, no expiry, no attempt limit. Brute-forceable.
- Login/register/verify responses return the full user document including password hashes. `confirmPassword` is stored as a second hash.
- Debug endpoints live in production: `GET /api/verify-webhook-data` (last 10 transactions with names), `GET /api/payment/test-transactions`, `/test-env`, `/test-image/:path` (server-side request forgery primitive), `/api/check/internet-connection` (outbound request per call), `/shorten` + `/s/:code` (open redirect on your domain, stored in process memory).
- No `helmet`, no rate limiting, no `express-mongo-sanitize` (request bodies go straight into `findOne`), no global error handler, error messages returned to clients.
- Payment routes fall back to a hardcoded JWT secret: `process.env.JWT_SECRET || 'your-secret-key'`, and `JWT_SECRET` is not in `.env.example`, so the fallback is always used.

### Payments (Stripe)
- **Price is client-supplied.** `routes/payment.js:155` `calculatedTotal = frontendTransactionData.total || product.price`; line 423 takes `amount` from the body. `Card.price` in the database is never consulted. Coupons are validated for existence only and the discount is applied client-side; Stripe promo codes can stack on top.
- `POST /api/payment/confirm-payment` marks any transaction COMPLETED and any card `isPaid` given any succeeded payment intent id, with no check that the intent belongs to that order or that the amount matches.
- Webhook: signature verified correctly, but not idempotent (re-delivery re-sends the confirmation email); only `checkout.session.completed` handled, so the PaymentIntent flow depends entirely on the browser calling `confirm-payment`. If the customer closes the tab after Stripe succeeds, they are charged, the order stays PENDING, no email, card never marked paid. No refund or dispute handling.
- `orderId` is a random 4-digit number with a unique index: collisions become likely around 100 orders and throw a 500 mid-checkout. A proper `generateUniqueOrderId` exists and is unused.
- `images: [...].fil` typo means Stripe never shows the card image. `session.promotion_code` / `session.discount` are not real fields, so the coupon is always recorded as "Stripe Discount". `transaction.data` and `transaction.currency` are assigned but not in the schema, so they are silently dropped.
- Every checkout attempt creates a new PENDING transaction that is never cleaned up, and **all statistics count PENDING rows as revenue**, so the dashboard overstates sales.
- Mass assignment: client `frontendTransactionData` is spread into `Transaction.create`, so a client can set `status`, `paid_at`, `shippingStatus`.

### Data lifecycle (highest business risk)
The QR on the printed card is `ar.incardible.com.au?templateId=<CardCustomization._id>`. Three things delete those documents:
1. `utils/deleteOldCustomizationData.js`: daily, deletes CardCustomization **and the Transaction** for every paid order older than 90 days. A card given at Christmas is dead by late March, and the order record is gone too.
2. `utils/notification.js:155`: daily, deletes any CardCustomization whose `arTemplateData.isCustomizationComplete` is still `false` after 7 days, **regardless of `isPaid`**. Nothing server-side ever sets that flag; it comes only from Unity JSON.
3. The UI tells users their draft expires in 30 days; the cron uses 7.

Also: uploaded files are never deleted (one `unlink` in the codebase), so replaced images, abandoned guest sessions and deleted documents all leave orphans; media URLs are stored absolute with the API host baked in (some relative, inconsistently), so changing domain breaks every card; `uuid` and `email` are unindexed, so every studio call is a collection scan; `express.json()`'s 100 kB default limit will reject large Unity JSON.

**Immediate action:** disable both deletion jobs today, and check backups for paid customisations already deleted.

### AR experience endpoint
`GET /api/user/ar-experience/get/:id` correctly whitelists fields (no email, userId or isPaid returned). Bugs: null card faces become the literal URL `.../null`; no `isPaid` gate, so unpaid designs are viewable by anyone who guesses a time-ordered ObjectId; no `Cache-Control`; media served by `express.static` from the API box with default headers (`max-age=0`), no CDN.

### Email
Four separate nodemailer transports, `verify()` with retries before every send (blocks requests up to 10 s), user input interpolated unescaped into HTML, unsubscribe is an unauthenticated GET by email address, marketing subscription is a flag on *transactions*, bulk sends run inside the HTTP request.

### Code quality
24% of the backend (2,051 of 8,513 lines) is commented-out code, including whole files. Three copies of the same handler, two of `uploadARTemplate`, five near-identical upload-design handlers. Full request bodies, user documents and Stripe sessions are logged. Three N+1 loops over all transactions back public statistics endpoints. `multer` 1.x is end-of-life; `nodemon` is a production dependency; PayPal SDK installed and unused. No tests. Cron jobs run in-process, so a second instance runs them twice.

---

## 7. Admin panel and order fulfilment (`greetings-card-admin/`)

### Fulfilment workflow gaps
- `order.js` (7,113 lines, 31% comments, 125 `console.*`) polls `GET /api/transactions/get-all` **every 5 seconds**, pulling the entire order history with three-level population each time. All filtering is client-side.
- **Paid and abandoned orders look the same.** There is no payment-status column or filter; PENDING checkouts appear as normal rows. The only lifecycle is `processing → in_shipping → shipped`; "printed" does not exist, so you cannot tell which cards you have printed.
- One order needs **three dialogs** to collect what goes in the envelope: greeting text (buried in `arTemplateData.mainHeading/paragraph1/paragraph2`), address (separate dialog with jsPDF), QR (separate dialog).
- **The on-screen QR encodes the wrong URL**: `${AR_EXPERIENCE_LINK}/${id}` (`order.js:6929`, `view/[id].js:427`), while the viewer expects `?templateId=`. Print and PNG download build the correct URL but **fetch the QR image from `api.qrserver.com`**, a third-party site, so shippable QRs depend on an external service and leak every template id to it. `react-qr-code` is already installed and renders locally.
- `NEXT_PUBLIC_AR_EXPERIENCE_LINK` is missing from `.env.example`; if unset, the modal QR encodes `undefined/<id>` and print silently omits the QR.
- Print export is A4 landscape, page 1 the customer's browser screenshot (`templateTextSS`, resolution depends on their device), page 2 a 150 px QR. No bleed, crop marks, DPI or CMYK; no batch print. Three older print implementations remain as ~2,000 commented lines.
- The "shipped" toast claims an email was sent; none is. Order delete is a hard delete behind a confirm dialog.
- `getCard` references undefined variables and would throw if called.

### Card upload (these become AR targets)
- Client checks only ≤ 5 MB and an A5 aspect ratio within 5%. **No minimum resolution** (148×210 px passes), no format whitelist (HEIC/SVG/GIF accepted), no dimension display, no tracking-suitability check. Server-side: nothing.
- Price stored with `parseInt` (12.99 → 12), displayed as `12 $`, no currency or GST.

### Dashboard
Numbers are real but wrong: every aggregate ignores payment status, so abandoned checkouts inflate revenue and conversion. Three endpoints do `find({})` then a query per row. One stat card is titled "Total Orde" and prints a quantity with a dollar sign.

### Security
Same open-admin and any-token-is-admin issues as §6. Auth guard is client-only and runs once per mount; with static export every page is downloadable, so protection is entirely the API's. Login response includes the admin's password hash. `error.response.data.msg` is dereferenced unguarded in 13 places, so a network error becomes an uncaught exception.

### Leftovers
`leaderboard.js` calls a non-existent endpoint, `bankaccount.js`, `forget.js`, `reset.js` call commented-out routes, `use-mocked-user.js` still has the template's "Anika Visser", `CHANGELOG.md` is the Devias kit changelog, three duplicate filter helpers.

---

## 8. QA and engineering process

- **No automated tests** in any of the four projects. No CI, no `.github`. No lint enforcement. No TypeScript.
- **No staging environment** is evident; debug endpoints and `console.log` of secrets suggest debugging happens in production.
- **No error monitoring** (Sentry or similar) on any surface. Studio and viewer failures are `alert()` or silent.
- **No analytics on the AR funnel**: you cannot see how many recipients scan, how long the load takes, how many reach a tracked state, or how many bounce during the download. Add timing beacons at: page open, Unity ready, camera granted, first track, media playing.
- **Dependency vulnerabilities** (from `npm audit` on the lockfiles):

  | Project | Critical | High | Moderate |
  |---|---|---|---|
  | API | 1 (mongoose) | 8 (express, jws, nodemailer, path-to-regexp…) | 3 |
  | Website | 4 (next, next-auth, swiper, form-data) | 15 | 6 |

- **Manual QA matrix that is currently failing** and should be run before each release: iPhone Safari and Android Chrome for (a) full studio flow on phone, (b) QR scan → AR in under 15 s on 4G, (c) tab-switch during AR (currently redirects to Google after 10 s), (d) guest → login → checkout without losing work, (e) print sheet matches physical card.

---

## 9. Prioritised roadmap

### This week (P0, roughly two to three developer-days)
1. Disable `deleteOldCustomizationData` and the >7-day delete in `notification.js`; audit backups for already-deleted paid cards.
2. Remove `POST /api/admin/register`; add a `role` claim to admin JWTs and enforce it in `middleware/admin.js`; switch `routes/admin/statistics.js` to the admin middleware; return 401 not 400/500.
3. Compute the Stripe amount server-side from `Card.price × quantity + shipping`; in `confirm-payment` verify the payment intent's amount and metadata match the transaction; handle `payment_intent.succeeded` in the webhook; make the webhook idempotent.
4. Delete the debug endpoints, `/shorten`, `get-all-express-shipping-users`; add `select('-password -token')` to every user populate; stop returning password hashes from login.
5. `multer`: MIME and extension allowlist, `limits.fileSize` (e.g. 15 MB images, 60 MB video), random filenames; serve `/uploads` with `X-Content-Type-Options: nosniff` and `Content-Disposition`.
6. Fix the admin on-screen QR URL and render print QRs locally with `react-qr-code`; document `NEXT_PUBLIC_AR_EXPERIENCE_LINK`.
7. Change the AR viewer's background timeout from 10 s to something sane (or remove the redirect entirely).
8. Verify Google ID tokens in `signIn_with_google`; bind reset codes to email with a 10-minute TTL and attempt limit.

### This month (P1)
9. **Rebuild both Unity builds** with Brotli compression, IL2CPP code stripping set to High, and the unused packages removed (AR Foundation, XR Interaction Toolkit + samples, Cinemachine, Timeline, Splines, Tutorials, Multiplayer Center, UIParticle demo, In-game Debug Console). Serve with `Content-Encoding: br` from a CDN with long cache headers. Target: studio < 40 MB, viewer < 20 MB.
10. In the studio page: remove jQuery/Bootstrap 3/Font Awesome, cap `devicePixelRatio` at 1.5, remove the 16:9 lock and the "use a laptop" modal, set a portrait Canvas Scaler reference in Unity, offset for the fixed nav (or hide it on the editor route), use a relative iframe src.
11. In the React editor: start API calls on mount in parallel with the Unity download; reset `isUnityReady` after uploads; keep bridge callbacks reading fresh state via refs; make `hasUnsavedChanges` real; surface errors as toasts; persist the draft before Google sign-in.
12. Replace the session JWT in the QR with a server-minted, short-lived, single-purpose upload token; stop trusting client `isAuthenticated`; require ownership on every studio write endpoint.
13. Card upload: enforce ≥ 1200 px long edge (ideally ≥ 1748 px for A5 at 150 dpi), JPG/PNG only, validate server-side with `sharp`, show dimensions before upload, and run a simple feature-count check (ORB keypoints) with a warning below a threshold. Re-export existing card fronts at full resolution.
14. AR viewer: register only `frontCard`/`rightCard`, constrain the camera to 1280×720, tune `DETECT_INTERVAL`/`MAX_TARGET_PIXELS`/detector, fetch the experience JSON once, add a poster frame and a "no camera" fallback, fix the page title and metadata.
15. Media pipeline: transcode uploaded video to H.264 720p ≤ 5 MB with a poster, convert GIFs to MP4/WebM, move all uploads to S3/R2 behind a CDN, store paths relative to a configurable base, add an orphan-file cleanup job.
16. Home page: replace the 45 MB of GIFs with WebM/Lottie, adopt `next/image`, drop Bootstrap and unused dependencies, add meta/OG/h1, put the AR link and order number on `/success`.
17. Admin fulfilment: default the order list to COMPLETED + unshipped, add payment status and a `printed` state, server-side pagination, one-screen order sheet (text + address + QR), print-ready PDF at trim size with bleed, batch print.
18. Add `helmet`, rate limiting, `express-mongo-sanitize`, a global error handler, indexes on `uuid`, `email`, `createdAt`, `status`; upgrade vulnerable dependencies.

### Next quarter (P2, strategic)
19. **Decide the future of Unity.** The studio's feature set (choose template, upload photo/video, pick a 3D sticker and music, type a greeting, preview) is a normal web UI. A React + three.js (or `<model-viewer>`) studio would be ~1 MB, instantly mobile, and maintainable by any web developer. Likewise, the AR viewer only plays a video/image with particles over a tracked card; MindAR (open source, GPU-accelerated) or a commercial WebAR SDK (8th Wall, Zappar) would remove the 96 MB download and give better tracking. Keep Unity only if you have a genuine need for complex 3D authoring.
20. Delete dead code (roughly a quarter of the codebase), split the 7k-line and 3k-line components, add TypeScript, tests for payments and auth, CI with lint + audit + build, a staging environment, Sentry, and AR funnel analytics.
21. Take the 5.8 GB of uploads out of git history (they will otherwise slow every clone forever) and rewrite the repository.

---

## 10. Open questions for you

1. Do you have the Unity source projects for the studio and the AR viewer (likely inside the Drive zips)? Without them, items 9, 10, 13 and 14 need the original developers.
2. Where are the four surfaces hosted, and is anything behind a CDN today? The compression and caching fixes are hosting changes as much as code changes.
3. Have any paid cards already been deleted by the 90-day job? The first paid orders appear to date from July/August 2025, so the first deletions would have started around November 2025.
4. Was `NEXT_PUBLIC_STRIPE_SECRET_KEY` ever set in a deployed `.env`? If yes, rotate the Stripe secret key.
5. Who will maintain this going forward: the same Fiverr team, or someone new? That decides whether the P2 rewrite is worth starting now.
