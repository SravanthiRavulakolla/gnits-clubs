const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['CSI', 'GDSC', 'Aptnus Gana']
  },
  description: {
    type: String,
    required: true
  },
  popularPeople: [{
    name: String,
    position: String,
    image: String,
    bio: String
  }],
  membershipDrive: {
    isActive: { type: Boolean, default: false },
    title: String,
    description: String,
    deadline: Date,
    requirements: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Club', clubSchema);