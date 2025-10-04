const express = require('express');
const User = require('../models/User');
const ClubApplication = require('../models/ClubApplication');
const Recruitment = require('../models/Recruitment');
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

// Get all recruitments (for debugging)
router.get('/recruitments', async (req, res) => {
  try {
    const recruitments = await Recruitment.find({}).populate('createdBy', 'name email');
    res.json(recruitments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all club applications (for debugging)
router.get('/applications', async (req, res) => {
  try {
    const applications = await ClubApplication.find({})
      .populate('recruitment', 'title clubName')
      .populate('student', 'name email');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get applications by club (for debugging)
router.get('/applications/:clubName', async (req, res) => {
  try {
    const { clubName } = req.params;
    
    // Find all recruitments for this club
    const recruitments = await Recruitment.find({ clubName });
    const recruitmentIds = recruitments.map(r => r._id);
    
    // Find all applications for these recruitments
    const applications = await ClubApplication.find({
      recruitment: { $in: recruitmentIds }
    })
    .populate('recruitment', 'title clubName')
    .populate('student', 'name email');
    
    res.json({
      clubName,
      recruitmentCount: recruitments.length,
      applicationCount: applications.length,
      recruitments,
      applications
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a test recruitment with future deadline
router.post('/create-test-recruitment', async (req, res) => {
  try {
    const testRecruitment = new Recruitment({
      title: 'Test GDSC Member - ' + new Date().toISOString(),
      description: 'Test recruitment with future deadline for debugging',
      eligibility: 'Students interested in technology',
      positions: [{
        role: 'Member',
        count: 10,
        requirements: 'Passionate about technology'
      }],
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      clubName: 'GDSC',
      createdBy: '68d10cdea3d250c958c33688', // srav's ID
      questions: []
    });

    await testRecruitment.save();
    
    res.json({
      message: 'Test recruitment created successfully',
      recruitment: testRecruitment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix existing GDSC recruitment deadline
router.post('/fix-gdsc-deadline', async (req, res) => {
  try {
    const result = await Recruitment.updateOne(
      { _id: '68d2a342bd742d9edc5913b3' }, // Club member recruitment
      { 
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true 
      }
    );
    
    res.json({
      message: 'GDSC Club member recruitment deadline updated successfully',
      result
    });
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

// Check specific user's applications (for debugging)
router.get('/user-applications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find user's club applications
    const applications = await ClubApplication.find({ student: userId })
      .populate('recruitment', 'title clubName')
      .populate('student', 'name email');
      
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
      clubApplications: applications,
      eventRegistrations: registrations,
      totals: {
        applications: applications.length,
        registrations: registrations.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
