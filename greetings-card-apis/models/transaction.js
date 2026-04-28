const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    cardCustomizationId: {type: mongoose.Schema.Types.ObjectId, ref: 'card-customization'},
    transaction_id: {type: String},
    is_success: {type: Boolean, default: false},
    aud: {type: Number},
    price: {type: Number},
    card: {type: String},
    status: {type: String},
    time: {type: Date},
    data: {type: mongoose.Schema.Types.Mixed},
}, {timestamps: true});

module.exports = mongoose.model('transaction', transactionSchema);
