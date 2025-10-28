const express = require('express');
const { body, validationResult } = require('express-validator');
const EventRegistration = require('../models/EventRegistration');
const ClubApplication = require('../models/ClubApplication');
const Event = require('../models/Event');
const Recruitment = require('../models/Recruitment');
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

// Club Application Endpoints

// Apply to a recruitment (students only)
router.post('/recruitments/:recruitmentId', [
  auth,
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('appliedPosition').trim().isLength({ min: 1 }).withMessage('Applied position is required'),
  body('whyJoin').trim().isLength({ min: 1 }).withMessage('Why join is required'),
  body('experience').optional().trim(),
  body('skills').optional().trim(),
  body('portfolio').optional().trim(),
  body('resume').optional().trim(),
  body('answers').optional().isArray().withMessage('Answers must be an array'),
  body('answers.*.questionText').optional().trim().isLength({ min: 1 }).withMessage('Answer questionText is required'),
  body('answers.*.answer').optional()
], async (req, res) => {
  try {
    console.log('\n=== APPLICATION SUBMISSION START ===');
    console.log('User:', req.user ? `${req.user.name} (${req.user.email})` : 'No user');
    console.log('Recruitment ID:', req.params.recruitmentId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { recruitmentId } = req.params;
    const { phone, appliedPosition, experience, skills, whyJoin, portfolio, resume, answers } = req.body;

    // Check if recruitment exists and is active
    console.log('Looking up recruitment:', recruitmentId);
    const recruitment = await Recruitment.findById(recruitmentId);
    console.log('Found recruitment:', recruitment ? `${recruitment.title} (${recruitment.clubName}) - Active: ${recruitment.isActive}` : 'Not found');
    if (!recruitment || !recruitment.isActive) {
      console.log('Recruitment check failed - not found or inactive');
      return res.status(404).json({ message: 'Recruitment not found or inactive' });
    }

    // Check if application deadline has passed
    if (new Date() > recruitment.applicationDeadline) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Check if position exists in recruitment
    const validPosition = recruitment.positions.find(pos => pos.role === appliedPosition);
    if (!validPosition) {
      return res.status(400).json({ message: 'Invalid position selected' });
    }

    // Check if already applied
    const existingApplication = await ClubApplication.findOne({
      recruitment: recruitmentId,
      student: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this recruitment' });
    }

    // Validate answers against recruitment questions
    let preparedAnswers = [];
    if (Array.isArray(recruitment.questions) && recruitment.questions.length > 0) {
      const questionsByText = new Map(recruitment.questions.map(q => [q.questionText, q]));
      const providedAnswers = Array.isArray(answers) ? answers : [];

      // Ensure all required questions are answered
      const missingRequired = recruitment.questions.filter(q => q.required && !providedAnswers.some(a => a.questionText === q.questionText && a.answer !== undefined && a.answer !== null && String(a.answer).trim() !== ''));
      if (missingRequired.length > 0) {
        return res.status(400).json({ message: 'Please answer all required questions', missing: missingRequired.map(q => q.questionText) });
      }

      // Validate select/multiselect options
      for (const a of providedAnswers) {
        const q = questionsByText.get(a.questionText);
        if (!q) continue; // ignore extra answers
        if ((q.fieldType === 'select' || q.fieldType === 'multiselect') && Array.isArray(q.options) && q.options.length > 0) {
          if (q.fieldType === 'select') {
            if (a.answer && !q.options.includes(a.answer)) {
              return res.status(400).json({ message: `Invalid answer for question: ${q.questionText}` });
            }
          } else if (q.fieldType === 'multiselect') {
            const arr = Array.isArray(a.answer) ? a.answer : [];
            const invalid = arr.some(val => !q.options.includes(val));
            if (invalid) {
              return res.status(400).json({ message: `Invalid answer for question: ${q.questionText}` });
            }
          }
        }
        preparedAnswers.push({ questionText: a.questionText, answer: a.answer });
      }
    }

    // Create application
    console.log('Creating application with data:');
    console.log('- Recruitment:', recruitmentId);
    console.log('- Student:', req.user._id, `(${req.user.name})`);
    console.log('- Position:', appliedPosition);
    console.log('- Club:', recruitment.clubName);
    
    const application = new ClubApplication({
      recruitment: recruitmentId,
      student: req.user._id,
      studentName: req.user.name,
      rollNumber: req.user.rollNumber || '',
      department: req.user.department || '',
      email: req.user.email,
      phone: phone || '',
      appliedPosition,
      experience: experience || '',
      skills: skills || '',
      whyJoin,
      portfolio: portfolio || '',
      resume: resume || '',
      answers: preparedAnswers
    });

    console.log('Saving application to database...');
    await application.save();
    console.log('Application saved successfully with ID:', application._id);

    const populatedApplication = await ClubApplication.findById(application._id)
      .populate('recruitment', 'title clubName applicationDeadline');

    console.log('Populated application:', populatedApplication);
    console.log('=== APPLICATION SUBMISSION SUCCESS ===\n');
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: populatedApplication
    });
  } catch (error) {
    console.error('=== APPLICATION SUBMISSION ERROR ===');
    console.error('Club application error:', error);
    console.error('Stack trace:', error.stack);
    console.error('=== END ERROR ===\n');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's club applications
router.get('/recruitments/my', auth, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const applications = await ClubApplication.find({
      student: req.user._id
    })
    .populate('recruitment', 'title clubName applicationDeadline')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

    const total = await ClubApplication.countDocuments({
      student: req.user._id
    });

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get student applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Endpoints for Managing Registrations

// Get event registrations (club admin only)
router.get('/events/:eventId/registrations', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    // Check if event exists and user has permission
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'club_admin' && event.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to view these registrations' });
    }

    const registrations = await EventRegistration.find({
      event: eventId,
      status: { $ne: 'cancelled' }
    })
    .populate('student', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

    const total = await EventRegistration.countDocuments({
      event: eventId,
      status: { $ne: 'cancelled' }
    });

    res.json({
      registrations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recruitment applications (club admin only)
router.get('/recruitments/:recruitmentId/applications', auth, async (req, res) => {
  try {
    const { recruitmentId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    // Check if recruitment exists and user has permission
    const recruitment = await Recruitment.findById(recruitmentId);
    if (!recruitment) {
      return res.status(404).json({ message: 'Recruitment not found' });
    }

    if (req.user.role === 'club_admin' && recruitment.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await ClubApplication.find({
      recruitment: recruitmentId
    })
    .populate('student', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

    const total = await ClubApplication.countDocuments({
      recruitment: recruitmentId
    });

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get recruitment applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (club admin only)
router.patch('/recruitments/applications/:applicationId/status', [
  auth,
  body('status').isIn(['applied', 'under_review', 'shortlisted', 'selected', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { applicationId } = req.params;
    const { status, feedback, interviewDate } = req.body;

    const application = await ClubApplication.findById(applicationId)
      .populate('recruitment', 'clubName');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is admin of the club
    if (req.user.role === 'club_admin' && application.recruitment.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    const updateData = { status };
    if (feedback) updateData.feedback = feedback;
    if (interviewDate) updateData.interviewDate = new Date(interviewDate);

    const updatedApplication = await ClubApplication.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true }
    ).populate('recruitment', 'title clubName')
    .populate('student', 'name email');

    res.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;