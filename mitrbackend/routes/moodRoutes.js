import express from 'express';
import { upsertTodayMood, getTodayMood, getMoodHistory } from '../controllers/moodController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All mood routes are strictly private to the authenticated user
router.post('/', protect, upsertTodayMood);
router.get('/today', protect, getTodayMood);
router.get('/history', protect, getMoodHistory);

export default router;
