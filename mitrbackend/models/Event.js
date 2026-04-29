import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    category: {
      type: String,
      enum: ['Workshop', 'Awareness', 'Challenge', 'Seminar', 'Other'],
      default: 'Workshop',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String, // 'admin' or user ID string
      default: 'admin',
    },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
