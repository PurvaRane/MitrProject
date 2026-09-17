import Availability from '../models/Availability.js';
import Appointment from '../models/Appointment.js';
import Counselor from '../models/Counselor.js';
import User from '../models/User.js';

const COUNSELOR_ID = 'dr-kshipra-moghe';

// ── Helper: get today's date as YYYY-MM-DD in IST ────────────────────────────
function getTodayIST() {
  const now = new Date();
  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
}

// ── Helper: check if a date string is in the past ────────────────────────────
function isPastDate(dateStr) {
  const today = getTodayIST();
  return dateStr < today;
}

// ── Helper: generate student initials from name ──────────────────────────────
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ══════════════════════════════════════════════════════════════════════════════
//  PUBLIC / STUDENT ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/appointments/counselor ──────────────────────────────────────────
// Returns the counselor profile (public)
export const getCounselor = async (req, res) => {
  let counselor = await Counselor.findOne({ counselorId: COUNSELOR_ID, isActive: true });

  // Fallback if not seeded yet
  if (!counselor) {
    counselor = {
      counselorId: COUNSELOR_ID,
      name: 'Dr. Kshipra V. Moghe',
      role: 'Nodal Officer & Incharge – Mental Health & Wellbeing Initiative: COEP "मित्र"',
      designation: 'Asst. Professor – Psychology & Consulting Psychologist',
      department: 'Department of Applied Sciences & Humanities',
      institution: 'COEP Tech, Pune',
      email: 'kam.appsci@coeptech.ac.in',
    };
  }

  res.status(200).json({ success: true, counselor });
};

// ── GET /api/appointments/availability?year=2026&month=9 ─────────────────────
// Returns availability for a whole month (for student calendar)
export const getMonthAvailability = async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ success: false, message: 'Year and month are required.' });
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

  const slots = await Availability.find({
    counselorId: COUNSELOR_ID,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1, startTime: 1 });

  // Group by date
  const byDate = {};
  for (const slot of slots) {
    if (!byDate[slot.date]) {
      byDate[slot.date] = { date: slot.date, slots: [], totalSlots: 0, availableSlots: 0, bookedSlots: 0 };
    }
    byDate[slot.date].slots.push({
      _id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.isAvailable ? slot.status : 'unavailable',
    });
    byDate[slot.date].totalSlots++;
    if (slot.isAvailable && slot.status === 'available') byDate[slot.date].availableSlots++;
    if (slot.status === 'booked') byDate[slot.date].bookedSlots++;
  }

  res.status(200).json({ success: true, availability: byDate });
};

// ── GET /api/appointments/availability/date?date=2026-09-18 ──────────────────
// Returns available slots for a specific date (student view)
export const getDateSlots = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required.' });
  }

  if (isPastDate(date)) {
    return res.status(400).json({ success: false, message: 'Cannot view availability for past dates.' });
  }

  const slots = await Availability.find({
    counselorId: COUNSELOR_ID,
    date,
    isAvailable: true,
  }).sort({ startTime: 1 });

  const result = slots.map(s => ({
    _id: s._id,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    isBookable: s.status === 'available',
  }));

  res.status(200).json({ success: true, slots: result, date });
};

// ── POST /api/appointments/book ──────────────────────────────────────────────
// Book an appointment — with atomic double-booking protection
export const bookAppointment = async (req, res) => {
  const { date, startTime, reason } = req.body;
  const studentId = req.user._id;

  if (!date || !startTime) {
    return res.status(400).json({ success: false, message: 'Date and time are required.' });
  }

  if (isPastDate(date)) {
    return res.status(400).json({ success: false, message: 'Cannot book appointments for past dates.' });
  }

  // Check if student already has a confirmed appointment for this date
  const existingStudentAppt = await Appointment.findOne({
    studentId,
    date,
    status: 'confirmed',
  });
  if (existingStudentAppt) {
    return res.status(409).json({
      success: false,
      message: 'You already have a confirmed appointment on this date. Please cancel it first if you need a different time.',
    });
  }

  // ATOMIC: Try to claim the slot — only succeeds if status is still 'available'
  const claimedSlot = await Availability.findOneAndUpdate(
    {
      counselorId: COUNSELOR_ID,
      date,
      startTime,
      status: 'available',
      isAvailable: true,
    },
    { $set: { status: 'booked' } },
    { new: true }
  );

  if (!claimedSlot) {
    return res.status(409).json({
      success: false,
      message: 'This slot was just booked by another student. Please choose another available time.',
    });
  }

  // Create the appointment
  try {
    const appointment = await Appointment.create({
      studentId,
      counselorId: COUNSELOR_ID,
      date,
      startTime,
      endTime: claimedSlot.endTime,
      reason: reason || '',
      status: 'confirmed',
    });

    // Populate student info for response
    const student = await User.findById(studentId);

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed successfully.',
      appointment: {
        ...appointment.toObject(),
        student: student ? {
          name: student.name,
          misId: student.misId,
          initials: getInitials(student.name),
        } : null,
      },
    });
  } catch (err) {
    // If appointment creation fails (e.g. duplicate), revert the slot
    await Availability.findByIdAndUpdate(claimedSlot._id, { status: 'available' });

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This slot was just booked by another student. Please choose another available time.',
      });
    }
    throw err;
  }
};

