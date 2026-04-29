import Journal from '../models/Journal.js';

// ── POST /api/journal — Create entry ────────────────────────────────────────
export const createEntry = async (req, res) => {
  const { title, body, mood, isAnonymous } = req.body;
  const userId = req.user._id;

  if (!body) {
    return res.status(400).json({ success: false, message: 'Content is required.' });
  }

  const entry = await Journal.create({
    userId,
    title: title || 'Untitled Entry',
    body,
    mood: mood || 'none',
    isAnonymous: !!isAnonymous,
  });

  res.status(201).json({ success: true, entry });
};

// ── GET /api/journal — Get user's entries ────────────────────────────────────
export const getMyEntries = async (req, res) => {
  const entries = await Journal.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: entries.length, entries });
};

// ── DELETE /api/journal/:id — Delete entry ───────────────────────────────────
export const deleteEntry = async (req, res) => {
  const entry = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found.' });
  }
  res.status(200).json({ success: true, message: 'Entry deleted.' });
};
