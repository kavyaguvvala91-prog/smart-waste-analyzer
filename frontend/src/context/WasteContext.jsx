import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const STORAGE_KEY = 'smart-waste-analyzer-state';

const defaultState = {
  uploadedImage: null,
  detections: [],
  analysis: null,
  detectionResult: null,
  recommendations: null,
  diy: null,
  diyImage: null,
  recyclingCenters: [],
  history: [],
  location: null,
  loading: {
    detect: false,
    analysis: false,
    recommendations: false,
    diy: false,
    diyImage: false,
    centers: false,
    history: false,
  },
  errors: {
    detect: null,
    analysis: null,
    recommendations: null,
    diy: null,
    diyImage: null,
    centers: null,
    history: null,
    location: null,
    general: null,
  },
};

const loadInitialState = () => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      loading: defaultState.loading,
      errors: defaultState.errors,
    };
  } catch {
    return defaultState;
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    case 'CLEAR_UPLOADED_IMAGE':
      return { ...state, uploadedImage: null };
    case 'SET_DETECTIONS':
      return { ...state, detections: action.payload };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_DETECTION_RESULT':
      return { ...state, detectionResult: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'SET_DIY':
      return { ...state, diy: action.payload };
    case 'SET_DIY_IMAGE':
      return { ...state, diyImage: action.payload };
    case 'SET_RECYCLING_CENTERS':
      return { ...state, recyclingCenters: action.payload };
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.value },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.key]: action.value },
      };
    case 'RESET_FLOW':
      return {
        ...state,
        uploadedImage: null,
        detections: [],
        analysis: null,
        detectionResult: null,
        recommendations: null,
        diy: null,
        diyImage: null,
        recyclingCenters: [],
        errors: defaultState.errors,
        loading: defaultState.loading,
      };
    default:
      return state;
  }
};

const WasteContext = createContext(null);

export function WasteProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = {
        uploadedImage: null,
        detections: state.detections,
        analysis: state.analysis,
        detectionResult: state.detectionResult,
        recommendations: state.recommendations,
        diy: state.diy,
        diyImage: state.diyImage,
        recyclingCenters: state.recyclingCenters,
        history: state.history,
        location: state.location,
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Persistence is best-effort only.
    }
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleReset = () => {
      dispatch({ type: 'RESET_FLOW' });
    };

    window.addEventListener('smart-waste-reset', handleReset);
    return () => window.removeEventListener('smart-waste-reset', handleReset);
  }, []);

  const value = useMemo(() => ({
    state,
    dispatch,
  }), [state]);

  return <WasteContext.Provider value={value}>{children}</WasteContext.Provider>;
}

export const useWasteContext = () => {
  const context = useContext(WasteContext);
  if (!context) {
    throw new Error('useWasteContext must be used within WasteProvider');
  }
  return context;
};
