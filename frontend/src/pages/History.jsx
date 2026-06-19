import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import HistoryCard from '../components/HistoryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorCard from '../components/ErrorCard';
import { useWaste } from '../hooks/useWaste';
import { getHistory } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function History() {
  const { state, dispatch } = useWaste();
  const { user, isAdmin, ecoLevel } = useAuth();
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        dispatch({ type: 'SET_LOADING', key: 'history', value: true });
        dispatch({ type: 'SET_ERROR', key: 'history', value: null });
        const response = await getHistory({ page, limit: 12 });
        dispatch({ type: 'SET_HISTORY', payload: response.history || [] });
        setPages(response.pages || 1);
        setCount(response.total || 0);
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          key: 'history',
          value: error instanceof Error ? error.message : 'History could not be loaded.',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'history', value: false });
      }
    };

    loadHistory();
  }, [dispatch, page]);

  return (
    <section className="page-shell section-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">History</p>
          <h1 className="soft-heading mt-2 text-4xl text-slate-900">Previous detections</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {isAdmin
              ? 'Admins can review the broader detection record for the municipality.'
              : 'Your authenticated scan history keeps the latest detections, summaries, and image previews together.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="chip">
            <FiClock />
            {count} records
          </div>
          <div className="chip">
            {ecoLevel.icon}
            {ecoLevel.label}
          </div>
          <div className="chip">
            Eco Points: {user?.points || 0}
          </div>
        </div>
      </div>

      {state.errors.history ? (
        <div className="mt-8">
          <ErrorCard message={state.errors.history} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(state.history || []).map((entry) => (
          <HistoryCard key={entry.id} entry={entry} />
        ))}
      </div>

      {state.history?.length === 0 && !state.loading.history ? (
        <div className="glass-card mt-8 p-8 text-center">
          <p className="text-lg font-bold text-slate-900">No history records yet</p>
          <p className="mt-2 text-sm text-slate-600">Run a detection to generate the first entry.</p>
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={page <= 1}
        >
          <FiChevronLeft />
          Previous
        </button>
        <span className="text-sm font-semibold text-slate-600">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPage((value) => Math.min(pages, value + 1))}
          disabled={page >= pages}
        >
          Next <FiChevronRight />
        </button>
      </div>

      {state.loading.history ? <LoadingSpinner label="Loading history..." fullScreen /> : null}
    </section>
  );
}
