// Stripe payment routes.
//
// Every amount charged is computed server-side (utils/pricing.js) from the
// card price stored in MongoDB. The browser only tells us *what* is being
// bought (customisation id, quantity, express shipping, coupon code) and
// where to ship it. Orders are completed exactly once via utils/completeOrder.
const {Router} = require('express');
const Transaction = require('../models/transactionData');
const userAuth = require('../middleware/auth');
const {quoteOrder, pickShippingFields, PricingError} = require('../utils/pricing');
const {completeTransaction, generateOrderId} = require('../utils/completeOrder');

const router = Router();

const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEB_URL = process.env.APP_URL;
if (!SECRET_KEY) console.error('STRIPE_SECRET_KEY is not set: payments will fail');
if (!WEB_URL) console.error('APP_URL is not set: Stripe redirect URLs will be invalid');

const stripe = require('stripe')(SECRET_KEY);

const sendError = (res, err, fallback) => {
    if (err instanceof PricingError) return res.status(err.status).json({error: err.message});
    console.error(fallback, err);
    return res.status(500).json({error: fallback});
};

const quoteToJson = (q) => ({
    unitPrice: q.unitPrice,
    quantity: q.quantity,
    subtotal: q.subtotal,
    shipping: q.shipping,
    expressShipping: q.expressShipping,
    expressShippingRate: q.expressShippingRate,
    gst: q.gst,
    totalBeforeDiscount: q.totalBeforeDiscount,
    discount: q.discount,
    couponCode: q.couponCode,
    total: q.total,
    currency: q.currency,
});

// Build the PENDING transaction row for a quote.
async function createPendingTransaction({quote, userId, shippingFields, extra = {}}) {
    return Transaction.create({
        user_id: userId,
        cardCustomizationId: quote.customization._id,
        title: quote.card.title || 'AR Greeting Card',
        price: quote.unitPrice,
        quantity: quote.quantity,
        shipping: quote.shipping,
        expressShipping: quote.expressShipping,
        expressShippingRate: quote.expressShippingRate,
        gst: quote.gst,
        total_before_discount: quote.totalBeforeDiscount,
        discount_price: quote.discount,
        coupon_code: quote.couponCode,
        total: quote.total,
        aud: quote.total,
        status: 'PENDING',
        orderId: await generateOrderId(),
        ...shippingFields,
        ...extra,
    });
}

// Validate a coupon and return its effect (display only; the server re-applies it at charge time).
router.post('/validate-coupon', userAuth, async (req, res) => {
    try {
        const {couponCode} = req.body || {};
        if (!couponCode) return res.status(400).json({error: 'Coupon code is required'});
        const list = await stripe.promotionCodes.list({code: String(couponCode).trim(), active: true, limit: 1});
        const promo = list.data[0];
        if (!promo || !promo.coupon || !promo.coupon.valid) {
            return res.status(404).json({valid: false, error: 'Invalid or expired coupon code'});
        }
        const coupon = promo.coupon;
        return res.json({
            valid: true,
            coupon: {
                id: coupon.id,
                name: coupon.name,
                percent_off: coupon.percent_off || null,
                amount_off: coupon.amount_off || null,
                currency: coupon.currency || 'aud',
                duration: coupon.duration,
                promotionCodeId: promo.id,
            },
        });
    } catch (err) {
        return sendError(res, err, 'Failed to validate coupon code');
    }
});

// Price preview for the checkout page (no side effects).
router.post('/quote', userAuth, async (req, res) => {
    try {
        const {cardCustomizationId, quantity, expressShipping, couponCode} = req.body || {};
        const quote = await quoteOrder({
            cardCustomizationId, userId: req.user.user_id, quantity, expressShipping, couponCode, stripe,
        });
        return res.json({success: true, quote: quoteToJson(quote)});
    } catch (err) {
        return sendError(res, err, 'Failed to price order');
    }
});

