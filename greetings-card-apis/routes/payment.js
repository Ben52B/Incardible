const {Router} = require('express');
const express = require("express");
// PAYPAL INTEGRATION COMMENTED OUT - SWITCHING TO STRIPE
// const {getAccessToken} = require("../utils/paypal");
const Transaction = require("../models/transactionData");
const CardCustomization = require("../models/card_customization");
const router = Router();

// const Transaction = require('../../models/transactionData');


// const app = express();
const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEB_URL = process.env.APP_URL;
const BASE_URL = process.env.API_URL;

console.log("🔧 Environment check:", {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    APP_URL: process.env.APP_URL || 'NOT SET',
    WEB_URL: WEB_URL,
    API_URL: process.env.API_URL || 'NOT SET'
});

// Validate required environment variables
if (!SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is not set!');
}

if (!WEB_URL) {
    console.error('❌ APP_URL is not set! Using fallback:', WEB_URL);
}

const stripe = require('stripe')(SECRET_KEY)

// Test endpoint to check environment variables
router.get('/test-env', (req, res) => {
    res.json({
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
        APP_URL: process.env.APP_URL || 'NOT SET',
        WEB_URL: WEB_URL,
        API_URL: process.env.API_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET'
    });
});

// Test endpoint to check recent transactions
router.get('/test-transactions', async (req, res) => {
    try {
        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id user_id status checkout_id payment_intent paid_at createdAt');
        
        res.json({
            message: 'Recent transactions',
            count: recentTransactions.length,
            transactions: recentTransactions
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
    }
});

// Test endpoint to check image accessibility
router.get('/test-image/:imagePath', async (req, res) => {
    try {
        const { imagePath } = req.params;
        const fullUrl = `${process.env.API_URL || 'http://localhost:5000'}/${imagePath}`;
        
        console.log('Testing image URL:', fullUrl);
        
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const parsedUrl = url.parse(fullUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const req = client.get(fullUrl, (response) => {
            console.log(`Image test response: ${response.statusCode}`);
            res.json({
                url: fullUrl,
                accessible: response.statusCode === 200,
                statusCode: response.statusCode,
                contentType: response.headers['content-type']
            });
        });
        
        req.on('error', (err) => {
            console.log(`Image test error: ${err.message}`);
            res.json({
                url: fullUrl,
                accessible: false,
                error: err.message
            });
        });
        
        req.setTimeout(5000, () => {
            console.log('Image test timeout');
            req.destroy();
            res.json({
                url: fullUrl,
                accessible: false,
                error: 'Timeout'
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// const RAW = express.raw({ type: 'application/json' });
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { product, userId, cardCustomizationId } = req.body;
        console.log("Stripe checkout session request:", { product, userId, cardCustomizationId });
        console.log("Environment variables:", { 
            WEB_URL, 
            SECRET_KEY: SECRET_KEY ? 'SET' : 'NOT SET',
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET'
        });

        // Validate required fields
        if (!product || !product.price) {
            return res.status(400).json({ error: 'Product and price are required' });
        }

        if (!cardCustomizationId && !product.cardCustomizationId) {
            return res.status(400).json({ error: 'Card customization ID is required' });
        }

        // Get userId from request or token
        let finalUserId = userId || product.userId;
        if (!finalUserId) {
            // Try to get userId from the token in headers
            const token = req.headers['x-access-token'];
            if (token) {
                try {
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                    finalUserId = decoded.user_id;
                    console.log('✅ User ID extracted from token:', finalUserId);
                } catch (err) {
                    console.log('❌ Could not decode token:', err.message);
                }
            }
        }

        if (!finalUserId) {
            return res.status(400).json({ error: 'User ID is required. Please login and try again.' });
        }

        // Create transaction record before Stripe checkout
        const frontendTransactionData = req.body.transactionData || {};
        const calculatedTotal = frontendTransactionData.total || product.price;
        
        // Handle coupon data
        const couponCode = frontendTransactionData.coupon_code || null;
        const discountPrice = frontendTransactionData.discount_price || 0;
        
        const transactionData = {
            user_id: finalUserId,
            cardCustomizationId: cardCustomizationId || product.cardCustomizationId,
            title: product.title || 'AR Greeting Card',
            price: product.price, // Base product price
            total: calculatedTotal, // Total amount (keep original)
            aud: calculatedTotal, // AUD amount (keep original)
            status: 'PENDING',
            orderId: Math.floor(1000 + Math.random() * 9000).toString(), // Generate unique order ID
            // Coupon fields
            coupon_code: couponCode,
            discount_price: discountPrice,
            // Add all additional fields from the frontend
            ...frontendTransactionData
        };

        console.log("💰 Price calculation:", {
            basePrice: product.price,
            calculatedTotal: calculatedTotal,
            discountPrice: discountPrice,
            couponCode: couponCode,
            frontendData: frontendTransactionData
        });

        console.log("📝 Creating transaction record:", transactionData);

        // Save transaction to database
        const savedTransaction = await Transaction.create(transactionData);
    
 

        
        // Test if the frontDesign image is accessible
        if (product.frontCardImage && product.frontCardImage !== 'null' && product.frontCardImage !== 'undefined') {
            console.log("🧪 Testing frontDesign image accessibility...");
            const https = require('https');
            const http = require('http');
            const url = require('url');
            
            try {
                const parsedUrl = url.parse(product.frontCardImage);
                const client = parsedUrl.protocol === 'https:' ? https : http;
                
                const req = client.get(product.frontCardImage, (res) => {
                    console.log(`✅ FrontDesign image accessible: ${product.frontCardImage} - Status: ${res.statusCode}`);
                });
                
                req.on('error', (err) => {
                    console.log(`❌ FrontDesign image not accessible: ${product.frontCardImage} - Error: ${err.message}`);
                });
                
                req.setTimeout(3000, () => {
                    console.log(`❌ FrontDesign image timeout: ${product.frontCardImage}`);
                    req.destroy();
                });
            } catch (error) {
                console.log(`❌ Error testing frontDesign image: ${error.message}`);
            }
        }

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'aud',
                        product_data: {
                            name: product.title,
                            description: `Custom Incardible Card - ${product.title}`,
                            images: [
                                String(product.frontCardImage || '')
                                  .replace(/^http:\/\//, 'https://') // live me https enforce
                              ].fil
                            // images: [product.frontCardImage]
                        },
                        unit_amount: Math.round(calculatedTotal * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            payment_method_types: ['card'],
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic'
                }
            },
            // Optional: Enable automatic tax (requires origin address in Stripe dashboard)
            // automatic_tax: {
            //     enabled: true
            // },
            
            // Optional: Enable shipping address collection (for physical products)
            // shipping_address_collection: {
            //     allowed_countries: ['AU', 'US', 'CA', 'GB', 'NZ']
            // },
            
            // Enable promotion codes
            allow_promotion_codes: true,
            success_url: `${WEB_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${WEB_URL}/cancel`,
            metadata: {
                userId: finalUserId,
                cardCustomizationId: cardCustomizationId || product.cardCustomizationId,
                transactionId: savedTransaction._id.toString(), // Add transaction ID to metadata
                title: product.title || 'AR Greeting Card',
                price: product.price.toString(),
                total: calculatedTotal.toString(), // Include total amount
                frontCardImage: product.frontCardImage || '',
                envelopeImage: product.envelopeImage || ''
            },
            payment_intent_data: {
                metadata: {
                    userId: finalUserId,
                    cardCustomizationId: cardCustomizationId || product.cardCustomizationId,
                    transactionId: savedTransaction._id.toString()
                }
            }
        });

        // Update transaction with Stripe checkout session ID
        await Transaction.findByIdAndUpdate(savedTransaction._id, {
            checkout_id: session.id,
            status: 'PENDING'
        });

        console.log("✅ Stripe checkout session created:", session.id);
        console.log("✅ Checkout URL:", session.url);
        console.log("✅ Transaction updated with checkout ID:", session.id);
        
        res.json({ 
            url: session.url,
            transactionId: savedTransaction._id,
            checkoutId: session.id
        });
    } catch (err) {
        console.error("❌ Error creating Stripe checkout session:", err);
        console.error("❌ Error details:", {
            message: err.message,
            type: err.type,
            code: err.code,
            raw: err.raw
        });
        res.status(500).json({ error: err.message || 'Stripe error' });
    }
});


// ========================================
// NEW: STRIPE PAYMENT INTENT API (Direct Payment on Website)
// ========================================

// Validate and apply discount/coupon code
router.post('/validate-coupon', async (req, res) => {
    try {
        const { couponCode } = req.body;
        
        if (!couponCode) {
            return res.status(400).json({ error: 'Coupon code is required' });
        }

        // Retrieve the promotion code from Stripe
        try {
            const promotionCodes = await stripe.promotionCodes.list({
                code: couponCode,
                active: true,
                limit: 1
            });

            if (promotionCodes.data.length === 0) {
                return res.status(404).json({ 
                    valid: false, 
                    error: 'Invalid or expired coupon code' 
                });
            }

            const promotionCode = promotionCodes.data[0];
            const coupon = promotionCode.coupon;

            // Check if coupon is valid
            if (!coupon.valid) {
                return res.status(400).json({ 
                    valid: false, 
                    error: 'This coupon is no longer valid' 
                });
            }

            // Return coupon details
            return res.json({
                valid: true,
                coupon: {
                    id: coupon.id,
                    name: coupon.name,
                    percent_off: coupon.percent_off || null,
                    amount_off: coupon.amount_off || null,
                    currency: coupon.currency || 'aud',
                    duration: coupon.duration,
                    promotionCodeId: promotionCode.id
                }
            });

        } catch (stripeError) {
            console.error('Stripe coupon validation error:', stripeError);
            return res.status(400).json({ 
                valid: false, 
                error: 'Invalid coupon code' 
            });
        }

    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ error: 'Failed to validate coupon code' });
    }
});

// Create Payment Intent for direct payment on website
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, userId, cardCustomizationId, transactionData, couponCode } = req.body;
        
        console.log("💳 Creating Payment Intent:", { amount, userId, cardCustomizationId, couponCode });

        // Validate required fields
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!cardCustomizationId) {
            return res.status(400).json({ error: 'Card customization ID is required' });
        }

        // Generate unique order ID
        const orderId = Math.floor(1000 + Math.random() * 9000).toString();

        // Calculate totals
        const discountAmount = transactionData?.discount_price || 0;
        const originalTotal = transactionData?.total || amount; // Total before discount
        const finalTotal = amount; // Total after discount (what user pays)

        // Create transaction record with both original and discounted amounts
        const newTransaction = await Transaction.create({
            user_id: userId,
            cardCustomizationId: cardCustomizationId,
            status: 'PENDING',
            orderId: orderId,
            ...transactionData, // Spread transaction data first
            // Override/add these specific fields
            total_before_discount: originalTotal, // NEW: Store original total before discount
            total: finalTotal, // Final total after discount (what user actually pays)
            aud: finalTotal, // AUD amount (same as final total)
            discount_price: discountAmount // Discount amount applied
        });

        console.log("📝 Transaction created:", newTransaction._id);

        // Create Payment Intent with Stripe
        // Note: For Payment Intents, discount is already calculated in the amount
        // The coupon code is stored in metadata for reference only
        const paymentIntentParams = {
            amount: Math.round(amount * 100), // Convert to cents (already discounted)
            currency: 'aud',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: userId,
                cardCustomizationId: cardCustomizationId,
                transactionId: newTransaction._id.toString(),
                orderId: orderId,
                // Store coupon code in metadata if provided
                ...(couponCode && { coupon_code: couponCode }),
                ...(transactionData?.coupon_code && { applied_coupon: transactionData.coupon_code }),
                ...(transactionData?.discount_price && { discount_amount: transactionData.discount_price.toString() })
            }
        };

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        // Update transaction with payment intent ID
        await Transaction.findByIdAndUpdate(newTransaction._id, {
            payment_intent: paymentIntent.id
        });

        console.log("✅ Payment Intent created:", paymentIntent.id);

        res.json({
            clientSecret: paymentIntent.client_secret,
            transactionId: newTransaction._id,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error("❌ Error creating Payment Intent:", error);
        res.status(500).json({ error: error.message || 'Failed to create payment intent' });
    }
});

