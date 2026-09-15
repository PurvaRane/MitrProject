import express from 'express';
import {
  getEvents,
  createEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
  getMyRegistrations,
} from '../controllers/eventController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET  /api/events       — any authenticated user (students see events)
// POST /api/events       — admin only
// DELETE /api/events/:id — admin only

// GET  /api/events/my-registrations
// GET  /api/events/:id/registrations — admin only
// POST /api/events/:id/register      — student
// DELETE /api/events/:id/register    — student

router.get('/', protect, getEvents);
router.get('/my-registrations', protect, getMyRegistrations);
router.post('/', protect, adminOnly, createEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);
router.get('/:id/registrations', protect, adminOnly, getEventRegistrations);

export default router;
