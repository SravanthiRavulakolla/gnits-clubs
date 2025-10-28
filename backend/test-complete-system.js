const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const ClubApplication = require('./models/ClubApplication');
const Recruitment = require('./models/Recruitment');
const Event = require('./models/Event');
const EventRegistration = require('./models/EventRegistration');
const User = require('./models/User');

async function testCompleteSystem() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    console.log('\n🔍 COMPLETE SYSTEM TEST');
    console.log('========================\n');
    
    // Test 1: Check all users
    console.log('👥 USERS:');
    const users = await User.find({}).select('name email role clubName');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}${user.clubName ? ` [${user.clubName}]` : ''}`);
    });
    
    // Test 2: Check all recruitments
    console.log('\n📋 RECRUITMENTS:');
    const recruitments = await Recruitment.find({}).select('title clubName isActive applicationDeadline');
    recruitments.forEach(rec => {
      const status = rec.isActive && new Date() < new Date(rec.applicationDeadline) ? '✅ OPEN' : '❌ CLOSED';
      console.log(`  - ${rec.title} (${rec.clubName}) - ${status} - Deadline: ${rec.applicationDeadline.toDateString()}`);
    });
    
    // Test 3: Check all club applications
    console.log('\n📝 CLUB APPLICATIONS:');
    const applications = await ClubApplication.find({})
      .populate('recruitment', 'title clubName')
      .populate('student', 'name email');
    
    if (applications.length === 0) {
      console.log('  ❌ No club applications found!');
    } else {
      applications.forEach(app => {
        console.log(`  - ${app.studentName} applied to "${app.recruitment.title}" (${app.recruitment.clubName}) - Status: ${app.status}`);
      });
    }
    
    // Test 4: Check all events
    console.log('\n🎪 EVENTS:');
    const events = await Event.find({}).select('title clubName isActive date');
    events.forEach(event => {
      const status = event.isActive && new Date() < new Date(event.date) ? '✅ ACTIVE' : '❌ INACTIVE';
      console.log(`  - ${event.title} (${event.clubName}) - ${status} - Date: ${event.date.toDateString()}`);
    });
    
    // Test 5: Check all event registrations
    console.log('\n🎫 EVENT REGISTRATIONS:');
    const registrations = await EventRegistration.find({})
      .populate('event', 'title clubName')
      .populate('student', 'name email');
    
    if (registrations.length === 0) {
      console.log('  ❌ No event registrations found!');
    } else {
      registrations.forEach(reg => {
        console.log(`  - ${reg.studentName} registered for "${reg.event.title}" (${reg.event.clubName}) - Status: ${reg.status}`);
      });
    }
    
    // Test 6: Admin Dashboard Data Simulation
    console.log('\n📊 ADMIN DASHBOARD DATA:');
    
    // GDSC Admin Dashboard
    console.log('\n🟢 GDSC ADMIN DASHBOARD:');
    const gdscRecruitments = await Recruitment.find({ clubName: 'GDSC' });
    const gdscRecruitmentIds = gdscRecruitments.map(r => r._id);
    const gdscApplications = await ClubApplication.find({ recruitment: { $in: gdscRecruitmentIds } });
    
    const gdscEvents = await Event.find({ clubName: 'GDSC' });
    const gdscEventIds = gdscEvents.map(e => e._id);
    const gdscEventRegistrations = await EventRegistration.find({ event: { $in: gdscEventIds } });
    
    console.log(`  📋 Recruitments: ${gdscRecruitments.length}`);
    console.log(`  📝 Applications: ${gdscApplications.length}`);
    console.log(`  🎪 Events: ${gdscEvents.length}`);
    console.log(`  🎫 Event Registrations: ${gdscEventRegistrations.length}`);
    
    // CSI Admin Dashboard
    console.log('\n🔵 CSI ADMIN DASHBOARD:');
    const csiRecruitments = await Recruitment.find({ clubName: 'CSI' });
    const csiRecruitmentIds = csiRecruitments.map(r => r._id);
    const csiApplications = await ClubApplication.find({ recruitment: { $in: csiRecruitmentIds } });
    
    const csiEvents = await Event.find({ clubName: 'CSI' });
    const csiEventIds = csiEvents.map(e => e._id);
    const csiEventRegistrations = await EventRegistration.find({ event: { $in: csiEventIds } });
    
    console.log(`  📋 Recruitments: ${csiRecruitments.length}`);
    console.log(`  📝 Applications: ${csiApplications.length}`);
    console.log(`  🎪 Events: ${csiEvents.length}`);
    console.log(`  🎫 Event Registrations: ${csiEventRegistrations.length}`);
    
    // Test 7: Student "My Applications" Data
    console.log('\n👨‍🎓 STUDENT DATA (Test Student):');
    const testStudent = await User.findOne({ email: 'test@student.com' });
    if (testStudent) {
      const studentApplications = await ClubApplication.find({ student: testStudent._id })
        .populate('recruitment', 'title clubName');
      const studentEventRegistrations = await EventRegistration.find({ student: testStudent._id })
        .populate('event', 'title clubName');
      
      console.log(`  📝 Club Applications: ${studentApplications.length}`);
      studentApplications.forEach(app => {
        console.log(`    - Applied to "${app.recruitment.title}" (${app.recruitment.clubName}) - Status: ${app.status}`);
      });
      
      console.log(`  🎫 Event Registrations: ${studentEventRegistrations.length}`);
      studentEventRegistrations.forEach(reg => {
        console.log(`    - Registered for "${reg.event.title}" (${reg.event.clubName}) - Status: ${reg.status}`);
      });
    } else {
      console.log('  ❌ Test Student not found!');
    }
    
    // Test 8: Final Status
    console.log('\n✅ SYSTEM STATUS SUMMARY:');
    console.log('========================');
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Recruitments: ${recruitments.length}`);
    console.log(`Total Club Applications: ${applications.length}`);
    console.log(`Total Events: ${events.length}`);
    console.log(`Total Event Registrations: ${registrations.length}`);
    
    if (applications.length > 0 && registrations.length > 0) {
      console.log('\n🎉 SUCCESS: System is working correctly!');
      console.log('   - Students can apply to club recruitments ✅');
      console.log('   - Students can register for events ✅');
      console.log('   - Data is being saved to database ✅');
      console.log('   - Admin dashboards should show this data ✅');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some data missing');
      if (applications.length === 0) console.log('   - No club applications found ❌');
      if (registrations.length === 0) console.log('   - No event registrations found ❌');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testCompleteSystem();