import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // ── Old daily-challenge flow (ReflectionPage / admin day-based challenge) ──
    challengeDay: {
      type: Number,
      default: null,
    },
    // ── New task-based challenge flow (ChallengePage / ChallengeTask) ──
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      default: null,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChallengeTask',
      default: null,
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

// For the daily-challenge flow: one submission per user per day number
submissionSchema.index(
  { userId: 1, challengeDay: 1 },
  { unique: true, sparse: true, partialFilterExpression: { challengeDay: { $ne: null } } }
);

// For the task-based flow: one submission per user per task
submissionSchema.index(
  { userId: 1, taskId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { taskId: { $ne: null } } }
);

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
