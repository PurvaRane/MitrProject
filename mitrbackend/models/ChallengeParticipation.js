import mongoose from 'mongoose';

const challengeParticipationSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joinedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    progress: { type: Number, default: 0 }, // number of tasks completed
  },
  { timestamps: true }
);

challengeParticipationSchema.index({ challengeId: 1, studentId: 1 }, { unique: true });

const ChallengeParticipation = mongoose.model('ChallengeParticipation', challengeParticipationSchema);
export default ChallengeParticipation;
