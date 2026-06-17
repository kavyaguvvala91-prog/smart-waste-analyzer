/**
 * AI Controller
 * Provides structured sustainability insights via Groq.
 */

import { generateSustainabilityInsights } from '../services/groqService.js';

export const getAISuggestions = async (req, res, next) => {
  try {
    const { detections } = req.body;

    if (!Array.isArray(detections)) {
      const error = new Error('Request body must contain a "detections" array.');
      error.statusCode = 400;
      throw error;
    }

    if (detections.length === 0) {
      return res.status(200).json({
        success: true,
        recommendations: ['Run a detection to generate tailored sustainability insights.'],
        reduce: [],
        reuse: [],
        recycle: [],
        recover: [],
        impact: 'No detections were provided, so there is not enough information to produce a sustainability summary.',
      });
    }

    const insights = await generateSustainabilityInsights(detections);

    return res.status(200).json({
      success: true,
      ...insights,
    });
  } catch (error) {
    next(error);
  }
};
