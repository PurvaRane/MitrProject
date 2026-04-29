import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import Event from '../models/Event.js';

// ── GET /api/admin/stats ───────────────────────────────────────────────────
export const getAdminStats = async (req, res) => {
  const [activeChallenge, totalUsers, totalEvents, totalReports] = await Promise.all([
    Challenge.findOne({ isActive: true }),
    User.countDocuments(),
    Event.countDocuments(),
    (await import('../models/EventReport.js')).default.countDocuments(),
  ]);

  // Unique participants (users who submitted at least 1 day, even if not marked "done")
  const participantIds = await Submission.distinct('userId');
  const activeUsersCount = participantIds.length;
  const inactiveUsersCount = totalUsers - activeUsersCount;

  // ── Today's completions ───────────────────────────────────────────────────
  const todayDay = activeChallenge?.day ?? 1;
  const todayCompletions = await Submission.countDocuments({
    challengeDay: todayDay,
    isDone: true,
  });

  // ── Weekly completions (last 7 days by submittedAt) ───────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyRaw = await Submission.aggregate([
    {
      $match: {
        isDone: true,
        submittedAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weeklyMap = {};
  weeklyRaw.forEach(r => { weeklyMap[r._id] = r.count; });
  const weeklyStats = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    weeklyStats.push({ date: key, label, count: weeklyMap[key] || 0 });
  }

  // ── Engagement Metrics ────────────────────────────────────────────────────
  const totalSubmissions = await Submission.countDocuments();
  const totalReflections = await Submission.countDocuments({ reflectionText: { $exists: true, $ne: '' } });
  
  const reflStats = await Submission.aggregate([
    { $match: { reflectionText: { $exists: true, $ne: '' } } },
    { $project: { wordCount: { $size: { $split: ['$reflectionText', ' '] } } } },
    { $group: { _id: null, avgWords: { $avg: '$wordCount' }, totalWords: { $sum: '$wordCount' } } }
  ]);
  
  const avgWords = reflStats.length > 0 ? Math.round(reflStats[0].avgWords) : 0;

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalEvents,
      totalReports,
      activeUsersCount,
      inactiveUsersCount,
      activeDay: activeChallenge?.day ?? null,
      activeDayTitle: activeChallenge?.title ?? 'N/A',
      todayCompletions,
      totalSubmissions,
      totalReflections,
      avgWords,
      weeklyStats,
    },
  });
};

// ── GET /api/admin/challenge-stats — Per-day breakdown ────────────────────
export const getChallengeStats = async (req, res) => {
  const dayStatsRaw = await Submission.aggregate([
    {
      $group: {
        _id: '$challengeDay',
        completions: { $sum: { $cond: ['$isDone', 1, 0] } },
        reflections: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$reflectionText', ''] } }, 0] }, 1, 0] } },
        images: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$imageUrl', ''] } }, 0] }, 1, 0] } },
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const totalUsers = await User.countDocuments();

  const rows = dayStatsRaw.map(d => ({
    day: d._id,
    completions: d.completions,
    reflections: d.reflections,
    images: d.images,
    percentage: totalUsers > 0 ? Math.round((d.completions / totalUsers) * 100) : 0,
  }));

  res.status(200).json({ success: true, rows, totalUsers });
};
