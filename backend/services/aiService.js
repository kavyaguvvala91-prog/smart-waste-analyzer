/**
 * AI Service
 * Communicates with the Python YOLOv8 detection microservice
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath, URL } from 'url';

// Flask YOLO service runs on port 8000 by default in ai-model/app.py.
// In production, AI_MODEL_URL must point to the deployed Python service URL.
const DEFAULT_LOCAL_AI_MODEL_URL = 'http://127.0.0.1:8000';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AI_MODEL_APP_PATH = path.join(__dirname, '..', '..', 'ai-model', 'app.py');
const AI_MODEL_WORKDIR = path.dirname(AI_MODEL_APP_PATH);
const AI_MODEL_PYTHON = path.join(AI_MODEL_WORKDIR, 'venv', 'Scripts', 'python.exe');

let localAiServiceStartPromise = null;
let localAiServiceProcess = null;
const RETRYABLE_UPSTREAM_STATUSES = new Set([502, 503, 504]);
const AI_SERVICE_READY_TIMEOUT_MS = 60000;
const AI_SERVICE_READY_POLL_MS = 2000;
const AI_SERVICE_RETRY_DELAY_MS = 5000;

const isLocalHost = (value) => {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
};

const isReachable = async (url, timeoutMs = 1500) => {
  try {
    await axios.get(`${url}/health`, { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const postDetectionRequest = async (aiModelUrl, form, requestTimeoutMs) => {
  return axios.post(`${aiModelUrl}/predict`, form, {
    headers: {
      ...form.getHeaders(),
    },
    timeout: requestTimeoutMs,
  });
};

const getResponseMessage = (payload, fallback) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }

    if (payload.error && typeof payload.error.message === 'string' && payload.error.message.trim()) {
      return payload.error.message;
    }
  }

  return fallback;
};

const buildServiceError = (message, statusCode, aiModelUrl) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.upstreamStatus = statusCode;
  error.serviceUrl = aiModelUrl;
  return error;
};

const buildUnavailableServiceError = (aiModelUrl, details = '') => {
  const suffix = details ? ` ${details}` : '';
  return buildServiceError(
    `AI detection service is temporarily unavailable.${suffix} Please try again in a moment.`,
    503,
    aiModelUrl,
  );
};

const waitForServiceReady = async (aiModelUrl, timeoutMs = AI_SERVICE_READY_TIMEOUT_MS) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await axios.get(`${aiModelUrl}/health`, { timeout: 2000 });
      return true;
    } catch {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }

      await sleep(Math.min(AI_SERVICE_READY_POLL_MS, remaining));
    }
  }

  return false;
};

const parseDetectionResponse = (response, aiModelUrl) => {
  const data = response.data || {};
  const upstreamStatus = response.status || 502;

  if (data.success === false) {
    const message = getResponseMessage(data, 'AI service reported a failure.');
    throw buildServiceError(
      `AI detection service at ${aiModelUrl} returned ${upstreamStatus}: ${message}`,
      upstreamStatus,
      aiModelUrl,
    );
  }

  const { detections } = data;

  if (!Array.isArray(detections)) {
    throw buildServiceError(
      `AI service returned an invalid detections format from ${aiModelUrl}`,
      upstreamStatus,
      aiModelUrl,
    );
  }

  return detections;
};

const startLocalAiService = async () => {
  if (localAiServiceStartPromise) {
    return localAiServiceStartPromise;
  }

  localAiServiceStartPromise = (async () => {
    if (await isReachable(DEFAULT_LOCAL_AI_MODEL_URL)) {
      return true;
    }

    if (!fs.existsSync(AI_MODEL_APP_PATH)) {
      throw new Error(`Local AI service entrypoint not found at ${AI_MODEL_APP_PATH}`);
    }

    const executable = fs.existsSync(AI_MODEL_PYTHON) ? AI_MODEL_PYTHON : 'python';
    const child = spawn(executable, ['app.py'], {
      cwd: AI_MODEL_WORKDIR,
      stdio: 'ignore',
      windowsHide: true,
      env: {
        ...process.env,
        AI_MODEL_URL: DEFAULT_LOCAL_AI_MODEL_URL,
        YOLO_CONFIG_DIR: path.join(AI_MODEL_WORKDIR, '.yolo'),
      },
    });

    localAiServiceProcess = child;
    child.on('exit', () => {
      if (localAiServiceProcess === child) {
        localAiServiceProcess = null;
      }
    });

    const started = await new Promise((resolve) => {
      let settled = false;
      const deadline = Date.now() + 30000;
      const finish = (ok, error = null) => {
        if (settled) return;
        settled = true;
        if (error) {
          resolve(false);
          return;
        }
        resolve(ok);
      };

      child.once('error', () => {
        finish(false);
      });

      child.once('exit', (code) => {
        if (!settled && code !== 0) {
          finish(false);
        }
      });

      const poll = async () => {
        if (settled) return;
        if (await isReachable(DEFAULT_LOCAL_AI_MODEL_URL)) {
          finish(true);
          return;
        }

        if (Date.now() >= deadline) {
          finish(false);
          return;
        }

        setTimeout(poll, 1000);
      };

      void poll();
    });

    if (!started) {
      throw new Error(
        `Unable to start the local AI service at ${DEFAULT_LOCAL_AI_MODEL_URL}. ` +
        'Please start ai-model/app.py manually and try again.'
      );
    }

    return true;
  })();

  try {
    return await localAiServiceStartPromise;
  } finally {
    localAiServiceStartPromise = null;
  }
};

const getAiModelUrl = () => {
  const configuredUrl = process.env.AI_MODEL_URL?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In local development, prefer the bundled AI service unless the env
    // already points to a local host. This avoids accidental timeouts from a
    // stale cloud URL while keeping the configured value available in prod.
    if (!configuredUrl || !isLocalHost(configuredUrl)) {
      return DEFAULT_LOCAL_AI_MODEL_URL;
    }
  }

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (isProduction) {
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

  if (process.env.NODE_ENV !== 'production' && isLocalHost(aiModelUrl)) {
    await startLocalAiService();
  }

  try {
    const response = await postDetectionRequest(aiModelUrl, form, requestTimeoutMs);
    return parseDetectionResponse(response, aiModelUrl);
  } catch (error) {
    const status = error.response?.status;
    const isTransientNetworkError = !error.response || error.code === 'ECONNABORTED';

    if ((status && RETRYABLE_UPSTREAM_STATUSES.has(status)) || isTransientNetworkError) {
      await sleep(AI_SERVICE_RETRY_DELAY_MS);

      const retryReady = await waitForServiceReady(aiModelUrl, AI_SERVICE_READY_TIMEOUT_MS / 2);
      if (!retryReady) {
        throw buildUnavailableServiceError(aiModelUrl);
      }

      try {
        const retryForm = new FormData();
        retryForm.append('image', fs.createReadStream(imagePath));
        const retryResponse = await postDetectionRequest(aiModelUrl, retryForm, requestTimeoutMs);
        return parseDetectionResponse(retryResponse, aiModelUrl);
      } catch (retryError) {
        if (retryError.response) {
          throw retryError;
        }

        throw buildUnavailableServiceError(aiModelUrl);
      }
    }

    if (!error.response) {
      throw buildUnavailableServiceError(aiModelUrl);
    }

    if (error.response) {
      const serviceMessage = getResponseMessage(
        error.response.data,
        error.message || 'AI detection request failed.',
      );
      throw buildServiceError(
        `AI detection service returned ${status || 502}: ${serviceMessage}`,
        status || 502,
        aiModelUrl,
      );
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
