import express from 'express';
import {
  getCounselor,
  updateCounselor,
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
import { protect, adminOnly, masterAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── Public / Student Routes ───────────────────────────────────────────────────
router.get('/counselor', getCounselor);
router.get('/availability', protect, getMonthAvailability);
router.get('/availability/date', protect, getDateSlots);
router.post('/book', protect, bookAppointment);
router.get('/my', protect, getMyAppointments);
router.patch('/cancel/:id', protect, cancelMyAppointment);

// ── Admin Routes — master_admin only ──────────────────────────────────────────
router.patch('/admin/counselor', protect, masterAdminOnly, updateCounselor);
router.get('/admin/stats', protect, masterAdminOnly, getAdminAppointmentStats);
router.get('/admin/today', protect, masterAdminOnly, getAdminTodaySchedule);
router.get('/admin/all', protect, masterAdminOnly, getAdminAllAppointments);
router.post('/admin/availability', protect, masterAdminOnly, setAvailability);
router.delete('/admin/availability', protect, masterAdminOnly, removeSlot);
router.patch('/admin/toggle-day', protect, masterAdminOnly, toggleDay);
router.patch('/admin/:id/status', protect, masterAdminOnly, updateAppointmentStatus);
router.patch('/admin/:id/cancel', protect, masterAdminOnly, adminCancelAppointment);

export default router;
