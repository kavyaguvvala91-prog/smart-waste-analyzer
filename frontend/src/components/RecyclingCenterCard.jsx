import { motion } from 'framer-motion';
import { FiMapPin, FiExternalLink, FiClock } from 'react-icons/fi';

export default function RecyclingCenterCard({ center }) {
  return (
    <motion.article whileHover={{ y: -3, scale: 1.005 }} className="glass-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{center.name}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <FiMapPin className="text-emerald-600" />
            {center.address}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Distance</p>
          <p className="text-lg font-black text-slate-900">{center.distance}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Array.isArray(center.wasteTypes) && center.wasteTypes.length > 0 ? center.wasteTypes.map((type) => (
          <span key={type} className="chip">
            {type}
          </span>
        )) : (
          <span className="chip">Recycling</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {center.rating ? <span className="chip">Rating: {center.rating}</span> : null}
        {typeof center.openNow === 'boolean' ? (
          <span className="chip">
            <FiClock className={center.openNow ? 'text-emerald-600' : 'text-slate-500'} />
            {center.openNow ? 'Open now' : 'Closed now'}
          </span>
        ) : null}
      </div>

      <a
        href={center.mapsUrl || center.mapsLink}
        target="_blank"
        rel="noreferrer"
        className="secondary-button mt-5 w-full justify-center"
      >
        <FiExternalLink />
        Maps
      </a>
    </motion.article>
  );
}
