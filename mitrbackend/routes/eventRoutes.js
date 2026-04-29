import express from 'express';
import {
  getEvents,
  createEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET  /api/events       — any authenticated user (students see events)
// POST /api/events       — admin only
// DELETE /api/events/:id — admin only

router.get('/', protect, getEvents);
router.post('/', protect, adminOnly, createEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

export default router;
