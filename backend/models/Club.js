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
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Club', clubSchema);