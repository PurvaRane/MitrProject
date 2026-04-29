import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    // Admin token: no DB lookup needed
    if (decoded.role === 'admin') {
      req.user = { _id: 'admin', id: 'admin', role: 'admin', name: 'COEP मित्र Admin' };
      return next();
    }

    // Student token: fetch from DB
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

// ── Admin-only guard ─────────────────────────────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};
