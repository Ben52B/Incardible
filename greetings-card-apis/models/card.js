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
    // Compiled MindAR image-tracking target for the web AR viewer (see utils/trackingTargets.js)
    trackingTarget: {
        type: new mongoose.Schema({
            status: {type: String, enum: ['none', 'pending', 'ready', 'failed'], default: 'none'},
            path: {type: String, default: null},
            faces: {type: [String], default: []},
            targets: {type: [new mongoose.Schema({
                face: String, width: Number, height: Number, points: Number, quality: String,
            }, {_id: false})], default: []},
            bytes: {type: Number, default: 0},
            sourceHash: {type: String, default: null},
            compiledAt: {type: Date, default: null},
            error: {type: String, default: null},
        }, {_id: false}),
        default: () => ({status: 'none', faces: [], targets: []}),
    },
}, {timestamps: true});

module.exports = mongoose.model('card', cardSchema);