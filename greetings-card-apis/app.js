const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
const Stripe = require('stripe');
const Transaction = require("./models/transactionData");
const crypto = require('crypto');
const path = require("path");
const internetOk = require('./utils/internetConnection');

require('dotenv').config();
require('./database/connection').connect();
require('./utils/deleteTemplateData');
require('./utils/notification');
require('./utils/deleteOldCustomizationData');

const apiRoutes = require('./routes/index');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CORS_OPTIONS = process.env.CORS_OPTIONS;
let corsOrigins = [];
if (CORS_OPTIONS) {
    corsOrigins = CORS_OPTIONS.split(',')
}

const corsOptions = {
    origin: corsOrigins,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const createMusicRouter = require('./routes/music');
const MUSIC_DIR = path.join(__dirname, 'public', 'music');
app.use('/api', createMusicRouter({dir: MUSIC_DIR}));

app.use('/music', express.static(MUSIC_DIR));


// 🔹 STRIPE WEBHOOK - Webhook must come BEFORE json middleware
app.post('/stripe/payment/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    
    console.log("🔍 Webhook received - endpointSecret:", endpointSecret ? 'SET' : 'NOT SET');
    
    let event;
    try {
        // Ensure we have the raw body
        if (!req.body) {
            throw new Error('No request body received');
        }
        
        if (!sig) {
            throw new Error('No stripe-signature header found');
        }
        
        if (!endpointSecret) {
            throw new Error('No webhook secret configured');
        }
        
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("✅ Stripe Event received:", event.type);
    } catch (err) {
        console.error("❌ Stripe webhook signature verification failed:", err.message);
        console.error("❌ Error details:", err.message);
        return res.status(400).send(`Stripe webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log("✅ Stripe Payment successful:", session.id);

        try {
            // Extract metadata from session
            const userId = session.metadata?.userId;
            const cardCustomizationId = session.metadata?.cardCustomizationId;
            const transactionId = session.metadata?.transactionId;
            
            if (!userId || !cardCustomizationId) {
                console.error("❌ Missing userId or cardCustomizationId in session metadata");
                return res.status(400).json({ error: 'Missing required metadata' });
            }

            // Find existing transaction by transactionId or fallback to user/card lookup
            let transaction;
            if (transactionId) {
                transaction = await Transaction.findById(transactionId);
                console.log("✅ Found transaction by ID:", transactionId);
            } else {
                // Fallback: find by user and card
                transaction = await Transaction.findOne({
                    user_id: userId,
                    cardCustomizationId: cardCustomizationId,
                    status: 'PENDING'
                });
                console.log("✅ Found transaction by user/card lookup");
            }

            if (transaction) {
                console.log("📝 Updating transaction:", transaction._id);

                // Calculate the actual amount paid from Stripe (convert from cents)
                const actualAmountPaid = session.amount_total / 100; // Convert from cents to dollars
                const stripeCurrency = session.currency.toUpperCase();

                // Extract discount information from Stripe session
                const discountInfo = session.total_details?.breakdown?.discounts?.[0];
                const appliedPromotionCode = session.promotion_code;
                const appliedCoupon = session.discount?.coupon;
                
                console.log("💰 Stripe discount information:", {
                    hasDiscount: !!discountInfo,
                    discountAmount: discountInfo?.amount ? discountInfo.amount / 100 : 0,
                    promotionCode: appliedPromotionCode?.code,
                    couponId: appliedCoupon?.id,
                    couponName: appliedCoupon?.name,
                    totalDetails: session.total_details,
                    sessionDiscount: session.discount
                });

                // Update existing transaction with payment completion
                transaction.checkout_id = session.id;
                transaction.payment_intent = session.payment_intent;
                transaction.status = 'COMPLETED';
                transaction.paid_at = new Date();
                transaction.data = session; // Store full session data
                
                // Update with actual amount paid from Stripe
                // Keep original total and aud unchanged, only update currency
                transaction.currency = stripeCurrency; // Store currency
                
                // Save discount information from Stripe
                if (discountInfo) {
                    transaction.discount_price = discountInfo.amount / 100; // Convert from cents to dollars
                    transaction.coupon_code = appliedPromotionCode?.code || appliedCoupon?.name || 'Stripe Discount';
                    console.log("✅ Discount information saved:", {
                        discount_price: transaction.discount_price,
                        coupon_code: transaction.coupon_code
                    });
                }
                
                const savedTransaction = await transaction.save();
                console.log("✅ Transaction completed:", savedTransaction._id);

                // Verify the transaction was actually saved
                const verifyTransaction = await Transaction.findById(transaction._id);
                if (verifyTransaction && verifyTransaction.status === 'COMPLETED') {
                    console.log("✅ Transaction verification successful");
                } else {
                    console.error("❌ Transaction verification failed");
                }

                // Send purchase confirmation email to buyer
                if (transaction.user_id) {
                    try {
                        console.log("📧 Attempting to send purchase confirmation email...");
                        const { send_purchase_confirmation_email } = require('./utils/email');
                        
                        const env = {
                            MAIL_HOST: process.env.MAIL_HOST,
                            MAIL_PORT: process.env.MAIL_PORT,
                            MAIL_USER: process.env.MAIL_USER,
                            MAIL_PASS: process.env.MAIL_PASS,
                            MAIL_FROM: process.env.MAIL_FROM,
                            APP_NAME: process.env.APP_NAME
                        };

                        console.log("📧 Email environment variables:", {
                            MAIL_HOST: env.MAIL_HOST ? 'SET' : 'NOT SET',
                            MAIL_PORT: env.MAIL_PORT ? 'SET' : 'NOT SET',
                            MAIL_USER: env.MAIL_USER ? 'SET' : 'NOT SET',
                            MAIL_PASS: env.MAIL_PASS ? 'SET' : 'NOT SET',
                            MAIL_FROM: env.MAIL_FROM ? 'SET' : 'NOT SET',
                            APP_NAME: env.APP_NAME ? 'SET' : 'NOT SET'
                        });

                        const emailResult = await send_purchase_confirmation_email(env, transaction);
                        if (emailResult.success) {
                            console.log("✅ Purchase confirmation email sent successfully");
                        } else {
                            console.log("⚠️ Failed to send purchase confirmation email:", emailResult.reason);
                        }
                    } catch (emailError) {
                        console.error("❌ Error sending purchase confirmation email:", emailError);
                    }
                } else {
                    console.log("⚠️ Cannot send email: user_id is missing from transaction");
                }
            } else {
                console.error("❌ No transaction found to update");
                return res.status(400).json({ error: 'Transaction not found' });
            }

            // Mark card customization as paid
            const CardCustomization = require('./models/card_customization');
            await CardCustomization.updateOne(
                { _id: cardCustomizationId },
                { $set: { isPaid: true } }
            );
            console.log("✅ Card customization marked as paid:", cardCustomizationId);

        } catch (err) {
            console.error("❌ Error processing Stripe webhook:", err);
            console.error("❌ Error details:", {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }

    res.json({received: true});
});


app.get('/api/check/internet-connection', async (_req, res) => {
    const ok = await internetOk();
    if (ok) return res.status(200).json({success: true, data: {internetWorking:true} });
    return res.status(500).json({success: false, data: {internetWorking:false }});
});


// Database verification endpoint - Check if webhook data is being saved
app.get('/api/verify-webhook-data', async (req, res) => {
    try {
        console.log("🔍 Checking webhook data in database...");
        
        // Get recent transactions
        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user_id', 'firstName lastName email')
            .populate('cardCustomizationId', 'title')
            .lean();
        
        console.log("📊 Recent transactions found:", recentTransactions.length);
        
        // Check for completed transactions
        const completedTransactions = await Transaction.find({ status: 'COMPLETED' })
            .sort({ paid_at: -1 })
            .limit(5)
            .populate('user_id', 'firstName lastName email')
            .populate('cardCustomizationId', 'title')
            .lean();
        
        console.log("✅ Completed transactions found:", completedTransactions.length);
        
        // Check for transactions with Stripe data
        const stripeTransactions = await Transaction.find({ 
            $or: [
                { checkout_id: { $exists: true, $ne: null } },
                { payment_intent: { $exists: true, $ne: null } }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        
        console.log("💳 Stripe transactions found:", stripeTransactions.length);
        
        res.json({
            success: true,
            data: {
                totalRecent: recentTransactions.length,
                completed: completedTransactions.length,
                stripeTransactions: stripeTransactions.length,
                recentTransactions: recentTransactions.map(t => ({
                    id: t._id,
                    status: t.status,
                    total: t.total,
                    checkout_id: t.checkout_id,
                    payment_intent: t.payment_intent,
                    paid_at: t.paid_at,
                    user: t.user_id?.firstName + ' ' + t.user_id?.lastName,
                    card: t.cardCustomizationId?.title
                })),
                completedTransactions: completedTransactions.map(t => ({
                    id: t._id,
                    status: t.status,
                    total: t.total,
                    checkout_id: t.checkout_id,
                    payment_intent: t.payment_intent,
                    paid_at: t.paid_at,
                    user: t.user_id?.firstName + ' ' + t.user_id?.lastName,
                    card: t.cardCustomizationId?.title
                })),
                stripeTransactions: stripeTransactions.map(t => ({
                    id: t._id,
                    status: t.status,
                    total: t.total,
                    checkout_id: t.checkout_id,
                    payment_intent: t.payment_intent,
                    paid_at: t.paid_at
                }))
            }
        });
    } catch (err) {
        console.error("❌ Error checking webhook data:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});




const RAW = express.raw({ type: 'application/json' });
// PAYPAL
// app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
//     try {
//         console.log("going to call webhook")
//         const webhook_id = process.env.PAYPAL_WEBHOOK_ID;
//         console.log("gwebhook_id", webhook_id)
//         const webhook_event = JSON.parse(req.body.toString('utf8'));
//         const token = await getAccessToken();
//         const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

//         const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
//             method: 'POST',
//             headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 auth_algo: req.get('paypal-auth-algo'),
//                 cert_url: req.get('paypal-cert-url'),
//                 transmission_id: req.get('paypal-transmission-id'),
//                 transmission_sig: req.get('paypal-transmission-sig'),
//                 transmission_time: req.get('paypal-transmission-time'),
//                 webhook_id,
//                 webhook_event
//             })
//         }).then(r => r.json());

//         if (verifyRes?.verification_status !== 'SUCCESS') return res.sendStatus(400);

//         const t = webhook_event.event_type;
//         if (t === 'PAYMENT.CAPTURE.COMPLETED') {
//             const cap = webhook_event.resource; // capture obj
//             const orderId  = cap?.supplementary_data?.related_ids?.order_id || null;
//             const customId = cap?.custom_id || null;

//             const doc = {
//                 status: 'COMPLETED',
//                 paypal_order_id: orderId,
//                 paypal_capture_id: cap?.id,
//                 amount: { value: cap?.amount?.value, currency: cap?.amount?.currency_code },
//                 breakdown: {
//                     paypal_fee: cap?.seller_receivable_breakdown?.paypal_fee?.value ?? null,
//                     net_amount: cap?.seller_receivable_breakdown?.net_amount?.value ?? null
//                 },
//                 paid_at: cap?.update_time ? new Date(cap.update_time) : new Date(),
//                 paypal_capture: webhook_event,
//                 data: webhook_event
//             };

//             await Transaction.findOneAndUpdate(
//                 customId ? { _id: customId } : { paypal_order_id: orderId },
//                 { $set: doc },
//                 { upsert: true, new: true }
//             );
//         }

//         res.sendStatus(200);
//     } catch (e) {
//         console.error('WH error', e);
//         res.sendStatus(500);
//     }
// });


// module.exports = router;



// 🔹 AFTER webhook
app.use(express.json());
app.use(express.urlencoded({extended: true}));



app.set('trust proxy', 1); // so req.protocol is correct behind proxies

// ----- SHORTENER (before static & after express.json) -----
const urlMap = new Map();
const gen = () => crypto.randomBytes(4).toString('hex');

// Create short URL
app.post('/shorten', express.json(), (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const code = gen();
  urlMap.set(code, url);

  // Build base from THIS request so host/port are always correct
  const base = `${req.protocol}://${req.get('host')}`;
  return res.json({ shortUrl: `${base}/s/${code}` });
});

// Resolve short URL (scoped path, not greedy)
app.get('/s/:code', (req, res) => {
  const longUrl = urlMap.get(req.params.code);
  if (!longUrl) return res.status(404).send('Not found');
  return res.redirect(302, longUrl);
});


// static files
app.use(express.static(__dirname + '/public'));

// all API routes
app.use("/api", apiRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Server is running.')
});

module.exports = app;

