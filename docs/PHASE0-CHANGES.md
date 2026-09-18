# Phase 0: stop-the-bleeding changes

These changes fix the P0 items from `AUDIT.md` without changing what customers see.
They must be deployed together (API first, then the website and admin), and the
environment additions below must be in place before the API restarts.

## What changed

### Data loss
- `utils/deleteOldCustomizationData.js`: the job that deleted paid customisations and
  their orders after 90 days is **disabled** unless `ENABLE_PAID_DATA_CLEANUP=true`.
- `utils/notification.js`: reminder/expiry job now only touches **unpaid** drafts that
  have an email; each customer is processed in isolation so one bad address no longer
  aborts the run.

### Authentication and authorisation
- Admin JWTs now carry `role: 'admin'`; `middleware/admin.js` requires that role **and**
  an existing Admin record. Customer tokens can no longer reach admin routes.
  **Existing admin sessions are invalid: admins must log in again once.**
- `POST /api/admin/register` only works with header `x-admin-setup-key` equal to
  `ADMIN_SETUP_KEY`. Leave the variable empty to keep registration closed.
- Admin statistics routes use the admin middleware. The express-shipping list is admin-only.
- Google sign-in verifies a Google **ID token** server-side (`google-auth-library`); the
  website passes it through next-auth (`callbacks.jwt/session`) and `/api/secure-data`.
- Password reset codes expire after 10 minutes, allow 5 attempts, and are bound to the
  email that requested them. `temp_user` documents auto-expire (TTL index).
- Per-user endpoints (`get-all-cards`, `remove-card`) enforce ownership.
- Middlewares return 401/403 instead of 400/500. Login/register/reset/contact endpoints
  are rate-limited (30 per 15 minutes per IP); everything else 300 per minute.
- Password hashes are never serialised (`toJSON` transform on User and Admin).

### Payments
- `routes/payment.js` rewritten. Amount = `Card.price × quantity + $5 shipping
  (+ $4 express) + 10% GST − Stripe coupon`, computed in `utils/pricing.js`. Client-sent
  totals are ignored. Stripe promotion codes are applied server-side, and Stripe's own
  promo-code box is disabled to prevent stacking.
- Payment routes require the customer token; the user id comes from the token.
- Only shipping fields are accepted from the client (no mass assignment of `status` etc.).
- `confirm-payment` verifies the payment intent belongs to the transaction, is
  `succeeded`, and the paid amount equals the order total.
- Webhook handles `checkout.session.completed`, `payment_intent.succeeded` and
  `charge.refunded`, verifies amounts, and completes each order **at most once**
  (`utils/completeOrder.js`). Confirmation emails are therefore sent once.
- Order numbers are 6 digits and checked for uniqueness.
- New `POST /api/payment/quote` returns the server's price breakdown for the checkout UI.
- New `GET /api/payment/order/:transactionId` (owner only) for the success page.

### Removed
- `GET /api/verify-webhook-data`, `/api/payment/test-env`, `/test-transactions`,
  `/test-image/:path`, `/api/check/internet-connection`, `POST /shorten`, `GET /s/:code`.
- Website API routes `pages/api/verify-token.js` and `generate-token.js` (hard-coded secret).
- PayPal SDK and body-parser dependencies.

### Uploads
- `utils/multer.js`: allow-list of image/video/audio types by MIME **and** extension,
  size limits (15 MB image, 60 MB video, 20 MB audio), random filenames. Card faces,
  template images, screenshots and marketing images accept images only.
- Static media served with `X-Content-Type-Options: nosniff` and a 7-day cache.
- Phone-upload and delete endpoints resolve the customisation by uuid on the server
  (paid first, then guest) instead of trusting the client's `isAuthenticated` flag.
- The studio QR no longer embeds the customer's session JWT.

### Admin panel
- QR codes on screen, print and download all use `<AR link>?templateId=<id>` and are
  generated locally (`src/utils/qr.js`) instead of `api.qrserver.com`.
- Requires `NEXT_PUBLIC_AR_EXPERIENCE_LINK` (see `.env.example`).

### AR viewer
- Leaving the tab no longer redirects the recipient to google.com; the camera restarts.

### Misc
- `helmet`, `express-rate-limit`, `express-mongo-sanitize`, JSON body limit 2 MB,
  central error handler (413/415/400 for upload and body errors), `/health`.
- Indexes on `card-customization.uuid/email/userId`, `templateData.uuid`,
  `transaction_data.createdAt/status/user_id/payment_intent`, `user.email`.
- `npm test` in the API runs `scripts/smoke.js` (boots the app without MongoDB and checks
  the HTTP surface: 22 checks).

## Environment additions

API (`greetings-card-apis/.env`):
```
ADMIN_SETUP_KEY=            # leave empty; set only while creating an admin
GOOGLE_CLIENT_ID=           # same value as the website's GOOGLE_CLIENT_ID
STRIPE_WEBHOOK_SECRET=      # already required; confirm it is set
CORS_OPTIONS=https://incardible.com.au,https://www.incardible.com.au,https://admin.incardible.com.au,https://ar.incardible.com.au
```
Stripe dashboard: the webhook endpoint `POST /stripe/payment/webhook` must be subscribed to
`checkout.session.completed`, `payment_intent.succeeded` and `charge.refunded`.

Admin (`greetings-card-admin/.env`):
```
NEXT_PUBLIC_AR_EXPERIENCE_LINK=https://ar.incardible.com.au
```

Website: remove `NEXT_PUBLIC_STRIPE_SECRET_KEY` from every `.env`. If it was ever set on a
deployed build, **rotate the Stripe secret key**.

## Deploy order
1. Add env vars, deploy API (`npm ci && npm test && npm start`).
2. Deploy website and admin.
3. Admins log in again.
4. Check backups for paid customisations deleted by the old cron (any `transaction_data`
   with `status: COMPLETED` whose `cardCustomizationId` no longer resolves).
