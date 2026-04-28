const nodemailer = require('nodemailer');

// Reuse the same transport maker from email.js
const makeTransport = ({ MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS }) => {
    return nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number(MAIL_PORT),
        secure: Number(MAIL_PORT) === 465,
        requireTLS: Number(MAIL_PORT) === 587,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        },
        pool: true,
        maxConnections: 1,
        maxMessages: 100,
        rateLimit: 14,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
    });
};

// Send tracking ID email to customer
exports.send_tracking_email = async (env, transactionData) => {
    try {
        const transport = makeTransport(env);
        
        // Add retry logic for authentication errors
        let retries = 3;
        while (retries > 0) {
            try {
                await transport.verify();
                break;
            } catch (error) {
                if (error.code === 'EAUTH' && retries > 1) {
                    console.log(`📧 Auth error, retrying... (${retries - 1} attempts left)`);
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
                throw error;
            }
        }

        const { APP_NAME, MAIL_FROM } = env;
        const {
            user_id,
            title,
            delivery_address,
            suburb,
            state,
            postal_code,
            trackingId,
            orderId
        } = transactionData;

        const userName = user_id?.firstName || 'Customer';
        const userEmail = user_id?.email;

        if (!userEmail) {
            console.log('No email found for user');
            return { success: false, reason: "User email not found" };
        }

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- TRACKING EMAIL HEADER -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="background:#1A1D25;color:#fff;border-radius:10px 10px 0 0;">
              <tr>
                <!-- Left: Logo -->
                <td width="80" valign="middle" style="padding:16px;">
                  <img src="cid:company-logo" alt="Incardible Logo" width="60"
                       style="display:block;height:auto;border:0;outline:0;text-decoration:none;">
                </td>

                <!-- Center: Content -->
                <td align="center" valign="middle" style="padding:16px;text-align:center;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;">Your Order Has Shipped!</h1>
                  <p style="margin:4px 0 0;font-size:14px;line-height:1.4;opacity:.9;">
                    Track your package delivery
                  </p>
                </td>

                <!-- Right: Spacer -->
                <td width="80" valign="middle" style="padding:16px;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                    Hi <strong>${userName}</strong>,
                </p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 25px;">
                    Great news! Your order <strong>#${orderId}</strong> has been shipped and is on its way to you.
                </p>
                
                 <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                     <h3 style="color: #667eea; margin-top: 0; margin-bottom: 15px;">📋 Tracking Information</h3>
                     ${transactionData.shippingCompany ? `
                         <p style="color: #666; margin-bottom: 10px; font-size: 14px;"><strong>Shipping Company:</strong> ${transactionData.shippingCompany}</p>
                     ` : ''}
                     <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your Tracking ID:</p>
                     <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center;">
                         <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 1px; font-family: monospace;">
                             ${trackingId}
                         </p>
                     </div>
                 </div>
                
                 <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                     <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">📦 Order Details</h3>
                    ${transactionData.cardCustomizationId ? `
                        <div style="text-align: center; margin-bottom: 15px;">
                            <img src="cid:product-image" alt="${title}" style="max-width: 120px; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        </div>
                    ` : ''}
                     <p style="color: #666; margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
                     <p style="color: #666; margin: 5px 0;"><strong>Card Title:</strong> ${title || 'N/A'}</p>
                     <p style="color: #666; margin: 5px 0;"><strong>Quantity:</strong> ${transactionData.quantity || 1}</p>
                     <p style="color: #666; margin: 5px 0;"><strong>Delivery Address:</strong> ${delivery_address}, ${suburb}, ${state} ${postal_code}</p>
                 </div>
                
    
                
                <p style="font-size: 14px; color: #666; line-height: 1.6;">
                    Thank you for shopping with incardible! If you have any questions, please don't hesitate to contact us.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea; text-decoration: none;">Info@incardible.com.au</a>
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                        © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
        `;

        // Load the logo
        const path = require('path');
        const fs = require('fs');
        const attachments = [];

        try {
            // Use logo from backend public folder (same as other email functions)
            const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
            console.log('📧 Looking for logo at:', logoPath);
            
            if (fs.existsSync(logoPath)) {
                attachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'company-logo'
                });
                console.log('✅ Logo attached successfully');
            } else {
                console.log('❌ Logo not found at:', logoPath);
            }
        } catch (logoError) {
            console.log('Could not attach logo:', logoError.message);
        }

        // Add product image if available
        if (transactionData.cardCustomizationId) {
            try {
                const CardCustomization = require('../models/card_customization');
                const customization = await CardCustomization.findById(transactionData.cardCustomizationId).populate('cardId');
                
                if (customization && customization.cardId) {
                    // Use the first available template image or front design
                    const productImage = customization?.cardId?.frontDesign;
                    
                    if (productImage) {
                        const imagePath = path.join(__dirname, '..', 'public', productImage);
                        console.log('📧 Looking for product image at:', imagePath);
                        
                        if (fs.existsSync(imagePath)) {
                            attachments.push({
                                filename: 'product-image.png',
                                path: imagePath,
                                cid: 'product-image'
                            });
                            console.log('✅ Product image attached successfully');
                        } else {
                            console.log('❌ Product image not found at:', imagePath);
                        }
                    }
                }
            } catch (imageError) {
                console.log('Could not attach product image:', imageError.message);
            }
        }

        const info = await transport.sendMail({
            from: `"${APP_NAME}" <${MAIL_FROM}>`,
            to: userEmail,
            subject: '📦 Your Order Has Been Shipped - Tracking Information',
            html,
            attachments
        });

        console.log(`✅ Tracking email sent to ${userEmail}`);
        return { success: true, info };
        
    } catch (error) {
        console.error('❌ Error sending tracking email:', error.message);
        
        // Handle specific Gmail rate limiting
        if (error.code === 'EAUTH' && error.response && error.response.includes('Too many login attempts')) {
            console.error('📧 Gmail rate limit exceeded. Please wait before sending more emails.');
            return { 
                success: false, 
                reason: 'Rate limit exceeded', 
                error: 'Too many login attempts to Gmail. Please try again later.'
            };
        }
        
        return {
            success: false,
            reason: "Email send failed",
            error: error.message || error
        };
    }
};

