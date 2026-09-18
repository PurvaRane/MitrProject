import mongoose from 'mongoose';

export const PAST_EVENT_CATEGORIES = [
  'Workshop',
  'Seminar',
  'Awareness Program',
  'Wellness Activity',
  'Counseling',
  'Outreach',
  'Campaign',
  'Student Activity',
  'Other',
];

const pastEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [400, 'Short description cannot exceed 400 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [8000, 'Description cannot exceed 8000 characters'],
      default: '',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    academicYear: {
      type: String,
      trim: true,
      maxlength: [20, 'Academic year too long'],
      default: '',
    },
    category: {
      type: String,
      enum: PAST_EVENT_CATEGORIES,
      default: 'Other',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location too long'],
      default: '',
    },
    organizer: {
      type: String,
      trim: true,
      maxlength: [200, 'Organizer too long'],
      default: 'COEP "मित्र"',
    },
    featuredImage: {
      type: String,
      default: null,
    },
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String, trim: true, maxlength: [200], default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    createdBy: { type: String, default: 'admin' },
    updatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

pastEventSchema.index({ eventDate: -1 });
pastEventSchema.index({ status: 1, eventDate: -1 });
pastEventSchema.index({ category: 1 });

const PastEvent = mongoose.model('PastEvent', pastEventSchema);
export default PastEvent;
