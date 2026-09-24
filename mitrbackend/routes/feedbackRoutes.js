import express from 'express';
import {
  submitFeedback,
  getMyFeedback,
  getAdminFeedback,
  updateFeedbackStatus,
} from '../controllers/feedbackController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// User routes (Student & Faculty)
router.post('/', protect, submitFeedback);
router.get('/my', protect, getMyFeedback);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAdminFeedback);
router.patch('/admin/:id/status', protect, adminOnly, updateFeedbackStatus);

export default router;
