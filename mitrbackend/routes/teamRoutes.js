import express from 'express';
import {
  getPublicTeam,
  getAdminTeam,
  createTeamMember,
  updateTeamMember,
  reorderTeam,
  deleteTeamMember,
} from '../controllers/teamController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPublicTeam);
router.get('/admin', protect, adminOnly, getAdminTeam);
router.post('/', protect, adminOnly, createTeamMember);
router.patch('/reorder', protect, adminOnly, reorderTeam);
router.patch('/:id', protect, adminOnly, updateTeamMember);
router.delete('/:id', protect, adminOnly, deleteTeamMember);

export default router;
