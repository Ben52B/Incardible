const mongoose = require('mongoose');

const cardCustomizationSchema = new mongoose.Schema({
    email: {type: String, default: null},
    userId: {type: String, default:null},
    uuid: {type: String},
    cardId: {type: mongoose.Schema.Types.ObjectId, ref: 'card'},
    arTemplateData: {type: mongoose.Schema.Types.Mixed, default: null},
    templateImage0: {type: String, default: null},
    templateImage1: {type: String, default: null},
    templateImage2: {type: String, default: null},
    templateImage3: {type: String, default: null},
    templateImage4: {type: String, default: null},
    templateImage5: {type: String, default: null},
    templateImage6: {type: String, default: null},
    templateImage7: {type: String, default: null},
    templateImage8: {type: String, default: null},
    templateImage9: {type: String, default: null},
    templateImage10: {type: String, default: null},
    templateVideo: {type: String, default: null},
    isPaid: {type: Boolean, default: false},
    deleteMyCard: {type: Boolean, default: false},
    templateTextSS: {type: String, default: null}
}, {timestamps: true});

module.exports = mongoose.model('card-customization', cardCustomizationSchema);