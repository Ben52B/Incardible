const nodemailer = require('nodemailer');

exports.send_email = async (MAIL_USER, MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_FROM, APP_NAME, email, code) => {
    try {
        const transport = makeTransport({
            MAIL_USER, MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_FROM, APP_NAME
        });
        
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
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    continue;
                }
                throw error;
            }
        }

        const html = `
        <style>
          @media only screen and (max-width: 480px) {
            .reset-code {
              font-size: 18px !important;
              letter-spacing: 1px !important;
              padding: 12px 20px !important;
            }
          }
        </style>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- PASSWORD RESET HEADER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#1A1D25;color:#fff;border-radius:10px 10px 0 0;">
  <tr>
    <!-- Left: Logo -->
    <td width="100" valign="middle" style="padding:20px;">
      <img src="cid:company-logo" alt="Incardible Logo" width="80"
           style="display:block;height:auto;border:0;outline:0;text-decoration:none;">
    </td>

    <!-- Center: Content -->
    <td align="center" valign="middle" style="padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:28px;line-height:1.2;">🔐 Password Reset Request</h1>
      <p style="margin:10px 0 0;font-size:16px;line-height:1.4;opacity:.9;">
        Secure your Incardible account with a new password
      </p>
    </td>

    <!-- Right: Spacer -->
    <td width="100" valign="middle" style="padding:20px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>

          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0; text-align: center;">🔑 Your Reset Code</h3>
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password for your Incardible account. Use the verification code below to complete the password reset process.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div class="reset-code" style="background: #1A1D25; color: white; padding: 15px 25px; border-radius: 10px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 2px; box-shadow: 0 4px 15px rgba(26, 29, 37, 0.3); max-width: 90%; word-wrap: break-word;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Enter this code in the password reset form to continue.
              </p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Security Notice</h3>
              <p style="margin: 0; color: #856404;">
                This verification code will expire in 10 minutes for security reasons. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>

    

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea; text-decoration: none;">Info@incardible.com.au</a>
              </p>
              <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
                This email was sent to ${email}. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      `;

        // Prepare attachments
        const attachments = [];
        
        // Add company logo from backend public folder
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Construct full path to logo in backend public folder
            const logoPath = path.join(__dirname, '../public/logo.png');
            if (fs.existsSync(logoPath)) {
                attachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'company-logo'
                });
            } else {
                console.log('Logo not found at:', logoPath);
            }
        } catch (logoError) {
            console.log('Could not attach logo:', logoError.message);
        }

        const info = await transport.sendMail({
            from: `"${APP_NAME}" <${MAIL_FROM}>`,
            to: email,
            subject: '🔐 Reset Your Incardible Password - Verification Code',
            html,
            attachments: attachments
        });

        console.log('✅ Reset password email sent successfully to:', email);
        return { success: true, info };

    } catch (error) {
        console.error("❌ Failed to send reset password email:", error);
        
        // Handle specific Gmail rate limiting
        if (error.code === 'EAUTH' && error.response && error.response.includes('Too many login attempts')) {
            console.error('📧 Gmail rate limit exceeded. Please wait before sending more emails.');
            return { 
                success: false, 
                reason: 'Rate limit exceeded', 
                error: 'Too many login attempts to Gmail. Please try again later.'
            };
        }

        // Check if it's a full inbox error
        if (
            error.responseCode === 452 &&
            error.response &&
            error.response.includes("4.2.2")
        ) {
            // Log or take action
            console.warn("Recipient inbox is full:", email);
            return {
                success: false,
                reason: "Recipient inbox is full"
            };
        }

        return {
            success: false,
            reason: "Email send failed",
            error: error.message || error
        };
    }
};

