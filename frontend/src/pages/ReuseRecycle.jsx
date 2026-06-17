import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLoader, FiPlay, FiRefreshCw, FiRepeat, FiShield, FiTrash2, FiZap } from 'react-icons/fi';
import FourRCard from '../components/FourRCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorCard from '../components/ErrorCard';
import { useWaste } from '../hooks/useWaste';
import { generateDIYProjects, getAISuggestions, getRecommendations, resolveMediaUrl } from '../services/api';
import { getTopWasteType } from '../utils/waste';

const createFallbackImage = (title) => {
  const safeTitle = String(title || 'DIY project').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <rect width="900" height="900" rx="56" fill="#ffffff" />
      <circle cx="450" cy="340" r="110" fill="#34d399" opacity="0.12" />
      <text x="450" y="440" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700" fill="#0f172a">${safeTitle}</text>
      <text x="450" y="500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#334155">DIY reuse project preview</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const InsightCard = ({ icon: Icon, title, items, accent = 'emerald' }) => {
  const accents = {
    emerald: 'border-emerald-100 bg-emerald-50/70',
    forest: 'border-emerald-200 bg-white',
    light: 'border-emerald-100 bg-emerald-50',
    sage: 'border-emerald-100 bg-white',
  };

  return (
    <motion.article whileHover={{ y: -3, scale: 1.01 }} className={`glass-card border ${accents[accent] || accents.emerald} p-5`}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-[0_12px_28px_rgba(16,185,129,0.12)]">
          <Icon />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900">{title}</h4>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{items.length} tips</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.length > 0 ? items.map((item) => (
          <li key={item} className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_10px_24px_rgba(16,185,129,0.06)]">
            {item}
          </li>
        )) : (
          <li className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm leading-6 text-slate-500">
            No guidance available yet.
          </li>
        )}
      </ul>
    </motion.article>
  );
};

const fallbackFourR = {
  reduce: 'Minimize disposable consumption by choosing refills, bulk items, and products with less packaging.',
  reuse: 'Use the detected materials again as containers, organizers, planters, or protective storage.',
  recycle: 'Sort materials carefully and keep them clean and dry before dropping them at a recycling point.',
  recover: 'If reuse and recycling are not possible, direct the waste to energy recovery or approved disposal routes.',
};

const DiyProjectCard = ({ project }) => {
  const [imageSrc, setImageSrc] = useState(
    resolveMediaUrl(project.imageUrl || project.placeholderUrl || createFallbackImage(project.title))
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_14px_36px_rgba(16,185,129,0.08)]">
      <div className="relative">
        <img
          src={imageSrc}
          alt={project.title}
          className="h-56 w-full object-cover"
          onError={() => setImageSrc(resolveMediaUrl(project.placeholderUrl || createFallbackImage(project.title)))}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-10">
          <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
            Green reuse idea
          </span>
          <p className="mt-3 text-lg font-semibold text-slate-900">{project.title}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">DIY Project</p>
        <h4 className="mt-2 text-xl font-bold text-slate-900">{project.title}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
      </div>
    </article>
  );
};

