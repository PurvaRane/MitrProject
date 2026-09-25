/**
 * COEP मित्र — Idempotent Admin Seed Script
 *
 * Creates / updates the following admin accounts if they do not already exist:
 *
 *   1. Master Admin  — kam.appsci@coeptech.ac.in     (role: master_admin)
 *   2. Master Admin  — ranepn25.comp@coeptech.ac.in   (role: master_admin)
 *   3. Sub Admin     — username: subadmin              (role: sub_admin)
 *
 * Passwords are read from environment variables (MASTER_ADMIN_1_PASSWORD,
 * MASTER_ADMIN_2_PASSWORD, SUB_ADMIN_PASSWORD). If not set, the script will
 * fail with a clear error — it will never fall back to hardcoded values.
 *
 * Usage:
 *   node scripts/seedAdmins.js
 *   — or —
 *   npm run seed:admins
 *
 * Safe to run multiple times (idempotent):
 *   - Existing accounts are skipped.
 *   - Passwords are NEVER logged.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

// ── Read passwords from env ──────────────────────────────────────────────────
const MASTER_ADMIN_1_PASSWORD = process.env.MASTER_ADMIN_1_PASSWORD;
const MASTER_ADMIN_2_PASSWORD = process.env.MASTER_ADMIN_2_PASSWORD;
const SUB_ADMIN_PASSWORD      = process.env.SUB_ADMIN_PASSWORD;

if (!MASTER_ADMIN_1_PASSWORD || !MASTER_ADMIN_2_PASSWORD || !SUB_ADMIN_PASSWORD) {
  console.error('❌ Admin seed failed: one or more admin passwords are missing from environment variables.');
  console.error('   Required env vars: MASTER_ADMIN_1_PASSWORD, MASTER_ADMIN_2_PASSWORD, SUB_ADMIN_PASSWORD');
  console.error('   Set them in your .env file and try again.');
  process.exit(1);
}

const ADMINS = [
  {
    name: 'Dr. Kshipra V. Moghe',
    email: 'kam.appsci@coeptech.ac.in',
    role: 'master_admin',
    password: MASTER_ADMIN_1_PASSWORD,
    lookupField: 'email',
  },
  {
    name: 'Purva Rane',
    email: 'ranepn25.comp@coeptech.ac.in',
    role: 'master_admin',
    password: MASTER_ADMIN_2_PASSWORD,
    lookupField: 'email',
  },
  {
    name: 'Sub Admin',
    username: 'subadmin',
    role: 'sub_admin',
    password: SUB_ADMIN_PASSWORD,
    lookupField: 'username',
  },
];

const seedAdmins = async () => {
  await connectDB();
  console.log('\n🔑 Seeding admin accounts…\n');

  for (const admin of ADMINS) {
    const lookup = admin.lookupField === 'email'
      ? { email: admin.email }
      : { username: admin.username };

    const existing = await User.findOne(lookup);

    if (existing) {
      // Ensure the role is correct (in case it was changed manually)
      if (existing.role !== admin.role) {
        existing.role = admin.role;
        await existing.save();
        console.log(`🔄 Updated role for ${admin.email || admin.username} → ${admin.role}`);
      } else {
        console.log(`⚠️  ${admin.email || admin.username} already exists as ${existing.role} — skipping.`);
      }
      continue;
    }

    // Create the admin account
    const userData = {
      name: admin.name,
      role: admin.role,
      password: admin.password,
      hasSeenOnboarding: true,
    };

    if (admin.email) userData.email = admin.email;
    if (admin.username) userData.username = admin.username;

    await User.create(userData);
    console.log(`✅ Created ${admin.role}: ${admin.email || admin.username}`);
  }

  console.log('\n🎉 Admin seed complete!\n');
  await mongoose.connection.close();
  process.exit(0);
};

seedAdmins().catch((err) => {
  console.error('❌ Admin seed failed:', err.message);
  process.exit(1);
});
