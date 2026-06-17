/**
 * DIY Routes
 * POST /api/diy          — generate a DIY idea for a waste type
 * POST /api/diy/image    — generate or retrieve a DIY image
 * GET  /api/diy/all      — list all saved DIY ideas
 */

import express from 'express';
import { getDIYIdea, getDIYImage, getAllDIYIdeas, generateDIYProjects } from '../controllers/diyController.js';

const router = express.Router();

router.post('/', getDIYIdea);
router.post('/generate', generateDIYProjects);
router.post('/image', getDIYImage);
router.get('/all', getAllDIYIdeas);

export default router;
