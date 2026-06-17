/**
 * History Routes
 * GET    /api/history       — list all detections (paginated)
 * GET    /api/history/:id   — get single detection
 * DELETE /api/history/:id   — delete a detection record
 */

import express from 'express';
import { getHistory, getDetectionById, deleteDetection, getDashboardOverview } from '../controllers/historyController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getHistory);
router.get('/summary', getDashboardOverview);
router.get('/:id', getDetectionById);
router.delete('/:id', deleteDetection);

export default router;
