const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ClubApplication = require('./models/ClubApplication');
const Recruitment = require('./models/Recruitment');
const User = require('./models/User');

async function testOrionApplication() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Get Orion user
    const orionUser = await User.findOne({ email: 'orion1234@gmail.com' });
    if (!orionUser) {
      console.log('❌ Orion user not found');
      return;
    }
    console.log('✅ Found Orion user:', orionUser.name, orionUser.email);
    
    // Get CSI Coordinator recruitment
    const csiRecruitment = await Recruitment.findOne({ 
      clubName: 'CSI', 
      title: 'Coordinator',
      isActive: true 
    });
    if (!csiRecruitment) {
      console.log('❌ CSI Coordinator recruitment not found');
      return;
    }
    console.log('✅ Found CSI recruitment:', csiRecruitment.title, csiRecruitment._id);
    console.log('📅 Deadline:', csiRecruitment.applicationDeadline);
    console.log('🔴 Active:', csiRecruitment.isActive);
    
    // Check deadline
    const now = new Date();
    const deadline = new Date(csiRecruitment.applicationDeadline);
    console.log('⏰ Current time:', now.toISOString());
    console.log('⏰ Deadline time:', deadline.toISOString());
    console.log('✅ Deadline check:', now < deadline ? 'PASSED' : 'FAILED');
    
    // Check if application already exists (this might be the issue!)
    const existingApp = await ClubApplication.findOne({
      recruitment: csiRecruitment._id,
      student: orionUser._id
    });
    
    if (existingApp) {
      console.log('🚨 DUPLICATE APPLICATION FOUND!');
      console.log('   Application ID:', existingApp._id);
      console.log('   Created:', existingApp.createdAt);
      console.log('   Status:', existingApp.status);
      console.log('');
      console.log('💡 This might explain why the frontend shows success');
      console.log('   but a new application is not created!');
    } else {
      console.log('✅ No existing application found - ready to create new one');
      
      // Simulate the exact application data that would be sent from frontend
      const applicationData = {
        phone: '9999999999',
        appliedPosition: 'Coordinator',
        experience: 'Student leadership experience',
        skills: 'Communication, Leadership',
        whyJoin: 'I want to contribute to CSI activities and grow my technical skills',
        portfolio: '',
        resume: '',
        answers: []
      };
      
      console.log('📝 Simulating application creation...');
      console.log('Data:', applicationData);
      
      // Create application
      const testApp = new ClubApplication({
        recruitment: csiRecruitment._id,
        student: orionUser._id,
        studentName: orionUser.name,
        rollNumber: orionUser.rollNumber || '',
        department: orionUser.department || '',
        email: orionUser.email,
        phone: applicationData.phone,
        appliedPosition: applicationData.appliedPosition,
        experience: applicationData.experience,
        skills: applicationData.skills,
        whyJoin: applicationData.whyJoin,
        portfolio: applicationData.portfolio,
        resume: applicationData.resume,
        answers: applicationData.answers
      });
      
      await testApp.save();
      console.log('✅ Test application created successfully:', testApp._id);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testOrionApplication();