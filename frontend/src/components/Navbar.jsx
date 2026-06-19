import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiLogOut, FiMenu, FiRepeat, FiX } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import { getEcoLevel } from '../utils/eco';

const guestLinks = [
  { to: '/#top', label: 'Home' },
  { to: '/#features', label: 'Features' },
  { to: '/#about', label: 'About' },
];

const userLinks = [
  { to: '/', label: 'Home' },
  { to: '/detect', label: 'Detect' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/reuse-recycle', label: 'Reuse & Recycle' },
  { to: '/recycling-centers', label: 'Centers' },
  { to: '/history', label: 'History' },
  { to: '/points', label: 'Eco Points' },
  { to: '/profile', label: 'Profile' },
];

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth();

  const links = isAuthenticated
    ? [
        ...userLinks.slice(0, 3),
        ...(isAdmin ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
        ...userLinks.slice(3),
      ]
    : guestLinks;
  const level = useMemo(() => getEcoLevel(user?.points || 0), [user?.points]);

  const openModal = (mode) => {
    setOpen(false);
    openAuthModal(mode, mode === 'signin' ? location.pathname : location.pathname);
  };

  const handleLogout = () => {
    setOpen(false);
    navigate('/', { replace: true });
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-2xl">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_14px_30px_rgba(16,185,129,0.18)]">
            <FiRepeat className="text-xl" />
          </span>
          <div>
            <p className="soft-heading text-lg leading-none text-slate-900">Smart Waste</p>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Analyzer</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) =>
            link.to.startsWith('/#') ? (
              <Link key={link.label} to={link.to} className={navClass}>
                {link.label}
              </Link>
            ) : (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <div className="chip">
                <span>{level.icon}</span>
                <span>Eco Points: {user?.points || 0}</span>
              </div>
              <div className="hidden items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2 xl:flex">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {level.label}
                  </p>
                  <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                </div>
                <FiChevronDown className="text-slate-400" />
              </div>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                <FiLogOut />
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary-button" onClick={() => openModal('signin')}>
                Sign In
              </button>
              <button type="button" className="primary-button" onClick={() => openModal('register')}>
                Register
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-slate-700 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="page-shell pb-4 lg:hidden"
          >
            <div className="glass-card-strong grid gap-2 p-3">
              {links.map((link) =>
                link.to.startsWith('/#') ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 text-sm font-semibold ${
                        isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                )
              )}

              {isAuthenticated ? (
                <button type="button" className="secondary-button mt-2 justify-center" onClick={handleLogout}>
                  <FiLogOut />
                  Logout
                </button>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button type="button" className="secondary-button justify-center" onClick={() => openModal('signin')}>
                    Sign In
                  </button>
                  <button type="button" className="primary-button justify-center" onClick={() => openModal('register')}>
                    Register
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
