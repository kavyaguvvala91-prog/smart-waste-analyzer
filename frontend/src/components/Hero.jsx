import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiBarChart2, FiCamera, FiMapPin, FiShield, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated, ensureAuth, user, ecoLevel } = useAuth();

  const startScan = () => {
    if (!ensureAuth({ mode: 'choice', redirectTo: '/detect' })) return;
    navigate('/detect');
  };

  const goDashboard = () => {
    if (!ensureAuth({ mode: 'choice', redirectTo: '/dashboard' })) return;
    navigate('/dashboard');
  };

  return (
    <section id="top" className="page-shell section-shell">
      <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="accent-pill">
            <FiStar />
            Public home, protected actions, real sustainability impact
          </span>
          <h1 className="soft-heading mt-5 max-w-3xl text-5xl leading-tight text-slate-900 sm:text-6xl">
            Smart Waste Analyzer
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className="primary-button" onClick={startScan}>
              {isAuthenticated ? 'Start Analysis' : 'Try Detection'} <FiArrowRight />
            </button>
            <button type="button" className="secondary-button" onClick={goDashboard}>
              {isAuthenticated ? 'View Dashboard' : 'Sign in to Continue'}
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: FiBarChart2, label: 'Summary cards and charts' },
              { icon: FiMapPin, label: 'Nearby recycling centers' },
              { icon: FiCamera, label: 'Upload or webcam capture' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="glass-card flex items-center gap-3 px-4 py-3">
                  <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <Icon />
                  </span>
                  <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="glass-card-strong relative overflow-hidden p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.08),transparent_34%)]" />
          <div className="relative grid gap-4">
            <div className="rounded-[28px] bg-white p-5 text-slate-900 shadow-[0_14px_36px_rgba(16,185,129,0.08)]">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">Eco snapshot</p>
              <h2 className="soft-heading mt-3 text-3xl">One platform, three outcomes</h2>
              <div className="mt-5 grid gap-3">
                {[
                  'Detect waste with the existing YOLO pipeline',
                  'Report locations and earn eco points',
                  'Get AI guidance, DIY ideas, and recycling centers',
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Current level</p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {isAuthenticated ? `${ecoLevel.icon} ${ecoLevel.label}` : 'Guest Explorer'}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {isAuthenticated ? `${user?.points || 0} eco points earned` : 'Sign in to start earning points.'}
                </p>
              </div>
              <div className="rounded-[28px] border border-emerald-100 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Protected actions</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  {['Upload image', 'Open camera', 'Report waste', 'Access dashboard'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <FiShield className="text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
