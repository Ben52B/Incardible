const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {type: String},
    deleteCategory:{type:Boolean, default:false}
}, {timestamps:true});

module.exports = mongoose.model('category', categorySchema);