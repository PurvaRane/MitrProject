import Submission from '../models/Submission.js';
import { uploadImage } from '../config/cloudinary.js';

// ── POST /api/submissions — User submits reflection/mark done ────────────────
export const createOrUpdateSubmission = async (req, res) => {
  const { challengeDay, challengeId, taskId, reflectionText, isDone, imageUrl: rawImage } = req.body;
  const userId = req.user._id;

  // At least challengeDay OR taskId is required
  if (challengeDay == null && !taskId) {
    return res.status(400).json({ success: false, message: 'challengeDay or taskId is required.' });
  }

  // Upload reflection image to Cloudinary if it's a base64 string
  let imageUrl = null;
  if (rawImage) {
    if (rawImage.startsWith('http')) {
      imageUrl = rawImage;
    } else {
      imageUrl = await uploadImage(rawImage, 'mitr/reflections');
    }
  }

  // Build the query key: either daily-challenge or task-based
  const queryKey = challengeDay != null
    ? { userId, challengeDay: Number(challengeDay) }
    : { userId, taskId };

  const updatePayload = {
    ...(challengeDay != null && { challengeDay: Number(challengeDay) }),
    ...(challengeId && { challengeId }),
    ...(taskId && { taskId }),
    ...(reflectionText !== undefined && { reflectionText }),
    ...(isDone === true && { isDone: true }),
    ...(imageUrl && { imageUrl }),
    submittedAt: new Date(),
  };

  const submission = await Submission.findOneAndUpdate(
    queryKey,
    updatePayload,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, submission });
};

// ── GET /api/submissions/my — User's own submissions ────────────────────────
export const getMySubmissions = async (req, res) => {
  const submissions = await Submission.find({ userId: req.user._id }).sort({ challengeDay: 1, createdAt: -1 });
  res.status(200).json({ success: true, submissions });
};

// ── GET /api/submissions — Admin: all submissions (with filters) ──────────────
export const getAllSubmissions = async (req, res) => {
  const { day, userId, hasReflection, hasImage } = req.query;

  const query = {};
  if (day) query.challengeDay = Number(day);
  if (userId) query.userId = userId;
  if (hasReflection === 'true') query.reflectionText = { $exists: true, $ne: '' };
  if (hasImage === 'true') query.imageUrl = { $exists: true, $ne: null };

  const submissions = await Submission.find(query)
    .populate('userId', 'name misId branch year')
    .populate('challengeId', 'title')
    .populate('taskId', 'title dayNumber')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions,
  });
};
