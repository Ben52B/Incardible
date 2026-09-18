const mongoose = require('mongoose');

const templateDataSchema = new mongoose.Schema({
    uuid: {type: String},
    userId: {type: String, default:null},
    cardId: {type: mongoose.Schema.Types.ObjectId, ref: 'card'},
    arTemplateData: {type: mongoose.Schema.Types.Mixed, default:null},
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
    templateVideo: {type: String, default: null}

},{timestamps:true});

templateDataSchema.index({uuid: 1});
templateDataSchema.index({createdAt: 1});

module.exports = mongoose.model('temporary-template-data', templateDataSchema);




// after save user data remove user template data from this table and run a crob job after a week to rmeove the data from this table