// Send account verification email
exports.send_verification_email = async (env, userEmail, verificationUrl) => {
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
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    continue;
                }
                throw error;
            }
        }

        const { APP_NAME, MAIL_FROM } = env;

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
   <!-- WELCOME HEADER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#1A1D25;color:#fff;border-radius:10px 10px 0 0;">
  <tr>
    <!-- Left: Logo -->
    <td width="100" valign="middle" style="padding:20px;">
      <img src="cid:company-logo" alt="Incardible Logo" width="80"
           style="display:block;height:auto;border:0;outline:0;text-decoration:none;">
    </td>

    <!-- Center: Content -->
    <td align="center" valign="middle" style="padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:28px;line-height:1.2;">🎉 Welcome to Incardible!</h1>
      <p style="margin:10px 0 0;font-size:16px;line-height:1.4;opacity:.9;">
        Verify your account to get started with amazing AR incardible cards
      </p>
    </td>

    <!-- Right: Spacer -->
    <td width="100" valign="middle" style="padding:20px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>

          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0; text-align: center;">🔐 Account Verification Required</h3>
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                Thank you for signing up with Incardible! To complete your registration and start creating amazing AR incardible cards, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #1A1D25; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(26, 29, 37, 0.3); transition: all 0.3s ease;">
                  ✅ Verify My Account
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>

            <div style="background: #e3f2fd; padding: 25px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 25px;">
              <h3 style="color: #1976d2; margin-top: 0;">🎨 What's Next?</h3>
              <p style="margin-bottom: 10px; color: #333;">Once verified, you'll be able to:</p>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Create personalized AR incardible cards</li>
                <li>Add custom messages and images</li>
                <li>Preview your cards in augmented reality</li>
                <li>Order physical copies of your designs</li>
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
              <h3 style="color: #856404; margin-top: 0;">⏰ Important Note</h3>
              <p style="margin: 0; color: #856404;">
                This verification link will expire in 24 hours for security reasons. If you don't verify your account within this time, you'll need to request a new verification email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea; text-decoration: none;">Info@incardible.com.au</a>
              </p>
              <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
                This email was sent to ${userEmail}. If you didn't create an account with Incardible, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      `;

        // Prepare attachments
        const attachments = [];
        
        // Add company logo from backend public folder
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Construct full path to logo in backend public folder
            const logoPath = path.join(__dirname, '../public/logo.png');
            if (fs.existsSync(logoPath)) {
                attachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'company-logo'
                });
            } else {
                console.log('Logo not found at:', logoPath);
            }
        } catch (logoError) {
            console.log('Could not attach logo:', logoError.message);
        }

        const info = await transport.sendMail({
            from: `"${APP_NAME}" <${MAIL_FROM}>`,
            to: userEmail,
            subject: '🎉 Welcome to Incardible - Verify Your Account',
            html,
            attachments: attachments
        });

        console.log('✅ Verification email sent successfully to:', userEmail);
        return { success: true, info };
    } catch (error) {
        console.error('❌ Error sending verification email:', error.message);
        
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
            reason: 'Email send failed', 
            error: error.message || error 
        };
    }
};

// Create a single transport instance to avoid multiple connections
let transportInstance = null;

const makeTransport = ({ MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS }) => {
    if (!transportInstance) {
        transportInstance = nodemailer.createTransport({
            host: MAIL_HOST,
            port: Number(MAIL_PORT),
            secure: Number(MAIL_PORT) === 465,
            requireTLS: Number(MAIL_PORT) === 587,
            auth: {
                user: process.env.MAIL_USER,   // info@incardible.com.au
                pass: process.env.MAIL_PASS
            },
            pool: true, // Use connection pooling
            maxConnections: 1, // Limit connections
            maxMessages: 100, // Messages per connection
            rateLimit: 14, // Max 14 emails per second
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
        });
    }
    return transportInstance;
};

