import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import Event from '../models/Event.js';
import EventReport from '../models/EventReport.js';

// ── Helper: IST-aware today string (YYYY-MM-DD) ───────────────────────────────
function getTodayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
}

// ── GET /api/admin/stats ───────────────────────────────────────────────────
export const getAdminStats = async (req, res) => {
  const todayStr = getTodayIST();
  const todayStart = new Date(todayStr + 'T00:00:00.000Z');
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [activeChallenge, totalUsers, totalEvents, totalReports] = await Promise.all([
    Challenge.findOne({ status: 'Active' }),
    User.countDocuments(),
    Event.countDocuments(),
    EventReport.countDocuments(),
  ]);

  // ── Registration tracking ─────────────────────────────────────────────────
  const [registrationsToday, registrationsThisWeek] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
  ]);

  // Unique participants (users who submitted at least once)
  const participantIds = await Submission.distinct('userId');
  const activeUsersCount = participantIds.length;
  const inactiveUsersCount = totalUsers - activeUsersCount;

  // ── Today's completions (by submissions with isDone today) ─────────────────
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todayCompletions = await Submission.countDocuments({
    isDone: true,
    submittedAt: { $gte: todayStart, $lt: todayEnd },
  });

  // ── Weekly completions (last 7 days by submittedAt) ───────────────────────
  const weeklyRaw = await Submission.aggregate([
    {
      $match: {
        isDone: true,
        submittedAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        // Group by IST date: add 5h30m offset before extracting date
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: { $add: ['$submittedAt', 5.5 * 60 * 60 * 1000] },
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weeklyMap = {};
  weeklyRaw.forEach(r => { weeklyMap[r._id] = r.count; });
  const weeklyStats = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = new Date(key).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    weeklyStats.push({ date: key, label, count: weeklyMap[key] || 0 });
  }

  // ── Engagement Metrics ────────────────────────────────────────────────────
  const totalSubmissions = await Submission.countDocuments();
  const totalReflections = await Submission.countDocuments({ reflectionText: { $exists: true, $ne: '' } });

  const reflStats = await Submission.aggregate([
    { $match: { reflectionText: { $exists: true, $ne: '' } } },
    { $project: { wordCount: { $size: { $split: ['$reflectionText', ' '] } } } },
    { $group: { _id: null, avgWords: { $avg: '$wordCount' }, totalWords: { $sum: '$wordCount' } } },
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
      registrationsToday,
      registrationsThisWeek,
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
    // Lookup the task to get dayNumber
    {
      $lookup: {
        from: 'challengetasks',
        localField: 'taskId',
        foreignField: '_id',
        as: 'task',
      }
    },
    { $unwind: { path: '$task', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        // Use task.dayNumber if available, fallback to challengeDay for any legacy ones that might still be there, or just ignore nulls
        _id: { $ifNull: ['$task.dayNumber', '$challengeDay'] },
        completions: { $sum: { $cond: ['$isDone', 1, 0] } },
        reflections: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$reflectionText', ''] } }, 0] }, 1, 0] } },
        images: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$imageUrl', ''] } }, 0] }, 1, 0] } },
      },
    },
    { $match: { _id: { $ne: null } } }, // Only day-based submissions
    { $sort: { _id: 1 } },
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
