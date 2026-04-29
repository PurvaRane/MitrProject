import express from 'express';
import { createEntry, getMyEntries, deleteEntry } from '../controllers/journalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/',   protect, createEntry);
router.get('/',    protect, getMyEntries);
router.delete('/:id', protect, deleteEntry);

export default router;
