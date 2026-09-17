/**
 * COEP मित्र — Database Seed Script
 *
 * Seeds:
 *   - 30 challenge tasks (Day 1 set active)
 *   - Initial wellness info (if none exists)
 *
 * Admin login is STATIC — no DB record:
 *   username: admin  |  password: mitr2026
 *
 * Usage:  node seed.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Challenge from './models/Challenge.js';
import WellnessInfo from './models/WellnessInfo.js';
import Counselor from './models/Counselor.js';

dotenv.config();

// 30 Days Challenge demo data removed per user request

const DEFAULT_WELLNESS_INFO = {
  title: 'COEP मित्र — Wellness Centre',
  description: 'COEP मित्र is the official mental health and wellbeing initiative of COEP Technological University, Pune. We provide a structured, confidential, and supportive environment for students navigating academic pressure, personal challenges, and everyday stress. Our programmes are designed to build resilience, promote self-awareness, and foster a culture where seeking help is seen as strength.',
  vision: 'To create a campus where every student has access to meaningful mental health support — and where wellbeing is treated as integral to academic excellence, not separate from it.',
  services: [
    { title: 'Individual Counselling', description: 'Confidential one-on-one sessions with trained counsellors, available by appointment.' },
    { title: '30-Day Wellness Challenge', description: 'A structured daily programme of self-care tasks designed to build long-term healthy habits.' },
    { title: 'Wellness Events', description: 'Workshops, awareness sessions, and peer-led activities organised throughout the academic year.' },
    { title: 'Reflection Journal', description: 'A private digital journaling space for students to document thoughts, emotions, and growth.' },
  ],
};

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Seeding COEP मित्र database...\n');

  // ── Clean up old challenge data ───────────────────────────────────────────────
  try {
    await mongoose.connection.collection('challenges').deleteMany({});
    await mongoose.connection.collection('challengetasks').deleteMany({});
    await mongoose.connection.collection('challengeparticipations').deleteMany({});
    await mongoose.connection.collection('challengecompletions').deleteMany({});
    await mongoose.connection.collection('challengefeedbacks').deleteMany({});
    await mongoose.connection.collection('submissions').deleteMany({});
    console.log('✅ Old challenge collections cleared.');
  } catch (err) {
    console.log('⚠️ Could not clear some collections (they might not exist yet).');
  }

  // ── Seed wellness info (only if none exists) ──────────────────────────────
  const existing = await WellnessInfo.findOne();
  if (existing) {
    console.log('⚠️  Wellness info already exists — skipping.');
  } else {
    await WellnessInfo.create(DEFAULT_WELLNESS_INFO);
    console.log('✅ Default wellness info seeded.');
  }

  // ── Seed Counselor profile ────────────────────────────────────────────────
  const counselor = await Counselor.findOne({ counselorId: 'dr-kshipra-moghe' });
  if (counselor) {
    console.log('⚠️  Counselor profile already exists — skipping.');
  } else {
    await Counselor.create({
      counselorId: 'dr-kshipra-moghe',
      name: 'Dr. Kshipra V. Moghe',
      role: 'Nodal Officer & Incharge – Mental Health & Wellbeing Initiative: COEP "मित्र"',
      designation: 'Asst. Professor – Psychology & Consulting Psychologist',
      department: 'Department of Applied Sciences & Humanities',
      institution: 'COEP Tech, Pune',
      email: 'kam.appsci@coeptech.ac.in',
    });
    console.log('✅ Counselor profile seeded.');
  }

  console.log('\n📌 Admin login (static — no DB record):');
  console.log('   username: admin');
  console.log('   password: mitr2026\n');

  console.log('🎉 Seed complete!\n');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
