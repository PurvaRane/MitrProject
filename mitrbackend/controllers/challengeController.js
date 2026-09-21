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
  const { challengeId } = req.params;
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
  const { challengeId } = req.params;
  const participations = await ChallengeParticipation.find({ challengeId }).populate('studentId', 'name misId email');
  res.status(200).json({ success: true, participations });
};

// ── SHARED/STUDENT: Challenges & Participation ────────────────────────────────
export const getAllChallenges = async (req, res) => {
  let filter = {};
  // Students only see published, active, or completed challenges
  if (req.user?.role !== 'admin') {
    filter.status = { $in: ['Published', 'Active', 'Completed'] };
  }
  const challenges = await Challenge.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, challenges });
};

export const getChallengeById = async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
  
  const tasks = await ChallengeTask.find({ challengeId: req.params.id }).sort({ dayNumber: 1, order: 1 });
  
  // If student, get their participation and completions
  let participation = null;
  let completions = [];
  if (req.user?.role !== 'admin') {
    participation = await ChallengeParticipation.findOne({ challengeId: req.params.id, studentId: req.user._id });
    if (participation) {
      completions = await ChallengeCompletion.find({ challengeId: req.params.id, studentId: req.user._id });
    }
  }

  res.status(200).json({ success: true, challenge, tasks, participation, completions });
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

  // Upsert feedback
  const feedback = await ChallengeFeedback.findOneAndUpdate(
    { challengeId: id, taskId, studentId: req.user._id },
    { mood, text },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, feedback });
};
