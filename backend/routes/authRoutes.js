import express from 'express';
import { login, me, register, updateProfile } from '../controllers/authController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', optionalAuth, me);
router.put('/profile', requireAuth, updateProfile);

export default router;
