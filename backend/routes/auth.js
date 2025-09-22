const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register endpoint
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'club_admin']).withMessage('Role must be either student or club_admin'),
  // Conditional validations
  body('rollNumber').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Roll number is required for students');
    }
    return true;
  }),
  body('department').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Department is required for students');
    }
    return true;
  }),
  body('clubName').custom((value, { req }) => {
    if (req.body.role === 'club_admin' && !value) {
      throw new Error('Club name is required for club admins');
    }
    if (req.body.role === 'club_admin' && !['CSI', 'GDSC', 'Aptnus Gana'].includes(value)) {
      throw new Error('Invalid club name');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { name, email, password, role, rollNumber, department, clubName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if roll number already exists for students
    if (role === 'student' && rollNumber) {
      const existingRollNumber = await User.findOne({ rollNumber });
      if (existingRollNumber) {
        return res.status(400).json({ message: 'Roll number already exists' });
      }
    }

    // Check if club admin already exists for the club
    if (role === 'club_admin' && clubName) {
      const existingClubAdmin = await User.findOne({ clubName, role: 'club_admin' });
      if (existingClubAdmin) {
        return res.status(400).json({ message: 'Club admin already exists for this club' });
      }
    }

    // Create user object based on role
    const userData = { name, email, password, role };
    if (role === 'student') {
      userData.rollNumber = rollNumber;
      userData.department = department;
    } else if (role === 'club_admin') {
      userData.clubName = clubName;
    }

    const user = new User(userData);
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && { 
          rollNumber: user.rollNumber, 
          department: user.department 
        }),
        ...(user.role === 'club_admin' && { 
          clubName: user.clubName 
        })
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    console.log('Attempting to compare password for user:', user.email);
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && { 
          rollNumber: user.rollNumber, 
          department: user.department 
        }),
        ...(user.role === 'club_admin' && { 
          clubName: user.clubName 
        })
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      ...(req.user.role === 'student' && { 
        rollNumber: req.user.rollNumber, 
        department: req.user.department 
      }),
      ...(req.user.role === 'club_admin' && { 
        clubName: req.user.clubName 
      })
    }
  });
});

module.exports = router;