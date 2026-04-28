
const TransactionData = require('../../models/transactionData');
const {success_response, error_response} = require('../../utils/response');
const cardCustomization = require('../../models/card_customization');
const User = require('../../models/user');
const { send_tracking_email } = require('../../utils/email_tracking');

// Function to generate unique 4-digit order ID
const generateUniqueOrderId = async () => {
    let orderId;
    let isUnique = false;
    
    while (!isUnique) {
        // Generate a 4-digit number (1000-9999)
        orderId = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Check if this order ID already exists
        const existingOrder = await TransactionData.findOne({ orderId: orderId });
        if (!existingOrder) {
            isUnique = true;
        }
    }
    
    return orderId;
};

exports.create_transaction = async (req, res) => {
    try {
        const {
            cardCustomizationId,
            delivery_address,
            suburb,
            aud,
            price,
            state,
            title,
            postal_code,
            phone_number,
            quantity,
            newsAndOffers,
            expressShipping, expressShippingRate, shipping, total, gst,
            shippingDays // Shipping days object with inVictoria and interstate information
        } = req.body;

        if (!(cardCustomizationId && delivery_address && suburb && aud && price && state && title && postal_code && phone_number && quantity )) {
            return error_response(res, 400, "All inputs are required!");
        }

        const userId = req.user.user_id;

        // Don't create transaction yet - just return the data for PayPal order creation
        // Transaction will be created only when PayPal order is successfully created
        const transactionData = {
            user_id: userId,
            cardCustomizationId,
            delivery_address,
            suburb,
            aud,
            price,
            state,
            title,
            postal_code,
            phone_number,
            quantity, newsAndOffers,
            // shippingMethod, shippingRate,
            expressShipping,expressShippingRate, shipping,
            total, gst,
            shippingDays
        };

        console.log("Transaction data prepared for PayPal payment", transactionData)

        return success_response(res, 200, "Transaction data prepared for payment", transactionData);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }

};

