const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['website_stats', 'page_views', 'unique_visitors']
  },
  totalVisits: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
counterSchema.index({ type: 1 });

module.exports = mongoose.model('Counter', counterSchema);
