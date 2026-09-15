import mongoose from 'mongoose';

const challengeFeedbackSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChallengeTask', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood: { type: String, enum: ['Great', 'Good', 'Okay', 'Difficult', 'Not helpful'], required: true },
    text: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

challengeFeedbackSchema.index({ challengeId: 1, taskId: 1, studentId: 1 }, { unique: true });

const ChallengeFeedback = mongoose.model('ChallengeFeedback', challengeFeedbackSchema);
export default ChallengeFeedback;
