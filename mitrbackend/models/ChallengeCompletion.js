import mongoose from 'mongoose';

const challengeCompletionSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    dayNumber: { type: Number, required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    completedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Completed'], default: 'Completed' },
  },
  { timestamps: true }
);

challengeCompletionSchema.index({ challengeId: 1, dayNumber: 1, studentId: 1 }, { unique: true });

const ChallengeCompletion = mongoose.model('ChallengeCompletion', challengeCompletionSchema);
export default ChallengeCompletion;
