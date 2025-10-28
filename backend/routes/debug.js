const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const router = express.Router();

// Get all users (for debugging only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all events (for debugging)
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({}).populate('createdBy', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all event registrations (for debugging)
router.get('/event-registrations', async (req, res) => {
  try {
    const registrations = await EventRegistration.find({})
      .populate('event', 'title clubName')
      .populate('student', 'name email');
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event registrations by club (for debugging)
router.get('/event-registrations/:clubName', async (req, res) => {
  try {
    const { clubName } = req.params;
    
    // Find all events for this club
    const events = await Event.find({ clubName });
    const eventIds = events.map(e => e._id);
    
    // Find all registrations for these events
    const registrations = await EventRegistration.find({
      event: { $in: eventIds }
    })
    .populate('event', 'title clubName')
    .populate('student', 'name email');
    
    res.json({
      clubName,
      eventCount: events.length,
      registrationCount: registrations.length,
      events,
      registrations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check specific user's event registrations (for debugging)
router.get('/user-registrations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find user's event registrations
    const registrations = await EventRegistration.find({ student: userId })
      .populate('event', 'title clubName')
      .populate('student', 'name email');

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      },
      eventRegistrations: registrations,
      total: registrations.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
