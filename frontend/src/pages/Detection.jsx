import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiLoader, FiShield } from 'react-icons/fi';
import UploadCard from '../components/UploadCard';
import WebcamCapture from '../components/WebcamCapture';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorCard from '../components/ErrorCard';
import { useWaste } from '../hooks/useWaste';
import { analyzeWaste, detectWaste } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { summarizeDetections } from '../utils/waste';

export default function Detection() {
  const navigate = useNavigate();
  const { state, dispatch } = useWaste();
  const { ensureAuth, isAuthenticated, user, ecoLevel } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(state.uploadedImage?.preview || '');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const syncSelection = (selectedFile, previewOverride = '') => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const preview = previewOverride || URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(preview);
    dispatch({
      type: 'SET_UPLOADED_IMAGE',
      payload: {
        file: selectedFile,
        preview,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      },
    });
    setLocalError(null);
    dispatch({ type: 'SET_ERROR', key: 'detect', value: null });
  };

  const handleCapture = (capturedFile, preview) => {
    syncSelection(capturedFile, preview);
  };

  const handleAnalyze = async () => {
    if (!ensureAuth({ mode: 'choice' })) {
      return;
    }

    const activeFile = file || state.uploadedImage?.file;
    if (!activeFile) {
      setLocalError('Please upload an image or capture a webcam frame before analyzing.');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', key: 'detect', value: true });
      dispatch({ type: 'SET_LOADING', key: 'analysis', value: true });
      dispatch({ type: 'SET_ERROR', key: 'detect', value: null });
      dispatch({ type: 'SET_ERROR', key: 'analysis', value: null });

      const detectionResponse = await detectWaste(activeFile);
      const detections = Array.isArray(detectionResponse.detections) ? detectionResponse.detections : [];
      const fallbackSummary = summarizeDetections(detections);
      const analysisResponse = await analyzeWaste(detections);

      dispatch({ type: 'SET_DETECTIONS', payload: detections });
      dispatch({
        type: 'SET_DETECTION_RESULT',
        payload: {
          ...detectionResponse,
          summary: detectionResponse.summary || fallbackSummary,
        },
      });
      dispatch({
        type: 'SET_ANALYSIS',
        payload: {
          ...analysisResponse,
          mostDetected: analysisResponse.mostDetected || detectionResponse.summary?.mostDetected || fallbackSummary.mostDetected,
          totalObjects: analysisResponse.totalObjects ?? detectionResponse.summary?.totalObjects ?? fallbackSummary.totalObjects,
          recyclable: analysisResponse.recyclable ?? detectionResponse.summary?.recyclable ?? fallbackSummary.recyclable,
          nonRecyclable: analysisResponse.nonRecyclable ?? detectionResponse.summary?.nonRecyclable ?? fallbackSummary.nonRecyclable,
        },
      });

      navigate('/analysis?view=analysis');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Detection failed.';
      dispatch({ type: 'SET_ERROR', key: 'detect', value: message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'detect', value: false });
      dispatch({ type: 'SET_LOADING', key: 'analysis', value: false });
    }
  };

  const handleRemove = () => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setFile(null);
    setLocalError(null);
    dispatch({ type: 'CLEAR_UPLOADED_IMAGE' });
  };

  const busy = state.loading.detect || state.loading.analysis;
  const error = localError || state.errors.detect;

  return (
    <section className="page-shell section-shell">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Detection</p>
          <h1 className="soft-heading mt-2 text-4xl text-slate-900">Upload a waste image or capture one with your camera</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            The detection engine is still the same YOLO pipeline. We only layered on authentication checks, reporting, and a polished eco theme around it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="chip">
              <FiShield />
              {isAuthenticated ? `${ecoLevel.icon} ${ecoLevel.label}` : 'Sign in to scan'}
            </div>
            <div className="chip">Eco Points: {user?.points || 0}</div>
          </div>
        </div>

        <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-6 shadow-[0_18px_48px_rgba(16,185,129,0.08)]">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Protected actions</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Uploading an image, opening the camera, and running detection now ask for sign-in if the visitor is not authenticated.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-[0_14px_32px_rgba(16,185,129,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Auth status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{isAuthenticated ? 'Signed in' : 'Guest visitor'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_14px_32px_rgba(16,185,129,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Workflow</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Upload, detect, analyze, report</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="primary-button"
          onClick={handleAnalyze}
          disabled={busy}
        >
          {busy ? <FiLoader className="animate-spin" /> : <FiArrowRight />}
          Analyze image
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <UploadCard
          previewUrl={previewUrl}
          onFileSelect={syncSelection}
          onRemove={handleRemove}
          error={error}
          isBusy={busy}
          onRequireAuth={() => ensureAuth({ mode: 'choice' })}
        />
        <WebcamCapture onCapture={handleCapture} onRequireAuth={() => ensureAuth({ mode: 'choice' })} />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        If the backend returns an error, we surface it here so the user can retry immediately.
      </p>

      {state.loading.detect ? <LoadingSpinner label="Detecting waste..." /> : null}
      {state.errors.detect ? (
        <div className="mt-5">
          <ErrorCard
            message={state.errors.detect}
            onRetry={file || state.uploadedImage?.file ? handleAnalyze : null}
          />
        </div>
      ) : null}
    </section>
  );
}
