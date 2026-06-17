import User from '../models/User.js';
import { hashPassword } from './authService.js';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const bootstrapAdminUser = async () => {
  const name = String(process.env.ADMIN_NAME || '').trim();
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!name || !email || !password) {
    console.log('ℹ️ Admin bootstrap skipped. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD to create a municipality account.');
    return null;
  }

  const existing = await User.findOne({ email });

  if (existing) {
    const updates = {};

    if (existing.role !== 'admin') {
      updates.role = 'admin';
    }

    if (existing.name !== name) {
      updates.name = name;
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(existing._id, { $set: updates });
      console.log(`✅ Admin account updated: ${email}`);
    } else {
      console.log(`✅ Admin account already exists: ${email}`);
    }

    return existing;
  }

  const adminUser = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'admin',
    points: 0,
  });

  console.log(`✅ Admin account created: ${email}`);
  return adminUser;
};

export default bootstrapAdminUser;
