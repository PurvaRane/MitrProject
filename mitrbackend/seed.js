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

dotenv.config();

const CHALLENGE_TASKS = [
  { day: 1,  title: 'Morning Gratitude',     description: "Write 3 things you're grateful for today. Big or small — they all count.", instructions: 'Take 5 quiet minutes after waking. Write three things — people, moments, or simple comforts you are thankful for. Be specific, not generic.' },
  { day: 2,  title: '5-Minute Breathing',    description: 'Box breathing exercise to regulate your nervous system.', instructions: 'Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat this cycle 5 times. Sit comfortably, spine straight, eyes closed.' },
  { day: 3,  title: 'Reach Out',             description: "Send a kind message to someone you haven't spoken to in a while.", instructions: "Choose one person — a friend, family member, or classmate. Send them a genuine message. It can be simple: 'I was thinking of you. Hope you're well.'" },
  { day: 4,  title: 'Nature Walk',           description: 'A mindful 10-minute walk outdoors.', instructions: 'Step outside for exactly 10 minutes. No phone. Notice 5 things you see, 3 you hear, 1 you smell. Walk slowly.' },
  { day: 5,  title: 'Digital Detox Hour',    description: 'One hour completely screen-free.', instructions: 'Set an alarm for 1 hour. Put all screens away — phone, laptop, TV. Use the time to read, sketch, stretch, or sit quietly.' },
  { day: 6,  title: 'Kind to Yourself',      description: 'Practice self-compassion in writing.', instructions: 'Write one paragraph as if you were writing to a close friend who is struggling with exactly what you are going through. Use that same kindness on yourself.' },
  { day: 7,  title: 'Celebrate Progress',    description: 'Acknowledge your week\'s small wins.', instructions: 'List 3 specific things you did well this week. They do not need to be big. Completing a task, showing up, being honest — all count.' },
  { day: 8,  title: 'Mindful Eating',        description: 'One screen-free, slow meal.', instructions: 'Choose one meal today. Eat it away from screens, phone face-down. Chew slowly. Notice flavours, textures, and sensations. Take at least 15 minutes.' },
  { day: 9,  title: 'Creative Expression',   description: 'Engage in any creative activity for 15 minutes.', instructions: 'Doodle, write freely, hum, play music, or dance in your room. No skill required — just expression. Do not judge the output.' },
  { day: 10, title: 'Compliment Challenge',  description: 'Give genuine compliments to 3 people.', instructions: 'Give three specific, genuine compliments to three different people today. Notice how it affects both of you.' },
  { day: 11, title: 'Free Journaling',       description: '5 minutes of unfiltered writing.', instructions: 'Set a timer for 5 minutes. Write continuously — do not stop, do not edit. Write whatever comes to mind. No one will read it.' },
  { day: 12, title: 'Stretch and Move',      description: '10 minutes of gentle body movement.', instructions: 'Do 10 minutes of simple stretches: neck rolls, shoulder shrugs, forward fold, seated twists. Focus on releasing areas where you hold tension.' },
  { day: 13, title: 'Learn Something New',   description: 'Spend 10 minutes on a topic of curiosity.', instructions: "Watch one short educational video or read one article on a topic unrelated to your academic work. Write one sentence about what you learned." },
  { day: 14, title: 'Two-Week Reflection',   description: 'Review your progress and patterns.', instructions: 'Look back at the last 14 days. Write: (1) what has changed in how you feel, (2) what habit felt most natural, (3) what you want to focus on next.' },
  { day: 15, title: 'Acts of Kindness',      description: 'One anonymous act of care for another.', instructions: 'Do one quiet, unannounced act of kindness: leave an encouraging note, help with a task without being asked, share something useful. Tell no one.' },
  { day: 16, title: 'Phone-Free Morning',    description: 'Start the day with presence, not screens.', instructions: 'Keep your phone away for the first 30 minutes after waking. Use that time to drink water, breathe, stretch, or sit quietly.' },
  { day: 17, title: 'Meaningful Conversation', description: 'Go beyond surface-level interaction.', instructions: 'Have one conversation today that goes beyond small talk. Ask someone: "How are you really doing?" and listen without planning your response.' },
  { day: 18, title: 'Boundary Setting',      description: 'Identify and practice one boundary.', instructions: 'Identify one thing currently draining your energy. Practise saying "no" or "not today" — to a person, a task, or a habit — with calm, clear communication.' },
  { day: 19, title: 'Forgiveness Practice',  description: 'Write a letter of release.', instructions: "Write a letter of forgiveness to yourself or someone else. You do not need to send it. The act of writing is the release. Be honest, then let it go." },
  { day: 20, title: 'Curate Your Digital Space', description: 'Audit one online space for your wellbeing.', instructions: 'Open one social media app. Unfollow or mute 5 accounts that make you feel inadequate. Follow at least one account that genuinely adds value.' },
  { day: 21, title: 'Three Good Things',     description: 'An evening gratitude ritual.', instructions: 'Before bed, write down 3 specific good things that happened today — no matter how small. Describe why each one was good.' },
  { day: 22, title: 'Mindful Listening',     description: 'A deep listening session with music.', instructions: 'Choose a piece of music you love. Sit or lie down. Close your eyes and listen from start to finish without multitasking. Let it move you.' },
  { day: 23, title: 'Body Scan',             description: 'A guided awareness practice.', instructions: 'Lie down comfortably. Starting from your feet, slowly bring awareness up your body — noticing sensations without judgment. Spend 10–12 minutes.' },
  { day: 24, title: 'Letter to Future Self', description: 'Write to yourself 6 months from now.', instructions: 'Write a kind, honest, and hopeful letter to your future self. Include what you hope has changed, what you want to remember, and one encouragement.' },
  { day: 25, title: 'Celebrate a Peer',      description: 'Recognise someone else\'s effort or growth.', instructions: "Sincerely acknowledge one person's effort or achievement today — in person or in a message. Be specific about what you noticed." },
  { day: 26, title: 'Morning Affirmations',  description: 'Start the day with intentional self-talk.', instructions: 'Say or write 3 affirmations aloud after waking. Choose ones that feel genuine, not hollow. For example: "I am learning and growing. I am enough as I am."' },
  { day: 27, title: 'Slow Reading',          description: '20 minutes of reading for pleasure.', instructions: 'Read something non-academic for 20 minutes — fiction, poetry, biography, anything you enjoy. Read slowly. Reread passages if they move you.' },
  { day: 28, title: 'Ask for Help',          description: 'Practice the skill of reaching out.', instructions: 'Identify one thing you have been carrying alone. Ask one person — friend, family member, counsellor, or mentor — for support, a perspective, or just a listening ear.' },
  { day: 29, title: 'Reflect on Growth',     description: 'Compare Day 1 you to today.', instructions: 'Write: (1) one way you think differently now, (2) one habit that has genuinely shifted, (3) one thing you are proud of yourself for in the last 29 days.' },
  { day: 30, title: 'Celebrate Completion',  description: '30 days of intentional self-care.', instructions: 'You have completed 30 days. Write a short celebration note to yourself. Share your journey with one person you trust. Plan how to carry one practice forward.' },
];

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

  // ── Seed 30 challenge tasks ───────────────────────────────────────────────
  await Challenge.deleteMany({});
  const tasksWithActive = CHALLENGE_TASKS.map((t, i) => ({ ...t, isActive: i === 0 }));
  await Challenge.insertMany(tasksWithActive);
  console.log('✅ 30 challenge tasks seeded. Day 1 is active.');

  // ── Seed wellness info (only if none exists) ──────────────────────────────
  const existing = await WellnessInfo.findOne();
  if (existing) {
    console.log('⚠️  Wellness info already exists — skipping.');
  } else {
    await WellnessInfo.create(DEFAULT_WELLNESS_INFO);
    console.log('✅ Default wellness info seeded.');
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
