import express from 'express';
import {
  getEventReports,
  createEventReport,
  deleteEventReport,
} from '../controllers/eventReportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET    /api/event-reports       — any authenticated user
// POST   /api/event-reports       — admin only
// DELETE /api/event-reports/:id   — admin only
router.get('/', protect, getEventReports);
router.post('/', protect, adminOnly, createEventReport);
router.delete('/:id', protect, adminOnly, deleteEventReport);

export default router;