// Confirm payment success and update transaction
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, transactionId } = req.body;

        if (!paymentIntentId || !transactionId) {
            return res.status(400).json({ error: 'Payment Intent ID and Transaction ID are required' });
        }

        // Retrieve payment intent from Stripe to verify status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update transaction status to COMPLETED and populate related data
            const updatedTransaction = await Transaction.findByIdAndUpdate(
                transactionId,
                {
                    status: 'COMPLETED',
                    payment_intent: paymentIntentId,
                    paid_at: new Date()
                },
                { new: true }
            ).populate('user_id').populate('cardCustomizationId');

            console.log("✅ Payment confirmed, transaction updated:", transactionId);

            // Mark card customization as paid
            if (updatedTransaction?.cardCustomizationId) {
                await CardCustomization.updateOne(
                    { _id: updatedTransaction.cardCustomizationId },
                    { $set: { isPaid: true } }
                );
                console.log("✅ Card customization marked as paid:", updatedTransaction.cardCustomizationId);
            }

            // Send purchase confirmation email
            if (updatedTransaction?.user_id) {
                try {
                    console.log("📧 Attempting to send purchase confirmation email...");
                    const { send_purchase_confirmation_email } = require('../utils/email');
                    
                    const env = {
                        MAIL_HOST: process.env.MAIL_HOST,
                        MAIL_PORT: process.env.MAIL_PORT,
                        MAIL_USER: process.env.MAIL_USER,
                        MAIL_PASS: process.env.MAIL_PASS,
                        MAIL_FROM: process.env.MAIL_FROM,
                        APP_NAME: process.env.APP_NAME
                    };

                    console.log("📧 Email environment check:", {
                        MAIL_HOST: env.MAIL_HOST ? 'SET' : 'NOT SET',
                        MAIL_PORT: env.MAIL_PORT ? 'SET' : 'NOT SET',
                        MAIL_USER: env.MAIL_USER ? 'SET' : 'NOT SET',
                        MAIL_PASS: env.MAIL_PASS ? 'SET' : 'NOT SET',
                        MAIL_FROM: env.MAIL_FROM ? 'SET' : 'NOT SET'
                    });

                    const emailResult = await send_purchase_confirmation_email(env, updatedTransaction);
                    if (emailResult.success) {
                        console.log("✅ Purchase confirmation email sent successfully to:", updatedTransaction.user_id.email);
                    } else {
                        console.log("⚠️ Failed to send purchase confirmation email:", emailResult.reason);
                    }
                } catch (emailError) {
                    console.error("❌ Error sending purchase confirmation email:", emailError);
                    // Don't fail the payment confirmation if email fails
                }
            } else {
                console.log("⚠️ Cannot send email: user_id is missing from transaction");
            }

            return res.json({
                success: true,
                transaction: updatedTransaction
            });
        } else {
            return res.status(400).json({
                success: false,
                error: `Payment status is ${paymentIntent.status}`
            });
        }

    } catch (error) {
        console.error("❌ Error confirming payment:", error);
        res.status(500).json({ error: error.message || 'Failed to confirm payment' });
    }
});

