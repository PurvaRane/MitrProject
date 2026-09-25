import fs from 'fs';
const file = '/Users/purvanitinrane/MitrProject/mitrbackend/controllers/appointmentController.js';
let content = fs.readFileSync(file, 'utf8');

const newFunctions = `
// ── POST /api/appointments/reschedule/:id ──────────────────────────────────
// Student reschedules an appointment
export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { newDate, newStartTime } = req.body;
  const studentId = req.user._id;

  if (!newDate || !newStartTime) {
    return res.status(400).json({ success: false, message: 'New date and time are required.' });
  }

  const oldAppointment = await Appointment.findOne({
    _id: id,
    studentId,
    status: { $in: ['confirmed', 'rejected'] }, // can reschedule a confirmed or rejected appt
  });

  if (!oldAppointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found or not eligible for rescheduling.' });
  }

  // ATOMIC: Try to claim the new slot
  const claimedSlot = await Availability.findOneAndUpdate(
    {
      counselorId: COUNSELOR_ID,
      date: newDate,
      startTime: newStartTime,
      status: 'available',
      isAvailable: true,
    },
    { $set: { status: 'booked' } },
    { new: true }
  );

  if (!claimedSlot) {
    return res.status(409).json({ success: false, message: 'The selected slot is no longer available.' });
  }

  try {
    const student = await User.findById(studentId);
    
    // Create new appointment
    const newAppointment = await Appointment.create({
      appointmentId: await uniqueAppointmentId(Appointment, student.role, student.branch, student.year),
      studentId,
      counselorId: COUNSELOR_ID,
      date: newDate,
      startTime: newStartTime,
      endTime: claimedSlot.endTime,
      reason: oldAppointment.reason,
      status: 'confirmed',
      studentMIS: oldAppointment.studentMIS,
      studentFirstName: oldAppointment.studentFirstName,
      studentLastName: oldAppointment.studentLastName,
      studentBranch: oldAppointment.studentBranch,
      studentInitials: oldAppointment.studentInitials,
    });

    // Update old appointment
    oldAppointment.status = 'rescheduled';
    oldAppointment.rescheduledTo = newAppointment._id;
    await oldAppointment.save();

    // Free up old slot if it was confirmed (if it was rejected, it might already be freed, but we should make sure)
    await Availability.findOneAndUpdate(
      {
        counselorId: COUNSELOR_ID,
        date: oldAppointment.date,
        startTime: oldAppointment.startTime,
        status: 'booked'
      },
      { $set: { status: 'available' } }
    );

    res.status(201).json({ success: true, message: 'Appointment rescheduled successfully.', appointment: newAppointment });
  } catch (err) {
    // Revert new slot
    await Availability.findByIdAndUpdate(claimedSlot._id, { status: 'available' });
    throw err;
  }
};

// ── PATCH /api/appointments/admin/:id/reject ───────────────────────────────
export const adminRejectAppointment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await Appointment.findOne({ _id: id, status: 'confirmed' });

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found or not in confirmed state.' });
  }

  appointment.status = 'rejected';
  appointment.cancelledBy = 'admin';
  appointment.cancelReason = reason || 'Rejected by administration';
  await appointment.save();

  // Free the slot
  await Availability.findOneAndUpdate(
    {
      counselorId: COUNSELOR_ID,
      date: appointment.date,
      startTime: appointment.startTime,
    },
    { $set: { status: 'available' } }
  );

  res.status(200).json({ success: true, message: 'Appointment rejected.', appointment });
};

// ── POST /api/appointments/admin/:id/reschedule ────────────────────────────
export const adminRescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { newDate, newStartTime } = req.body;

  if (!newDate || !newStartTime) {
    return res.status(400).json({ success: false, message: 'New date and time are required.' });
  }

  const oldAppointment = await Appointment.findOne({
    _id: id,
    status: { $in: ['confirmed', 'rejected'] }
  });

  if (!oldAppointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found or not eligible.' });
  }

  const claimedSlot = await Availability.findOneAndUpdate(
    {
      counselorId: COUNSELOR_ID,
      date: newDate,
      startTime: newStartTime,
      status: 'available',
      isAvailable: true,
    },
    { $set: { status: 'booked' } },
    { new: true }
  );

  if (!claimedSlot) {
    return res.status(409).json({ success: false, message: 'The selected slot is no longer available.' });
  }

  try {
    const student = await User.findById(oldAppointment.studentId);
    
    const newAppointment = await Appointment.create({
      appointmentId: await uniqueAppointmentId(Appointment, student.role, student.branch, student.year),
      studentId: oldAppointment.studentId,
      counselorId: COUNSELOR_ID,
      date: newDate,
      startTime: newStartTime,
      endTime: claimedSlot.endTime,
      reason: oldAppointment.reason,
      status: 'confirmed',
      studentMIS: oldAppointment.studentMIS,
      studentFirstName: oldAppointment.studentFirstName,
      studentLastName: oldAppointment.studentLastName,
      studentBranch: oldAppointment.studentBranch,
      studentInitials: oldAppointment.studentInitials,
    });

    oldAppointment.status = 'rescheduled';
    oldAppointment.rescheduledTo = newAppointment._id;
    await oldAppointment.save();

    await Availability.findOneAndUpdate(
      {
        counselorId: COUNSELOR_ID,
        date: oldAppointment.date,
        startTime: oldAppointment.startTime,
        status: 'booked'
      },
      { $set: { status: 'available' } }
    );

    res.status(201).json({ success: true, message: 'Appointment rescheduled by admin.', appointment: newAppointment });
  } catch (err) {
    await Availability.findByIdAndUpdate(claimedSlot._id, { status: 'available' });
    throw err;
  }
};
`;

fs.appendFileSync(file, newFunctions);
console.log('Appended to appointmentController.js');
