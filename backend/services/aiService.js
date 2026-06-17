/**
 * AI Service
 * Communicates with the Python YOLOv8 detection microservice
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Flask YOLO service runs on port 8000 by default in ai-model/app.py.
const getAiModelUrl = () => process.env.AI_MODEL_URL?.trim() || 'http://localhost:8000';

// Recyclable waste classes (used for classification logic)
const RECYCLABLE_CLASSES = new Set([
  'plastic bottle',
  'plastic bag',
  'plastic container',
  'paper',
  'cardboard',
  'glass bottle',
  'glass jar',
  'metal can',
  'aluminium can',
  'tin can',
  'newspaper',
  'magazine',
  'carton',
]);

/**
 * Sends an image file to the Python YOLO service for detection.
 * @param {string} imagePath - Absolute path to the uploaded image file
 * @returns {Promise<Array>} Array of detection objects { class, confidence }
 */
export const detectWaste = async (imagePath) => {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  const aiModelUrl = getAiModelUrl();

  try {
    const response = await axios.post(`${aiModelUrl}/predict`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000, // 30 second timeout for AI inference
    });

    const { detections } = response.data;

    if (!Array.isArray(detections)) {
      throw new Error('AI service returned an invalid detections format');
    }

    return detections;
  } catch (error) {
    if (!error.response) {
      // Service is down / unreachable
      const serviceError = new Error(
        'AI detection service is offline. Please ensure the Python YOLO service is running.'
      );
      serviceError.statusCode = 503;
      throw serviceError;
    }
    throw error;
  }
};

/**
 * Determines whether a waste class is recyclable.
 * @param {string} wasteClass - e.g. "plastic bottle"
 * @returns {boolean}
 */
export const isRecyclable = (wasteClass) => {
  const normalized = wasteClass.toLowerCase().trim();
  return RECYCLABLE_CLASSES.has(normalized);
};

/**
 * Extracts the broad category from a detected class name.
 * e.g. "plastic bottle" → "plastic"
 * @param {string} wasteClass
 * @returns {string}
 */
export const extractCategory = (wasteClass) => {
  const normalized = wasteClass.toLowerCase().trim();

  if (normalized.includes('plastic')) return 'plastic';
  if (normalized.includes('paper') || normalized.includes('cardboard') || normalized.includes('newspaper') || normalized.includes('magazine')) return 'paper';
  if (normalized.includes('glass')) return 'glass';
  if (normalized.includes('metal') || normalized.includes('aluminium') || normalized.includes('tin') || normalized.includes('can')) return 'metal';
  if (normalized.includes('organic') || normalized.includes('food') || normalized.includes('vegetable') || normalized.includes('fruit')) return 'organic';
  if (normalized.includes('electronic') || normalized.includes('battery') || normalized.includes('phone')) return 'e-waste';

  return 'other';
};