export default function ReuseRecycle() {
  const { state, dispatch } = useWaste();
  const detections = state.detections || [];
  const topWasteType = getTopWasteType(detections) || state.analysis?.mostDetected || null;
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [diyProjects, setDiyProjects] = useState([]);
  const [diyLoading, setDiyLoading] = useState(false);
  const [diyError, setDiyError] = useState(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!detections.length || !topWasteType) return;
      try {
        dispatch({ type: 'SET_LOADING', key: 'recommendations', value: true });
        const recommendationResponse = await getRecommendations(detections);
        dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendationResponse.recommendations });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          key: 'recommendations',
          value: error instanceof Error ? error.message : 'Could not load 4R recommendations.',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'recommendations', value: false });
      }
    };

    loadSuggestions();
  }, [detections, dispatch, topWasteType]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!detections.length) return;
      try {
        setAiLoading(true);
        setAiError(null);
        const response = await getAISuggestions(detections);
        setAiInsights(response);
      } catch (error) {
        setAiError(error instanceof Error ? error.message : 'Could not load AI insights.');
      } finally {
        setAiLoading(false);
      }
    };

    loadInsights();
  }, [detections]);

  const handleGenerateDIY = async () => {
    const sourceWasteType = topWasteType || state.analysis?.mostDetected || 'recycling';
    try {
      setDiyLoading(true);
      setDiyError(null);
      const response = await generateDIYProjects(sourceWasteType);
      setDiyProjects(response.projects || []);
    } catch (error) {
      setDiyError(error instanceof Error ? error.message : 'DIY reuse ideas could not be generated.');
    } finally {
      setDiyLoading(false);
    }
  };

  if (!detections.length) {
    return (
      <section className="page-shell section-shell">
        <ErrorCard
          title="No waste data yet"
          message="Run a detection first so we can suggest 4R actions and DIY ideas."
        />
        <Link to="/detect" className="primary-button mt-5">
          Go to Detection
        </Link>
      </section>
    );
  }

  const recommendations = state.recommendations || fallbackFourR;

  return (
    <section className="page-shell section-shell space-y-8">
      <div className="section-card p-1">
        <motion.section whileHover={{ y: -3 }} className="rounded-[30px] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">AI Sustainability Insights</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Groq-powered guidance</h3>
            </div>
            {aiLoading ? <FiLoader className="animate-spin text-emerald-600" /> : null}
          </div>

          {aiError ? (
            <div className="mt-5">
              <ErrorCard title="AI insight issue" message={aiError} />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            {aiInsights ? (
              <>
                <InsightCard icon={FiShield} title="Recommendations" items={aiInsights.recommendations || []} accent="emerald" />
                <div className="grid gap-4 md:grid-cols-2">
                  <InsightCard icon={FiZap} title="Reduce" items={aiInsights.reduce || []} accent="forest" />
                  <InsightCard icon={FiRefreshCw} title="Reuse" items={aiInsights.reuse || []} accent="light" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InsightCard icon={FiRepeat} title="Recycle" items={aiInsights.recycle || []} accent="sage" />
                  <InsightCard icon={FiTrash2} title="Recover" items={aiInsights.recover || []} accent="forest" />
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Environmental Impact</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{aiInsights.impact}</p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-sm text-slate-500">
                {aiLoading ? 'Building sustainability insights...' : 'No AI insights yet. Generate reuse suggestions to populate this section.'}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FourRCard title="Reduce" description={recommendations.reduce || fallbackFourR.reduce} tone="emerald" />
        <FourRCard title="Reuse" description={recommendations.reuse || fallbackFourR.reuse} tone="forest" />
        <FourRCard title="Recycle" description={recommendations.recycle || fallbackFourR.recycle} tone="light" />
        <FourRCard title="Recover" description={recommendations.recover || fallbackFourR.recover} tone="sage" />
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">DIY Reuse Ideas</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Generate three projects only when you want them</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              This keeps the page responsive and avoids automatic image generation after detection.
            </p>
          </div>
          <button type="button" className="primary-button" onClick={handleGenerateDIY} disabled={diyLoading}>
            {diyLoading ? <FiLoader className="animate-spin" /> : <FiPlay />}
            Show DIY Reuse Ideas
          </button>
        </div>

        {diyError ? (
          <div className="mt-5">
            <ErrorCard title="DIY issue" message={diyError} />
          </div>
        ) : null}

        {diyLoading ? (
          <LoadingSpinner label="Generating reuse ideas..." />
        ) : null}

        {diyProjects.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {diyProjects.map((project) => (
              <DiyProjectCard key={project.title} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-sm text-slate-500">
            Click the button above to generate three beautiful DIY reuse cards with Pollinations images.
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link to="/recycling-centers" className="primary-button">
          Find Recycling Centers <FiRepeat />
        </Link>
        <Link to="/analysis" className="secondary-button">
          <FiRefreshCw />
          Back to analysis
        </Link>
      </div>

      {state.loading.recommendations ? <LoadingSpinner label="Building reuse suggestions..." fullScreen /> : null}

      {state.errors.recommendations ? (
        <div className="mt-8">
          <ErrorCard message={state.errors.recommendations} />
        </div>
      ) : null}
    </section>
  );
}
