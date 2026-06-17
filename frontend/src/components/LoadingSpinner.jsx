import { motion } from 'framer-motion';

export default function LoadingSpinner({ label = 'Loading...', fullScreen = false, className = '' }) {
  const wrapperClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'flex items-center justify-center py-10';

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className="glass-card flex items-center gap-4 px-5 py-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-4 border-emerald-100 border-t-emerald-500"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">Please wait while we process your request.</p>
        </div>
      </div>
    </div>
  );
}
