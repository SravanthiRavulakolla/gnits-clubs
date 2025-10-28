const express = require('express');
const jwt = require('jsonwebtoken');
const Club = require('../models/Club');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
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

// Get club details
router.get('/:clubName', optionalAuth, async (req, res) => {
  try {
    const { clubName } = req.params;
    const userId = req.user?._id;
    let club = await Club.findOne({ name: clubName });
    
    if (!club) {
      // Create default club data if not exists
      const defaultClubs = {
        'CSI': {
          name: 'CSI',
          description: 'Computer Society of India - Fostering innovation in technology and computer science through workshops, competitions, and technical events.',
          popularPeople: [
            { name: 'Dr. Rajesh Kumar', position: 'Faculty Coordinator', bio: 'Professor of Computer Science with 15+ years experience' },
            { name: 'Priya Sharma', position: 'President', bio: 'Final year CSE student, passionate about AI and ML' },
            { name: 'Arjun Patel', position: 'Technical Lead', bio: 'Expert in web development and competitive programming' }
          ],
          membershipDrive: {
            isActive: true,
            title: 'Join CSI - Shape Your Tech Future',
            description: 'Be part of the leading computer science community. Gain access to exclusive workshops, internship opportunities, and networking events.',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            requirements: ['Basic programming knowledge', 'Passion for technology', 'Commitment to participate in events']
          }
        },
        'GDSC': {
          name: 'GDSC',
          description: 'Google Developer Student Club - Building the next generation of developers through Google technologies, cloud computing, and open source contributions.',
          popularPeople: [
            { name: 'Prof. Anita Singh', position: 'Faculty Advisor', bio: 'Google Certified Professional with expertise in cloud technologies' },
            { name: 'Rohit Verma', position: 'Lead', bio: 'Google Developer Expert, specializing in Android development' },
            { name: 'Sneha Gupta', position: 'Co-Lead', bio: 'Flutter enthusiast and open source contributor' }
          ],
          membershipDrive: {
            isActive: true,
            title: 'GDSC Membership Drive 2024',
            description: 'Join Google Developer Student Club and learn cutting-edge Google technologies. Get access to Google Cloud credits, exclusive events, and mentorship.',
            deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            requirements: ['Interest in Google technologies', 'Basic coding skills', 'Willingness to learn and share knowledge']
          }
        },
        'Aptnus Gana': {
          name: 'Aptnus Gana',
          description: 'Aptnus Gana - Celebrating creativity and cultural diversity through music, dance, drama, and artistic expressions. Building confidence and showcasing talent.',
          popularPeople: [
            { name: 'Dr. Meera Reddy', position: 'Cultural Coordinator', bio: 'Renowned classical dancer and cultural enthusiast' },
            { name: 'Vikram Singh', position: 'President', bio: 'Talented musician and event organizer' },
            { name: 'Kavya Nair', position: 'Creative Director', bio: 'Award-winning choreographer and performer' }
          ],
          membershipDrive: {
            isActive: true,
            title: 'Unleash Your Creative Potential',
            description: 'Join Aptnus Gana and be part of amazing cultural events, competitions, and performances. Express yourself through various art forms.',
            deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            requirements: ['Passion for arts and culture', 'Willingness to perform', 'Team spirit and creativity']
          }
        }
      };
      
      club = new Club(defaultClubs[clubName]);
      await club.save();
    }
    
    // Get events for this club (only active events)
    const currentDate = new Date();
    let upcomingEvents = await Event.find({
      clubName,
      isActive: true,
      date: { $gte: currentDate }
    }).sort({ date: 1 }).limit(5).lean();

    let pastEvents = await Event.find({
      clubName,
      isActive: true,
      date: { $lt: currentDate }
    }).sort({ date: -1 }).limit(5).lean();

    // If user is authenticated, check registration status
    if (userId) {
      const eventIds = [...upcomingEvents, ...pastEvents].map(e => e._id);
      const registrations = await EventRegistration.find({
        student: userId,
        event: { $in: eventIds },
        status: { $ne: 'cancelled' }
      }).select('event');

      const registeredEventIds = new Set(registrations.map(r => r.event.toString()));

      upcomingEvents = upcomingEvents.map(event => ({
        ...event,
        isRegistered: registeredEventIds.has(event._id.toString())
      }));

      pastEvents = pastEvents.map(event => ({
        ...event,
        isRegistered: registeredEventIds.has(event._id.toString())
      }));
    }

    res.json({
      club,
      upcomingEvents,
      pastEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;