import Challenge from '../models/Challenge.js';

// ── GET /api/challenge — All 30 tasks ────────────────────────────────────────
export const getAllChallenges = async (req, res) => {
  const challenges = await Challenge.find().sort({ day: 1 });
  res.status(200).json({ success: true, challenges });
};

// ── GET /api/challenge/active — Only the active day ──────────────────────────
export const getActiveChallenge = async (req, res) => {
  const challenge = await Challenge.findOne({ isActive: true });
  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: 'No active challenge task. Check back soon.',
    });
  }
  res.status(200).json({ success: true, challenge });
};

// ── POST /api/challenge — Admin seeds/adds a task ─────────────────────────────
export const createChallenge = async (req, res) => {
  const { day, title, description, instructions } = req.body;

  if (!day || !title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Day, title, and description are required.',
    });
  }

  const existing = await Challenge.findOne({ day });
  if (existing) {
    // Update existing task
    existing.title = title.trim();
    existing.description = description.trim();
    if (instructions !== undefined) existing.instructions = instructions.trim();
    await existing.save();
    return res.status(200).json({ success: true, challenge: existing, updated: true });
  }

  const challenge = await Challenge.create({
    day: Number(day),
    title: title.trim(),
    description: description.trim(),
    instructions: instructions?.trim() || '',
    isActive: false,
  });
  res.status(201).json({ success: true, challenge });
};

// ── PUT /api/challenge/activate — Admin activates exactly one day ─────────────
export const activateDay = async (req, res) => {
  const { day } = req.body;

  if (!day || day < 1 || day > 30) {
    return res.status(400).json({
      success: false,
      message: 'Provide a valid day number (1–30).',
    });
  }

  const target = await Challenge.findOne({ day: Number(day) });
  if (!target) {
    return res.status(404).json({
      success: false,
      message: `Day ${day} not found. Please add it first.`,
    });
  }

  await Challenge.updateMany({}, { isActive: false });
  target.isActive = true;
  await target.save();

  res.status(200).json({
    success: true,
    message: `Day ${day} is now active for all students.`,
    challenge: target,
  });
};
