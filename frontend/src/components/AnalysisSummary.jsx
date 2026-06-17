import { motion } from 'framer-motion';

export default function AnalysisSummary({ analysis, summary }) {
  const data = analysis || summary || {};

  return (
    <motion.section whileHover={{ y: -3, scale: 1.005 }} className="glass-card p-6">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Summary</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">Analysis summary</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Most Detected Waste', value: data.mostDetected || 'N/A' },
          { label: 'Recyclable Count', value: data.recyclable ?? data.recyclableCount ?? 0 },
          { label: 'Non-Recyclable Count', value: data.nonRecyclable ?? data.nonRecyclableCount ?? 0 },
          { label: 'Total Objects', value: data.totalObjects ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            <p className="mt-2 break-words text-lg font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
      {data.summary ? <p className="mt-5 text-sm leading-7 text-slate-600">{data.summary}</p> : null}
    </motion.section>
  );
}
