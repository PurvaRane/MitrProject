import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Entry',
    },
    body: {
      type: String,
      required: [true, 'Journal content is required'],
      trim: true,
      maxlength: [10000, 'Journal content cannot exceed 10000 characters'],
    },
    mood: {
      type: String,
      enum: ['happy', 'calm', 'anxious', 'sad', 'tired', 'excited', 'none'],
      default: 'none',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Journal = mongoose.model('Journal', journalSchema);
export default Journal;
