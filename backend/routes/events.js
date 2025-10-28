const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const { auth, isClubAdmin } = require('../middleware/auth');

const router = express.Router();

// Optional auth middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  next();
};

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const { clubName, eventType, limit = 10, page = 1 } = req.query;
    const filter = { isActive: true };
    
    if (clubName) filter.clubName = clubName;
    if (eventType) filter.eventType = eventType;

    const events = await Event.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (club admin only)
router.post('/', [
  auth,
  isClubAdmin,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').trim().isLength({ min: 1 }).withMessage('Time is required'),
  body('venue').trim().isLength({ min: 1 }).withMessage('Venue is required'),
  body('eventType').optional().isIn(['workshop', 'seminar', 'competition', 'cultural', 'technical', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const {
      title,
      description,
      date,
      time,
      venue,
      maxParticipants,
      registrationDeadline,
      tags,
      eventType
    } = req.body;

    // Check if the event date is in the future
    const eventDate = new Date(date);
    if (eventDate < new Date()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    const event = new Event({
      title,
      description,
      date: eventDate,
      time,
      venue,
      clubName: req.user.clubName,
      createdBy: req.user._id,
      maxParticipants,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      tags: tags || [],
      eventType: eventType || 'other'
    });

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (club admin only)
router.put('/:id', [
  auth,
  isClubAdmin,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('time').optional().trim().isLength({ min: 1 }).withMessage('Time cannot be empty'),
  body('venue').optional().trim().isLength({ min: 1 }).withMessage('Venue cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator or admin of the same club
    if (event.createdBy.toString() !== req.user._id.toString() && 
        event.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updateData = { ...req.body };
    delete updateData.clubName; // Prevent changing club name
    delete updateData.createdBy; // Prevent changing creator

    if (updateData.date) {
      const eventDate = new Date(updateData.date);
      if (eventDate < new Date()) {
        return res.status(400).json({ message: 'Event date must be in the future' });
      }
      updateData.date = eventDate;
    }

    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(updateData.registrationDeadline);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (club admin only)
router.delete('/:id', auth, isClubAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator or admin of the same club
    if (event.createdBy.toString() !== req.user._id.toString() && 
        event.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Soft delete - set isActive to false
    await Event.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events by club
router.get('/club/:clubName', optionalAuth, async (req, res) => {
  try {
    const { clubName } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const userId = req.user?._id;

    const filter = { clubName, isActive: true };

    let events = await Event.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    // If user is authenticated, check registration status
    if (userId) {
      const eventIds = events.map(e => e._id);
      const registrations = await EventRegistration.find({
        student: userId,
        event: { $in: eventIds },
        status: { $ne: 'cancelled' }
      }).select('event');

      const registeredEventIds = new Set(registrations.map(r => r.event.toString()));

      events = events.map(event => ({
        ...event,
        isRegistered: registeredEventIds.has(event._id.toString())
      }));
    }

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get club events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
