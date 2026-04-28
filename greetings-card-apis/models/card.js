const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const cardSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        index: true,
        unique: true
    },
    title: {type: String},
    cardType: {
        type: [String],

    },
    price: {
        type: Number
    },
    frontDesign: {type: String, default: null},
    backDesign: {type: String, default: null},
    insideLeftDesign: {type: String, default: null},
    insideRightDesign: {type: String, default: null},
    envelope:{type: String, default: null},
    video: {type: String, default: null},
    views: { type: Number, default: 0 },
    deleteCard: { type: Boolean, default: false },
    promotionCode: {type: String, default: null},
}, {timestamps: true});

module.exports = mongoose.model('card', cardSchema);