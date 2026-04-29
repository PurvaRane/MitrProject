import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengeDay: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
      index: true,
    },
    reflectionText: {
      type: String,
      trim: true,
      maxlength: [5000, 'Reflection cannot exceed 5000 characters'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Composite index: one submission per user per day
submissionSchema.index({ userId: 1, challengeDay: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
