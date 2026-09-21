import Challenge from '../models/Challenge.js';
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
  await ChallengeParticipation.deleteMany({ challengeId: req.params.id });
  await ChallengeCompletion.deleteMany({ challengeId: req.params.id });
  await ChallengeFeedback.deleteMany({ challengeId: req.params.id });
  res.status(200).json({ success: true, message: 'Challenge and related data deleted' });
};

export const getParticipants = async (req, res) => {
  const { id } = req.params;
  const participations = await ChallengeParticipation.find({ challengeId: id }).populate('studentId', 'name misId email branch year');
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
  
  // If student, get their participation and completions and feedbacks
  let participation = null;
  let completions = [];
  let feedbacks = [];
  
  if (req.user?.role !== 'admin') {
    participation = await ChallengeParticipation.findOne({ challengeId: req.params.id, studentId: req.user._id });
    if (participation) {
      completions = await ChallengeCompletion.find({ challengeId: req.params.id, studentId: req.user._id });
      feedbacks = await ChallengeFeedback.find({ challengeId: req.params.id, studentId: req.user._id });
    }
  }

  res.status(200).json({ success: true, challenge, participation, completions, feedbacks });
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

export const completeDay = async (req, res) => {
  const { id, dayNumber } = req.params;
  
  const challenge = await Challenge.findById(id);
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
  
  const existing = await ChallengeCompletion.findOne({ challengeId: id, dayNumber, studentId: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Day already completed' });
  }

  const completion = await ChallengeCompletion.create({
    challengeId: id,
    dayNumber,
    studentId: req.user._id,
  });

  // Update progress
  const participation = await ChallengeParticipation.findOneAndUpdate(
    { challengeId: id, studentId: req.user._id },
    { $inc: { progress: 1 } },
    { new: true }
  );
  
  if (participation.progress >= challenge.duration) {
    participation.status = 'Completed';
    participation.completedAt = new Date();
    await participation.save();
  }

  res.status(201).json({ success: true, completion, participation });
};

export const submitFeedback = async (req, res) => {
  const { id, dayNumber } = req.params;
  const { mood, text } = req.body;

  if (!mood) return res.status(400).json({ success: false, message: 'Mood is required' });

  // Upsert feedback
  const feedback = await ChallengeFeedback.findOneAndUpdate(
    { challengeId: id, dayNumber, studentId: req.user._id },
    { mood, text },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, feedback });
};
