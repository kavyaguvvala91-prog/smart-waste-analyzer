import User from '../models/User.js';
import { buildAuthUser, hashPassword, signToken, verifyPassword } from '../services/authService.js';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const buildTokenResponse = (user) => {
  const authUser = buildAuthUser(user);
  return {
    user: authUser,
    token: signToken({
      sub: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
      points: authUser.points,
    }),
  };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user', adminCode } = req.body || {};

    if (!String(name || '').trim() || !String(email || '').trim() || !String(password || '').trim()) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }

    const shouldBeAdmin =
      role === 'admin' &&
      (process.env.NODE_ENV !== 'production'
        || (adminCode && process.env.ADMIN_INVITE_CODE && adminCode === process.env.ADMIN_INVITE_CODE));

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: shouldBeAdmin ? 'admin' : 'user',
      points: 0,
    });

    return res.status(201).json({
      success: true,
      ...buildTokenResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !String(password || '').trim()) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.status(200).json({
      success: true,
      ...buildTokenResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { name } = req.body || {};
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: String(name || '').trim() || req.user.name } },
      { new: true }
    ).select('_id name email role points');

    return res.status(200).json({
      success: true,
      user: buildAuthUser(updated),
    });
  } catch (error) {
    next(error);
  }
};
