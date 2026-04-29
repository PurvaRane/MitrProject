import express from 'express';
import {
  createOrUpdateSubmission,
  getMySubmissions,
  getAllSubmissions,
} from '../controllers/submissionController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/submissions       — authenticated user submits/updates
// GET  /api/submissions/my    — user sees their own submissions
// GET  /api/submissions        — admin sees all

router.post('/', protect, createOrUpdateSubmission);
router.get('/my', protect, getMySubmissions);
router.get('/', protect, adminOnly, getAllSubmissions);

export default router;
