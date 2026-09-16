// Server-side order pricing. The browser never decides what to charge: every
// amount sent to Stripe is computed here from the card price in the database.
const CardCustomization = require('../models/card_customization');

const SHIPPING_STANDARD_AUD = 5;
const EXPRESS_SURCHARGE_AUD = 4;
const GST_RATE = 0.10;
const MAX_QUANTITY = 50;
const STRIPE_MIN_AUD = 0.5;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

class PricingError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

/**
 * Look up a Stripe promotion code and return the discount it grants on the
 * given total. Throws PricingError(400) for unknown/inactive codes.
 */
async function resolveDiscount(stripe, couponCode, totalBeforeDiscount) {
    if (!couponCode) return {discount: 0, couponCode: null, promotionCodeId: null};
    const code = String(couponCode).trim();
    if (!code) return {discount: 0, couponCode: null, promotionCodeId: null};

    const list = await stripe.promotionCodes.list({code, active: true, limit: 1});
    const promo = list.data[0];
    if (!promo || !promo.coupon || !promo.coupon.valid) {
        throw new PricingError(400, 'Invalid or expired coupon code');
    }
    let discount = 0;
    if (promo.coupon.percent_off) {
        discount = round2(totalBeforeDiscount * promo.coupon.percent_off / 100);
    } else if (promo.coupon.amount_off) {
        if (promo.coupon.currency && promo.coupon.currency.toLowerCase() !== 'aud') {
            throw new PricingError(400, 'Coupon currency is not supported');
        }
        discount = round2(promo.coupon.amount_off / 100);
    }
    discount = Math.min(discount, totalBeforeDiscount);
    return {discount, couponCode: promo.code, promotionCodeId: promo.id};
}

/**
 * Build a full quote for a card customisation.
 * @param {object} opts
 * @param {string} opts.cardCustomizationId
 * @param {string} opts.userId          – the authenticated user (from JWT)
 * @param {number} [opts.quantity=1]
 * @param {boolean} [opts.expressShipping=false]
 * @param {string|null} [opts.couponCode]
 * @param {object} opts.stripe          – initialised Stripe client
 */
async function quoteOrder({cardCustomizationId, userId, quantity = 1, expressShipping = false, couponCode = null, stripe}) {
    if (!cardCustomizationId) throw new PricingError(400, 'Card customization ID is required');

    const customization = await CardCustomization.findById(cardCustomizationId).populate('cardId');
    if (!customization) throw new PricingError(404, 'Card customization not found');
    if (!customization.cardId) throw new PricingError(400, 'Card customization has no card attached');

    // Ownership: the customisation must belong to the paying user. Legacy rows
    // may carry only an email; those are matched by the caller before reaching
    // here (see routes/payment.js), so we only enforce userId when it is set.
    if (customization.userId && String(customization.userId) !== String(userId)) {
        throw new PricingError(403, 'This card belongs to another account');
    }

    const card = customization.cardId;
    const unitPrice = Number(card.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new PricingError(400, 'This card has no valid price');
    }

    let qty = parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > MAX_QUANTITY) qty = MAX_QUANTITY;

    const express = toBool(expressShipping);
    const shipping = SHIPPING_STANDARD_AUD;
    const expressShippingRate = express ? EXPRESS_SURCHARGE_AUD : 0;
    const subtotal = round2(unitPrice * qty);
    const preTax = round2(subtotal + shipping + expressShippingRate);
    const gst = round2(preTax * GST_RATE);
    const totalBeforeDiscount = round2(preTax + gst);

    const {discount, couponCode: appliedCode, promotionCodeId} =
        await resolveDiscount(stripe, couponCode, totalBeforeDiscount);

    let total = round2(totalBeforeDiscount - discount);
    if (total < STRIPE_MIN_AUD) total = STRIPE_MIN_AUD;

    return {
        customization,
        card,
        unitPrice,
        quantity: qty,
        expressShipping: express,
        expressShippingRate,
        shipping,
        subtotal,
        gst,
        totalBeforeDiscount,
        discount,
        couponCode: appliedCode,
        promotionCodeId,
        total,
        amountCents: Math.round(total * 100),
        currency: 'aud',
    };
}

/** Fields a client may supply about the order (everything else is ignored). */
function pickShippingFields(body = {}) {
    const out = {};
    for (const k of ['delivery_address', 'suburb', 'state', 'postal_code', 'phone_number']) {
        if (body[k] !== undefined && body[k] !== null) out[k] = String(body[k]).slice(0, 300);
    }
    out.newsAndOffers = toBool(body.newsAndOffers);
    return out;
}

module.exports = {quoteOrder, pickShippingFields, resolveDiscount, PricingError, round2, toBool};