// Hosted Stripe Checkout.
router.post('/create-checkout-session', userAuth, async (req, res) => {
    try {
        const body = req.body || {};
        const td = body.transactionData || {};
        const cardCustomizationId = body.cardCustomizationId || (body.product && body.product.cardCustomizationId);
        const quote = await quoteOrder({
            cardCustomizationId,
            userId: req.user.user_id,
            quantity: td.quantity,
            expressShipping: td.expressShipping,
            couponCode: td.coupon_code || body.couponCode,
            stripe,
        });

        const tx = await createPendingTransaction({
            quote, userId: req.user.user_id, shippingFields: pickShippingFields(td),
        });

        const image = quote.card.frontDesign && /^https?:\/\//i.test(quote.card.frontDesign)
            ? [quote.card.frontDesign.replace(/^http:\/\//i, 'https://')]
            : [];

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: 'aud',
                    unit_amount: quote.amountCents,
                    product_data: {
                        name: `${quote.card.title || 'AR Greeting Card'} × ${quote.quantity}`,
                        description: `Incardible card incl. shipping and GST${quote.discount ? ` (coupon ${quote.couponCode})` : ''}`,
                        images: image,
                    },
                },
            }],
            // Discounts are applied server-side; do not let Stripe stack a second one.
            allow_promotion_codes: false,
            success_url: `${WEB_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${WEB_URL}/cancel`,
            metadata: {
                userId: String(req.user.user_id),
                cardCustomizationId: String(quote.customization._id),
                transactionId: tx._id.toString(),
                orderId: tx.orderId,
            },
            payment_intent_data: {
                metadata: {
                    userId: String(req.user.user_id),
                    cardCustomizationId: String(quote.customization._id),
                    transactionId: tx._id.toString(),
                    orderId: tx.orderId,
                },
            },
        });

        await Transaction.findByIdAndUpdate(tx._id, {checkout_id: session.id});

        return res.json({url: session.url, transactionId: tx._id, checkoutId: session.id, quote: quoteToJson(quote)});
    } catch (err) {
        return sendError(res, err, 'Failed to create checkout session');
    }
});

// In-page Stripe Elements flow.
router.post('/create-payment-intent', userAuth, async (req, res) => {
    try {
        const body = req.body || {};
        const td = body.transactionData || {};
        const quote = await quoteOrder({
            cardCustomizationId: body.cardCustomizationId,
            userId: req.user.user_id,
            quantity: td.quantity,
            expressShipping: td.expressShipping,
            couponCode: body.couponCode || td.coupon_code,
            stripe,
        });

        const tx = await createPendingTransaction({
            quote, userId: req.user.user_id, shippingFields: pickShippingFields(td),
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: quote.amountCents,
            currency: 'aud',
            automatic_payment_methods: {enabled: true},
            metadata: {
                userId: String(req.user.user_id),
                cardCustomizationId: String(quote.customization._id),
                transactionId: tx._id.toString(),
                orderId: tx.orderId,
                ...(quote.couponCode ? {coupon_code: quote.couponCode} : {}),
            },
        });

        await Transaction.findByIdAndUpdate(tx._id, {payment_intent: paymentIntent.id});

        return res.json({
            clientSecret: paymentIntent.client_secret,
            transactionId: tx._id,
            paymentIntentId: paymentIntent.id,
            quote: quoteToJson(quote),
        });
    } catch (err) {
        return sendError(res, err, 'Failed to create payment intent');
    }
});

// Client-side confirmation after Stripe Elements succeeds. The webhook is the
// source of truth; this only lets the UI proceed quickly, and it verifies the
// intent really belongs to this transaction and this user.
router.post('/confirm-payment', userAuth, async (req, res) => {
    try {
        const {paymentIntentId, transactionId} = req.body || {};
        if (!paymentIntentId || !transactionId) {
            return res.status(400).json({error: 'Payment Intent ID and Transaction ID are required'});
        }

        const tx = await Transaction.findById(transactionId);
        if (!tx) return res.status(404).json({error: 'Transaction not found'});
        if (String(tx.user_id) !== String(req.user.user_id)) {
            return res.status(403).json({error: 'This order belongs to another account'});
        }

        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        const matchesTransaction =
            (pi.metadata && pi.metadata.transactionId === String(tx._id)) || tx.payment_intent === pi.id;
        if (!matchesTransaction) {
            return res.status(400).json({error: 'Payment does not match this order'});
        }
        if (pi.status !== 'succeeded') {
            return res.status(400).json({success: false, error: `Payment status is ${pi.status}`});
        }
        const expectedCents = Math.round(Number(tx.total) * 100);
        if (pi.currency !== 'aud' || pi.amount_received !== expectedCents) {
            console.error('[payment] amount mismatch', {tx: tx._id, expectedCents, received: pi.amount_received});
            return res.status(400).json({error: 'Paid amount does not match this order'});
        }

        const {transaction} = await completeTransaction(tx._id, {paymentIntentId: pi.id});
        const finalTx = transaction || await Transaction.findById(tx._id)
            .populate('user_id', 'firstName lastName email')
            .populate('cardCustomizationId');
        return res.json({success: true, transaction: finalTx});
    } catch (err) {
        return sendError(res, err, 'Failed to confirm payment');
    }
});

// Order summary for the success page (owner only).
router.get('/order/:transactionId', userAuth, async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.transactionId)
            .populate({path: 'cardCustomizationId', populate: {path: 'cardId', select: 'title frontDesign'}});
        if (!tx) return res.status(404).json({error: 'Order not found'});
        if (String(tx.user_id) !== String(req.user.user_id)) {
            return res.status(403).json({error: 'This order belongs to another account'});
        }
        return res.json({success: true, order: tx});
    } catch (err) {
        return sendError(res, err, 'Failed to load order');
    }
});

module.exports = router;