// ── GET /api/appointments/my ─────────────────────────────────────────────────
// Get student's own appointments
export const getMyAppointments = async (req, res) => {
  const studentId = req.user._id;

  const appointments = await Appointment.find({ studentId })
    .sort({ date: -1, startTime: -1 });

  const today = getTodayIST();

  const upcoming = appointments.filter(a => a.status === 'confirmed' && a.date >= today);
  const past = appointments.filter(a => a.status !== 'confirmed' || a.date < today);

  // Get counselor info
  const counselor = await Counselor.findOne({ counselorId: COUNSELOR_ID });

  res.status(200).json({
    success: true,
    upcoming,
    past,
    counselorName: counselor?.name || 'Dr. Kshipra V. Moghe',
  });
};

// ── PATCH /api/appointments/cancel/:id ───────────────────────────────────────
// Student cancels their own appointment
export const cancelMyAppointment = async (req, res) => {
  const { id } = req.params;
  const studentId = req.user._id;

  const appointment = await Appointment.findOne({
    _id: id,
    studentId,
    status: 'confirmed',
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found or already cancelled.',
    });
  }

  // Cancel the appointment
  appointment.status = 'cancelled';
  appointment.cancelledBy = 'student';
  await appointment.save();

  // Re-open the slot
  await Availability.findOneAndUpdate(
    {
      counselorId: COUNSELOR_ID,
      date: appointment.date,
      startTime: appointment.startTime,
    },
    { $set: { status: 'available' } }
  );

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully. The slot is now available for others.',
    appointment,
  });
};

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/appointments/admin/stats ─────────────────────────────────────────
export const getAdminAppointmentStats = async (req, res) => {
  const today = getTodayIST();

  const [todayAppts, upcomingAppts, availableSlots, bookedSlots] = await Promise.all([
    Appointment.countDocuments({ counselorId: COUNSELOR_ID, date: today, status: 'confirmed' }),
    Appointment.countDocuments({ counselorId: COUNSELOR_ID, date: { $gte: today }, status: 'confirmed' }),
    Availability.countDocuments({ counselorId: COUNSELOR_ID, date: { $gte: today }, status: 'available', isAvailable: true }),
    Availability.countDocuments({ counselorId: COUNSELOR_ID, date: { $gte: today }, status: 'booked' }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      todayAppointments: todayAppts,
      upcomingAppointments: upcomingAppts,
      availableSlots,
      bookedSlots,
    },
  });
};

// ── GET /api/appointments/admin/today ─────────────────────────────────────────
export const getAdminTodaySchedule = async (req, res) => {
  const today = getTodayIST();

  const slots = await Availability.find({
    counselorId: COUNSELOR_ID,
    date: today,
  }).sort({ startTime: 1 });

  const appointments = await Appointment.find({
    counselorId: COUNSELOR_ID,
    date: today,
    status: { $ne: 'cancelled' },
  }).populate('studentId', 'name misId');

  // Build schedule
  const apptMap = {};
  for (const a of appointments) {
    apptMap[a.startTime] = a;
  }

  const schedule = slots.map(slot => {
    const appt = apptMap[slot.startTime];
    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: appt ? appt.status : (slot.isAvailable ? 'available' : 'unavailable'),
      appointment: appt ? {
        _id: appt._id,
        appointmentId: appt.appointmentId,
        studentName: appt.studentId?.name || 'Unknown',
        studentInitials: getInitials(appt.studentId?.name),
        reason: appt.reason,
        status: appt.status,
      } : null,
    };
  });

  res.status(200).json({ success: true, schedule, date: today });
};

