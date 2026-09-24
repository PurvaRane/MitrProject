import DailyMood from '../models/DailyMood.js';

// ── Helper: get today's date in IST (YYYY-MM-DD) ─────────────────────────────
function getTodayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
}

// ── POST /api/mood — Log or update today's mood & energy check-in ─────────────
export const upsertTodayMood = async (req, res) => {
  const { moodScore, energyScore, feeling, note } = req.body;
  const userId = req.user._id;

  if (moodScore === undefined || energyScore === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Both mood score (1-5) and energy score (1-5) are required.',
    });
  }

  const mScore = Number(moodScore);
  const eScore = Number(energyScore);

  if (mScore < 1 || mScore > 5 || eScore < 1 || eScore > 5) {
    return res.status(400).json({
      success: false,
      message: 'Scores must be numbers between 1 and 5.',
    });
  }

  const todayStr = getTodayIST();

  const entry = await DailyMood.findOneAndUpdate(
    { userId, date: todayStr },
    {
      userId,
      date: todayStr,
      moodScore: mScore,
      energyScore: eScore,
      feeling: (feeling || '').trim(),
      note: (note || '').trim(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: 'Check-in saved successfully.',
    entry,
  });
};

// ── GET /api/mood/today — Get user's check-in for today ───────────────────────
export const getTodayMood = async (req, res) => {
  const userId = req.user._id;
  const todayStr = getTodayIST();

  const entry = await DailyMood.findOne({ userId, date: todayStr });
  res.status(200).json({
    success: true,
    hasCheckedIn: !!entry,
    entry: entry || null,
  });
};

// ── GET /api/mood/history — Get user's recent mood history (private) ──────────
export const getMoodHistory = async (req, res) => {
  const userId = req.user._id;
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 30);

  // Calculate cutoff date in IST
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const history = await DailyMood.find({
    userId,
    date: { $gte: cutoffDate },
  }).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: history.length,
    history,
  });
};
