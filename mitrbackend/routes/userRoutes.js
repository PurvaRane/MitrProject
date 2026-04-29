import express from 'express';
import { protect } from '../middleware/auth.js';
import Submission from '../models/Submission.js';

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

export default router;
