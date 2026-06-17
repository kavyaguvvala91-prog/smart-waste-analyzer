import { motion } from 'framer-motion';
import { FiCalendar, FiBarChart2 } from 'react-icons/fi';
import { formatDate } from '../utils/waste';
import { resolveMediaUrl } from '../services/api';

export default function HistoryCard({ entry }) {
  return (
    <motion.article whileHover={{ y: -3, scale: 1.005 }} className="glass-card overflow-hidden p-4">
      {entry.imageUrl ? <img src={resolveMediaUrl(entry.imageUrl)} alt="Previous detection" className="h-48 w-full rounded-2xl object-cover" /> : null}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">{entry.mostDetected || 'Unknown item'}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <FiCalendar />
            {formatDate(entry.date)}
          </p>
        </div>
        <span className="chip">
          <FiBarChart2 />
          {entry.totalObjects} objects
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Recyclable</p>
          <p className="mt-1 text-lg font-black text-slate-900">{entry.recyclable}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Non-recyclable</p>
          <p className="mt-1 text-lg font-black text-slate-900">{entry.nonRecyclable}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.categories ? Object.entries(entry.categories).slice(0, 4).map(([key, value]) => (
          <span key={key} className="chip">
            {key}: {value}
          </span>
        )) : null}
      </div>
    </motion.article>
  );
}
