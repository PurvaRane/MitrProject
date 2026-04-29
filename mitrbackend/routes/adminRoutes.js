import express from 'express';
import { getAdminStats, getChallengeStats } from '../controllers/adminStatsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats            — admin only: full overview
// GET /api/admin/challenge-stats  — admin only: per-day breakdown
router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/challenge-stats', protect, adminOnly, getChallengeStats);

export default router;
