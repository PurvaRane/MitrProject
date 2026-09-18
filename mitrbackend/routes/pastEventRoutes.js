import express from 'express';
import {
  getPublicPastEvents,
  getPublicPastEvent,
  getAdminPastEvents,
  createPastEvent,
  updatePastEvent,
  deletePastEvent,
} from '../controllers/pastEventController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPublicPastEvents);
router.get('/admin/all', protect, adminOnly, getAdminPastEvents);
router.get('/:id', getPublicPastEvent);
router.post('/', protect, adminOnly, createPastEvent);
router.put('/:id', protect, adminOnly, updatePastEvent);
router.delete('/:id', protect, adminOnly, deletePastEvent);

export default router;
