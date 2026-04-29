import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Static admin credentials (no DB storage) ─────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'mitr2026';
const ADMIN_JWT_PAYLOAD = { id: 'admin', role: 'admin', name: 'COEP मित्र Admin' };

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register — Student self-registration ──────────────────────
export const register = async (req, res) => {
  const { name, misId, year, branch, password } = req.body;

  console.log('[POST /api/auth/register] misId:', misId);

  if (!name || !misId || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, MIS ID, and password are required.',
    });
  }

  const existing = await User.findOne({ misId });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'A student with this MIS ID is already registered.',
    });
  }

  const user = await User.create({
    name: name.trim(),
    misId,
    year,
    branch,
    password,
    role: 'student',
    hasSeenOnboarding: false,
  });

  const token = signToken({ id: user._id, role: 'student' });
  console.log('[POST /api/auth/register] ✅ Registered:', misId);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      misId: user.misId,
      year: user.year,
      branch: user.branch,
      role: user.role,
      hasSeenOnboarding: user.hasSeenOnboarding,
    },
  });
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { username, misId, password } = req.body;

  console.log('[POST /api/auth/login] username:', username, '| misId:', misId);

  // ── Admin path: static check ───────────────────────────────────────────────
  if (username !== undefined) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken(ADMIN_JWT_PAYLOAD);
      console.log('[POST /api/auth/login] ✅ Admin login');
      return res.status(200).json({
        success: true,
        token,
        user: { id: 'admin', name: 'COEP मित्र Admin', role: 'admin', hasSeenOnboarding: true },
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials.',
    });
  }

  // ── Student path: DB lookup ────────────────────────────────────────────────
  if (!misId || !password) {
    return res.status(400).json({
      success: false,
      message: 'MIS ID and password are required.',
    });
  }

  const user = await User.findOne({ misId }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid MIS ID or password.',
    });
  }

  const token = signToken({ id: user._id, role: 'student' });
  console.log('[POST /api/auth/login] ✅ Student login:', misId);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      misId: user.misId,
      year: user.year,
      branch: user.branch,
      role: user.role,
      hasSeenOnboarding: user.hasSeenOnboarding,
    },
  });
};

// ── GET /api/auth/me — Return current user info ───────────────────────────────
export const getMe = async (req, res) => {
  // Admin token has no DB record
  if (req.user?.role === 'admin') {
    return res.status(200).json({
      success: true,
      user: { id: 'admin', name: 'COEP मित्र Admin', role: 'admin', hasSeenOnboarding: true },
    });
  }
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ── PATCH /api/auth/onboarding — Mark onboarding as seen ──────────────────────
export const completeOnboarding = async (req, res) => {
  if (req.user?.role === 'admin') return res.status(200).json({ success: true });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { hasSeenOnboarding: true },
    { new: true }
  );

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      misId: user.misId,
      year: user.year,
      branch: user.branch,
      role: user.role,
      hasSeenOnboarding: user.hasSeenOnboarding,
    },
  });
};
