import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Mental Well-being', 'Physical Well-being', 'Emotional Well-being', 'Social Well-being', 'Academic Well-being', 'Mindfulness', 'Sleep', 'Digital Wellness', 'Self-care', 'Gratitude', 'Other'],
      default: 'Mental Well-being',
    },
    instructions: { type: String, trim: true, default: '' },
    image: { type: String, default: null }, // Optional cover image
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 }, // in days
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Active', 'Completed', 'Archived'],
      default: 'Draft',
    },
    createdBy: { type: mongoose.Schema.Types.Mixed, default: 'admin' },
  },
  { timestamps: true }
);

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
