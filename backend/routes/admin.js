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
    
    // Get total events
    const totalEvents = await Event.countDocuments({ clubName });
    
    // Get upcoming events
    const upcomingEvents = await Event.countDocuments({ 
      clubName, 
      date: { $gte: currentDate } 
    });
    
    // Get total registrations for all club events
    const clubEvents = await Event.find({ clubName }).select('_id');
    const eventIds = clubEvents.map(event => event._id);
    const totalRegistrations = await EventRegistration.countDocuments({ 
      eventId: { $in: eventIds } 
    });
    
    // For now, set membership applications to 0 (can be implemented later)
    const membershipApplications = 0;
    
    res.json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      membershipApplications,
      clubName
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;