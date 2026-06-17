import { motion } from 'framer-motion';

export default function DIYCard({ diy, loading = false }) {
  if (!diy) return null;

  return (
    <motion.article whileHover={{ y: -3, scale: 1.01 }} className="glass-card p-6">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">DIY Suggestion</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{diy.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{diy.description}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Materials</h4>
          <ul className="mt-3 space-y-2">
            {(diy.materials || []).map((item) => (
              <li key={item} className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Steps</h4>
          <ol className="mt-3 space-y-2">
            {(diy.steps || []).map((item) => (
              <li key={item} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {item}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">Refreshing DIY idea...</p> : null}
    </motion.article>
  );
}
