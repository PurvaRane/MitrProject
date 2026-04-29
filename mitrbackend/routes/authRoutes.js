import express from 'express';
import { register, login, getMe, completeOnboarding } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST  /api/auth/register   — student self-registration (public)
// POST  /api/auth/login      — student (misId+password) or admin (username+password)
// GET   /api/auth/me         — return current user (protected)
// PATCH /api/auth/onboarding — mark onboarding seen (protected)

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/onboarding', protect, completeOnboarding);

export default router;
