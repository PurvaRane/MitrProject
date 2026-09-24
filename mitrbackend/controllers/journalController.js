import Journal from '../models/Journal.js';
import Submission from '../models/Submission.js';

// ── POST /api/journal — Create personal journal entry ─────────────────────────
export const createEntry = async (req, res) => {
  const { title, body, mood, isAnonymous } = req.body;
  const userId = req.user._id;

  if (!body || !body.trim()) {
    return res.status(400).json({ success: false, message: 'Content is required.' });
  }

  const entry = await Journal.create({
    userId,
    title: (title || '').trim() || 'Untitled Entry',
    body: body.trim(),
    mood: mood || 'none',
    isAnonymous: !!isAnonymous,
  });

  res.status(201).json({ success: true, entry });
};

// ── GET /api/journal — Get user's own entries ─────────────────────────────────
export const getMyEntries = async (req, res) => {
  if (req.user._id === 'admin') {
    return res.status(200).json({ success: true, count: 0, entries: [] });
  }
  const entries = await Journal.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: entries.length, entries });
};

// ── PATCH /api/journal/:id — Update user's own journal entry ──────────────────
export const updateEntry = async (req, res) => {
  if (req.user._id === 'admin') {
    return res.status(403).json({ success: false, message: 'Admins cannot edit personal entries.' });
  }

  const { title, body, mood } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title.trim() || 'Untitled Entry';
  if (body !== undefined) updates.body = body.trim();
  if (mood !== undefined) updates.mood = mood;

  const entry = await Journal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true }
  );

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found or access denied.' });
  }

  res.status(200).json({ success: true, message: 'Entry updated successfully.', entry });
};

// ── DELETE /api/journal/:id — Delete user's own journal entry ─────────────────
export const deleteEntry = async (req, res) => {
  if (req.user._id === 'admin') {
    return res.status(403).json({ success: false, message: 'Admins cannot delete personal journals here.' });
  }
  const entry = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found or access denied.' });
  }
  res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
};

// ── GET /api/journal/vault — Comprehensive Private Reflection Vault ───────────
// Combines private journals and challenge task reflections for the logged-in user
export const getVaultEntries = async (req, res) => {
  if (req.user._id === 'admin') {
    return res.status(200).json({ success: true, count: 0, entries: [] });
  }

  const userId = req.user._id;

  // 1. Personal journals
  const journals = await Journal.find({ userId }).sort({ createdAt: -1 });

  // 2. Challenge reflections
  const submissions = await Submission.find({
    userId,
    reflectionText: { $exists: true, $ne: '' },
  })
    .populate('challengeId', 'title category')
    .populate('taskId', 'title dayNumber')
    .sort({ createdAt: -1 });

  const formattedJournals = journals.map(j => ({
    _id: j._id,
    id: j._id,
    type: 'journal',
    title: j.title || 'Personal Reflection',
    body: j.body,
    mood: j.mood || 'none',
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
    canEdit: true,
    canDelete: true,
  }));

  const formattedSubmissions = submissions.map(s => {
    const challengeName = s.challengeId?.title || (s.challengeDay ? `Daily Challenge (Day ${s.challengeDay})` : 'Challenge Activity');
    const taskName = s.taskId?.title ? `Day ${s.taskId.dayNumber}: ${s.taskId.title}` : '';
    return {
      _id: s._id,
      id: s._id,
      type: 'challenge',
      title: taskName ? `${challengeName} — ${taskName}` : challengeName,
      body: s.reflectionText,
      mood: 'none',
      imageUrl: s.imageUrl || null,
      createdAt: s.submittedAt || s.createdAt,
      canEdit: false,
      canDelete: false,
    };
  });

  const allEntries = [...formattedJournals, ...formattedSubmissions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.status(200).json({
    success: true,
    count: allEntries.length,
    entries: allEntries,
  });
};

// ── GET /api/journal/all — Admin: strictly anonymous entries ──────────────────
// PRIVACY RULE: Administrators must NOT be able to see student identities or personal identifiers alongside reflections.
export const getAllEntries = async (req, res) => {
  const entries = await Journal.find({}, '-userId')
    .sort({ createdAt: -1 });

  // Strictly sanitized output without any user identity
  const sanitized = entries.map(j => ({
    _id: j._id,
    title: j.title,
    body: j.body,
    mood: j.mood,
    isAnonymous: true,
    user: 'Anonymous Member',
    misId: '—',
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  }));

  res.status(200).json({ success: true, count: sanitized.length, entries: sanitized });
};
