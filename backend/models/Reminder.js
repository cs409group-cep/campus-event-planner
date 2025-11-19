const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventTitle: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  reminder1DaySent: {
    type: Boolean,
    default: false
  },
  reminder2HoursSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
reminderSchema.index({ user: 1, event: 1 }, { unique: true });
reminderSchema.index({ eventDate: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);