exports.send_contact_email = async (env, payload) => {
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
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    continue;
                }
                throw error;
            }
        }

    const { APP_NAME, MAIL_FROM, MAIL_USER } = env; // MAIL_USER = admin inbox
    const { name, email, phoneNumber, message } = payload;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<!-- HEADER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#1A1D25;color:#fff;border-radius:10px 10px 0 0;">
  <tr>
    <!-- Left: Logo -->
    <td width="80" valign="middle" style="padding:16px;">
      <img src="cid:company-logo" alt="Incardible Logo" width="60"
           style="display:block;height:auto;border:0;outline:0;text-decoration:none;">
    </td>

    <!-- Center: Content (truly centered) -->
    <td align="center" valign="middle" style="padding:16px;text-align:center;">
      <h1 style="margin:0;font-size:22px;line-height:1.3;">📩 New Contact Request</h1>
      <p style="margin:4px 0 0;font-size:14px;line-height:1.4;opacity:.9;">
        Someone wants to get in touch with you
      </p>
    </td>

    <!-- Right: Ghost spacer equal to logo width -->
    <td width="80" valign="middle" style="padding:16px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>





      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-top: 0;">👤 Contact Information</h3>
          <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> <span style="color: #333;">${name}</span></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> <span style="color: #333;">${phoneNumber || 'Not provided'}</span></p>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-top: 0;">💬 Message</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; white-space: pre-wrap; color: #333; line-height: 1.6;">${message}</div>
        </div>

        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px;">
          <h3 style="color: #1976d2; margin-top: 0;">⚡ Quick Actions</h3>
          <p style="margin-bottom: 10px; color: #333;">You can respond directly to this email or use the contact information above.</p>
          <p style="margin: 0;">
            <a href="mailto:${email}" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">📧 Reply Now</a>
  
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 14px; margin: 0;">
            This contact request was sent through your Incardible website.<br>
            Respond promptly to provide excellent customer service.
          </p>
          <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
            Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea; text-decoration: none;">Info@incardible.com.au</a>
          </p>
        </div>
      </div>
    </div>
  `;

        // Prepare attachments
        const attachments = [];
        
        // Add company logo from backend public folder
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Construct full path to logo in backend public folder
            const logoPath = path.join(__dirname, '../public/logo.png');
            if (fs.existsSync(logoPath)) {
                attachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'company-logo'
                });
            } else {
                console.log('Logo not found at:', logoPath);
            }
        } catch (logoError) {
            console.log('Could not attach logo:', logoError.message);
        }

        const info = await transport.sendMail({
            from: `"${APP_NAME}" <${MAIL_FROM}>`, // must be the same licensed mailbox
            to: MAIL_USER,                        // ✅ send to admin
            replyTo: email,                       // replies go to user
            subject: `📩 New Contact — ${name}`,
            html,
            attachments: attachments
        });

        console.log('✅ Contact email sent successfully');
        return { success: true, info };
    } catch (error) {
        console.error('❌ Error sending contact email:', error.message);
        
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
            reason: 'Email send failed', 
            error: error.message || error 
        };
    }
};

// Send purchase confirmation email to buyer
exports.send_purchase_confirmation_email = async (env, transactionData) => {
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
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    continue;
                }
                throw error;
            }
        }

        const { APP_NAME, MAIL_FROM } = env;
        const {
            user_id,
            title,
            quantity,
            total,
            delivery_address,
            suburb,
            state,
            postal_code,
            phone_number,
            paypal_order_id,
            checkout_id,
            payment_intent,
            paid_at,
            cardCustomizationId,
            shippingDays,
            orderId
        } = transactionData;

        // Get user email from user_id
        const User = require('../models/user');
        const user = await User.findById(user_id);

        if (!user) {
            console.log('User not found for transaction:', user_id);
            return { success: false, reason: "User not found" };
        }

        // Get card customization data for product image
        const CardCustomization = require('../models/card_customization');
        const Card = require('../models/card');
        
        let productImage = null;
        let cardData = null;
        
        if (cardCustomizationId) {
            const customization = await CardCustomization.findById(cardCustomizationId).populate('cardId');
            if (customization && customization.cardId) {
                cardData = customization.cardId;
                // Use the first available template image or front design
                productImage = cardData.frontDesign;
                
                console.log('📧 Product image found:', productImage);
            } else {
                console.log('📧 No customization or card data found for:', cardCustomizationId);
            }
        } else {
            console.log('📧 No cardCustomizationId provided');
        }

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
            
            <!-- PURCHASE CONFIRM HEADER -->
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
      <h1 style="margin:0;font-size:22px;line-height:1.3;">🎉 Purchase Confirmed!</h1>
      <p style="margin:4px 0 0;font-size:14px;line-height:1.4;opacity:.9;">
        Thank you for your order
      </p>
    </td>

    <!-- Right: Spacer -->
    <td width="80" valign="middle" style="padding:16px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <h2 style="color: #333; margin-top: 0;">Order Details</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="color: #667eea; margin-top: 0;">📦 Product Information</h3>
                    ${productImage ? `
                        <div style="text-align: center; margin-bottom: 15px;">
                            <img src="cid:product-image" alt="${title}" style="max-width: 150px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        </div>
                    ` : ''}
                    <p><strong>Card Title:</strong> ${title}</p>
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <p><strong>Total Amount:</strong> <span style="color: #28a745; font-weight: bold;">${total}$ </span></p>
                </div>

                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="color: #667eea; margin-top: 0;">🏠 Delivery Address</h3>
                    <p><strong>Address:</strong> ${delivery_address}</p>
                    <p><strong>Suburb:</strong> ${suburb}</p>
                    <p><strong>State:</strong> ${state}</p>
                    <p><strong>Postal Code:</strong> ${postal_code}</p>
                    <p><strong>Phone:</strong> ${phone_number}</p>
                </div>

                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="color: #667eea; margin-top: 0;">💳 Payment Information</h3>
                    <p><strong>Order ID:</strong> <span style="color: #e91e63; font-weight: bold; font-size: 18px;">#${orderId}</span></p>
                    <p><strong>Payment Method:</strong> Stripe</p>
                    <p><strong>Checkout ID:</strong> ${checkout_id || 'N/A'}</p>
                    <p><strong>Payment Intent:</strong> ${payment_intent || 'N/A'}</p>
                    <p><strong>Payment Date:</strong> ${new Date(paid_at).toLocaleDateString('en-AU', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Completed</span></p>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <h3 style="color: #1976d2; margin-top: 0;">📋 What's Next?</h3>
                    <p style="margin-bottom: 10px;">Your order has been successfully processed and payment confirmed.</p>
                    <p style="margin-bottom: 10px;">We'll start preparing your Incardible card and it will be ready for shipping whithin 24 hours.</p>
            
                    <p style="margin: 0;">If you have any questions, please don't hesitate to contact our support team at <a href="mailto:Info@incardible.com.au" style="color: #1976d2; text-decoration: none; font-weight: bold;">Info@incardible.com.au</a></p>
                </div>

                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        Thank you for choosing Incardible!<br>
                        We appreciate your business and look forward to creating something special for you.
                    </p>
                    <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
                        Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea; text-decoration: none;">Info@incardible.com.au</a>
                    </p>
                </div>
            </div>
        </div>
        `;

        // Prepare attachments
        const attachments = [];
        
        // Add company logo from backend public folder
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Construct full path to logo in backend public folder
            const logoPath = path.join(__dirname, '../public/logo.png');
            if (fs.existsSync(logoPath)) {
                attachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'company-logo'
                });
            } else {
                console.log('Logo not found at:', logoPath);
            }
        } catch (logoError) {
            console.log('Could not attach logo:', logoError.message);
        }
        
        // Add product image if available
        if (productImage) {
            try {
                const fs = require('fs');
                const path = require('path');
                
                // Construct full path to product image
                const imagePath = path.join(__dirname, '../public', productImage);
                if (fs.existsSync(imagePath)) {
                    attachments.push({
                        filename: 'product-image.png',
                        path: imagePath,
                        cid: 'product-image'
                    });
                } else {
                    console.log('Product image not found at:', imagePath);
                }
            } catch (imageError) {
                console.log('Could not attach product image:', imageError.message);
            }
        }

        console.log('📧 Sending email with attachments:', attachments.length, 'files');
        console.log('📧 Attachment details:', attachments.map(att => ({ filename: att.filename, cid: att.cid })));

        const info = await transport.sendMail({
            from: `"Incardible" <${MAIL_FROM}>`,
            to: user.email,
            subject: `🎉 Order Confirmation - ${title} | Incardible`,
            html,
            attachments: attachments
        });

        console.log('✅ Purchase confirmation email sent to:', user.email);
        return { success: true, info };

    } catch (error) {
        console.error("❌ Failed to send purchase confirmation email:", error);
        
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