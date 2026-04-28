// PAYPAL INTEGRATION COMMENTED OUT - SWITCHING TO STRIPE
// const { Router } = require('express');
// const router = Router();
// const { getPaypalClient, paypal } = require('../../utils/paypal');
// const Transaction = require('../../models/transactionData');
// const CardCustomization = require('../../models/card_customization');
// const verify_token = require('../../middleware/auth');

// // Function to generate unique 4-digit order ID
// const generateUniqueOrderId = async () => {
//     let orderId;
//     let isUnique = false;
//     
//     while (!isUnique) {
//         // Generate a 4-digit number (1000-9999)
//         orderId = Math.floor(1000 + Math.random() * 9000).toString();
//         
//         // Check if this order ID already exists
//         const existingOrder = await Transaction.findOne({ orderId: orderId });
//         if (!existingOrder) {
//             isUnique = true;
//         }
//     }
//     
//     return orderId;
// };

// router.post('/create-order', verify_token, async (req, res) => {
//     try {
//         const { amount, currency = 'AUD', transactionId, meta, transactionData } = req.body || {};
//         const client = getPaypalClient();
//         
//         // Add user_id to transaction data
//         const userId = req.user.user_id;
//         console.log("📧 User ID from token:", userId);

//         const request = new paypal.orders.OrdersCreateRequest();
//         request.prefer("return=representation");
//         request.requestBody({
//             intent: 'CAPTURE',
//             purchase_units: [{
//                 amount: { currency_code: currency, value: String(Number(amount).toFixed(2)) },
//                 custom_id: transactionId || undefined,
//                 description: meta?.title
//             }],
//             application_context: {
//                 user_action: 'PAY_NOW',
//                 return_url: `${process.env.APP_URL}/paypal-return`,
//                 cancel_url: `${process.env.APP_URL}/checkout?cancel=1`
//             }
//         });

//         const order = await client.execute(request);

//         const approveUrl =
//             order.result.links?.find(l => l.rel === 'approve')?.href ||
//             `${process.env.PAYPAL_BASE_URL}/checkoutnow?token=${order.result.id}`;

//         // Create transaction in database when PayPal order is successfully created
//         let createdTransaction = null;
//         if (transactionData) {
//             // Generate unique order ID
//             const uniqueOrderId = await generateUniqueOrderId();
//             
//             // Create new transaction with PayPal order ID, user_id, and unique order ID
//             createdTransaction = await Transaction.create({
//                 ...transactionData,
//                 user_id: userId, // Add user_id from token
//                 paypal_order_id: order.result.id,
//                 orderId: uniqueOrderId, // Add unique 4-digit order ID
//                 status: 'PENDING' // Mark as pending until payment is completed
//             });
//             console.log("✅ Transaction created in database with PayPal order ID:", createdTransaction._id, "and Order ID:", uniqueOrderId);
//         } else if (transactionId) {
//             // Fallback: Update existing transaction with PayPal order ID
//             const uniqueOrderId = await generateUniqueOrderId();
//             createdTransaction = await Transaction.findByIdAndUpdate(transactionId, {
//                 paypal_order_id: order.result.id,
//                 orderId: uniqueOrderId,
//                 status: 'PENDING'
//             }, { new: true });
//         }

//         res.json({ 
//             id: order.result.id, 
//             approveUrl,
//             transactionId: createdTransaction?._id 
//         });
//     } catch (e) {
//         console.error('create-order error', e);
//         res.status(500).json({ error: 'Failed to create order' });
//     }
// });

// router.post('/capture/:orderId', async (req, res) => {
//     try {
//         const { orderId } = req.params;

//         const client  = getPaypalClient();
//         const request = new paypal.orders.OrdersCaptureRequest(orderId);
//         request.requestBody({});
//         const { result } = await client.execute(request);

//         const pu    = result?.purchase_units?.[0] || {};
//         const cap   = pu?.payments?.captures?.[0] || null;
//         const payer = result?.payer || null;
//         const customId = pu?.custom_id || null; // your Transaction _id set in create-order

//         // Build document to save on Transaction
//         const doc = {
//             status: result?.status || 'UNKNOWN',
//             paypal_order_id: orderId,
//             paypal_payer: payer,
//             paypal_capture_id: cap?.id || null,
//             amount: {
//                 value: cap?.amount?.value || pu?.amount?.value || null,
//                 currency: cap?.amount?.currency_code || pu?.amount?.currency_code || null
//             },
//             breakdown: {
//                 paypal_fee: cap?.seller_receivable_breakdown?.paypal_fee?.value ?? null,
//                 net_amount: cap?.seller_receivable_breakdown?.net_amount?.value ?? null
//             },
//             paid_at: cap?.update_time ? new Date(cap.update_time) : new Date(),
//             paypal_capture: result,
//             data: result
//         };

