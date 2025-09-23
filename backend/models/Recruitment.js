const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
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
  positions: [{
    role: {
      type: String,
      required: true,
      trim: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    },
    requirements: {
      type: String,
      required: true
    }
  }],
  eligibility: {
    type: String,
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  applicationProcess: {
    type: String,
    default: 'Apply through the portal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  questions: [{
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    fieldType: {
      type: String,
      enum: ['short_text', 'long_text', 'url', 'number', 'select', 'multiselect'],
      default: 'long_text'
    },
    required: {
      type: Boolean,
      default: true
    },
    options: [{
      type: String,
      trim: true
    }]
  }]
}, {
  timestamps: true
});

// Index for better query performance
recruitmentSchema.index({ clubName: 1, applicationDeadline: 1 });
recruitmentSchema.index({ isActive: 1, applicationDeadline: 1 });

module.exports = mongoose.model('Recruitment', recruitmentSchema);