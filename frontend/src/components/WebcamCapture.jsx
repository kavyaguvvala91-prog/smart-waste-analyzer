import { useMemo, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { FiCamera, FiRefreshCw, FiZap } from 'react-icons/fi';

const videoConstraints = {
  facingMode: 'environment',
};

export default function WebcamCapture({ onCapture, onRequireAuth }) {
  const webcamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [captureError, setCaptureError] = useState(null);

  const canUseCamera = useMemo(() => typeof navigator !== 'undefined' && navigator.mediaDevices, []);

  const captureFrame = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setCaptureError('Unable to capture a frame from the webcam.');
      return;
    }

    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
    onCapture(file, imageSrc);
  };

  return (
    <motion.div whileHover={{ y: -3, scale: 1.005 }} className="glass-card surface-border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            <FiCamera />
            Webcam Capture
          </div>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Use your camera for a live scan.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start the camera, capture a frame, and send it into the same detection flow as uploaded images.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button shrink-0"
          onClick={() => {
            if (!isActive && onRequireAuth && onRequireAuth() === false) return;
            setIsActive((value) => !value);
          }}
          disabled={!canUseCamera}
        >
          <FiZap />
          {isActive ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        {isActive && canUseCamera ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.95}
            videoConstraints={videoConstraints}
            mirrored={false}
            className="h-[320px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_35%),linear-gradient(135deg,#ffffff,#f0fdf4)]">
            <p className="text-sm font-semibold text-slate-600">
              {canUseCamera ? 'Camera is idle' : 'Camera access is not available in this browser'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (!isActive && onRequireAuth && onRequireAuth() === false) return;
            captureFrame();
          }}
          disabled={!isActive}
        >
          <FiCamera />
          Capture
        </button>
        <button type="button" className="secondary-button" onClick={() => setIsActive(false)}>
          <FiRefreshCw />
          Retake
        </button>
      </div>

      {captureError ? <p className="mt-3 text-sm font-semibold text-rose-600">{captureError}</p> : null}
    </motion.div>
  );
}
