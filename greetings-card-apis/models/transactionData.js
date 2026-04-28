const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    cardCustomizationId: {type: mongoose.Schema.Types.ObjectId, ref: 'card-customization'},
    delivery_address: {type: String},
    suburb: {type: String},
    state: {type: String},
    postal_code: {type: String},
    phone_number: {type: String},
    quantity: {type: Number},
    price: {type: Number},
    aud: {type: Number},
    gst:{type: Number},
    shipping: {type: Number},
    total_before_discount: {type: Number}, // NEW: Original total before discount applied
    total: {type: Number}, // Final total after discount (what user pays)
    newsAndOffers: {type: Boolean, default: false},
    // shippingMethod: {type: String},
    // shippingRate: {type: Number, default:0},
    expressShipping: {type: Boolean, default: false},
    expressShippingRate: {type: Number, default:0},
    // shippingDays: {
    //     type: {
    //         inVictoria: {type: String, default: "3-5 business days"},
    //         interstate: {type: String, default: "4-7 business days"}
    //     },
    //     default: {
    //         inVictoria: "3-5 business days",
    //         interstate: "4-7 business days"
    //     }
    // }, 
    status: {type: String, default: null},
    title: {type: String},
    // PayPal fields (commented out - switching to Stripe)
    // paypal_order_id: {type: String , default:null},
    
    // Stripe fields
    checkout_id: {type: String, default: null}, // Stripe checkout session ID
    payment_intent: {type: String, default: null}, // Stripe payment intent ID
    
    // Coupon fields
    coupon_code: {type: String, default: null}, // Applied coupon code
    discount_price: {type: Number, default: 0}, // Discount amount applied
    
    // data: { type: mongoose.Schema.Types.Mixed , default:null },
    paid_at: { type: Date  , default:null},
    isShipped: {type: Boolean, default: false},
    shippingStatus: {type: String, enum: ['processing', 'in_shipping', 'shipped'], default: 'processing'},
    inShippingDate: {type: Date, default: null},
    shippedDate: {type: Date, default: null},
    trackingId: {type: String, default: null},
    shippingCompany: {type: String, default: null},
    orderId: {type: String, unique: true, required: true}
}, {timestamps: true});

module.exports = mongoose.model('transaction_data', transactionSchema);