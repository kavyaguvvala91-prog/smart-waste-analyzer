/**
 * AI Routes
 * POST /api/ai/suggestions — sustainability insights from Groq
 */

import express from 'express';
import { getAISuggestions } from '../controllers/aiController.js';

const router = express.Router();

router.post('/suggestions', getAISuggestions);

export default router;
