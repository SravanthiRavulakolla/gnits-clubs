const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'attended', 'cancelled'],
    default: 'registered'
  },
  additionalInfo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure one registration per student per event
eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });
eventRegistrationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);