const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'club_admin'],
    required: true
  },
  // Student specific fields
  rollNumber: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  department: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  // Club admin specific fields
  clubName: {
    type: String,
    enum: ['CSI', 'GDSC', 'Aptnus Gana'],
    required: function() { return this.role === 'club_admin'; }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);