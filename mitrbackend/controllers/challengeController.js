import Challenge from '../models/Challenge.js';
import ChallengeTask from '../models/ChallengeTask.js';
import ChallengeParticipation from '../models/ChallengeParticipation.js';
import ChallengeCompletion from '../models/ChallengeCompletion.js';
import ChallengeFeedback from '../models/ChallengeFeedback.js';

// ── ADMIN: Challenges ────────────────────────────────────────────────────────
export const createChallenge = async (req, res) => {
  const challenge = await Challenge.create({
    ...req.body,
    createdBy: req.user?._id?.toString() || 'admin'
  });
  res.status(201).json({ success: true, challenge });
};

export const updateChallenge = async (req, res) => {
  const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
  res.status(200).json({ success: true, challenge });
};

export const deleteChallenge = async (req, res) => {
  await Challenge.findByIdAndDelete(req.params.id);
  await ChallengeTask.deleteMany({ challengeId: req.params.id });
  await ChallengeParticipation.deleteMany({ challengeId: req.params.id });
  await ChallengeCompletion.deleteMany({ challengeId: req.params.id });
  await ChallengeFeedback.deleteMany({ challengeId: req.params.id });
  res.status(200).json({ success: true, message: 'Challenge and related data deleted' });
};

// ── ADMIN: Tasks ─────────────────────────────────────────────────────────────
export const addTask = async (req, res) => {
  // The route is /:id/tasks; using challengeId here left the required model
  // field undefined and caused "Path `challengeId` is required" in the admin.
  const { id: challengeId } = req.params;
  const challenge = await Challenge.exists({ _id: challengeId });
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
  const task = await ChallengeTask.create({ ...req.body, challengeId });
  res.status(201).json({ success: true, task });
};

export const updateTask = async (req, res) => {
  const task = await ChallengeTask.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.status(200).json({ success: true, task });
};

export const deleteTask = async (req, res) => {
  await ChallengeTask.findByIdAndDelete(req.params.taskId);
  await ChallengeCompletion.deleteMany({ taskId: req.params.taskId });
  await ChallengeFeedback.deleteMany({ taskId: req.params.taskId });
  res.status(200).json({ success: true, message: 'Task deleted' });
};

export const getParticipants = async (req, res) => {
  const { id: challengeId } = req.params;
  const participations = await ChallengeParticipation.find({ challengeId }).populate('studentId', 'name misId email');
  res.status(200).json({ success: true, participations });
};

// ── Helper: calculate accurate challenge status from database dates ─────────
const syncChallengeStatus = (challenge) => {
  const doc = challenge.toObject ? challenge.toObject() : { ...challenge };
  if (doc.status === 'Draft' || doc.status === 'Archived') return doc;

  if (doc.startDate && doc.endDate) {
    const now = new Date();
    const start = new Date(doc.startDate);
    const end = new Date(doc.endDate);
    // End date covers the entire end day (until 23:59:59.999)
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      doc.status = 'Upcoming';
    } else if (now > end) {
      doc.status = doc.status === 'Completed' ? 'Completed' : 'Expired';
    } else {
      doc.status = 'Active';
    }
  }
  return doc;
};

// ── SHARED: Challenges & Participation ───────────────────────────────────────
export const getAllChallenges = async (req, res) => {
  let filter = {};
  // Non-admins see published, upcoming, active, or completed challenges
  if (req.user?.role !== 'admin') {
    filter.status = { $in: ['Published', 'Upcoming', 'Active', 'Completed', 'Expired'] };
  }
  const challenges = await Challenge.find(filter).sort({ createdAt: -1 });
  const synchronized = challenges.map(syncChallengeStatus);
  res.status(200).json({ success: true, challenges: synchronized });
};

export const getChallengeById = async (req, res) => {
  const rawChallenge = await Challenge.findById(req.params.id);
  if (!rawChallenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

  const challenge = syncChallengeStatus(rawChallenge);
  const tasks = await ChallengeTask.find({ challengeId: req.params.id }).sort({ dayNumber: 1, order: 1 });
  
  // If not admin, get their participation and completions
  let participation = null;
  let completions = [];
  let feedback = [];
  if (req.user?.role !== 'admin') {
    participation = await ChallengeParticipation.findOne({ challengeId: req.params.id, studentId: req.user._id });
    if (participation) {
      completions = await ChallengeCompletion.find({ challengeId: req.params.id, studentId: req.user._id });
      feedback = await ChallengeFeedback.find({ challengeId: req.params.id, studentId: req.user._id });
    }
  }

  res.status(200).json({ success: true, challenge, tasks, participation, completions, feedback });
};

// ── STUDENT: Actions ─────────────────────────────────────────────────────────
export const joinChallenge = async (req, res) => {
  const { id } = req.params;
  const existing = await ChallengeParticipation.findOne({ challengeId: id, studentId: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Already joined this challenge' });
  }
  
  const participation = await ChallengeParticipation.create({
    challengeId: id,
    studentId: req.user._id,
    status: 'Active',
    progress: 0
  });
  
  res.status(201).json({ success: true, participation });
};

export const completeTask = async (req, res) => {
  const { id, taskId } = req.params;
  const [participation, task] = await Promise.all([
    ChallengeParticipation.exists({ challengeId: id, studentId: req.user._id }),
    ChallengeTask.exists({ _id: taskId, challengeId: id }),
  ]);

  if (!participation) {
    return res.status(403).json({ success: false, message: 'Join this challenge before completing tasks.' });
  }
  if (!task) {
    return res.status(404).json({ success: false, message: 'Challenge task not found.' });
  }

  const existing = await ChallengeCompletion.findOne({ challengeId: id, taskId, studentId: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Task already completed' });
  }

  const completion = await ChallengeCompletion.create({
    challengeId: id,
    taskId,
    studentId: req.user._id,
  });

  // Update progress
  await ChallengeParticipation.findOneAndUpdate(
    { challengeId: id, studentId: req.user._id },
    { $inc: { progress: 1 } }
  );

  res.status(201).json({ success: true, completion });
};

export const submitFeedback = async (req, res) => {
  const { id, taskId } = req.params;
  const { mood, text } = req.body;

  if (!mood) return res.status(400).json({ success: false, message: 'Mood is required' });

  const completion = await ChallengeCompletion.exists({
    challengeId: id,
    taskId,
    studentId: req.user._id,
  });
  if (!completion) {
    return res.status(403).json({ success: false, message: 'Complete this task before submitting feedback.' });
  }

  // Upsert feedback
  const feedback = await ChallengeFeedback.findOneAndUpdate(
    { challengeId: id, taskId, studentId: req.user._id },
    { mood, text },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, feedback });
};

// ── ADMIN: completed-task reflections and feedback ──────────────────────────
export const getChallengeFeedback = async (req, res) => {
  const filter = {};
  if (req.query.challengeId) filter.challengeId = req.query.challengeId;
  if (req.query.mood) filter.mood = req.query.mood;

  const feedback = await ChallengeFeedback.find(filter)
    .populate('studentId', 'name misId branch year')
    .populate('challengeId', 'title')
    .populate('taskId', 'title dayNumber')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, feedback, count: feedback.length });
};
