import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
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

// ── POST /api/events/:id/register (Student) ───────────────────────────────────
export const registerForEvent = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (!event.registrationRequired) return res.status(400).json({ success: false, message: 'Registration not required' });
  if (event.status !== 'Upcoming' && event.status !== 'Ongoing') return res.status(400).json({ success: false, message: 'Event is not accepting registrations' });

  // Check capacity
  if (event.capacity) {
    const count = await EventRegistration.countDocuments({ eventId: id, status: 'Registered' });
    if (count >= event.capacity) return res.status(400).json({ success: false, message: 'Event is full' });
  }

  const existing = await EventRegistration.findOne({ eventId: id, studentId: req.user._id });
  if (existing) {
    if (existing.status === 'Registered') return res.status(400).json({ success: false, message: 'Already registered' });
    // If previously cancelled, re-register
    existing.status = 'Registered';
    await existing.save();
    return res.status(200).json({ success: true, registration: existing });
  }

  const registration = await EventRegistration.create({ eventId: id, studentId: req.user._id });
  res.status(201).json({ success: true, registration });
};

// ── DELETE /api/events/:id/register (Student) ─────────────────────────────────
export const cancelRegistration = async (req, res) => {
  const { id } = req.params;
  const existing = await EventRegistration.findOne({ eventId: id, studentId: req.user._id });
  if (!existing || existing.status === 'Cancelled') {
    return res.status(400).json({ success: false, message: 'Not registered' });
  }
  existing.status = 'Cancelled';
  await existing.save();
  res.status(200).json({ success: true, message: 'Registration cancelled' });
};

// ── GET /api/events/:id/registrations (Admin) ─────────────────────────────────
export const getEventRegistrations = async (req, res) => {
  const { id } = req.params;
  const registrations = await EventRegistration.find({ eventId: id, status: 'Registered' }).populate('studentId', 'name misId email');
  res.status(200).json({ success: true, registrations });
};

// ── GET /api/events/my-registrations (Student) ────────────────────────────────
export const getMyRegistrations = async (req, res) => {
  if (req.user?.role === 'admin') return res.status(200).json({ success: true, registrations: [] });
  const registrations = await EventRegistration.find({ studentId: req.user._id, status: 'Registered' });
  res.status(200).json({ success: true, registrations });
};
