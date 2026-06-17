/**
 * Detection Controller
 * Handles image upload, YOLO AI detection, and saving results to MongoDB
 */

import path from 'path';
import { fileURLToPath } from 'url';
import Detection from '../models/Detection.js';
import { detectWaste, isRecyclable, extractCategory } from '../services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/detect
 * Accepts an uploaded image, runs YOLO detection, saves and returns results.
 */
export const detectImage = async (req, res, next) => {
  try {
    // Validate file was uploaded
    if (!req.file) {
      const err = new Error('No image file provided. Please upload an image using the "image" field.');
      err.statusCode = 400;
      throw err;
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      const err = new Error(`Unsupported file type: ${req.file.mimetype}. Please upload a JPEG, PNG, or WebP image.`);
      err.statusCode = 415;
      throw err;
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // ── Send to YOLO AI service ──────────────────────────────────────────────
    const detections = await detectWaste(imagePath);

    // ── Compute summary statistics ───────────────────────────────────────────
    const totalObjects = detections.length;
    let recyclableCount = 0;
    let nonRecyclableCount = 0;
    const categoryMap = {};
    const classFrequency = {};

    for (const det of detections) {
      // Recyclability
      if (isRecyclable(det.class)) {
        recyclableCount++;
      } else {
        nonRecyclableCount++;
      }

      // Category grouping
      const category = extractCategory(det.class);
      categoryMap[category] = (categoryMap[category] || 0) + 1;

      // Most-detected tracking
      const cls = det.class.toLowerCase();
      classFrequency[cls] = (classFrequency[cls] || 0) + 1;
    }

    // Find the most common detected class
    const mostDetected = totalObjects > 0
      ? Object.entries(classFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || null
      : null;

    // ── Save to MongoDB ──────────────────────────────────────────────────────
    const detection = await Detection.create({
      userId: req.user?.id || null,
      imageUrl,
      detections,
      totalObjects,
      recyclable: recyclableCount,
      nonRecyclable: nonRecyclableCount,
      categories: categoryMap,
      mostDetected,
    });

    res.status(201).json({
      success: true,
      detectionId: detection._id,
      imageUrl,
      detections,
      summary: {
        totalObjects,
        recyclable: recyclableCount,
        nonRecyclable: nonRecyclableCount,
        categories: categoryMap,
        mostDetected,
      },
    });
  } catch (error) {
    next(error);
  }
};
