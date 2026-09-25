import express from 'express';
import { getAdminStats, getChallengeStats, getUsers } from '../controllers/adminStatsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats            — admin only: full overview
// GET /api/admin/challenge-stats  — admin only: per-day breakdown
// GET /api/admin/users            — admin only: list registered users
router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/challenge-stats', protect, adminOnly, getChallengeStats);
router.get('/users', protect, adminOnly, getUsers);

export default router;
