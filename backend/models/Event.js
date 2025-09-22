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
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  clubName: {
    type: String,
    enum: ['CSI', 'GDSC', 'Aptnus Gana'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    default: null
  },
  maxParticipants: {
    type: Number,
    default: null
  },
  registrationDeadline: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  eventType: {
    type: String,
    enum: ['workshop', 'seminar', 'competition', 'cultural', 'technical', 'other'],
    default: 'other'
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ clubName: 1, date: 1 });
eventSchema.index({ isActive: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