// ── GET /api/appointments/admin/all ──────────────────────────────────────────
export const getAdminAllAppointments = async (req, res) => {
  const { status, date, filter, page = 1, limit = 50 } = req.query;
  const today = getTodayIST();

  const mongoFilter = { counselorId: COUNSELOR_ID };

  // Named filter shortcuts from the admin UI dropdown
  if (filter && filter !== 'all') {
    if (filter === 'upcoming') {
      mongoFilter.date = { $gte: today };
      mongoFilter.status = 'confirmed';
    } else if (filter === 'today') {
      mongoFilter.date = today;
      mongoFilter.status = 'confirmed';
    } else if (filter === 'pending') {
      // Appointments confirmed but date is today or future — same as upcoming
      mongoFilter.date = { $gte: today };
      mongoFilter.status = 'confirmed';
    }
  } else {
    // Individual param overrides
    if (status) mongoFilter.status = status;
    if (date) mongoFilter.date = date;
  }

  const total = await Appointment.countDocuments(mongoFilter);
  const appointments = await Appointment.find(mongoFilter)
    .populate('studentId', 'name misId year branch')
    .sort({ date: -1, startTime: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const result = appointments.map(a => ({
    ...a.toObject(),
    // Flatten populated student fields for consistent frontend access
    studentName: a.studentId?.name || 'Unknown',
    studentInitials: getInitials(a.studentId?.name),
    studentMisId: a.studentId?.misId || '—',
    studentYear: a.studentId?.year || '',
    studentBranch: a.studentId?.branch || '',
  }));

  res.status(200).json({ success: true, appointments: result, total, page: parseInt(page) });
};

// ── POST /api/appointments/admin/availability ────────────────────────────────
// Create or update availability slots for a date
export const setAvailability = async (req, res) => {
  const { date, slots } = req.body;

  if (!date || !slots || !Array.isArray(slots)) {
    return res.status(400).json({ success: false, message: 'Date and slots array are required.' });
  }

  const results = [];
  for (const slot of slots) {
    if (!slot.startTime || !slot.endTime) continue;

    const existing = await Availability.findOne({
      counselorId: COUNSELOR_ID,
      date,
      startTime: slot.startTime,
    });

    if (existing) {
      // Don't modify a booked slot
      if (existing.status === 'booked') {
        results.push({ ...existing.toObject(), skipped: true, reason: 'Slot is booked' });
        continue;
      }
      existing.endTime = slot.endTime;
      existing.isAvailable = slot.isAvailable !== false;
      await existing.save();
      results.push(existing.toObject());
    } else {
      const created = await Availability.create({
        counselorId: COUNSELOR_ID,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable !== false,
        status: 'available',
      });
      results.push(created.toObject());
    }
  }

  res.status(200).json({ success: true, message: `Availability updated for ${date}.`, slots: results });
};

// ── DELETE /api/appointments/admin/availability ──────────────────────────────
// Remove a specific slot
export const removeSlot = async (req, res) => {
  const { date, startTime } = req.body;

  if (!date || !startTime) {
    return res.status(400).json({ success: false, message: 'Date and startTime are required.' });
  }

  const slot = await Availability.findOne({
    counselorId: COUNSELOR_ID,
    date,
    startTime,
  });

  if (!slot) {
    return res.status(404).json({ success: false, message: 'Slot not found.' });
  }

  // Check if this slot has a booking
  if (slot.status === 'booked') {
    const appointment = await Appointment.findOne({
      counselorId: COUNSELOR_ID,
      date,
      startTime,
      status: 'confirmed',
    });
    if (appointment) {
      return res.status(409).json({
        success: false,
        message: 'This slot already has an appointment. Please cancel or reschedule the existing appointment before removing this availability.',
      });
    }
  }

  await Availability.deleteOne({ _id: slot._id });
  res.status(200).json({ success: true, message: 'Slot removed.' });
};

// ── PATCH /api/appointments/admin/toggle-day ─────────────────────────────────
// Enable or disable all slots for a date
export const toggleDay = async (req, res) => {
  const { date, isAvailable } = req.body;

  if (!date || isAvailable === undefined) {
    return res.status(400).json({ success: false, message: 'Date and isAvailable are required.' });
  }

  // Only toggle non-booked slots
  const result = await Availability.updateMany(
    { counselorId: COUNSELOR_ID, date, status: { $ne: 'booked' } },
    { $set: { isAvailable: !!isAvailable } }
  );

  res.status(200).json({
    success: true,
    message: `${isAvailable ? 'Enabled' : 'Disabled'} ${result.modifiedCount} slot(s) for ${date}.`,
    modifiedCount: result.modifiedCount,
  });
};

// ── PATCH /api/appointments/admin/:id/status ─────────────────────────────────
// Update appointment status (confirm, complete)
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['confirmed', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be confirmed or completed.' });
  }

  const appointment = await Appointment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('studentId', 'name misId year branch');

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  res.status(200).json({ success: true, message: `Appointment marked as ${status}.`, appointment });
};

// ── PATCH /api/appointments/admin/:id/cancel ─────────────────────────────────
// Admin cancels an appointment
export const adminCancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await Appointment.findOne({ _id: id, status: 'confirmed' });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found or already cancelled/completed.',
    });
  }

  // Cancel the appointment
  appointment.status = 'cancelled';
  appointment.cancelledBy = 'admin';
  appointment.cancelReason = reason || '';
  await appointment.save();

  // Re-open the slot
  await Availability.findOneAndUpdate(
    {
      counselorId: COUNSELOR_ID,
      date: appointment.date,
      startTime: appointment.startTime,
    },
    { $set: { status: 'available' } }
  );

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled. The slot is now available again.',
    appointment,
  });
};
