const mongoose = require('mongoose');

// One-time codes for password reset / verification. Documents expire
// automatically 15 minutes after creation (the controller enforces 10).
const tempUserSchema = new mongoose.Schema({
    email: {type: String, index: true},
    code: {type: String},
    attempts: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now, expires: 15 * 60}
});

module.exports = mongoose.model("temp_user", tempUserSchema);
