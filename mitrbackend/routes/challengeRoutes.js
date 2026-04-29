import express from 'express';
import {
  getAllChallenges,
  getActiveChallenge,
  createChallenge,
  activateDay,
} from '../controllers/challengeController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET  /api/challenge/active  — any authenticated user (active day task)
// GET  /api/challenge          — any authenticated user (all tasks; admin uses to manage)
// POST /api/challenge          — admin only: seed a task
// PUT  /api/challenge/activate — admin only: set active day

router.get('/active', protect, getActiveChallenge);
router.get('/', protect, getAllChallenges);
router.post('/', protect, adminOnly, createChallenge);
router.put('/activate', protect, adminOnly, activateDay);

export default router;
