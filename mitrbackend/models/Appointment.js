import mongoose from 'mongoose';

// Generate a unique appointment ID like "MITR-APPT-8F42"
function generateAppointmentId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MITR-APPT-${suffix}`;
}

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      default: generateAppointmentId,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    counselorId: {
      type: String,
      required: true,
      default: 'dr-kshipra-moghe',
    },
    date: {
      type: String, // "2026-09-18" — plain ISO date string
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String, // "10:00" — 24h format
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // "10:30"
      required: [true, 'End time is required'],
    },
    studentMIS: {
      type: String,
      trim: true,
      default: '',
    },
    studentFirstName: {
      type: String,
      trim: true,
      maxlength: [80, 'First name too long'],
      default: '',
    },
    studentLastName: {
      type: String,
      trim: true,
      maxlength: [80, 'Last name too long'],
      default: '',
    },
    studentBranch: {
      type: String,
      trim: true,
      default: '',
    },
    studentInitials: {
      type: String,
      trim: true,
      default: '',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['confirmed', 'completed', 'cancelled', 'rejected', 'rescheduled'],
      default: 'confirmed',
    },
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['student', 'admin', null],
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent double-booking: only one non-cancelled appointment per slot
appointmentSchema.index(
  { counselorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'cancelled' } },
  }
);

// Efficient student lookup
appointmentSchema.index({ studentId: 1, status: 1 });

// Efficient date-based queries for admin
appointmentSchema.index({ counselorId: 1, date: 1, status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
