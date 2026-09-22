import express from 'express';
import {
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  addTask,
  updateTask,
  deleteTask,
  joinChallenge,
  completeTask,
  submitFeedback,
  getParticipants,
  getChallengeFeedback,
} from '../controllers/challengeController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Shared/Student routes
router.get('/', protect, getAllChallenges);
// Keep this before '/:id', otherwise "admin" is treated as a challenge id.
router.get('/admin/feedback', protect, adminOnly, getChallengeFeedback);
router.get('/:id', protect, getChallengeById);
router.post('/:id/join', protect, joinChallenge);
router.post('/:id/tasks/:taskId/complete', protect, completeTask);
router.post('/:id/tasks/:taskId/feedback', protect, submitFeedback);

// Admin routes
router.post('/', protect, adminOnly, createChallenge);
router.put('/:id', protect, adminOnly, updateChallenge);
router.delete('/:id', protect, adminOnly, deleteChallenge);
router.get('/:id/participants', protect, adminOnly, getParticipants);

router.post('/:id/tasks', protect, adminOnly, addTask);
router.put('/:id/tasks/:taskId', protect, adminOnly, updateTask);
router.delete('/:id/tasks/:taskId', protect, adminOnly, deleteTask);

export default router;
