/**
 * Recommendation Controller
 * Generates 4R (Reduce, Reuse, Recycle, Recover) recommendations using OpenAI
 */

import { generate4RRecommendations } from '../services/openaiService.js';

/**
 * POST /api/recommendations
 * Input: { wasteTypes: ["plastic bottle", "paper"] }
 * OR:    { detections: [{ class: "plastic bottle", confidence: 0.9 }] }
 * Output: { reduce, reuse, recycle, recover }
 */
export const getRecommendations = async (req, res, next) => {
  try {
    let wasteTypes = req.body.wasteTypes;

    // Support both formats: explicit wasteTypes array or raw detections array
    if (!wasteTypes && req.body.detections) {
      wasteTypes = [...new Set(req.body.detections.map((d) => d.class))];
    }

    // Validate
    if (!wasteTypes || !Array.isArray(wasteTypes) || wasteTypes.length === 0) {
      const err = new Error(
        'Request body must contain a non-empty "wasteTypes" array or "detections" array.'
      );
      err.statusCode = 400;
      throw err;
    }

    // Deduplicate and sanitise
    const uniqueTypes = [...new Set(wasteTypes.map((t) => String(t).trim().toLowerCase()))];

    // Generate recommendations via OpenAI
    const recommendations = await generate4RRecommendations(uniqueTypes);

    res.status(200).json({
      success: true,
      wasteTypes: uniqueTypes,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};
