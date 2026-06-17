/**
 * Groq Service
 * Generates structured sustainability guidance using Groq's OpenAI-compatible API.
 */

import axios from 'axios';

const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';
const getGroqApiKey = () => process.env.GROQ_API_KEY?.trim();

const normalizeText = (value) => String(value || '').trim();

const safeJsonParse = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;

  const cleaned = value.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

const buildInsightsPrompt = (detections = []) => {
  const items = Array.isArray(detections)
    ? detections.map((detection) => ({
        class: normalizeText(detection?.class),
        confidence: Number(detection?.confidence || 0),
      }))
    : [];

  return `
You are an eco-friendly sustainability assistant for a smart waste analyzer app.
The user detected the following waste items:
${items.map((item) => `- ${item.class || 'unknown'} (${Math.round(item.confidence * 100)}%)`).join('\n') || '- No detections'}

Return practical guidance for disposal, recycling, reduction, reuse, recycling, and recovery.
Keep every recommendation concrete, concise, and suitable for a consumer app.

Respond only with valid JSON in this exact schema:
{
  "recommendations": ["..."],
  "reduce": ["..."],
  "reuse": ["..."],
  "recycle": ["..."],
  "recover": ["..."],
  "impact": "..."
}

Rules:
- Use 2 to 4 short bullet-like strings per array.
- "recommendations" should summarize the best immediate disposal actions.
- "impact" should be a short environmental summary in 2 to 3 sentences.
- Do not include markdown, code fences, or extra keys.
  `.trim();
};

export const generateSustainabilityInsights = async (detections = []) => {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please verify backend/.env.');
  }

  const response = await axios.post(
    `${GROQ_API_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You generate structured sustainability guidance for waste detection results.',
        },
        {
          role: 'user',
          content: buildInsightsPrompt(detections),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sustainability_insights',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              recommendations: {
                type: 'array',
                items: { type: 'string' },
              },
              reduce: {
                type: 'array',
                items: { type: 'string' },
              },
              reuse: {
                type: 'array',
                items: { type: 'string' },
              },
              recycle: {
                type: 'array',
                items: { type: 'string' },
              },
              recover: {
                type: 'array',
                items: { type: 'string' },
              },
              impact: {
                type: 'string',
              },
            },
            required: ['recommendations', 'reduce', 'reuse', 'recycle', 'recover', 'impact'],
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  const parsed = safeJsonParse(raw);

  if (!parsed) {
    throw new Error('Groq returned an invalid structured response.');
  }

  return {
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    reduce: Array.isArray(parsed.reduce) ? parsed.reduce : [],
    reuse: Array.isArray(parsed.reuse) ? parsed.reuse : [],
    recycle: Array.isArray(parsed.recycle) ? parsed.recycle : [],
    recover: Array.isArray(parsed.recover) ? parsed.recover : [],
    impact: normalizeText(parsed.impact),
  };
};

export default { generateSustainabilityInsights };
