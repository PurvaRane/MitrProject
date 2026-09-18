import PastEvent, { PAST_EVENT_CATEGORIES } from '../models/PastEvent.js';
import { resolveImage } from '../config/cloudinary.js';

const MAX_IMAGES = 20;

function actor(req) {
  return req.user?.role === 'admin' ? 'admin' : (req.user?._id?.toString() || 'admin');
}

async function normalizeImages(rawImages = []) {
  if (!Array.isArray(rawImages)) return [];
  if (rawImages.length > MAX_IMAGES) {
    const err = new Error(`A past event can include at most ${MAX_IMAGES} images.`);
    err.status = 400;
    throw err;
  }
  const out = [];
  for (const item of rawImages) {
    const raw = typeof item === 'string' ? item : item?.url;
    if (!raw) continue;
    const url = await resolveImage(raw, 'mitr/past-events');
    out.push({
      url,
      caption: typeof item === 'object' ? (item.caption || '').trim() : '',
    });
  }
  return out;
}

export const getPublicPastEvents = async (req, res) => {
  const { year, category, search } = req.query;
  const filter = { status: 'published' };

  if (category && category !== 'All') filter.category = category;
  if (year) {
    const y = parseInt(year, 10);
    if (!Number.isNaN(y)) {
      filter.eventDate = { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31T23:59:59.999Z`) };
    }
  }
  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { shortDescription: { $regex: search.trim(), $options: 'i' } },
      { location: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const events = await PastEvent.find(filter).sort({ eventDate: -1 });
  res.status(200).json({ success: true, events, categories: PAST_EVENT_CATEGORIES });
};

export const getPublicPastEvent = async (req, res) => {
  const event = await PastEvent.findOne({ _id: req.params.id, status: 'published' });
  if (!event) return res.status(404).json({ success: false, message: 'Past event not found.' });
  res.status(200).json({ success: true, event });
};

export const getAdminPastEvents = async (_req, res) => {
  const events = await PastEvent.find().sort({ eventDate: -1 });
  res.status(200).json({ success: true, events, categories: PAST_EVENT_CATEGORIES });
};

export const createPastEvent = async (req, res) => {
  const {
    title, shortDescription, description, eventDate, academicYear,
    category, location, organizer, featuredImage, images, status,
  } = req.body;

  if (!title?.trim() || !eventDate) {
    return res.status(400).json({ success: false, message: 'Title and event date are required.' });
  }

  let imageDocs = [];
  try {
    imageDocs = await normalizeImages(images);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }

  let featured = featuredImage || imageDocs[0]?.url || null;
  if (featuredImage) {
    try {
      featured = await resolveImage(featuredImage, 'mitr/past-events');
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  }

  const event = await PastEvent.create({
    title: title.trim(),
    shortDescription: (shortDescription || '').trim(),
    description: (description || '').trim(),
    eventDate: new Date(eventDate),
    academicYear: (academicYear || '').trim(),
    category: PAST_EVENT_CATEGORIES.includes(category) ? category : 'Other',
    location: (location || '').trim(),
    organizer: (organizer || 'COEP "मित्र"').trim(),
    featuredImage: featured,
    images: imageDocs,
    status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
    createdBy: actor(req),
    updatedBy: actor(req),
  });

  res.status(201).json({ success: true, event });
};

export const updatePastEvent = async (req, res) => {
  const event = await PastEvent.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Past event not found.' });

  const {
    title, shortDescription, description, eventDate, academicYear,
    category, location, organizer, featuredImage, images, status,
  } = req.body;

  if (title !== undefined) event.title = title.trim();
  if (shortDescription !== undefined) event.shortDescription = shortDescription.trim();
  if (description !== undefined) event.description = description.trim();
  if (eventDate !== undefined) event.eventDate = new Date(eventDate);
  if (academicYear !== undefined) event.academicYear = academicYear.trim();
  if (category !== undefined) event.category = PAST_EVENT_CATEGORIES.includes(category) ? category : event.category;
  if (location !== undefined) event.location = location.trim();
  if (organizer !== undefined) event.organizer = organizer.trim();
  if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) event.status = status;

  if (images !== undefined) {
    try {
      event.images = await normalizeImages(images);
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  }

  if (featuredImage !== undefined) {
    if (!featuredImage) {
      event.featuredImage = event.images[0]?.url || null;
    } else {
      try {
        event.featuredImage = await resolveImage(featuredImage, 'mitr/past-events');
      } catch (err) {
        return res.status(err.status || 400).json({ success: false, message: err.message });
      }
    }
  }

  event.updatedBy = actor(req);
  await event.save();
  res.status(200).json({ success: true, event });
};

export const deletePastEvent = async (req, res) => {
  const event = await PastEvent.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Past event not found.' });
  res.status(200).json({ success: true, message: 'Past event deleted.' });
};
