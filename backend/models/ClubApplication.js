const mongoose = require('mongoose');

const clubApplicationSchema = new mongoose.Schema({
  recruitment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruitment',
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
    required: false,
    default: ''
  },
  department: {
    type: String,
    required: false,
    default: ''
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false,
    default: ''
  },
  appliedPosition: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    default: ''
  },
  skills: {
    type: String,
    default: ''
  },
  whyJoin: {
    type: String,
    required: true
  },
  portfolio: {
    type: String,
    default: ''
  },
  resume: {
    type: String,
    default: ''
  },
  answers: [{
    questionText: {
      type: String,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['applied', 'under_review', 'shortlisted', 'selected', 'rejected'],
    default: 'applied'
  },
  interviewDate: {
    type: Date,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure one application per student per recruitment
clubApplicationSchema.index({ recruitment: 1, student: 1 }, { unique: true });
clubApplicationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('ClubApplication', clubApplicationSchema);