// ========================================
// OLD: STRIPE CHECKOUT SESSION (Redirect to Stripe)
// COMMENTED OUT - KEEPING FOR REFERENCE
// ========================================
/*
// OLD IMPLEMENTATION - This redirects to Stripe's hosted checkout page
router.post('/create-checkout-session-old', async (req, res) => {
    try {
        const { product, userId, cardCustomizationId } = req.body;
        console.log("Stripe checkout session request:", { product, userId, cardCustomizationId });
        
        // ... rest of the old checkout session code ...
        
        const session = await stripe.checkout.sessions.create({
            line_items: [...],
            mode: 'payment',
            success_url: `${WEB_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${WEB_URL}/cancel`,
            // ... rest of checkout session config ...
        });

        res.json({ 
            url: session.url,
            transactionId: savedTransaction._id,
            checkoutId: session.id
        });
    } catch (err) {
        console.error("❌ Error creating Stripe checkout session:", err);
        res.status(500).json({ error: err.message || 'Stripe error' });
    }
});
*/

// router.post('/webhook', RAW, async (req, res) => {
//     try {
//         const webhook_id = process.env.PAYPAL_WEBHOOK_ID; // from dashboard
//         const webhook_event = JSON.parse(req.body.toString('utf8'));
//
//         // 1) Verify signature
//         const token = await getAccessToken();
//         const verifyRes = await fetch(`${process.env.PAYPAL_MODE === 'live'
//             ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/notifications/verify-webhook-signature`, {
//             method: 'POST',
//             headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 auth_algo:        req.get('paypal-auth-algo'),
//                 cert_url:         req.get('paypal-cert-url'),
//                 transmission_id:  req.get('paypal-transmission-id'),
//                 transmission_sig: req.get('paypal-transmission-sig'),
//                 transmission_time:req.get('paypal-transmission-time'),
//                 webhook_id,
//                 webhook_event
//             })
//         }).then(r => r.json());
//
//         if (verifyRes?.verification_status !== 'SUCCESS') return res.sendStatus(400);
//
//         // 2) Idempotency: ignore duplicates
//         // Create a unique index on { paypal_capture_id: 1 } in your Transaction model if you can.
//
//         // 3) Handle events
//         const t = webhook_event.event_type;
//         if (t === 'PAYMENT.CAPTURE.COMPLETED') {
//             const cap = webhook_event.resource; // capture object
//             const orderId = cap?.supplementary_data?.related_ids?.order_id || null;
//
//             const doc = {
//                 status:            'COMPLETED',
//                 paypal_order_id:   orderId,
//                 paypal_capture_id: cap?.id,
//                 amount:            { value: cap?.amount?.value, currency: cap?.amount?.currency_code },
//                 breakdown: {
//                     paypal_fee: cap?.seller_receivable_breakdown?.paypal_fee?.value || null,
//                     net_amount: cap?.seller_receivable_breakdown?.net_amount?.value || null
//                 },
//                 capture_update_time: cap?.update_time
//             };
//
//             console.log("doc", doc)
//
//             // Upsert by capture id first, fallback to order id
//             const tx = await Transaction.findOneAndUpdate(
//                 { $or: [{ paypal_capture_id: cap?.id }, { paypal_order_id: orderId }] },
//                 { $set: doc },
//                 { upsert: false, new: true }
//             );
//
//             // If you created the row earlier with _id=custom_id, you can also try to link:
//             // await Transaction.findByIdAndUpdate(cap.custom_id, { $set: doc });
//
//             console.log('[WH] capture saved', cap?.id, orderId);
//             return res.sendStatus(200);
//         }
//
//         if (t === 'PAYMENT.CAPTURE.REFUNDED' || t === 'PAYMENT.CAPTURE.DENIED') {
//             const cap = webhook_event.resource;
//             await Transaction.findOneAndUpdate(
//                 { paypal_capture_id: cap?.id },
//                 { $set: { status: t.includes('REFUNDED') ? 'REFUNDED' : 'DENIED' } }
//             );
//             return res.sendStatus(200);
//         }
//
//         return res.sendStatus(200);
//     } catch (e) {
//         console.error('WH error', e);
//         return res.sendStatus(500);
//     }
// });

module.exports = router;
