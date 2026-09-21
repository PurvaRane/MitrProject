import express from 'express';
import {
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  completeDay,
  submitFeedback,
  getParticipants,
} from '../controllers/challengeController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Shared/Student routes
router.get('/', protect, getAllChallenges);
router.get('/:id', protect, getChallengeById);
router.post('/:id/join', protect, joinChallenge);
router.post('/:id/day/:dayNumber/complete', protect, completeDay);
router.post('/:id/day/:dayNumber/feedback', protect, submitFeedback);

// Admin routes
router.post('/', protect, adminOnly, createChallenge);
router.put('/:id', protect, adminOnly, updateChallenge);
router.delete('/:id', protect, adminOnly, deleteChallenge);
router.get('/:id/participants', protect, adminOnly, getParticipants);

export default router;
