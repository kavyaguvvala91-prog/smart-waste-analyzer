import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_24%),radial-gradient(circle_at_top_right,rgba(52,211,153,0.05),transparent_22%),linear-gradient(180deg,rgba(255,255,255,1),rgba(240,253,244,0.55))]" />
      <Navbar />
      <AuthModal />
      <main className="pt-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-[calc(100vh-6rem)]"
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
