import express from 'express';
import { getWellnessInfo, upsertWellnessInfo } from '../controllers/wellnessController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET  /api/wellness-info   — any authenticated user
// POST /api/wellness-info   — admin only (upsert)
router.get('/', protect, getWellnessInfo);
router.post('/', protect, adminOnly, upsertWellnessInfo);

export default router;
