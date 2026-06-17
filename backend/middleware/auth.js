import User from '../models/User.js';
import { buildAuthUser, verifyToken } from '../services/authService.js';

const readTokenFromRequest = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      req.user = null;
      return next();
    }

    const user = await User.findById(payload.sub).select('_id name email role points').lean();
    req.user = user ? buildAuthUser(user) : null;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Sign in required.' });
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    }

    const user = await User.findById(payload.sub).select('_id name email role points').lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Your account could not be found.' });
    }

    req.user = buildAuthUser(user);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Sign in required.' });
  }

  if (req.user.role !== role) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
  }

  return next();
};

export const requireAdmin = [requireAuth, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  return next();
}];
