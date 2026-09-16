// Single place that turns a PENDING transaction into a COMPLETED order.
// Idempotent: a transaction is completed at most once, so Stripe retries and
// the client-side confirm call can all race safely.
const Transaction = require('../models/transactionData');
const CardCustomization = require('../models/card_customization');

async function completeTransaction(transactionId, {checkoutId = null, paymentIntentId = null, discount = null, couponCode = null} = {}) {
    const update = {
        status: 'COMPLETED',
        paid_at: new Date(),
    };
    if (checkoutId) update.checkout_id = checkoutId;
    if (paymentIntentId) update.payment_intent = paymentIntentId;
    if (discount !== null && discount !== undefined) update.discount_price = discount;
    if (couponCode) update.coupon_code = couponCode;

    // Only flips PENDING -> COMPLETED. Returns null when already completed.
    const tx = await Transaction.findOneAndUpdate(
        {_id: transactionId, status: {$ne: 'COMPLETED'}},
        {$set: update},
        {new: true}
    ).populate('user_id', 'firstName lastName email').populate('cardCustomizationId');

    if (!tx) {
        return {transaction: null, alreadyCompleted: true};
    }

    if (tx.cardCustomizationId) {
        await CardCustomization.updateOne(
            {_id: tx.cardCustomizationId._id || tx.cardCustomizationId},
            {$set: {isPaid: true}}
        );
    }

    // Email is best-effort and must never fail the payment.
    if (tx.user_id) {
        try {
            const {send_purchase_confirmation_email} = require('./email');
            const env = {
                MAIL_HOST: process.env.MAIL_HOST,
                MAIL_PORT: process.env.MAIL_PORT,
                MAIL_USER: process.env.MAIL_USER,
                MAIL_PASS: process.env.MAIL_PASS,
                MAIL_FROM: process.env.MAIL_FROM,
                APP_NAME: process.env.APP_NAME,
            };
            const result = await send_purchase_confirmation_email(env, tx);
            if (!result || !result.success) {
                console.warn('[order] confirmation email not sent:', result && result.reason);
            }
        } catch (err) {
            console.error('[order] confirmation email error:', err.message);
        }
    }

    return {transaction: tx, alreadyCompleted: false};
}

/** 6-digit order number that is unique across transactions. */
async function generateOrderId() {
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = String(100000 + Math.floor(Math.random() * 900000));
        const exists = await Transaction.exists({orderId: candidate});
        if (!exists) return candidate;
    }
    // Practically unreachable; fall back to a time-based id.
    return String(Date.now()).slice(-9);
}

module.exports = {completeTransaction, generateOrderId};
