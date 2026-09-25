import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import Event from '../models/Event.js';
import EventReport from '../models/EventReport.js';
import ChallengeCompletion from '../models/ChallengeCompletion.js';
import ChallengeFeedback from '../models/ChallengeFeedback.js';
import ChallengeParticipation from '../models/ChallengeParticipation.js';

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
  // Use actual midnight in India rather than UTC midnight, so early-morning
  // activity is included in the correct dashboard day.
  const todayStart = new Date(todayStr + 'T00:00:00+05:30');
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
  const [legacyParticipantIds, challengeParticipantIds] = await Promise.all([
    Submission.distinct('userId'),
    ChallengeParticipation.distinct('studentId'),
  ]);
  const activeUsersCount = new Set([
    ...legacyParticipantIds.map(String),
    ...challengeParticipantIds.map(String),
  ]).size;
  const inactiveUsersCount = totalUsers - activeUsersCount;

  // ── Today's completions (by submissions with isDone today) ─────────────────
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [legacyTodayCompletions, taskTodayCompletions] = await Promise.all([
    Submission.countDocuments({ isDone: true, submittedAt: { $gte: todayStart, $lt: todayEnd } }),
    ChallengeCompletion.countDocuments({ completedAt: { $gte: todayStart, $lt: todayEnd } }),
  ]);
  const todayCompletions = legacyTodayCompletions + taskTodayCompletions;

  // ── Weekly completions (last 7 days by submittedAt) ───────────────────────
  const legacyWeeklyRaw = await Submission.aggregate([
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

  const taskWeeklyRaw = await ChallengeCompletion.aggregate([
    { $match: { completedAt: { $gte: sevenDaysAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: { $add: ['$completedAt', 5.5 * 60 * 60 * 1000] } } },
      count: { $sum: 1 },
    } },
  ]);
  const weeklyMap = {};
  [...legacyWeeklyRaw, ...taskWeeklyRaw].forEach(r => { weeklyMap[r._id] = (weeklyMap[r._id] || 0) + r.count; });
  const weeklyStats = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = new Date(key).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    weeklyStats.push({ date: key, label, count: weeklyMap[key] || 0 });
  }

  // ── Engagement Metrics ────────────────────────────────────────────────────
  const [legacySubmissionCount, taskCompletionCount, legacyReflectionCount, taskReflectionCount] = await Promise.all([
    Submission.countDocuments(),
    ChallengeCompletion.countDocuments(),
    Submission.countDocuments({ reflectionText: { $exists: true, $ne: '' } }),
    ChallengeFeedback.countDocuments({ text: { $exists: true, $ne: '' } }),
  ]);
  const totalSubmissions = legacySubmissionCount + taskCompletionCount;
  const totalReflections = legacyReflectionCount + taskReflectionCount;

  const [legacyReflectionWords, taskReflectionWords] = await Promise.all([
    Submission.aggregate([
      { $match: { reflectionText: { $exists: true, $ne: '' } } },
      { $project: { wordCount: { $size: { $split: ['$reflectionText', ' '] } } } },
      { $group: { _id: null, totalWords: { $sum: '$wordCount' }, count: { $sum: 1 } } },
    ]),
    ChallengeFeedback.aggregate([
      { $match: { text: { $exists: true, $ne: '' } } },
      { $project: { wordCount: { $size: { $split: ['$text', ' '] } } } },
      { $group: { _id: null, totalWords: { $sum: '$wordCount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const wordTotal = (legacyReflectionWords[0]?.totalWords || 0) + (taskReflectionWords[0]?.totalWords || 0);
  const wordCount = (legacyReflectionWords[0]?.count || 0) + (taskReflectionWords[0]?.count || 0);
  const avgWords = wordCount ? Math.round(wordTotal / wordCount) : 0;

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
  const legacyDayStats = await Submission.aggregate([
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

  const [completionDayStats, feedbackDayStats, totalUsers] = await Promise.all([
    ChallengeCompletion.aggregate([
      { $lookup: { from: 'challengetasks', localField: 'taskId', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $group: { _id: '$task.dayNumber', completions: { $sum: 1 } } },
    ]),
    ChallengeFeedback.aggregate([
      { $match: { text: { $exists: true, $ne: '' } } },
      { $lookup: { from: 'challengetasks', localField: 'taskId', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $group: { _id: '$task.dayNumber', reflections: { $sum: 1 } } },
    ]),
    User.countDocuments(),
  ]);

  const byDay = new Map();
  const ensureDay = (day) => {
    if (!byDay.has(day)) byDay.set(day, { day, completions: 0, reflections: 0, images: 0 });
    return byDay.get(day);
  };
  legacyDayStats.forEach(row => {
    const target = ensureDay(row._id);
    target.completions += row.completions;
    target.reflections += row.reflections;
    target.images += row.images;
  });
  completionDayStats.forEach(row => { ensureDay(row._id).completions += row.completions; });
  feedbackDayStats.forEach(row => { ensureDay(row._id).reflections += row.reflections; });

  const rows = [...byDay.values()]
    .sort((a, b) => a.day - b.day)
    .map(row => ({ ...row, percentage: totalUsers > 0 ? Math.round((row.completions / totalUsers) * 100) : 0 }));

  res.status(200).json({ success: true, rows, totalUsers });
};

// ── GET /api/admin/users — List registered users ──────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['student', 'faculty'] } })
      .select('name email misId role department branch year createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};
