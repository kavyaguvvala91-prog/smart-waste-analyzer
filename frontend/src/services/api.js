import axios from 'axios';

const defaultApiBaseURL = import.meta.env.DEV
  ? 'http://localhost:5001'
  : '';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseURL;
const mediaBaseURL = import.meta.env.VITE_MEDIA_BASE_URL?.trim() || apiBaseURL;
const API_TIMEOUT_MS = 120000;

const api = axios.create({
  baseURL: apiBaseURL,
  // AI-heavy requests can take a while, especially on a cold start.
  timeout: API_TIMEOUT_MS,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
};

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${mediaBaseURL}${url}`;
};

const readErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return fallback;
};

export const detectWaste = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const { data } = await api.post('/api/detect', formData);
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Detection failed. Please try another image.'));
  }
};

export const loginUser = async (payload) => {
  try {
    const { data } = await api.post('/api/auth/login', payload);
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Unable to sign in.'));
  }
};

export const registerUser = async (payload) => {
  try {
    const { data } = await api.post('/api/auth/register', payload);
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Unable to create your account.'));
  }
};

export const fetchCurrentUser = async () => {
  try {
    const { data } = await api.get('/api/auth/me');
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Unable to restore your session.'));
  }
};

export const updateUserProfile = async (payload) => {
  try {
    const { data } = await api.put('/api/auth/profile', payload);
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Unable to update your profile.'));
  }
};

export const analyzeWaste = async (detections) => {
  try {
    const { data } = await api.post('/api/analysis', { detections });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Analysis failed. Please try again.'));
  }
};

export const getAISuggestions = async (detections) => {
  try {
    const { data } = await api.post('/api/ai/suggestions', { detections });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not load AI sustainability insights.'));
  }
};

export const getRecommendations = async (detectionsOrTypes) => {
  const payload = Array.isArray(detectionsOrTypes?.[0])
    ? { wasteTypes: detectionsOrTypes }
    : Array.isArray(detectionsOrTypes) && detectionsOrTypes.length && typeof detectionsOrTypes[0] === 'object'
      ? { detections: detectionsOrTypes }
      : { wasteTypes: detectionsOrTypes };

  try {
    const { data } = await api.post('/api/recommendations', payload);
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not generate recommendations.'));
  }
};

export const generateDIY = async (wasteType) => {
  try {
    const { data } = await api.post('/api/diy', { wasteType });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'DIY generation failed.'));
  }
};

export const generateDIYProjects = async (wasteType) => {
  try {
    const { data } = await api.post('/api/diy/generate', { wasteType });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'DIY reuse ideas could not be generated.'));
  }
};

export const generateDIYImage = async (wasteType, diyIdea) => {
  try {
    const { data } = await api.post('/api/diy/image', { wasteType, diyIdea });
    return data;
  } catch (error) {
    if (error?.response?.data?.imageUrl) {
      return error.response.data;
    }
    throw new Error(readErrorMessage(error, 'DIY image generation failed.'));
  }
};

export const getRecyclingCenters = async ({ latitude, longitude, wasteType = '' }) => {
  try {
    const { data } = await api.get('/api/recycling-centers', {
      params: { latitude, longitude, wasteType },
    });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not find recycling centers.'));
  }
};

export const getHistory = async ({ page = 1, limit = 12 } = {}) => {
  try {
    const { data } = await api.get('/api/history', {
      params: { page, limit },
    });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not load history.'));
  }
};

export const getDashboardOverview = async () => {
  try {
    const { data } = await api.get('/api/dashboard/overview');
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not load dashboard overview.'));
  }
};

export const getMyReports = async () => {
  try {
    const { data } = await api.get('/api/reports/mine');
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not load your reports.'));
  }
};

export const createWasteReport = async (payload) => {
  try {
    const { data } = await api.post('/api/reports', payload);
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not save the waste report.'));
  }
};

export const getAdminReports = async () => {
  try {
    const { data } = await api.get('/api/reports/admin');
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not load admin waste reports.'));
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const { data } = await api.patch(`/api/reports/${reportId}/status`, { status });
    return data;
  } catch (error) {
    throw new Error(readErrorMessage(error, 'Could not update the report status.'));
  }
};

export default api;
