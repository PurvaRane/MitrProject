import Event from '../models/Event.js';
import { uploadImage } from '../config/cloudinary.js';

// ── GET /api/events ──────────────────────────────────────────────────────────
export const getEvents = async (req, res) => {
  console.log('[GET /api/events] query:', req.query);
  const filter = {};
  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }
  const events = await Event.find(filter).sort({ date: 1 });
  console.log('[GET /api/events] Found:', events.length);
  res.status(200).json({ success: true, count: events.length, events });
};

// ── POST /api/events ─────────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
  const { title, description, date, category, imageUrl: rawImage } = req.body;

  console.log('[POST /api/events] Incoming body:', { title, description, date, category });

  if (!title || !date) {
    return res.status(400).json({
      success: false,
      message: 'Title and date are required.',
    });
  }

  // Upload image to Cloudinary if base64 provided — isolated so failure doesn't kill the event
  let imageUrl = null;
  if (rawImage) {
    try {
      if (rawImage.startsWith('http')) {
        imageUrl = rawImage;
      } else {
        imageUrl = await uploadImage(rawImage, 'mitr/events');
      }
    } catch (imgErr) {
      console.warn('[POST /api/events] Image upload failed (continuing without image):', imgErr.message);
    }
  }

  console.log('[POST /api/events] Creating event document…');
  const event = await Event.create({
    title: title.trim(),
    description: description?.trim() || '',
    date: new Date(date),
    category: category || 'Workshop',
    imageUrl,
    createdBy: req.user?._id?.toString() || req.user?.id || 'admin',
  });

  console.log('[POST /api/events] ✅ Event saved:', event._id, event.title);
  res.status(201).json({ success: true, event });
};

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }
  console.log('[DELETE /api/events] ✅ Deleted:', req.params.id);
  res.status(200).json({ success: true, message: 'Event deleted.' });
};
