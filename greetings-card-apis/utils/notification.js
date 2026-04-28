const cron = require('node-cron');
const cardCustomization = require('../models/card_customization');
const nodemailer = require('nodemailer');
const dayjs = require('dayjs'); // For easy date handling
const {MAIL_FROM, MAIL_PASS, APP_NAME, MAIL_HOST, MAIL_PORT, MAIL_USER} = process.env;

// Create email transporter
const transport = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: false,
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS
    }
});
// daysjs is used to compare 2 dates and also check cuurent date and calculate how anu days left to the specific date
const sendNotificationToUserToCompleteCard = async () => {
    try {
        const users = await cardCustomization.find({ "arTemplateData.isCustomizationComplete": false });

        for (const user of users) {
            const createdDate = dayjs(user.createdAt);
            console.log("createdDate", createdDate)
            const now = dayjs();
            console.log("now", now)
            const diffInDays = now.diff(createdDate, 'day');
            console.log("diffInDays", diffInDays)

            const daysLeft = 7 - diffInDays;
            console.log("daysLeft", daysLeft)

            if (diffInDays === 1  || diffInDays === 3 || diffInDays === 6) {
                // Create styled HTML email
                const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- REMINDER HEADER -->
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
                          <h1 style="margin:0;font-size:22px;line-height:1.3;">⏰ Reminder: Complete Your Card</h1>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.4;opacity:.9;">
                            Don't let your customisation expire
                          </p>
                        </td>

                        <!-- Right: Spacer -->
                        <td width="80" valign="middle" style="padding:16px;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h2 style="color: #667eea; margin-top: 0; font-size: 24px;">
                                🎨 Complete Your AR Card Customisation
                            </h2>
                            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                                Hi there! We noticed you started customizing your AR greeting card but haven't finished yet.
                            </p>
                            
                            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                                <h3 style="color: #856404; margin-top: 0;">⏰ Time Remaining</h3>
                                <p style="margin: 0; color: #856404; font-size: 18px; font-weight: bold;">
                                    You have <span style="color: #dc3545; font-size: 24px;">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</span> left to complete your card customisation before it expires.
                                </p>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.APP_URL || 'http://localhost:3000'}/card-editor/${user._id}" 
                                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;">
                                    🎨 Complete My Card
                                </a>
                            </div>
                        </div>

                        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px;">
                            <h3 style="color: #1976d2; margin-top: 0;">✨ What You Can Do</h3>
                            <ul style="color: #333; margin: 0; padding-left: 20px;">
                                <li>Add your personal message and images</li>
                                <li>Customize colors and fonts</li>
                                <li>Preview your card in augmented reality</li>
                                <li>Order physical copies when ready</li>
                            </ul>
                        </div>

                        <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                            <h3 style="color: #155724; margin-top: 0;">💡 Need Help?</h3>
                            <p style="margin-bottom: 10px; color: #155724;">If you're having trouble with the customisation process, we're here to help!</p>
                            <p style="margin: 0;">
                                <a href="mailto:Info@incardible.com.au" style="color: #1976d2; text-decoration: none; font-weight: bold;">📧 Contact Support</a>
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                Don't miss out on creating something special!<br>
                                Complete your card customisation today.
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
                    console.log('🔍 Reminder email - __dirname:', __dirname);
                    console.log('🔍 Reminder email - logoPath:', logoPath);
                    console.log('🔍 Reminder email - logo exists:', fs.existsSync(logoPath));
                    
                    if (fs.existsSync(logoPath)) {
                        attachments.push({
                            filename: 'logo.png',
                            path: logoPath,
                            cid: 'company-logo'
                        });
                        console.log('✅ Reminder email - Logo attachment added successfully');
                    } else {
                        console.log('❌ Reminder email - Logo not found at:', logoPath);
                    }
                } catch (logoError) {
                    console.log('❌ Reminder email - Could not attach logo:', logoError.message);
                }

                const mailOptions = {
                    from: `"${APP_NAME}" <${MAIL_FROM}>`,
                    to: user.email,
                    subject: `⏰ Reminder: Complete Your Card Customisation (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`,
                    html,
                    attachments: attachments
                };

                await transport.sendMail(mailOptions);
                console.log(`✅ Styled reminder (Day ${diffInDays}) sent to ${user.email}`);
             }

            if (diffInDays > 7) {
                await cardCustomization.findByIdAndDelete(user._id);
                console.log(`Deleted user ${user._id} due to expiration`);
            }
        }
    } catch (error) {
        console.error('Error during daily user card reminder check:', error);
    }
};

// const sendNotificationToUserToCompleteCard = async () => {
//     try {
//         const users = await cardCustomization.find({ "arTemplateData.isCustomizationComplete": false });
//
//         for (const user of users) {
//             const createdDate = dayjs(user.createdAt);
//             const now = dayjs();
//             const diffInDays = now.diff(createdDate, 'day');
//
//             if (diffInDays < 30) {
//                 const daysLeft = 30 - diffInDays;
//
//                 // Send reminder email
//                 const mailOptions = {
//                     from: `"${APP_NAME}" <${MAIL_FROM}>`,
//                     to: user.email, // Make sure this field exists in your schema
//                     subject: 'Complete Your Card Customization',
//                     text: `You have ${daysLeft} day(s) left to complete your card customization before it expires.`,
//                 };
//
//                 await transport.sendMail(mailOptions);
//                 console.log(`Reminder sent to ${user.email}`);
//             } else {
//                 // Delete user from DB
//                 await cardCustomization.findByIdAndDelete(user._id);
//                 console.log(`Deleted user ${user._id} due to expiration`);
//             }
//         }
//     } catch (error) {
//         console.error('Error during daily user card reminder check:', error);
//     }
// };

// Run the job daily at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily card customization check...');
    await sendNotificationToUserToCompleteCard();
});



// const nodemailer = require("nodemailer");
//
// async function sendEmail() {
//     let transporter = nodemailer.createTransport({
//         host: "smtp.office365.com",
//         port: 587,
//         secure: false, // use TLS
//         auth: {
//             user: "info@incardible.com.au",  // your email
//             pass: "YOUR_PASSWORD_HERE",      // your password or app password
//         },
//     });
//
//     let info = await transporter.sendMail({
//         from: '"Incardible" <info@incardible.com.au>',
//         to: "test@example.com",
//         subject: "Test Email",
//         text: "This is a test email sent from Node.js using Microsoft 365 SMTP.",
//     });
//
//     console.log("Message sent: %s", info.messageId);
// }
//
// sendEmail().catch(console.error);