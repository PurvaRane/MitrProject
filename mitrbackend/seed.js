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
import TeamMember from './models/TeamMember.js';
import PlatformContent from './models/PlatformContent.js';

dotenv.config();

// 30 Days Challenge demo data removed per user request

const DEFAULT_WELLNESS_INFO = {
  title: 'COEP "मित्र" Mental Health & Wellbeing',
  description: 'COEP "मित्र" is the official mental health and wellbeing initiative of COEP Technological University, Pune. We provide a structured, confidential, and supportive environment for students navigating academic pressure, personal challenges, and everyday stress. Our programmes are designed to build resilience, promote self-awareness, and foster a culture where seeking help is seen as strength.',
  vision: 'To create a campus where every student has access to meaningful mental health support — and where wellbeing is treated as integral to academic excellence, not separate from it.',
  services: [
    { title: 'Individual Counselling', description: 'Confidential one-on-one sessions with trained counsellors, available by appointment.' },
    { title: 'Wellbeing Challenges', description: 'Participate in various wellbeing challenges to build long-term healthy habits.' },
    { title: 'Wellness Events', description: 'Workshops, awareness sessions, and peer-led activities organised throughout the academic year.' },
    { title: 'Reflection Journal', description: 'A private digital journaling space for students and faculty to document thoughts, emotions, and growth.' },
  ],
};

const ICARE_TEAM = [
  { name: 'Yash', phone: '8999893770', email: 'yashmore2428@gmail.com', displayOrder: 0 },
  { name: 'Sakshi', phone: '9403371329', email: 'sakshib.200512@gmail.com', displayOrder: 1 },
  { name: 'Purva', phone: '8530062608', email: 'purvarane.2623@gmail.com', displayOrder: 2 },
  { name: 'Om', phone: '7350909448', email: 'omitrawellness@gmail.com', displayOrder: 3 },
  { name: 'Ritu', phone: '9011939795', email: 'ritu.kars23@gmail.com', displayOrder: 4 },
  { name: 'Ishwari', phone: '9809095666', email: 'ishwari0720@gmail.com', displayOrder: 5 },
];

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

  // ── Seed Counselor profile (always keep official details current) ─────────
  await Counselor.findOneAndUpdate(
    { counselorId: 'dr-kshipra-moghe' },
    {
      counselorId: 'dr-kshipra-moghe',
      name: 'Dr. Kshipra V. Moghe',
      role: 'Nodal Officer & Incharge – Mental Health & Wellbeing Initiative: COEP "मित्र"',
      designation: 'Asst. Professor – Psychology & Consulting Psychologist',
      department: 'Department of Applied Sciences & Humanities',
      institution: 'COEP Tech, Pune',
      email: 'kam.appsci@coeptech.ac.in',
      isActive: true,
    },
    { upsert: true, new: true }
  );
  console.log('✅ Counselor profile synced: Dr. Kshipra V. Moghe');

  // ── Seed I-Care We-Care team (poster details) ─────────────────────────────
  if ((await TeamMember.countDocuments()) === 0) {
    await TeamMember.insertMany(ICARE_TEAM.map(m => ({ ...m, isVisible: true, createdBy: 'seed' })));
    console.log('✅ I-Care We-Care team seeded.');
  } else {
    console.log('⚠️  Team members already exist — skipping.');
  }

  // ── Seed platform content ─────────────────────────────────────────────────
  const existingContent = await PlatformContent.findOne({ key: 'platform' });
  if (!existingContent) {
    const intro = {
      introTitle: 'COEP "मित्र" Mental Health & Wellbeing',
      introSubtitle: 'A safe, confidential space for COEP Tech students and faculty',
      introDescription: DEFAULT_WELLNESS_INFO.description,
      welcomeMessage: 'Reaching out is an act of courage. COEP "मित्र" is here to support you.',
      supportDescription: 'Need someone to talk to? Book a confidential appointment with Dr. Kshipra V. Moghe, or connect with the I-Care We-Care Team.',
      challengesIntro: 'Join guided wellbeing challenges and build healthy habits at your own pace.',
      featuredChallengeMessage: '',
      eventsIntro: 'Workshops, awareness sessions, and activities organised throughout the academic year.',
      aboutText: DEFAULT_WELLNESS_INFO.vision,
      contactMessage: 'For counselling support, write to kam.appsci@coeptech.ac.in',
      showPastEvents: true,
      featuredEvent: {
        title: '',
        description: '',
        imageUrl: null,
        date: '',
        ctaLabel: 'Learn More',
        ctaLink: '/events',
        isVisible: false,
      },
    };
    await PlatformContent.create({ key: 'platform', draft: intro, published: intro, status: 'published' });
    console.log('✅ Platform content seeded.');
  } else {
    console.log('⚠️  Platform content already exists — skipping.');
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
