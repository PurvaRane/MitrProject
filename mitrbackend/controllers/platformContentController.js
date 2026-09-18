import PlatformContent from '../models/PlatformContent.js';
import { resolveImage } from '../config/cloudinary.js';

const EMPTY_FEATURED = {
  title: '',
  description: '',
  imageUrl: null,
  date: '',
  ctaLabel: 'Learn More',
  ctaLink: '/events',
  isVisible: false,
};

const EMPTY_CONTENT = {
  introTitle: 'COEP "मित्र" Mental Health & Wellbeing',
  introSubtitle: '',
  introDescription: '',
  welcomeMessage: '',
  supportDescription: '',
  challengesIntro: '',
  featuredChallengeMessage: '',
  eventsIntro: '',
  aboutText: '',
  contactMessage: '',
  showPastEvents: true,
  featuredEvent: { ...EMPTY_FEATURED },
};

function pickContent(body = {}) {
  const next = { ...EMPTY_CONTENT, ...body, featuredEvent: { ...EMPTY_FEATURED, ...(body.featuredEvent || {}) } };
  return {
    introTitle: String(next.introTitle || '').slice(0, 200),
    introSubtitle: String(next.introSubtitle || '').slice(0, 200),
    introDescription: String(next.introDescription || '').slice(0, 4000),
    welcomeMessage: String(next.welcomeMessage || '').slice(0, 500),
    supportDescription: String(next.supportDescription || '').slice(0, 2000),
    challengesIntro: String(next.challengesIntro || '').slice(0, 1000),
    featuredChallengeMessage: String(next.featuredChallengeMessage || '').slice(0, 500),
    eventsIntro: String(next.eventsIntro || '').slice(0, 1000),
    aboutText: String(next.aboutText || '').slice(0, 4000),
    contactMessage: String(next.contactMessage || '').slice(0, 1000),
    showPastEvents: next.showPastEvents !== false,
    featuredEvent: {
      title: String(next.featuredEvent.title || '').slice(0, 200),
      description: String(next.featuredEvent.description || '').slice(0, 1000),
      imageUrl: next.featuredEvent.imageUrl || null,
      date: String(next.featuredEvent.date || ''),
      ctaLabel: String(next.featuredEvent.ctaLabel || 'Learn More').slice(0, 60),
      ctaLink: String(next.featuredEvent.ctaLink || '/events').slice(0, 300),
      isVisible: !!next.featuredEvent.isVisible,
    },
  };
}

async function ensureDoc() {
  let doc = await PlatformContent.findOne({ key: 'platform' });
  if (!doc) {
    doc = await PlatformContent.create({
      key: 'platform',
      draft: EMPTY_CONTENT,
      published: EMPTY_CONTENT,
      status: 'draft',
    });
  }
  return doc;
}

async function maybeUploadFeatured(featuredEvent) {
  if (!featuredEvent?.imageUrl) return featuredEvent;
  if (featuredEvent.imageUrl.startsWith('http')) return featuredEvent;
  const url = await resolveImage(featuredEvent.imageUrl, 'mitr/content');
  return { ...featuredEvent, imageUrl: url };
}

export const getPublishedContent = async (_req, res) => {
  const doc = await ensureDoc();
  res.status(200).json({ success: true, content: doc.published || EMPTY_CONTENT });
};

export const getAdminContent = async (_req, res) => {
  const doc = await ensureDoc();
  res.status(200).json({
    success: true,
    draft: doc.draft || EMPTY_CONTENT,
    published: doc.published || EMPTY_CONTENT,
    status: doc.status,
    updatedAt: doc.updatedAt,
  });
};

export const saveDraftContent = async (req, res) => {
  const doc = await ensureDoc();
  let payload = pickContent({ ...(doc.draft?.toObject?.() || doc.draft || {}), ...req.body });
  try {
    payload.featuredEvent = await maybeUploadFeatured(payload.featuredEvent);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
  doc.draft = payload;
  doc.status = 'draft';
  doc.lastUpdatedBy = 'admin';
  await doc.save();
  res.status(200).json({ success: true, draft: doc.draft, status: doc.status, message: 'Draft saved.' });
};

export const publishContent = async (req, res) => {
  const doc = await ensureDoc();
  let payload = pickContent({ ...(doc.draft?.toObject?.() || doc.draft || {}), ...req.body });
  if (!payload.introTitle.trim()) {
    return res.status(400).json({ success: false, message: 'Platform title is required before publishing.' });
  }
  try {
    payload.featuredEvent = await maybeUploadFeatured(payload.featuredEvent);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
  doc.draft = payload;
  doc.published = payload;
  doc.status = 'published';
  doc.lastUpdatedBy = 'admin';
  await doc.save();
  res.status(200).json({ success: true, published: doc.published, draft: doc.draft, status: doc.status, message: 'Content published.' });
};

export const revertContent = async (_req, res) => {
  const doc = await ensureDoc();
  doc.draft = doc.published || EMPTY_CONTENT;
  doc.lastUpdatedBy = 'admin';
  await doc.save();
  res.status(200).json({ success: true, draft: doc.draft, message: 'Draft reverted to last published version.' });
};
