import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiLoader, FiShield, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const initialFormState = {
  name: '',
  email: '',
  password: '',
  adminCode: '',
};

export default function AuthModal() {
  const navigate = useNavigate();
  const { authModal, closeAuthModal, login, register } = useAuth();
  const [view, setView] = useState('choice');
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authModal.open) {
      setView(authModal.mode === 'register' ? 'register' : authModal.mode === 'signin' ? 'signin' : 'choice');
      setError(null);
      setForm(initialFormState);
    }
  }, [authModal.open, authModal.mode]);

  const title = useMemo(() => 'Sign In Required', []);

  const close = () => {
    setView('choice');
    setError(null);
    closeAuthModal();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'signin') {
        await login({
          email: form.email,
          password: form.password,
        });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          adminCode: form.adminCode,
        });
      }

      const redirectTo = authModal.redirectTo;
      closeAuthModal();
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {authModal.open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  <FiShield />
                  Protected action
                </div>
                <h2 className="soft-heading mt-4 text-3xl text-slate-900">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{authModal.message}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Cancel
              </button>
            </div>

            {view === 'choice' ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  className="primary-button justify-center"
                  onClick={() => setView('signin')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="secondary-button justify-center"
                  onClick={() => setView('register')}
                >
                  <FiUserPlus />
                  Register
                </button>
                <button
                  type="button"
                  className="secondary-button justify-center"
                  onClick={close}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                {view === 'register' ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Full Name</span>
                    <input
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </label>
                ) : null}

                {view === 'register' ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Admin Code</span>
                    <input
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                      value={form.adminCode}
                      onChange={(event) => setForm((current) => ({ ...current, adminCode: event.target.value }))}
                      placeholder="Optional for municipality workers"
                    />
                    <span className="text-xs text-slate-500">Leave blank for a standard user account.</span>
                  </label>
                ) : null}

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <input
                    type="password"
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                </label>

                {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? <FiLoader className="animate-spin" /> : null}
                    {view === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setView('choice')}>
                    Back
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
