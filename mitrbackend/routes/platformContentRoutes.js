import express from 'express';
import {
  getPublishedContent,
  getAdminContent,
  saveDraftContent,
  publishContent,
  revertContent,
} from '../controllers/platformContentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPublishedContent);
router.get('/admin', protect, adminOnly, getAdminContent);
router.post('/draft', protect, adminOnly, saveDraftContent);
router.post('/publish', protect, adminOnly, publishContent);
router.post('/revert', protect, adminOnly, revertContent);

export default router;
