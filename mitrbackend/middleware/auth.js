import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Helper: determine if a role is an admin-level role ────────────────────────
const ADMIN_ROLES = ['admin', 'master_admin', 'sub_admin'];
const isAdminRole = (role) => ADMIN_ROLES.includes(role);

// ── Verify JWT token ─────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // All users (including admins) now have DB records — always look up
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// ── Admin-only guard (any admin role: admin, master_admin, sub_admin) ────────
export const adminOnly = (req, res, next) => {
  if (!isAdminRole(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

// ── Master-admin-only guard ──────────────────────────────────────────────────
export const masterAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'master_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Master admin privileges required.',
    });
  }
  next();
};

// ── Flexible role guard ──────────────────────────────────────────────────────
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ── Faculty-only guard ───────────────────────────────────────────────────────
export const facultyOnly = (req, res, next) => {
  if (req.user?.role !== 'faculty') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Faculty only.',
    });
  }
  next();
};

// ── Student-only guard ───────────────────────────────────────────────────────
export const studentOnly = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student only.',
    });
  }
  next();
};
