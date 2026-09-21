import mongoose from 'mongoose';

const challengeFeedbackSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    dayNumber: { type: Number, required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood: { type: String, enum: ['Great', 'Good', 'Okay', 'Difficult', 'Not helpful'], required: true },
    text: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

challengeFeedbackSchema.index({ challengeId: 1, dayNumber: 1, studentId: 1 }, { unique: true });

const ChallengeFeedback = mongoose.model('ChallengeFeedback', challengeFeedbackSchema);
export default ChallengeFeedback;