exports.get_all_transaction = async (req, res) => {
    try {
        const transactions = await TransactionData.find()
            .populate({
                path: 'cardCustomizationId', populate: [{
                    path: 'cardId', model: 'card'
                }, {
                    path: 'userId', model: 'user'
                }]
            })
            .sort({createdAt: -1})
            .exec();

        return success_response(res, 200, "All transactions fetched successfully", transactions);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.get_Single_CardCustomization = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id) {
            return error_response(res, 400, "Id is required!");
        }

        const userCardCustomizationDetails = await cardCustomization.findOne({_id: id}).populate('cardId');

        return success_response(res, 200, "User card customization detail  fetched successfully", userCardCustomizationDetails);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.update_shipping_status = async (req, res) => {
    try {
        const {id} = req.params;
        const {isShipped} = req.body;

        if (!id) {
            return error_response(res, 400, "Transaction ID is required!");
        }

        if (typeof isShipped !== 'boolean') {
            return error_response(res, 400, "isShipped must be a boolean value!");
        }

        const transaction = await TransactionData.findByIdAndUpdate(
            id,
            {isShipped: isShipped},
            {new: true}
        );

        if (!transaction) {
            return error_response(res, 404, "Transaction not found!");
        }

        return success_response(res, 200, "Shipping status updated successfully", transaction);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.update_shipping_status_new = async (req, res) => {
    try {
        const {id} = req.params;
        const {shippingStatus, trackingId, shippingCompany} = req.body;

        if (!id) {
            return error_response(res, 400, "Transaction ID is required!");
        }

        if (!shippingStatus || !['processing', 'in_shipping', 'shipped'].includes(shippingStatus)) {
            return error_response(res, 400, "Valid shipping status is required!");
        }

        const updateData = { shippingStatus };
        
        // Set appropriate date based on status
        if (shippingStatus === 'in_shipping') {
            updateData.inShippingDate = new Date();
        } else if (shippingStatus === 'shipped') {
            updateData.shippedDate = new Date();
            updateData.isShipped = true;
        }

        // Add tracking ID if provided (optional)
        if (trackingId && trackingId.trim() !== '') {
            updateData.trackingId = trackingId.trim();
        }

        // Add shipping company if provided (optional)
        if (shippingCompany && shippingCompany.trim() !== '') {
            updateData.shippingCompany = shippingCompany.trim();
        }

        const transaction = await TransactionData.findByIdAndUpdate(
            id,
            updateData,
            {new: true}
        );

        if (!transaction) {
            return error_response(res, 404, "Transaction not found!");
        }

        return success_response(res, 200, "Shipping status updated successfully", transaction);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.get_user_news_and_offers_preference = async (req, res) => {
    try {
        const userId = req.user.user_id;

        if (!userId) {
            return error_response(res, 400, "User ID is required!");
        }

        // Find the most recent transaction for this user to get their newsAndOffers preference
        const lastTransaction = await TransactionData.findOne({ user_id: userId })
            .sort({ createdAt: -1 })
            .select('newsAndOffers');

        // If user has no previous transactions, return default false
        const newsAndOffersPreference = lastTransaction ? lastTransaction.newsAndOffers : false;

        return success_response(res, 200, "User news and offers preference fetched successfully", {
            newsAndOffers: newsAndOffersPreference,
            hasPreviousTransactions: !!lastTransaction
        });
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// exports.getUserCardCustomizationForCheckout = async (req, res) => {
//     try {
//         const {id} = req.params;
//         console.log("id", id)
//
//         if (!id) {
//             return error_response(res, 400, "Id is required!");
//         }
//
//     } catch (error) {
//         console.log("error", error)
//         return error_response(res, 500, error.message);
//     }
// }

// exports.approved_status = async (req, res) => {
//     try {
//         const {id} = req.params;
//
//         const transaction = await Transaction.findOne({_id: id});
//         if (transaction) {
//             transaction.approved = true;
//             await transaction.save();
//         }
//
//         // Assuming you also want to update the associated game customization
//         const gameCustomization = await Game_Customization.findOne({
//             userId: transaction.userId,
//             gameId: transaction.gameId
//         });
//
//         if (gameCustomization) {
//             gameCustomization.isPaid = true; // Set the isPaid status based on the approved status
//             await gameCustomization.save();
//         }
//
//         const user = await User.findOne({_id: transaction.userId});
//         const {MAIL_USER, MAIL_HOST, MAIL_PASS, MAIL_PORT, APP_URL, MAIL_FROM, APP_NAME} = process.env;
//
//         let transport = nodemailer.createTransport({
//             host: MAIL_HOST,
//             port: MAIL_PORT,
//             auth: {
//                 user: MAIL_USER,
//                 pass: MAIL_PASS
//             }
//         });
//         const mailOptions = {
//             from: `"${APP_NAME}" <${MAIL_FROM}>`,
//             to: user.email,
//             subject: 'Transaction Approval',
//             html: "Your transaction is approved , your game is public now."
//         };
//
//
//         transport.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.error('Error:', error);
//             } else {
//                 console.log('Email sent:', info.response);
//             }
//         });
//
//         return success_response(res, 200, "Approved status set successfully", {transaction, email: user.email});
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

// Add tracking ID and send email notification to user
exports.add_tracking_id = async (req, res) => {
    try {
        const { id } = req.params;
        const { trackingId, shippingCompany, shippingStatus } = req.body;

        if (!id) {
            return error_response(res, 400, "Transaction ID is required!");
        }

        if (!trackingId || trackingId.trim() === '') {
            return error_response(res, 400, "Tracking ID is required!");
        }

        // Determine shipping status (default to 'shipped' if not provided)
        const status = shippingStatus || 'shipped';

        // Find and update the transaction with tracking ID and shipping company
        const updateData = { 
            trackingId: trackingId.trim(),
            shippingStatus: status
        };

        // Set appropriate date and isShipped flag based on status
        if (status === 'in_shipping') {
            updateData.inShippingDate = new Date();
        } else if (status === 'shipped') {
            updateData.shippedDate = new Date();
            updateData.isShipped = true;
        }

        // Add shipping company if provided (optional)
        if (shippingCompany && shippingCompany.trim() !== '') {
            updateData.shippingCompany = shippingCompany.trim();
        }

        const transaction = await TransactionData.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate({
            path: 'user_id',
            select: 'email firstName lastName'
        });

        if (!transaction) {
            return error_response(res, 404, "Transaction not found!");
        }

        // Send email to user with tracking ID
        try {
            const { MAIL_USER, MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_FROM, APP_NAME } = process.env;
            const env = { MAIL_USER, MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_FROM, APP_NAME };
            
            const emailResult = await send_tracking_email(env, transaction);
            
            if (!emailResult.success) {
                console.error('❌ Email sending failed:', emailResult.reason || emailResult.error);
            }
        } catch (emailError) {
            console.error('❌ Error sending tracking email:', emailError);
            // Don't fail the request if email fails
        }

        return success_response(res, 200, "Tracking ID added and email sent successfully", transaction);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.delete_transaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return error_response(res, 400, "Transaction ID is required!");
        }

        const deletedTransaction = await TransactionData.findByIdAndDelete(id);

        if (!deletedTransaction) {
            return error_response(res, 404, "Transaction not found!");
        }

        return success_response(res, 200, "Transaction deleted successfully", deletedTransaction);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

