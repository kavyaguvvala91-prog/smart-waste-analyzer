import { motion } from 'framer-motion';

export default function StatisticsCard({ icon: Icon, title, value, subtitle, tone = 'emerald' }) {
  const tones = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    forest: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    light: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
    sage: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  };

  const toneClass = tones[tone] || tones.emerald;

  return (
    <motion.article whileHover={{ y: -3, scale: 1.01 }} className="glass-card p-5">
      <div className={`inline-flex rounded-2xl border p-3 ${toneClass.bg} ${toneClass.border}`}>
        <Icon className={`text-2xl ${toneClass.text}`} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
    </motion.article>
  );
}
