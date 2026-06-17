import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCamera, FiCompass, FiLoader, FiMapPin, FiShield, FiStar } from 'react-icons/fi';
import StatisticsCard from '../components/StatisticsCard';
import PieChartCard from '../components/PieChartCard';
import ErrorCard from '../components/ErrorCard';
import { useWaste } from '../hooks/useWaste';
import { analyzeWaste, createWasteReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTopWasteType, summarizeDetections } from '../utils/waste';

const QuickLinkCard = ({ title, description, to, cta }) => (
  <motion.article whileHover={{ y: -3, scale: 1.01 }} className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_14px_32px_rgba(16,185,129,0.08)]">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">{title}</p>
    <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    <Link to={to} className="secondary-button mt-5 inline-flex">
      {cta}
      <FiArrowRight />
    </Link>
  </motion.article>
);

export default function Analysis() {
  const { state, dispatch } = useWaste();
  const { ensureAuth, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('view') === 'report' ? 'report' : 'analysis';
  const detections = state.detections || [];

  const summary = useMemo(() => {
    if (state.analysis) return state.analysis;
    if (state.detectionResult?.summary) {
      return {
        ...summarizeDetections(detections),
        ...state.detectionResult.summary,
      };
    }
    return summarizeDetections(detections);
  }, [detections, state.analysis, state.detectionResult]);

  const dominantWaste = useMemo(
    () => getTopWasteType(detections) || summary.mostDetected || 'recycling',
    [detections, summary.mostDetected]
  );

  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [location, setLocation] = useState(state.location || null);
  const [locationRequested, setLocationRequested] = useState(Boolean(state.location));

  const switchMode = (nextMode) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', nextMode);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const hydrateAnalysis = async () => {
      if (!detections.length || state.analysis || mode !== 'analysis') return;
      try {
        dispatch({ type: 'SET_LOADING', key: 'analysis', value: true });
        const response = await analyzeWaste(detections);
        dispatch({ type: 'SET_ANALYSIS', payload: { ...response, ...summary } });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          key: 'analysis',
          value: error instanceof Error ? error.message : 'Analysis could not be loaded.',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'analysis', value: false });
      }
    };

    hydrateAnalysis();
  }, [detections, dispatch, mode, state.analysis, summary]);

  useEffect(() => {
    if (mode !== 'report' || !detections.length || location || locationRequested) return;

    if (!navigator.geolocation) {
      setLocationRequested(true);
      setLocationError('Geolocation is not available in this browser.');
      return;
    }

    setLocationRequested(true);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocationError(null);
        setLocation(nextLocation);
        dispatch({ type: 'SET_LOCATION', payload: nextLocation });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message || 'Location permission was denied.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  }, [detections.length, dispatch, location, locationRequested, mode]);

  const totalObjects = summary.totalObjects ?? detections.length;
  const sustainabilityScore = summary.totalObjects ? Math.round((summary.recyclable / Math.max(1, summary.totalObjects)) * 100) : 0;

  const handleReportWaste = async () => {
    if (!ensureAuth({ mode: 'choice' })) return;

    if (!location) {
      setLocationError('Location is required to report waste.');
      return;
    }

    const imageUrl = state.detectionResult?.imageUrl || state.uploadedImage?.preview;
    if (!imageUrl) {
      setReportError('No image is available to include in the waste report.');
      return;
    }

    try {
      setReportLoading(true);
      setReportError(null);
      setReportMessage(null);

      const response = await createWasteReport({
        imageUrl,
        wasteType: dominantWaste,
        latitude: location.latitude,
        longitude: location.longitude,
        detectionId: state.detectionResult?.detectionId || null,
      });

      if (response.user) {
        setUser(response.user);
      }

      setReportMessage(`Report saved successfully. +${response.awardedPoints || 10} eco points earned.`);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Could not save waste report.');
    } finally {
      setReportLoading(false);
    }
  };

  if (!detections.length && !state.analysis && !state.detectionResult) {
    return (
      <section className="page-shell section-shell">
        <ErrorCard
          title="No analysis data yet"
          message="Run a detection first so we have detections to analyze."
        />
        <Link to="/detect" className="primary-button mt-5">
          Go to Detection
        </Link>
      </section>
    );
  }

  return (
    <section className="page-shell section-shell space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
            {mode === 'report' ? 'Waste Reporting' : 'Analysis'}
          </p>
          <h1 className="soft-heading mt-2 text-4xl text-slate-900">
            {mode === 'report' ? 'Report this waste and earn points' : 'Current detection results'}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {mode === 'report'
              ? 'Use the location of the detected waste to submit a community report and collect eco points.'
              : 'This page stays focused on scan results and charts. AI sustainability guidance, DIY ideas, and recycling center discovery live in their own sections.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={mode === 'analysis' ? 'primary-button' : 'secondary-button'}
            onClick={() => switchMode('analysis')}
          >
            Analysis
          </button>
          <button
            type="button"
            className={mode === 'report' ? 'primary-button' : 'secondary-button'}
            onClick={() => switchMode('report')}
          >
            Report Waste
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard icon={FiStar} title="Total Waste Detected" value={summary.totalObjects ?? totalObjects} subtitle="Items present in the scan" tone="emerald" />
        <StatisticsCard icon={FiCamera} title="Total Objects" value={totalObjects} subtitle="Detected object count" tone="forest" />
        <StatisticsCard icon={FiCompass} title="Dominant Waste" value={summary.mostDetected || dominantWaste} subtitle="Most common class" tone="light" />
        <StatisticsCard icon={FiShield} title="Sustainability Score" value={`${sustainabilityScore}%`} subtitle="More recyclable is better" tone="sage" />
      </div>

      {mode === 'report' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Report Waste & Earn Points</p>
                <h2 className="soft-heading mt-2 text-2xl text-slate-900">Send this site to municipality workers</h2>
              </div>
              {reportLoading ? <FiLoader className="animate-spin text-emerald-600" /> : null}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-sm text-slate-600">
                {location
                  ? `Captured location: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : locationLoading
                    ? 'Capturing your location...'
                    : 'Browser location will be requested before the report is saved.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="primary-button" onClick={handleReportWaste} disabled={reportLoading}>
                  Report Waste
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setLocationError('Geolocation is not available in this browser.');
                      return;
                    }

                    setLocationRequested(false);
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const nextLocation = {
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                        };
                        setLocationError(null);
                        setLocation(nextLocation);
                        dispatch({ type: 'SET_LOCATION', payload: nextLocation });
                      },
                      (error) => setLocationError(error.message || 'Location permission was denied.')
                    );
                  }}
                >
                  <FiMapPin />
                  Refresh Location
                </button>
              </div>
              {reportMessage ? <p className="mt-4 text-sm font-semibold text-emerald-700">{reportMessage}</p> : null}
              {reportError ? <p className="mt-4 text-sm font-semibold text-rose-600">{reportError}</p> : null}
              {locationError ? <p className="mt-4 text-sm font-semibold text-rose-600">{locationError}</p> : null}
            </div>
          </div>

          <div className="glass-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">What happens next</p>
            <div className="mt-4 grid gap-3">
              {[
                'The report is stored with your user ID and geolocation.',
                'You earn 10 eco points immediately.',
                'Municipality workers can review the report in the admin panel.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <button type="button" className="secondary-button mt-5" onClick={() => switchMode('analysis')}>
              Back to analysis
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <PieChartCard detections={detections} analysis={state.analysis || summary} />

            <div className="glass-card p-6">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Focused Navigation</p>
              <h2 className="soft-heading mt-2 text-2xl text-slate-900">Move to the right feature without repeating content</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                AI sustainability assistance and DIY reuse ideas live in Reuse &amp; Recycle. Nearby recycling centers live in Centers.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/reuse-recycle" className="primary-button">
                  Reuse &amp; Recycle <FiArrowRight />
                </Link>
                <Link to="/recycling-centers" className="secondary-button">
                  Nearby Centers <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <QuickLinkCard
              title="AI Sustainability Assistant"
              description="Get Groq-powered disposal, reduce, reuse, recycle, and recover suggestions from the dedicated Reuse & Recycle page."
              to="/reuse-recycle"
              cta="Open AI Guidance"
            />
            <QuickLinkCard
              title="DIY Reuse Ideas"
              description="Generate three Pollinations-based DIY ideas from the detected waste type when you want hands-on reuse inspiration."
              to="/reuse-recycle"
              cta="Open DIY Ideas"
            />
            <QuickLinkCard
              title="Nearby Recycling Centers"
              description="Use your location on the Centers page to find recycling centers, view them on the map, and open directions."
              to="/recycling-centers"
              cta="Open Centers"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="secondary-button" onClick={() => switchMode('report')}>
          Go to Report
        </button>
      </div>
    </section>
  );
}
