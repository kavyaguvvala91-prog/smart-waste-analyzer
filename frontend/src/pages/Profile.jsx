import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiShield, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import { getEcoLevel } from '../utils/eco';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const level = getEcoLevel(user?.points || 0);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateProfile({ name });
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-shell section-shell">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div whileHover={{ y: -3 }} className="glass-card-strong p-7">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Profile</p>
          <h1 className="soft-heading mt-2 text-4xl text-slate-900">Your account</h1>
          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Name</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{user?.name}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Email</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{user?.email}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Role</p>
              <p className="mt-2 text-lg font-bold text-slate-900 capitalize">{user?.role || 'user'}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Level</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{level.icon} {level.label}</p>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button mt-6"
            onClick={() => {
              navigate('/', { replace: true });
              logout();
            }}
          >
            Sign Out
          </button>
        </motion.div>

        <motion.form onSubmit={handleSave} whileHover={{ y: -3 }} className="glass-card p-7">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Edit Profile</p>
          <h2 className="soft-heading mt-2 text-3xl text-slate-900">Keep your account details current</h2>
          <label className="mt-6 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Display Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
              placeholder="Enter your name"
            />
          </label>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" className="primary-button" disabled={saving}>
              <FiSave />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <div className="chip">
              <FiUser />
              {user?.points || 0} points
            </div>
            <div className="chip">
              <FiShield />
              {level.label}
            </div>
          </div>
          {message ? <p className="mt-4 text-sm font-semibold text-emerald-700">{message}</p> : null}
        </motion.form>
      </div>
    </section>
  );
}
