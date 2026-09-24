import mongoose from 'mongoose';

const dailyMoodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD' formatted date in IST
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    moodScore: {
      type: Number,
      required: [true, 'Mood score is required'],
      min: [1, 'Mood score must be between 1 and 5'],
      max: [5, 'Mood score must be between 1 and 5'],
    },
    energyScore: {
      type: Number,
      required: [true, 'Energy score is required'],
      min: [1, 'Energy score must be between 1 and 5'],
      max: [5, 'Energy score must be between 1 and 5'],
    },
    feeling: {
      type: String,
      trim: true,
      default: '',
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent duplicate entries for the same user on the same calendar day
dailyMoodSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyMood = mongoose.model('DailyMood', dailyMoodSchema);
export default DailyMood;
