const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {type: String},
    image: {
        type: String

    },

}, {timestamps: true});

module.exports = mongoose.model('news-&-offer', offerSchema);