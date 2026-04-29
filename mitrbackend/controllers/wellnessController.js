import WellnessInfo from '../models/WellnessInfo.js';

// ── GET /api/wellness-info ─────────────────────────────────────────────────
export const getWellnessInfo = async (req, res) => {
  const info = await WellnessInfo.findOne().sort({ updatedAt: -1 });
  res.status(200).json({ success: true, info: info || null });
};

// ── POST /api/wellness-info — Admin upserts wellness content ───────────────
export const upsertWellnessInfo = async (req, res) => {
  const { title, description, vision, services } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required.',
    });
  }

  console.log('[POST /api/wellness-info] Upserting wellness info');

  // Only one record — find existing or create new
  let info = await WellnessInfo.findOne();

  if (info) {
    info.title = title.trim();
    info.description = description.trim();
    if (vision !== undefined) info.vision = vision.trim();
    if (services !== undefined) info.services = services;
    info.lastUpdatedBy = 'admin';
    await info.save();
  } else {
    info = await WellnessInfo.create({
      title: title.trim(),
      description: description.trim(),
      vision: vision?.trim() || '',
      services: services || [],
      lastUpdatedBy: 'admin',
    });
  }

  console.log('[POST /api/wellness-info] ✅ Saved');
  res.status(200).json({ success: true, info });
};
