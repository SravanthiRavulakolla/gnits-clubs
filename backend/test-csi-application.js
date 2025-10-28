const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const ClubApplication = require('./models/ClubApplication');
const Recruitment = require('./models/Recruitment');
const User = require('./models/User');

async function testCSIApplication() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Get Test Student user
    const testStudent = await User.findOne({ email: 'test@student.com' });
    if (!testStudent) {
      console.log('❌ Test Student user not found');
      return;
    }
    console.log('Found Test Student:', testStudent.name, testStudent.email);
    
    // Get CSI Coordinator recruitment
    const csiRecruitment = await Recruitment.findOne({ 
      clubName: 'CSI', 
      title: 'Coordinator',
      isActive: true 
    });
    if (!csiRecruitment) {
      console.log('❌ CSI Coordinator recruitment not found or inactive');
      return;
    }
    console.log('Found CSI recruitment:', csiRecruitment.title, 'Deadline:', csiRecruitment.applicationDeadline);
    
    // Check if application already exists
    const existingApp = await ClubApplication.findOne({
      recruitment: csiRecruitment._id,
      student: testStudent._id
    });
    
    if (existingApp) {
      console.log('Application already exists:', existingApp._id);
      console.log('Status:', existingApp.status);
      console.log('Created:', existingApp.createdAt);
    } else {
      console.log('No existing application found - this might be the issue!');
      
      // Create a test application manually
      console.log('\\nCreating test application...');
      const testApplication = new ClubApplication({
        recruitment: csiRecruitment._id,
        student: testStudent._id,
        studentName: testStudent.name,
        rollNumber: testStudent.rollNumber || '',
        department: testStudent.department || '',
        email: testStudent.email,
        phone: '9876543210',
        appliedPosition: 'Coordinator',
        experience: 'Test experience for CSI',
        skills: 'Leadership, Communication',
        whyJoin: 'I want to contribute to CSI activities',
        portfolio: '',
        resume: '',
        answers: []
      });
      
      await testApplication.save();
      console.log('✅ Test application created successfully:', testApplication._id);
    }
    
    // Now check all CSI applications
    console.log('\\n=== Checking all CSI applications ===');
    const csiRecruitments = await Recruitment.find({ clubName: 'CSI' });
    const recruitmentIds = csiRecruitments.map(r => r._id);
    
    const csiApplications = await ClubApplication.find({
      recruitment: { $in: recruitmentIds }
    }).populate('student', 'name email').populate('recruitment', 'title');
    
    console.log(`Total CSI applications: ${csiApplications.length}`);
    csiApplications.forEach(app => {
      console.log(`- ${app.studentName} applied to "${app.recruitment.title}" on ${app.createdAt}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testCSIApplication();