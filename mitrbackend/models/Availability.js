import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    counselorId: {
      type: String,
      required: [true, 'Counselor ID is required'],
      default: 'dr-kshipra-moghe',
      index: true,
    },
    date: {
      type: String, // "2026-09-18" — stored as plain ISO date string (IST-safe)
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'],
    },
    startTime: {
      type: String, // "09:00" — 24h format
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be HH:MM format'],
    },
    endTime: {
      type: String, // "09:30" — 24h format
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'End time must be HH:MM format'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available',
    },
  },
  { timestamps: true }
);

// Prevent duplicate slots for the same counselor, date, and start time
availabilitySchema.index(
  { counselorId: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Efficient lookup by counselor + date range
availabilitySchema.index({ counselorId: 1, date: 1 });

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;
