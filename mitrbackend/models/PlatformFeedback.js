import mongoose from 'mongoose';

const platformFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userRole: {
      type: String,
      enum: ['student', 'faculty'],
      required: [true, 'User role is required'],
    },
    userIdentifier: {
      type: String, // MIS for student, email for faculty (internal only, never shown publicly)
      default: '',
    },
    userName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      required: [true, 'Feedback type is required'],
      enum: [
        'Activity Suggestion',
        'Event Suggestion',
        'Platform Improvement',
        'Support Feedback',
        'General Feedback',
        'Other',
      ],
      default: 'General Feedback',
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      trim: true,
      maxlength: [3000, 'Feedback cannot exceed 3000 characters'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Archived'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

platformFeedbackSchema.index({ createdAt: -1 });
platformFeedbackSchema.index({ type: 1 });
platformFeedbackSchema.index({ status: 1 });

const PlatformFeedback = mongoose.model('PlatformFeedback', platformFeedbackSchema);
export default PlatformFeedback;
