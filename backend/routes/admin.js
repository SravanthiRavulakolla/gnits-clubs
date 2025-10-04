const express = require('express');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ClubApplication = require('../models/ClubApplication');
const Recruitment = require('../models/Recruitment');
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
      event: { $in: eventIds } 
    });
    
    // Get membership applications count - Count ALL applications for club recruitments
    const clubRecruitments = await Recruitment.find({ clubName }).select('_id');
    const recruitmentIds = clubRecruitments.map(recruitment => recruitment._id);
    const membershipApplications = await ClubApplication.countDocuments({ 
      recruitment: { $in: recruitmentIds } 
    });
    
    // Get recent applications for more detailed info
    const recentApplications = await ClubApplication.find({
      recruitment: { $in: recruitmentIds }
    })
    .populate('student', 'name email')
    .populate('recruitment', 'title')
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      membershipApplications,
      recentApplications,
      clubName,
      debug: {
        activeRecruitments: clubRecruitments.length,
        recruitmentIds
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all applications for admin's club
router.get('/applications/:clubName', auth, isClubAdmin, async (req, res) => {
  try {
    const { clubName } = req.params;
    
    // Verify admin belongs to this club
    if (req.user.clubName !== clubName) {
      return res.status(403).json({ message: 'Access denied. You can only view applications for your club.' });
    }

    // Get all recruitments for this club
    const recruitments = await Recruitment.find({ clubName });
    const recruitmentIds = recruitments.map(r => r._id);
    
    // Get all applications for these recruitments
    const applications = await ClubApplication.find({
      recruitment: { $in: recruitmentIds }
    })
    .populate('student', 'name email')
    .populate('recruitment', 'title applicationDeadline')
    .sort({ createdAt: -1 });
    
    res.json({
      clubName,
      totalApplications: applications.length,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
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

    // Get all events for this club
    const events = await Event.find({ clubName });
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