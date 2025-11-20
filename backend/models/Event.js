const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['academic', 'social', 'sports', 'cultural', 'fundraiser', 'concert', 'workshop', 'other']
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerName: {
    type: String,
    required: true
  },
  rsvps: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  imageUrl: {
    type: String,
    default: ''
  }
  ,
  // External integration metadata (optional)
  externalSource: {
    type: String,
    default: null
  },
  externalId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ date: 1, category: 1 });
eventSchema.index({ organizer: 1 });

module.exports = mongoose.model('Event', eventSchema);

