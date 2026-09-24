import express from 'express';
import {
  createEntry,
  getMyEntries,
  updateEntry,
  deleteEntry,
  getVaultEntries,
  getAllEntries,
} from '../controllers/journalController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createEntry);
router.get('/', protect, getMyEntries);
router.get('/vault', protect, getVaultEntries);
router.put('/:id', protect, updateEntry);
router.patch('/:id', protect, updateEntry);
router.delete('/:id', protect, deleteEntry);

// Strictly anonymous admin aggregate endpoint
router.get('/all', protect, adminOnly, getAllEntries);

export default router;
