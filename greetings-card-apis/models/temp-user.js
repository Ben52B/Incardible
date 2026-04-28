const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
    email: {type: String},
    code: {type: String}
});

module.exports = mongoose.model("temp_user", tempUserSchema);