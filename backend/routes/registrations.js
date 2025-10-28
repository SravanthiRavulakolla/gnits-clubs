const express = require('express');
const { body, validationResult } = require('express-validator');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const { auth, isStudent } = require('../middleware/auth');

const router = express.Router();

// Event Registration Endpoints

// Register for an event (students only)
router.post('/events/:eventId', [
  auth,
  isStudent,
  body('phone').optional().isMobilePhone(),
  body('additionalInfo').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { eventId } = req.params;
    const { phone, additionalInfo } = req.body;

    // Check if event exists and is active
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found or inactive' });
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if event has already happened
    if (new Date() > event.date) {
      return res.status(400).json({ message: 'Cannot register for past events' });
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      event: eventId,
      student: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check max participants limit
    if (event.maxParticipants) {
      const currentRegistrations = await EventRegistration.countDocuments({
        event: eventId,
        status: { $in: ['registered', 'confirmed'] }
      });
      
      if (currentRegistrations >= event.maxParticipants) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }

    // Create registration
    const registration = new EventRegistration({
      event: eventId,
      student: req.user._id,
      studentName: req.user.name,
      rollNumber: req.user.rollNumber,
      department: req.user.department,
      email: req.user.email,
      phone,
      additionalInfo: additionalInfo || ''
    });

    await registration.save();

    const populatedRegistration = await EventRegistration.findById(registration._id)
      .populate('event', 'title date time venue clubName');

    res.status(201).json({
      message: 'Successfully registered for the event',
      registration: populatedRegistration
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel event registration (students only)
router.delete('/events/:eventId', auth, isStudent, async (req, res) => {
  try {
    const { eventId } = req.params;

    const registration = await EventRegistration.findOne({
      event: eventId,
      student: req.user._id
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if event has already happened
    const event = await Event.findById(eventId);
    if (event && new Date() > event.date) {
      return res.status(400).json({ message: 'Cannot cancel registration for past events' });
    }

    await EventRegistration.findByIdAndUpdate(registration._id, { status: 'cancelled' });

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's event registrations
router.get('/events/my', auth, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    // First, get all active events
    const activeEvents = await Event.find({ isActive: true }).select('_id');
    const activeEventIds = activeEvents.map(e => e._id);

    const registrations = await EventRegistration.find({
      student: req.user._id,
      status: { $ne: 'cancelled' },
      event: { $in: activeEventIds }
    })
    .populate('event', 'title date time venue clubName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

    const total = await EventRegistration.countDocuments({
      student: req.user._id,
      status: { $ne: 'cancelled' },
      event: { $in: activeEventIds }
    });

    res.json({
      registrations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get student registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;