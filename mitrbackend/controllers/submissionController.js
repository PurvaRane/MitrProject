import Submission from '../models/Submission.js';
import { uploadImage } from '../config/cloudinary.js';

// ── POST /api/submissions — User submits reflection/mark done ────────────────
export const createOrUpdateSubmission = async (req, res) => {
  const { challengeDay, reflectionText, isDone, imageUrl: rawImage } = req.body;
  const userId = req.user._id;

  if (!challengeDay) {
    return res.status(400).json({ success: false, message: 'challengeDay is required.' });
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

  const submission = await Submission.findOneAndUpdate(
    { userId, challengeDay },
    {
      ...(reflectionText !== undefined && { reflectionText }),
      ...(isDone === true && { isDone: true }),
      ...(imageUrl && { imageUrl }),
      submittedAt: new Date(),
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, submission });
};

// ── GET /api/submissions/my — User's own submissions ────────────────────────
export const getMySubmissions = async (req, res) => {
  const submissions = await Submission.find({ userId: req.user._id }).sort({ challengeDay: 1 });
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
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions
  });
};
