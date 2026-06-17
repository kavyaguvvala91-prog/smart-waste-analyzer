import { motion } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';
import { resolveMediaUrl } from '../services/api';

export default function DIYImageCard({ imageUrl, title, onRefresh, loading = false }) {
  if (!imageUrl) return null;

  return (
    <motion.article whileHover={{ y: -3, scale: 1.01 }} className="glass-card overflow-hidden p-4">
      <div className="flex items-start justify-between gap-4 px-2 pt-1">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">DIY Image</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{title || 'Generated craft image'}</h3>
        </div>
        {onRefresh ? (
          <button type="button" className="secondary-button shrink-0" onClick={onRefresh} disabled={loading}>
            <FiRefreshCw />
            Refresh
          </button>
        ) : null}
      </div>
      <div className="mt-4 overflow-hidden rounded-3xl">
        <img src={resolveMediaUrl(imageUrl)} alt={title || 'Generated DIY craft'} className="h-[22rem] w-full object-cover" />
      </div>
      {loading ? <p className="px-2 pb-2 pt-3 text-sm text-slate-500">Generating image...</p> : null}
    </motion.article>
  );
}
