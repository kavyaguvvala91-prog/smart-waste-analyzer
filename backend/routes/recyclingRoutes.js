/**
 * Recycling Routes
 * GET /api/recycling-centers — find nearby recycling centers
 */

import express from 'express';
import { getRecyclingCenters } from '../controllers/recyclingController.js';

const router = express.Router();

router.get('/', getRecyclingCenters);

export default router;
