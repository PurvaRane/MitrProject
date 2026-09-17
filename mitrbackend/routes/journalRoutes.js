import express from 'express';
import { createEntry, getMyEntries, deleteEntry, getAllEntries } from '../controllers/journalController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/',   protect, createEntry);
router.get('/',    protect, getMyEntries);
router.get('/all', protect, adminOnly, getAllEntries);
router.delete('/:id', protect, deleteEntry);

export default router;
