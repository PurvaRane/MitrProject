import mongoose from 'mongoose';

const eventReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [300, 'Title too long'],
    },
    date: {
      type: Date,
      required: [true, 'Report date is required'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      maxlength: [10000, 'Summary too long'],
    },
    images: [{ type: String }], // Cloudinary URLs
    fileUrl: { type: String, default: null }, // PDF URL
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

eventReportSchema.index({ date: -1 });

const EventReport = mongoose.model('EventReport', eventReportSchema);
export default EventReport;