//         // Update transaction status based on payment completion
//         let tx;
//         const paymentCompleted = (cap?.status === 'COMPLETED') || (result?.status === 'COMPLETED');
        
//         if (customId) {
//             // Update existing transaction with payment details
//             tx = await Transaction.findByIdAndUpdate(customId, { 
//                 $set: { 
//                     ...doc,
//                     status: paymentCompleted ? 'COMPLETED' : 'PENDING'
//                 } 
//             }, { new: true });
            
//             if (paymentCompleted) {
//                 console.log("✅ Transaction updated to COMPLETED after successful payment:", tx._id);
//             } else {
//                 console.log("⚠️ Transaction updated with PENDING status. Payment status:", cap?.status || result?.status);
//             }
//         } else {
//             // Fallback: Find by PayPal order ID
//             tx = await Transaction.findOneAndUpdate(
//                 { paypal_order_id: orderId },
//                 { 
//                     $set: { 
//                         ...doc,
//                         status: paymentCompleted ? 'COMPLETED' : 'PENDING'
//                     } 
//                 },
//                 { new: true }
//             );
//         }

//         // Log transaction data for debugging
//         console.log("📧 Transaction data for email:", {
//             _id: tx?._id,
//             user_id: tx?.user_id,
//             title: tx?.title,
//             total: tx?.total,
//             cardCustomizationId: tx?.cardCustomizationId
//         });

//         // If payment actually completed, mark the linked customization as paid and send email
//         if (paymentCompleted && tx?.cardCustomizationId) {
//             await CardCustomization.updateOne(
//                 { _id: tx.cardCustomizationId },
//                 { $set: { isPaid: true } }
//             );
//             console.log("✅ Card customization marked as paid:", tx.cardCustomizationId);

//             // Send purchase confirmation email to buyer (only if we have user_id)
//             if (tx?.user_id) {
//                 try {
//                     console.log("📧 Attempting to send purchase confirmation email...");
//                     const { send_purchase_confirmation_email } = require('../../utils/email');
                    
//                     const env = {
//                         MAIL_HOST: process.env.MAIL_HOST,
//                         MAIL_PORT: process.env.MAIL_PORT,
//                         MAIL_USER: process.env.MAIL_USER,
//                         MAIL_PASS: process.env.MAIL_PASS,
//                         MAIL_FROM: process.env.MAIL_FROM,
//                         APP_NAME: process.env.APP_NAME
//                     };

//                     console.log("📧 Email environment variables:", {
//                         MAIL_HOST: env.MAIL_HOST ? 'SET' : 'NOT SET',
//                         MAIL_PORT: env.MAIL_PORT ? 'SET' : 'NOT SET',
//                         MAIL_USER: env.MAIL_USER ? 'SET' : 'NOT SET',
//                         MAIL_PASS: env.MAIL_PASS ? 'SET' : 'NOT SET',
//                         MAIL_FROM: env.MAIL_FROM ? 'SET' : 'NOT SET',
//                         APP_NAME: env.APP_NAME ? 'SET' : 'NOT SET'
//                     });

//                     const emailResult = await send_purchase_confirmation_email(env, tx);
//                     if (emailResult.success) {
//                         console.log("✅ Purchase confirmation email sent successfully");
//                     } else {
//                         console.log("⚠️ Failed to send purchase confirmation email:", emailResult.reason);
//                     }
//                 } catch (emailError) {
//                     console.error("❌ Error sending purchase confirmation email:", emailError);
//                 }
//             } else {
//                 console.log("⚠️ Cannot send email: user_id is missing from transaction");
//             }
//         }

//         return res.json({ 
//             status: paymentCompleted ? 'COMPLETED' : 'PENDING', 
//             transaction: tx, 
//             capture: result,
//             message: paymentCompleted ? "Payment completed successfully" : "Payment not completed"
//         });
//     } catch (e) {
//         const statusCode = e?.statusCode || 500;
//         let payload = { message: 'Failed to capture PayPal order' };
//         try {
//             const raw = e?._originalError?.text || e?.message;
//             const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
//             if (parsed) payload = { message: parsed?.message || payload.message, issue: parsed?.details?.[0]?.issue, paypal: parsed };
//         } catch {}
//         return res.status(statusCode).json(payload);
//     }
// });

// module.exports = router;