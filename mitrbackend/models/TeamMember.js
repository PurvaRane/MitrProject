import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name too long'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone too long'],
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [120, 'Email too long'],
      default: '',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: String, default: 'admin' },
    updatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

teamMemberSchema.index({ displayOrder: 1 });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
export default TeamMember;
