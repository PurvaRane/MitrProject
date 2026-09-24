import PlatformFeedback from '../models/PlatformFeedback.js';

// ── POST /api/feedback — Submit general platform feedback (Student/Faculty) ──
export const submitFeedback = async (req, res) => {
  const { type, message, isAnonymous } = req.body;
  const user = req.user;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Feedback message cannot be empty.',
    });
  }

  const allowedTypes = [
    'Activity Suggestion',
    'Event Suggestion',
    'Platform Improvement',
    'Support Feedback',
    'General Feedback',
    'Other',
  ];

  const feedbackType = allowedTypes.includes(type) ? type : 'General Feedback';

  const userIdentifier = user.role === 'faculty' ? user.email || '' : user.misId || '';

  const feedback = await PlatformFeedback.create({
    userId: user._id,
    userRole: user.role === 'faculty' ? 'faculty' : 'student',
    userIdentifier,
    userName: user.name || '',
    type: feedbackType,
    message: message.trim(),
    isAnonymous: !!isAnonymous,
    status: 'Pending',
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! It helps improve COEP मित्र for everyone.',
    feedback: {
      id: feedback._id,
      type: feedback.type,
      message: feedback.message,
      isAnonymous: feedback.isAnonymous,
      status: feedback.status,
      createdAt: feedback.createdAt,
    },
  });
};

// ── GET /api/feedback/my — Get user's own submitted feedback ─────────────────
export const getMyFeedback = async (req, res) => {
  const userId = req.user._id;

  const list = await PlatformFeedback.find({ userId })
    .sort({ createdAt: -1 })
    .select('type message isAnonymous status createdAt');

  res.status(200).json({
    success: true,
    count: list.length,
    feedback: list,
  });
};

// ── GET /api/feedback/admin/all — Admin: view all platform feedback ───────────
export const getAdminFeedback = async (req, res) => {
  const { type, status } = req.query;
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  const list = await PlatformFeedback.find(query).sort({ createdAt: -1 });

  // Format safely: if isAnonymous is true, mask personal identity
  const sanitized = list.map(item => ({
    _id: item._id,
    type: item.type,
    message: item.message,
    status: item.status,
    userRole: item.userRole,
    isAnonymous: item.isAnonymous,
    senderName: item.isAnonymous ? 'Anonymous Member' : item.userName,
    senderIdentifier: item.isAnonymous ? '—' : item.userIdentifier,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  res.status(200).json({
    success: true,
    count: sanitized.length,
    feedback: sanitized,
  });
};

// ── PATCH /api/feedback/admin/:id/status — Admin: update status ──────────────
export const updateFeedbackStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Reviewed', 'Archived'];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowed.join(', ')}`,
    });
  }

  const feedback = await PlatformFeedback.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!feedback) {
    return res.status(404).json({ success: false, message: 'Feedback not found.' });
  }

  res.status(200).json({
    success: true,
    message: 'Feedback status updated.',
    feedback,
  });
};
