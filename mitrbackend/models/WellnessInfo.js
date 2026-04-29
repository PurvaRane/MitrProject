import mongoose from 'mongoose';

const wellnessInfoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title too long'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description too long'],
    },
    vision: {
      type: String,
      trim: true,
      maxlength: [1000, 'Vision too long'],
    },
    services: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
    lastUpdatedBy: {
      type: String,
      default: 'admin',
    },
  },
  { timestamps: true }
);

const WellnessInfo = mongoose.model('WellnessInfo', wellnessInfoSchema);
export default WellnessInfo;
