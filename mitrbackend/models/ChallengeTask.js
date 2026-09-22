import mongoose from 'mongoose';

// A challenge consists of one or more ordered daily tasks.  This model is
// intentionally separate from Challenge so task completion and reflections can
// safely reference a stable task id.
const challengeTaskSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: [1, 'Day number must be at least 1'],
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order cannot be negative'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'Task title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Task description cannot exceed 2000 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [4000, 'Instructions cannot exceed 4000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

challengeTaskSchema.index({ challengeId: 1, dayNumber: 1, order: 1 });

const ChallengeTask = mongoose.model('ChallengeTask', challengeTaskSchema);
export default ChallengeTask;
