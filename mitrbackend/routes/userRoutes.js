import express from 'express';
import { protect, facultyOnly } from '../middleware/auth.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import ChallengeParticipation from '../models/ChallengeParticipation.js';
import EventRegistration from '../models/EventRegistration.js';

const router = express.Router();

// GET /api/user/progress — fetch this user's progress summary
router.get('/progress', protect, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(200).json({ success: true, doneCount: 0, streak: 0, submissions: [] });
  }

  const submissions = await Submission.find({ userId: req.user._id }).sort({ challengeDay: 1 });
  const doneCount = submissions.filter(s => s.isDone).length;

  // Calculate streak (consecutive done days from day 1)
  const doneSet = new Set(submissions.filter(s => s.isDone).map(s => s.challengeDay));
  let streak = 0;
  for (let d = 1; d <= 30; d++) {
    if (doneSet.has(d)) streak++;
    else break;
  }

  res.status(200).json({ success: true, doneCount, streak, submissions });
});

// PATCH /api/user/profile — update profile (e.g. department for faculty)
router.patch('/profile', protect, async (req, res) => {
  if (req.user?.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Admin profile cannot be modified here.' });
  }

  const { department, name } = req.body;
  const updates = {};
  if (name && name.trim()) updates.name = name.trim();
  if (department !== undefined) updates.department = department.trim();

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

  res.status(200).json({
    success: true,
    user: {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      misId: updatedUser.misId,
      department: updatedUser.department,
      year: updatedUser.year,
      branch: updatedUser.branch,
      role: updatedUser.role,
      hasSeenOnboarding: updatedUser.hasSeenOnboarding,
    },
  });
});

// GET /api/user/faculty-summary — faculty-only protected dashboard summary
router.get('/faculty-summary', protect, facultyOnly, async (req, res) => {
  const [challengeCount, eventCount] = await Promise.all([
    ChallengeParticipation.countDocuments({ studentId: req.user._id }),
    EventRegistration.countDocuments({ studentId: req.user._id, status: 'Registered' }),
  ]);

  res.status(200).json({
    success: true,
    summary: {
      joinedChallenges: challengeCount,
      registeredEvents: eventCount,
      department: req.user.department || 'Not specified',
    },
  });
});

export default router;
