import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function ErrorCard({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card border border-red-100 bg-red-50/70 p-6 text-slate-900"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white p-3 text-red-600 shadow-[0_8px_18px_rgba(220,38,38,0.08)]">
          <FiAlertTriangle className="text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          {onRetry ? (
            <button className="secondary-button mt-4 border-red-200 text-red-700 hover:border-red-300" onClick={onRetry}>
              <FiRefreshCw />
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
