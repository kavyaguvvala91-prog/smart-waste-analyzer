import { motion } from 'framer-motion';

export default function FourRCard({ title, description, tone = 'emerald' }) {
  const backgrounds = {
    emerald: 'border-emerald-100 bg-emerald-50',
    forest: 'border-emerald-200 bg-white',
    light: 'border-emerald-100 bg-emerald-50/70',
    sage: 'border-emerald-100 bg-white',
  };

  return (
    <motion.article whileHover={{ y: -4, scale: 1.01 }} className={`glass-card border ${backgrounds[tone] || backgrounds.emerald} p-6`}>
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">{title}</p>
      <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
    </motion.article>
  );
}
