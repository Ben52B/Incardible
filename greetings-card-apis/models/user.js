const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    firstName: {type: String},
    lastName: {type: String, default:null},
    email: {type: String},
    password: {type: String, default:null},
    confirmPassword: {type: String , default:null},
    // address: {type: String},
    // phoneNumber: {type: String},
    // deliveryAddress: {type: String},
    isVerified: {type: Boolean, default: false},
    loginMethod: { type: String, enum: ['manual', 'google'], default: 'manual' },
    token: {type: String},
});

module.exports = mongoose.model('user', userSchema);
