const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {type: String},
    email: {type: String},
    phoneNumber: {type: String},
    message: {type: String},
});

module.exports = mongoose.model('contact-us', adminSchema);