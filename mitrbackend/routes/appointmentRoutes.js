import express from 'express';
import {
  getCounselor,
  getMonthAvailability,
  getDateSlots,
  bookAppointment,
  getMyAppointments,
  cancelMyAppointment,
  getAdminAppointmentStats,
  getAdminTodaySchedule,
  getAdminAllAppointments,
  setAvailability,
  removeSlot,
  toggleDay,
  updateAppointmentStatus,
  adminCancelAppointment,
} from '../controllers/appointmentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── Public / Student Routes ───────────────────────────────────────────────────
router.get('/counselor', getCounselor);
router.get('/availability', protect, getMonthAvailability);
router.get('/availability/date', protect, getDateSlots);
router.post('/book', protect, bookAppointment);
router.get('/my', protect, getMyAppointments);
router.patch('/cancel/:id', protect, cancelMyAppointment);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get('/admin/stats', protect, adminOnly, getAdminAppointmentStats);
router.get('/admin/today', protect, adminOnly, getAdminTodaySchedule);
router.get('/admin/all', protect, adminOnly, getAdminAllAppointments);
router.post('/admin/availability', protect, adminOnly, setAvailability);
router.delete('/admin/availability', protect, adminOnly, removeSlot);
router.patch('/admin/toggle-day', protect, adminOnly, toggleDay);
router.patch('/admin/:id/status', protect, adminOnly, updateAppointmentStatus);
router.patch('/admin/:id/cancel', protect, adminOnly, adminCancelAppointment);

export default router;
