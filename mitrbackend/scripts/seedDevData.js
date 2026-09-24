/**
 * COEP मित्र — Comprehensive Local Dev Seeder
 * Populates test data for:
 *  - Counselor & Team members
 *  - October 2026 Appointment availability slots
 *  - Active, Upcoming, and Completed Challenges with tasks
 *  - Events (Upcoming and Past)
 *  - Wellness info
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Counselor from '../models/Counselor.js';
import TeamMember from '../models/TeamMember.js';
import WellnessInfo from '../models/WellnessInfo.js';
import Availability from '../models/Availability.js';
import Challenge from '../models/Challenge.js';
import ChallengeTask from '../models/ChallengeTask.js';
import Event from '../models/Event.js';
import PlatformContent from '../models/PlatformContent.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mitr';

async function seedDevData() {
  console.log('🔄 Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // 1. Counselor
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
  console.log('✅ Counselor synced: Dr. Kshipra V. Moghe');

  // 2. Team Members
  const team = [
    { name: 'Yash', phone: '8999893770', email: 'yashmore2428@gmail.com', displayOrder: 0 },
    { name: 'Sakshi', phone: '9403371329', email: 'sakshib.200512@gmail.com', displayOrder: 1 },
    { name: 'Purva', phone: '8530062608', email: 'purvarane.2623@gmail.com', displayOrder: 2 },
    { name: 'Om', phone: '7350909448', email: 'omitrawellness@gmail.com', displayOrder: 3 },
    { name: 'Ritu', phone: '9011939795', email: 'ritu.kars23@gmail.com', displayOrder: 4 },
    { name: 'Ishwari', phone: '9809095666', email: 'ishwari0720@gmail.com', displayOrder: 5 },
  ];
  for (const m of team) {
    await TeamMember.findOneAndUpdate(
      { email: m.email },
      { ...m, isVisible: true },
      { upsert: true }
    );
  }
  console.log('✅ I-Care We-Care Team members synced (6 members).');

  // 3. Wellness Info
  const existingWellness = await WellnessInfo.findOne();
  if (!existingWellness) {
    await WellnessInfo.create({
      title: 'COEP "मित्र" Mental Health & Wellbeing',
      description: 'COEP "मित्र" is the official mental health and wellbeing initiative of COEP Technological University, Pune. We provide a structured, confidential, and supportive environment for students navigating academic pressure, personal challenges, and everyday stress.',
      vision: 'To create a campus where every student has access to meaningful mental health support — and where wellbeing is treated as integral to academic excellence, not separate from it.',
      services: [
        { title: 'Individual Counselling', description: 'Confidential one-on-one sessions with trained counsellors, available by appointment.' },
        { title: 'Wellbeing Challenges', description: 'Participate in various wellbeing challenges to build long-term healthy habits.' },
        { title: 'Wellness Events', description: 'Workshops, awareness sessions, and peer-led activities organised throughout the academic year.' },
        { title: 'Reflection Journal', description: 'A private digital journaling space for students and faculty to document thoughts, emotions, and growth.' },
      ],
    });
    console.log('✅ Wellness info created.');
  }

  // 4. Availability slots for October 2026 (Appointment Booking)
  const testDates = [
    '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09',
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16',
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23',
  ];
  const timeSlots = [
    { start: '10:00', end: '10:45' },
    { start: '11:00', end: '11:45' },
    { start: '14:00', end: '14:45' },
    { start: '15:00', end: '15:45' },
  ];

  let slotsCount = 0;
  for (const date of testDates) {
    for (const slot of timeSlots) {
      await Availability.findOneAndUpdate(
        { counselorId: 'dr-kshipra-moghe', date, startTime: slot.start },
        {
          counselorId: 'dr-kshipra-moghe',
          date,
          startTime: slot.start,
          endTime: slot.end,
          isAvailable: true,
          status: 'available',
        },
        { upsert: true }
      );
      slotsCount++;
    }
  }
  console.log(`✅ Appointment slots seeded: ${slotsCount} slots across October 2026.`);

  // 5. Challenges & Tasks
  // Clean old challenges to prevent duplicate clutter
  await Challenge.deleteMany({});
  await ChallengeTask.deleteMany({});

  const now = new Date();
  const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const future4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const future24Days = new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000);
  const past14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Challenge 1: Active 7-Day Challenge
  const activeChallenge = await Challenge.create({
    title: '7-Day Mindful Habit Challenge',
    description: 'A 7-day self-care journey designed to help COEP students and faculty reset stress, practice mindfulness, and build sustainable daily mental hygiene.',
    category: 'Mindfulness',
    startDate: past3Days,
    endDate: future4Days,
    duration: 7,
    status: 'Active',
    instructions: 'Complete one small wellness task each day and record your feelings or reflections in your journal.',
  });

  const activeTasks = [
    { dayNumber: 1, title: '5-Minute Mindful Breathing', description: 'Take 5 minutes at the start of your morning or study session to practice 4-7-8 breathing.', instructions: 'Inhale for 4 seconds, hold for 7, exhale slowly for 8. Repeat 4 times.' },
    { dayNumber: 2, title: '1-Hour Digital Sunset', description: 'Disconnect from all screens (phone, laptop) for 60 minutes before going to bed tonight.', instructions: 'Use this time to read a physical book, journal, or listen to calming music.' },
    { dayNumber: 3, title: 'Gratitude Reflection', description: 'Note down 3 specific things you are grateful for today in the COEP campus or in life.', instructions: 'Reflect on people, opportunities, or small moments of calm.' },
    { dayNumber: 4, title: '20-Minute Campus Walk', description: 'Step away from your desk and take an intentional walk around the Boat Club or heritage quadrangle.', instructions: 'Leave headphones behind and observe your surroundings without multitasking.' },
    { dayNumber: 5, title: 'Hydration & Mindful Eating', description: 'Drink 2.5 litres of water and eat at least one meal today without using your phone or laptop.', instructions: 'Notice the flavors, textures, and give your mind a break during lunch.' },
    { dayNumber: 6, title: 'Reach Out to a Friend', description: 'Send a genuine check-in message or have a tea break with a classmate or colleague.', instructions: 'Ask how they are doing and listen actively.' },
    { dayNumber: 7, title: 'Weekly Growth & Self-Compassion', description: 'Review your week, acknowledge what you handled well, and set one kind intention for next week.', instructions: 'Write a short reflection in your private journal.' },
  ];

  for (const t of activeTasks) {
    await ChallengeTask.create({ ...t, challengeId: activeChallenge._id });
  }
  console.log('✅ Active 7-Day Challenge seeded with 7 tasks.');

  // Challenge 2: Upcoming Challenge
  const upcomingChallenge = await Challenge.create({
    title: '14-Day Exam Resilience & Focus Challenge',
    description: 'Prepare your mind for academic deadlines and exams with cognitive reframing, sleep optimization, and focus intervals.',
    category: 'Academic Wellbeing',
    startDate: future10Days,
    endDate: future24Days,
    duration: 14,
    status: 'Upcoming',
    instructions: 'Starts soon! Join early to receive daily task prompts when the challenge kicks off.',
  });
  await ChallengeTask.create({
    challengeId: upcomingChallenge._id,
    dayNumber: 1,
    title: 'Focus Priming & Workspace Tidy',
    description: 'Clear your study space and define your top 2 priorities for the day.',
    instructions: 'A clutter-free space creates a calm, focused mind.',
  });
  console.log('✅ Upcoming 14-Day Challenge seeded.');

  // Challenge 3: Completed Challenge
  await Challenge.create({
    title: '5-Day Campus Kickstart Challenge',
    description: 'Orientation wellness challenge held at the start of the semester.',
    category: 'Social Wellbeing',
    startDate: past14Days,
    endDate: past7Days,
    duration: 5,
    status: 'Completed',
    instructions: 'Challenge concluded. View previous tasks and reflections.',
  });
  console.log('✅ Completed Challenge seeded.');

  // 6. Events
  await Event.deleteMany({});
  await Event.create([
    {
      title: 'Mindfulness & Stress Resilience Workshop',
      description: 'An interactive session led by Dr. Kshipra V. Moghe on handling academic and personal pressures with proven psychological tools.',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      category: 'Workshop',
      capacity: 60,
      registrationRequired: true,
      status: 'Upcoming',
    },
    {
      title: 'Peer Support & Mental Health Open House',
      description: 'Meet the I-Care We-Care student team for an informal conversation, tea, and peer guidance.',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      category: 'Awareness',
      capacity: 100,
      registrationRequired: false,
      status: 'Upcoming',
    },
    {
      title: 'World Mental Health Day Panel Discussion',
      description: 'Annual panel discussion with mental health professionals and university leadership.',
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      category: 'Seminar',
      status: 'Completed',
    },
  ]);
  console.log('✅ Events seeded (Upcoming & Completed).');

  console.log('\n🎉 ALL LOCAL TEST DATA SEEDED SUCCESSFULLY!\n');
  await mongoose.connection.close();
  process.exit(0);
}

seedDevData().catch(err => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
