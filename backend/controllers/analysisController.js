/**
 * Analysis Controller
 * Processes raw detection results into structured analysis for frontend charts and statistics
 */

import { isRecyclable, extractCategory } from '../services/aiService.js';

/**
 * POST /api/analysis
 * Input: { detections: [{ class, confidence }] }
 * Output: Full analysis with category breakdown, recyclability, most detected item
 */
export const analyzeDetections = async (req, res, next) => {
  try {
    const { detections } = req.body;

    // Input validation
    if (!detections || !Array.isArray(detections)) {
      const err = new Error('Request body must contain a "detections" array.');
      err.statusCode = 400;
      throw err;
    }

    if (detections.length === 0) {
      return res.status(200).json({
        success: true,
        totalObjects: 0,
        categories: {},
        mostDetected: null,
        recyclable: 0,
        nonRecyclable: 0,
        recyclablePercentage: 0,
        summary: 'No waste items were detected in the image.',
      });
    }

    // Validate each detection has required fields
    for (const det of detections) {
      if (!det.class || typeof det.confidence !== 'number') {
        const err = new Error('Each detection must have a "class" string and "confidence" number.');
        err.statusCode = 400;
        throw err;
      }
    }

    // ── Compute statistics ───────────────────────────────────────────────────
    let recyclableCount = 0;
    let nonRecyclableCount = 0;
    const categories = {};
    const classFrequency = {};
    const confidenceSum = {};

    for (const det of detections) {
      const cls = det.class.toLowerCase().trim();
      const category = extractCategory(cls);

      // Recyclability count
      if (isRecyclable(cls)) {
        recyclableCount++;
      } else {
        nonRecyclableCount++;
      }

      // Category count
      categories[category] = (categories[category] || 0) + 1;

      // Class frequency (for most-detected)
      classFrequency[cls] = (classFrequency[cls] || 0) + 1;

      // Average confidence per class
      if (!confidenceSum[cls]) confidenceSum[cls] = { total: 0, count: 0 };
      confidenceSum[cls].total += det.confidence;
      confidenceSum[cls].count++;
    }

    const totalObjects = detections.length;
    const recyclablePercentage = Math.round((recyclableCount / totalObjects) * 100);

    // Most detected class
    const mostDetected = Object.entries(classFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Average confidence per class
    const averageConfidence = {};
    for (const [cls, data] of Object.entries(confidenceSum)) {
      averageConfidence[cls] = parseFloat((data.total / data.count).toFixed(3));
    }

    // ── Generate summary text ────────────────────────────────────────────────
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0];
    const summary = `Detected ${totalObjects} waste item${totalObjects !== 1 ? 's' : ''}. ` +
      `${recyclableCount} item${recyclableCount !== 1 ? 's are' : ' is'} recyclable (${recyclablePercentage}%). ` +
      (topCategory ? `Most common category: ${topCategory}.` : '');

    res.status(200).json({
      success: true,
      totalObjects,
      categories,
      mostDetected,
      recyclable: recyclableCount,
      nonRecyclable: nonRecyclableCount,
      recyclablePercentage,
      averageConfidence,
      summary,
    });
  } catch (error) {
    next(error);
  }
};
