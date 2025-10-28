const express = require('express');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { auth, isClubAdmin } = require('../middleware/auth');
const router = express.Router();

// Get admin statistics for a club
router.get('/stats/:clubName', auth, isClubAdmin, async (req, res) => {
  try {
    const { clubName } = req.params;

    // Verify admin belongs to this club
    if (req.user.clubName !== clubName) {
      return res.status(403).json({ message: 'Access denied. You can only view stats for your club.' });
    }

    const currentDate = new Date();

    // Get total active events
    const totalEvents = await Event.countDocuments({ clubName, isActive: true });

    // Get upcoming active events
    const upcomingEvents = await Event.countDocuments({
      clubName,
      isActive: true,
      date: { $gte: currentDate }
    });

    // Get total registrations for all active club events
    const clubEvents = await Event.find({ clubName, isActive: true }).select('_id');
    const eventIds = clubEvents.map(event => event._id);
    const totalRegistrations = await EventRegistration.countDocuments({
      event: { $in: eventIds }
    });

    res.json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      clubName
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event registrations for admin's club
router.get('/event-registrations/:clubName', auth, isClubAdmin, async (req, res) => {
  try {
    const { clubName } = req.params;

    // Verify admin belongs to this club
    if (req.user.clubName !== clubName) {
      return res.status(403).json({ message: 'Access denied. You can only view event registrations for your club.' });
    }

    // Get all active events for this club
    const events = await Event.find({ clubName, isActive: true });
    const eventIds = events.map(e => e._id);

    // Get all registrations for these events
    const registrations = await EventRegistration.find({
      event: { $in: eventIds }
    })
    .populate('event', 'title date time venue')
    .populate('student', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      clubName,
      totalRegistrations: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;