import express from 'express';
import {
  createWasteReport,
  getAdminReportStats,
  getAdminReports,
  getMyReports,
  updateReportStatus,
} from '../controllers/reportController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, createWasteReport);
router.get('/mine', requireAuth, getMyReports);
router.get('/admin', requireAdmin, getAdminReports);
router.get('/admin/stats', requireAdmin, getAdminReportStats);
router.patch('/:id/status', requireAdmin, updateReportStatus);

export default router;
