import mongoose from 'mongoose';

// Generate a unique appointment ID like "MWC-A1B2C3"
function generateAppointmentId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'MWC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
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
