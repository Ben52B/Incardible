const User = require('../../models/user');
const TransactionData = require('../../models/transactionData');

exports.unsubscribeNewsAndOffers = async (req, res) => {
    try {
        const email = req.query.email || req.body.email;
        const isApiCall = req.body.email && req.method === 'POST'; // Check if it's an API call from toggle
        
        if (!email) {
            if (isApiCall) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Unsubscribe - Incardible</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            background: #f8f9fa; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            margin: 0;
                            padding: 20px;
                        }
                        .container { 
                            background: white; 
                            padding: 40px; 
                            border-radius: 10px; 
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                            max-width: 500px;
                            text-align: center;
                        }
                        .icon { 
                            font-size: 60px; 
                            margin-bottom: 20px; 
                        }
                        h1 { 
                            color: #dc3545; 
                            margin-bottom: 20px; 
                        }
                        p { 
                            color: #666; 
                            line-height: 1.6; 
                        }
                        .button { 
                            display: inline-block; 
                            background: #1A1D25; 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin-top: 20px; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">⚠️</div>
                        <h1>Invalid Request</h1>
                        <p>Email address is required to unsubscribe.</p>
                        <a href="${process.env.APP_URL}" class="button">Go to Homepage</a>
                    </div>
                </body>
                </html>
            `);
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            if (isApiCall) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Unsubscribe - Incardible</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            background: #f8f9fa; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            margin: 0;
                            padding: 20px;
                        }
                        .container { 
                            background: white; 
                            padding: 40px; 
                            border-radius: 10px; 
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                            max-width: 500px;
                            text-align: center;
                        }
                        .icon { 
                            font-size: 60px; 
                            margin-bottom: 20px; 
                        }
                        h1 { 
                            color: #dc3545; 
                            margin-bottom: 20px; 
                        }
                        p { 
                            color: #666; 
                            line-height: 1.6; 
                        }
                        .button { 
                            display: inline-block; 
                            background: #1A1D25; 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin-top: 20px; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">❌</div>
                        <h1>User Not Found</h1>
                        <p>We couldn't find an account with the email: <strong>${email}</strong></p>
                        <a href="${process.env.APP_URL}" class="button">Go to Homepage</a>
                    </div>
                </body>
                </html>
            `);
        }

        const transactions = await TransactionData.find({
            user_id: user._id,
            newsAndOffers: true
        });

        if (transactions.length === 0) {
            if (isApiCall) {
                return res.status(200).json({
                    success: true,
                    message: 'You are already unsubscribed from news and offers',
                    data: {
                        alreadyUnsubscribed: true
                    }
                });
            }
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Already Unsubscribed - Incardible</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            background: #f8f9fa; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            margin: 0;
                            padding: 20px;
                        }
                        .container { 
                            background: white; 
                            padding: 40px; 
                            border-radius: 10px; 
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                            max-width: 500px;
                            text-align: center;
                        }
                        .icon { 
                            font-size: 60px; 
                            margin-bottom: 20px; 
                        }
                        h1 { 
                            color: #6c757d; 
                            margin-bottom: 20px; 
                        }
                        p { 
                            color: #666; 
                            line-height: 1.6; 
                        }
                        .info-box {
                            background: #fff3cd;
                            border: 1px solid #ffc107;
                            color: #856404;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .toggle-disabled {
                            display: inline-block;
                            background: #ccc;
                            border-radius: 15px;
                            width: 50px;
                            height: 26px;
                            position: relative;
                            opacity: 0.6;
                            cursor: not-allowed;
                            margin: 15px 0;
                        }
                        .toggle-circle {
                            width: 22px;
                            height: 22px;
                            background: white;
                            border-radius: 50%;
                            position: absolute;
                            left: 2px;
                            top: 2px;
                        }
                        .button { 
                            display: inline-block; 
                            background: #1A1D25; 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin-top: 20px; 
                        }
                        .contact {
                            font-size: 13px;
                            color: #999;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #eee;
                        }
                        .contact a {
                            color: #667eea;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">ℹ️</div>
                        <h1>Already Unsubscribed</h1>
                    
                        <p>You have already unsubscribed from news and offers emails.</p>
                   
                        <div class="contact">
                            Need help? Contact us at <a href="mailto:Info@incardible.com.au">Info@incardible.com.au</a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }

        const updateResult = await TransactionData.updateMany(
            { user_id: user._id, newsAndOffers: true },
            { $set: { newsAndOffers: false } }
        );

        console.log(`✅ Unsubscribed user ${email} from news and offers. Updated ${updateResult.modifiedCount} transactions`);

        if (isApiCall) {
            return res.status(200).json({
                success: true,
                message: 'Successfully unsubscribed from news and offers',
                data: {
                    transactionsUpdated: updateResult.modifiedCount,
                    email: email
                }
            });
        }

        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Unsubscribed Successfully - Incardible</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #f8f9fa; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        margin: 0;
                        padding: 20px;
                    }
                    .container { 
                        background: white; 
                        padding: 40px; 
                        border-radius: 10px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                        max-width: 500px;
                        text-align: center;
                    }
                    .icon { 
                        font-size: 60px; 
                        margin-bottom: 20px; 
                    }
                    h1 { 
                        color: #28a745; 
                        margin-bottom: 20px; 
                    }
                    p { 
                        color: #666; 
                        line-height: 1.6; 
                    }
                    .success-box {
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .button { 
                        display: inline-block; 
                        background: #1A1D25; 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        margin-top: 20px; 
                    }
                    .contact {
                        font-size: 13px;
                        color: #999;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }
                    .contact a {
                        color: #667eea;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">🔕</div>
                    <h1 style="color: #6c757d;">Unsubscribed Successfully</h1>
                
                    <p>You will no longer receive promotional emails, news, and special offers from Incardible.</p>
                 
                    <div class="contact">
                        Need help? Contact us at <a href="mailto:Info@incardible.com.au">Info@incardible.com.au</a>
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ Error unsubscribing user:', error);
        const isApiCall = req.body.email && req.method === 'POST';
        
        if (isApiCall) {
            return res.status(500).json({
                success: false,
                message: 'Failed to unsubscribe. Please try again later.'
            });
        }
        
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Error - Incardible</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #f8f9fa; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        margin: 0;
                        padding: 20px;
                    }
                    .container { 
                        background: white; 
                        padding: 40px; 
                        border-radius: 10px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                        max-width: 500px;
                        text-align: center;
                    }
                    .icon { 
                        font-size: 60px; 
                        margin-bottom: 20px; 
                    }
                    h1 { 
                        color: #dc3545; 
                        margin-bottom: 20px; 
                    }
                    p { 
                        color: #666; 
                        line-height: 1.6; 
                    }
                    .button { 
                        display: inline-block; 
                        background: #1A1D25; 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        margin-top: 20px; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">❌</div>
                    <h1>Oops! Something went wrong</h1>
                    <p>We encountered an error while processing your unsubscribe request. Please try again later.</p>
                    <a href="${process.env.APP_URL}" class="button">Go to Homepage</a>
                    <p style="font-size: 13px; color: #999; margin-top: 30px;">
                        Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea;">Info@incardible.com.au</a>
                    </p>
                </div>
            </body>
            </html>
        `);
    }
};

