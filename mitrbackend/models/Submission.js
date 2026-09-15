import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChallengeTask',
      required: true,
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

// Composite index: one submission per user per task
submissionSchema.index({ userId: 1, challengeId: 1, taskId: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
