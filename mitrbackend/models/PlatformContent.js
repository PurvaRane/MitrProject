import mongoose from 'mongoose';

const featuredEventShape = {
  title: { type: String, trim: true, maxlength: 200, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  imageUrl: { type: String, default: null },
  date: { type: String, trim: true, default: '' },
  ctaLabel: { type: String, trim: true, maxlength: 60, default: 'Learn More' },
  ctaLink: { type: String, trim: true, maxlength: 300, default: '/events' },
  isVisible: { type: Boolean, default: false },
};

const contentFields = {
  introTitle: { type: String, trim: true, maxlength: 200, default: 'COEP "मित्र" Mental Health & Wellbeing' },
  introSubtitle: { type: String, trim: true, maxlength: 200, default: '' },
  introDescription: { type: String, trim: true, maxlength: 4000, default: '' },
  welcomeMessage: { type: String, trim: true, maxlength: 500, default: '' },
  supportDescription: { type: String, trim: true, maxlength: 2000, default: '' },
  challengesIntro: { type: String, trim: true, maxlength: 1000, default: '' },
  featuredChallengeMessage: { type: String, trim: true, maxlength: 500, default: '' },
  eventsIntro: { type: String, trim: true, maxlength: 1000, default: '' },
  aboutText: { type: String, trim: true, maxlength: 4000, default: '' },
  contactMessage: { type: String, trim: true, maxlength: 1000, default: '' },
  showPastEvents: { type: Boolean, default: true },
  featuredEvent: featuredEventShape,
};

const platformContentSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'platform' },
    draft: contentFields,
    published: contentFields,
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    lastUpdatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

const PlatformContent = mongoose.model('PlatformContent', platformContentSchema);
export default PlatformContent;
