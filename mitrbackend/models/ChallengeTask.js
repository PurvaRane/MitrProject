import mongoose from 'mongoose';

const challengeTaskSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    dayNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    image: { type: String, default: null },
  },
  { timestamps: true }
);

// A challenge can only have one task for a specific dayNumber
challengeTaskSchema.index({ challengeId: 1, dayNumber: 1 }, { unique: true });

const ChallengeTask = mongoose.model('ChallengeTask', challengeTaskSchema);
export default ChallengeTask;
