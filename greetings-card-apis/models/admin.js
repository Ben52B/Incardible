const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {type: String},
    email: {type: String},
    password: {type: String},
    token: {type: String},
});

const stripSecrets = (_doc, ret) => {
    for (const f of ['password']) delete ret[f];
    return ret;
};
adminSchema.set('toJSON', {transform: stripSecrets});
adminSchema.set('toObject', {transform: stripSecrets});
adminSchema.index({email: 1});

module.exports = mongoose.model('admin', adminSchema);