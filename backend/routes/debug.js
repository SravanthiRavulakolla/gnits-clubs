const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users (for debugging only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role clubName').limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;