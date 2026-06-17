/**
 * Analysis Routes
 * POST /api/analysis — analyse detection results
 */

import express from 'express';
import { analyzeDetections } from '../controllers/analysisController.js';

const router = express.Router();

router.post('/', analyzeDetections);

export default router;
