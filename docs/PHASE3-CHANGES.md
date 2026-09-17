# Phase 3: fulfilment, success page, cleanup

## Done

### Admin: new Orders screen (`/orders`)
- Server-side list: `GET /api/transactions/orders?status&shipping&printed&q&page&limit`
  (admin only). Defaults to **paid** orders, newest first, 25 per page; refreshes
  once a minute instead of pulling the whole history every 5 seconds.
- Queue badges: "N to print", "N to ship" (click to filter).
- **Printed** switch per order (`PUT /api/transactions/orders/:id/printed`, new
  `printedAt` field), so you can see what still needs printing.
- Shipping status per row (To ship → In transit → Delivered). "In transit" asks
  for the tracking number and sends the existing tracking email.
- **Order sheet** dialog: greeting text as it will be printed, shipping address
  and phone, the QR code with the exact viewer URL, card details, AR target
  status, payment info. One place for everything that goes in the envelope.
- **Print**: A4 landscape, page 1 the customer's print artwork (or the text
  rendered if artwork is missing), page 2 the QR label at 25 mm from the
  bottom-right. QR generated locally.
- Search by order number, customer name, email, postcode.
- The old `/order` page is still reachable from a link at the bottom.

### Customer: success page
- Checkout now lands on `/success?order=<id>`; the page shows the order number,
  card, total, shipping address, and the AR QR code / link with an "Open
  preview" button (`GET /api/payment/order/:id`, owner only).

### Website cleanup (first pass)
- Removed `jsonwebtoken` imports from browser code (dropped a Node crypto polyfill
  from the main bundle) and deleted `pages/backup.js` (a stale copy of the legacy
  editor that was live at `/backup`).
- Site-wide `description` and Open Graph / Twitter metadata in `_app.js`.
- Home-page GIFs re-encoded in place (same dimensions and frames, 128 colours,
  inter-frame optimisation): 46 MB → 19 MB total; unused `1_1.gif` removed.
  Converting the two biggest ones to short MP4/WebM clips would save another
  ~12 MB and is worth doing once an encoder is available in the pipeline.
- CI now runs full `next build` for the website and the admin, so lint errors and
  broken imports fail the pull request instead of the deploy.

## Not done yet
- Media on object storage + CDN (needs the AWS details).
- Delete the legacy editor (`/card-editor`, `/backup`, `public/editor`) once the
  studio is live.
- Website weight (hero GIFs), SEO metadata, dead code removal.
- Original Unity template artwork into the studio catalogue.
