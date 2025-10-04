const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const ClubApplication = require('./models/ClubApplication');
const Recruitment = require('./models/Recruitment');
const Event = require('./models/Event');
const EventRegistration = require('./models/EventRegistration');
const User = require('./models/User');

async function testApplicationFlow() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Test 1: Get all GDSC recruitments
    console.log('\n=== TEST 1: GDSC Recruitments ===');
    const gdscRecruitments = await Recruitment.find({ clubName: 'GDSC' });
    console.log(`Found ${gdscRecruitments.length} GDSC recruitments:`);
    gdscRecruitments.forEach(r => {
      console.log(`  - ${r.title} (${r._id}) - Active: ${r.isActive}`);
    });
    
    // Test 2: Get all applications for GDSC recruitments
    console.log('\n=== TEST 2: GDSC Applications ===');
    const recruitmentIds = gdscRecruitments.map(r => r._id);
    const gdscApplications = await ClubApplication.find({
      recruitment: { $in: recruitmentIds }
    }).populate('student', 'name email').populate('recruitment', 'title');
    
    console.log(`Found ${gdscApplications.length} applications for GDSC:`);
    gdscApplications.forEach(app => {
      console.log(`  - ${app.studentName || app.student?.name} applied to "${app.recruitment?.title}" on ${app.createdAt}`);
    });
    
    // Test 3: Check CSI recruitments and applications
    console.log('\n=== TEST 3: CSI Recruitments & Applications ===');
    const csiRecruitments = await Recruitment.find({ clubName: 'CSI' });
    console.log(`Found ${csiRecruitments.length} CSI recruitments:`);
    csiRecruitments.forEach(r => {
      console.log(`  - ${r.title} (${r._id}) - Active: ${r.isActive}`);
    });
    
    const csiRecruitmentIds = csiRecruitments.map(r => r._id);
    const csiApplications = await ClubApplication.find({
      recruitment: { $in: csiRecruitmentIds }
    }).populate('student', 'name email').populate('recruitment', 'title');
    
    console.log(`Found ${csiApplications.length} applications for CSI:`);
    csiApplications.forEach(app => {
      console.log(`  - ${app.studentName || app.student?.name} applied to "${app.recruitment?.title}" on ${app.createdAt}`);
    });
    
    // Test 4: Check GDSC event registrations
    console.log('\n=== TEST 4: GDSC Event Registrations ===');
    const gdscEvents = await Event.find({ clubName: 'GDSC' });
    console.log(`Found ${gdscEvents.length} GDSC events:`);
    gdscEvents.forEach(e => {
      console.log(`  - ${e.title} (${e._id}) - Active: ${e.isActive}`);
    });
    
    const gdscEventIds = gdscEvents.map(e => e._id);
    const gdscEventRegistrations = await EventRegistration.find({
      event: { $in: gdscEventIds }
    }).populate('student', 'name email').populate('event', 'title');
    
    console.log(`Found ${gdscEventRegistrations.length} event registrations for GDSC:`);
    gdscEventRegistrations.forEach(reg => {
      console.log(`  - ${reg.studentName || reg.student?.name} registered for "${reg.event?.title}" on ${reg.createdAt}`);
    });
    
    // Test 5: Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total GDSC recruitments: ${gdscRecruitments.length}`);
    console.log(`Total GDSC applications: ${gdscApplications.length}`);
    console.log(`Total GDSC events: ${gdscEvents.length}`);
    console.log(`Total GDSC event registrations: ${gdscEventRegistrations.length}`);
    console.log(`Total CSI recruitments: ${csiRecruitments.length}`);
    console.log(`Total CSI applications: ${csiApplications.length}`);
    
    if (gdscApplications.length > 0 || csiApplications.length > 0 || gdscEventRegistrations.length > 0) {
      console.log('\n✅ SUCCESS: Data is being saved correctly!');
      console.log('   - Recruitment applications: ' + (gdscApplications.length + csiApplications.length));
      console.log('   - Event registrations: ' + gdscEventRegistrations.length);
      console.log('   If these are not showing in admin dashboard, the issue is in the frontend.');
    } else {
      console.log('\n❌ ISSUE: No data found in database.');
      console.log('   Students may not be successfully submitting data.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testApplicationFlow();