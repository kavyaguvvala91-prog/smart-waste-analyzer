/**
 * AI Service
 * Communicates with the Python YOLOv8 detection microservice
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Flask YOLO service runs on port 8000 by default in ai-model/app.py.
// In production, AI_MODEL_URL must point to the deployed Python service URL.
const DEFAULT_LOCAL_AI_MODEL_URL = 'http://127.0.0.1:8000';

const getAiModelUrl = () => {
  const configuredUrl = process.env.AI_MODEL_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AI_MODEL_URL is not configured. Set it to the deployed Python YOLO service URL.'
    );
  }

  return DEFAULT_LOCAL_AI_MODEL_URL;
};

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
  const requestTimeoutMs = 120000; // Give free Render services time to wake up

  try {
    const response = await axios.post(`${aiModelUrl}/predict`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: requestTimeoutMs,
    });

    const { detections } = response.data;

    if (!Array.isArray(detections)) {
      throw new Error('AI service returned an invalid detections format');
    }

    return detections;
  } catch (error) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        const serviceError = new Error(
          `AI detection service timed out while starting at ${aiModelUrl}. Please try again in a moment.`
        );
        serviceError.statusCode = 503;
        throw serviceError;
      }

      // Service is down / unreachable
      const serviceError = new Error(
        `AI detection service is offline or unreachable at ${aiModelUrl}. ` +
        'Please ensure the Python YOLO service is deployed and AI_MODEL_URL points to it.'
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
