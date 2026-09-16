const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const Stripe = require('stripe');
const multer = require('multer');

require('dotenv').config();
require('./database/connection').connect();

const Transaction = require('./models/transactionData');
const {completeTransaction} = require('./utils/completeOrder');

// Background jobs (each guards itself; see the files for the safety rules).
require('./utils/deleteTemplateData');
require('./utils/notification');
require('./utils/deleteOldCustomizationData');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// Security headers, CORS, rate limits
// ---------------------------------------------------------------------------
app.use(helmet({
    // Media in /uploads and /music is embedded by the website, the studio and
    // the AR viewer, which live on other origins.
    crossOriginResourcePolicy: {policy: 'cross-origin'},
    contentSecurityPolicy: false, // API only; no HTML is served
}));

const corsOrigins = (process.env.CORS_OPTIONS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: corsOrigins.length ? corsOrigins : false,
    optionsSuccessStatus: 200,
}));

app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/uploads') || req.path.startsWith('/music'),
}));
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {success: false, msg: 'Too many attempts, please try again later'},
});
app.use([
    '/api/user/login', '/api/user/register', '/api/user/forget', '/api/user/reset',
    '/api/user/verify', '/api/user/google-signin', '/api/admin/login', '/api/admin/register',
    '/api/contact-us',
], authLimiter);

// ---------------------------------------------------------------------------
// Stripe webhook: must see the raw body, so it is mounted before express.json
// ---------------------------------------------------------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/stripe/payment/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        if (!endpointSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret);
    } catch (err) {
        console.error('[stripe] webhook signature verification failed:', err.message);
        return res.status(400).send('Webhook signature verification failed');
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.payment_status && session.payment_status !== 'paid') break;
                const txId = session.metadata && session.metadata.transactionId;
                const tx = txId
                    ? await Transaction.findById(txId)
                    : await Transaction.findOne({checkout_id: session.id});
                if (!tx) {
                    console.error('[stripe] no transaction for checkout session', session.id);
                    break;
                }
                const expectedCents = Math.round(Number(tx.total) * 100);
                if (session.amount_total !== expectedCents) {
                    console.error('[stripe] amount mismatch on checkout session', {tx: tx._id, expectedCents, got: session.amount_total});
                    break;
                }
                const discountCents = session.total_details && session.total_details.amount_discount;
                await completeTransaction(tx._id, {
                    checkoutId: session.id,
                    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                    discount: discountCents ? discountCents / 100 : undefined,
                });
                break;
            }
            case 'payment_intent.succeeded': {
                const pi = event.data.object;
                const txId = pi.metadata && pi.metadata.transactionId;
                const tx = txId
                    ? await Transaction.findById(txId)
                    : await Transaction.findOne({payment_intent: pi.id});
                if (!tx) {
                    console.error('[stripe] no transaction for payment intent', pi.id);
                    break;
                }
                const expectedCents = Math.round(Number(tx.total) * 100);
                if (pi.amount_received !== expectedCents) {
                    console.error('[stripe] amount mismatch on payment intent', {tx: tx._id, expectedCents, got: pi.amount_received});
                    break;
                }
                await completeTransaction(tx._id, {paymentIntentId: pi.id});
                break;
            }
            case 'charge.refunded': {
                const charge = event.data.object;
                if (charge.payment_intent) {
                    await Transaction.updateOne(
                        {payment_intent: charge.payment_intent},
                        {$set: {status: charge.refunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED'}}
                    );
                }
                break;
            }
            default:
                break;
        }
    } catch (err) {
        // 500 makes Stripe retry, which is what we want for transient DB errors.
        console.error('[stripe] webhook processing error:', err);
        return res.status(500).json({error: 'Webhook processing failed'});
    }

    return res.json({received: true});
});

// ---------------------------------------------------------------------------
// Body parsing and sanitisation
// ---------------------------------------------------------------------------
app.use(express.json({limit: '2mb'}));
app.use(express.urlencoded({extended: true, limit: '2mb'}));
app.use(mongoSanitize());

// ---------------------------------------------------------------------------
// Static media
// ---------------------------------------------------------------------------
const MUSIC_DIR = path.join(__dirname, 'public', 'music');
const createMusicRouter = require('./routes/music');
app.use('/api', createMusicRouter({dir: MUSIC_DIR}));

const staticOptions = {
    maxAge: '7d',
    etag: true,
    index: false,
    dotfiles: 'ignore',
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
    },
};
app.use('/music', express.static(MUSIC_DIR, staticOptions));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), staticOptions));
app.use('/logo.png', express.static(path.join(__dirname, 'public', 'logo.png'), staticOptions));

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
app.use('/api', require('./routes/index'));

app.get('/', (_req, res) => res.status(200).send('Server is running.'));
app.get('/health', (_req, res) => res.status(200).json({ok: true}));

// 404
app.use((req, res) => res.status(404).json({success: false, msg: 'Not found'}));

// Central error handler (multer, JSON parse errors, anything thrown)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    if (err instanceof multer.MulterError) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({success: false, msg: err.message});
    }
    if (err && err.status === 415) {
        return res.status(415).json({success: false, msg: err.message});
    }
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({success: false, msg: 'Request body too large'});
    }
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({success: false, msg: 'Malformed JSON'});
    }
    console.error('[unhandled]', err);
    return res.status(500).json({success: false, msg: 'Internal server error'});
});

module.exports = app;
