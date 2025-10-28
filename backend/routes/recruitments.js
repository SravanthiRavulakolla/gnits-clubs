const express = require('express');
const { body, validationResult } = require('express-validator');
const Recruitment = require('../models/Recruitment');
const { auth, isClubAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all recruitments (public)
router.get('/', async (req, res) => {
  try {
    const { clubName, limit = 10, page = 1 } = req.query;
    const filter = { isActive: true };
    
    if (clubName) filter.clubName = clubName;

    const recruitments = await Recruitment.find(filter)
      .populate('createdBy', 'name')
      .sort({ applicationDeadline: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Transform data for frontend compatibility
    const transformedRecruitments = recruitments.map(recruitment => ({
      _id: recruitment._id,
      title: recruitment.title,
      description: recruitment.description,
      clubName: recruitment.clubName,
      requirements: recruitment.eligibility,
      responsibilities: recruitment.positions[0]?.requirements || '',
      deadline: recruitment.applicationDeadline,
      questions: recruitment.questions.map(q => ({
        _id: q._id,
        question: q.questionText,
        type: q.fieldType === 'short_text' ? 'text' : q.fieldType === 'long_text' ? 'textarea' : q.fieldType === 'url' ? 'email' : q.fieldType === 'number' ? 'number' : 'text',
        required: q.required
      })),
      createdAt: recruitment.createdAt
    }));

    const total = await Recruitment.countDocuments(filter);

    res.json({
      recruitments: transformedRecruitments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get recruitments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single recruitment
router.get('/:id', async (req, res) => {
  try {
    const recruitment = await Recruitment.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!recruitment) {
      return res.status(404).json({ message: 'Recruitment not found' });
    }

    res.json(recruitment);
  } catch (error) {
    console.error('Get recruitment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create recruitment (club admin only)
router.post('/', [
  auth,
  isClubAdmin,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required')
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
      requirements,
      responsibilities,
      deadline,
      questions
    } = req.body;

    // Check if the deadline is in the future
    let applicationDeadline = null;
    if (deadline) {
      applicationDeadline = new Date(deadline);
      if (applicationDeadline < new Date()) {
        return res.status(400).json({ message: 'Application deadline must be in the future' });
      }
    }

    // Transform questions to match the model
    const transformedQuestions = questions ? questions.map(q => ({
      questionText: q.question,
      fieldType: q.type === 'text' ? 'short_text' : q.type === 'textarea' ? 'long_text' : q.type === 'email' ? 'url' : q.type === 'number' ? 'number' : 'long_text',
      required: q.required || false
    })) : [];

    const recruitment = new Recruitment({
      title,
      description,
      eligibility: requirements || 'No specific requirements',
      positions: [{
        role: title,
        count: 1,
        requirements: responsibilities || 'Various responsibilities'
      }],
      applicationDeadline: applicationDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now if no deadline
      clubName: req.user.clubName,
      createdBy: req.user._id,
      questions: transformedQuestions
    });

    await recruitment.save();

    const populatedRecruitment = await Recruitment.findById(recruitment._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Recruitment created successfully',
      recruitment: populatedRecruitment
    });
  } catch (error) {
    console.error('Create recruitment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recruitment (club admin only)
router.put('/:id', [
  auth,
  isClubAdmin,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('eligibility').optional().trim().isLength({ min: 1 }).withMessage('Eligibility cannot be empty'),
  body('applicationDeadline').optional().isISO8601().withMessage('Valid deadline is required'),
  body('positions').optional().isArray({ min: 1 }).withMessage('At least one position is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const recruitment = await Recruitment.findById(req.params.id);
    if (!recruitment) {
      return res.status(404).json({ message: 'Recruitment not found' });
    }

    // Check if user is the creator or admin of the same club
    if (recruitment.createdBy.toString() !== req.user._id.toString() && 
        recruitment.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to update this recruitment' });
    }

    const updateData = { ...req.body };
    delete updateData.clubName; // Prevent changing club name
    delete updateData.createdBy; // Prevent changing creator

    if (updateData.applicationDeadline) {
      const deadline = new Date(updateData.applicationDeadline);
      if (deadline < new Date()) {
        return res.status(400).json({ message: 'Application deadline must be in the future' });
      }
      updateData.applicationDeadline = deadline;
    }

    const updatedRecruitment = await Recruitment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Recruitment updated successfully',
      recruitment: updatedRecruitment
    });
  } catch (error) {
    console.error('Update recruitment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete recruitment (club admin only)
router.delete('/:id', auth, isClubAdmin, async (req, res) => {
  try {
    const recruitment = await Recruitment.findById(req.params.id);
    if (!recruitment) {
      return res.status(404).json({ message: 'Recruitment not found' });
    }

    // Check if user is the creator or admin of the same club
    if (recruitment.createdBy.toString() !== req.user._id.toString() && 
        recruitment.clubName !== req.user.clubName) {
      return res.status(403).json({ message: 'Not authorized to delete this recruitment' });
    }

    // Soft delete - set isActive to false
    await Recruitment.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Recruitment deleted successfully' });
  } catch (error) {
    console.error('Delete recruitment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recruitments by club
router.get('/club/:clubName', async (req, res) => {
  try {
    const { clubName } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const filter = { clubName, isActive: true };
    
    const recruitments = await Recruitment.find(filter)
      .populate('createdBy', 'name')
      .sort({ applicationDeadline: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Transform data for frontend compatibility
    const transformedRecruitments = recruitments.map(recruitment => ({
      _id: recruitment._id,
      title: recruitment.title,
      description: recruitment.description,
      clubName: recruitment.clubName,
      requirements: recruitment.eligibility,
      responsibilities: recruitment.positions[0]?.requirements || '',
      deadline: recruitment.applicationDeadline,
      questions: recruitment.questions.map(q => ({
        _id: q._id,
        question: q.questionText,
        type: q.fieldType === 'short_text' ? 'text' : q.fieldType === 'long_text' ? 'textarea' : q.fieldType === 'url' ? 'email' : q.fieldType === 'number' ? 'number' : 'text',
        required: q.required
      })),
      createdAt: recruitment.createdAt
    }));

    const total = await Recruitment.countDocuments(filter);

    res.json({
      recruitments: transformedRecruitments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get club recruitments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;