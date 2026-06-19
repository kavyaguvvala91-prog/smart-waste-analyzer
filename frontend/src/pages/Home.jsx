import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCamera, FiCheckCircle, FiCompass, FiGlobe, FiMapPin, FiRepeat, FiShield } from 'react-icons/fi';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import { useAuth } from '../context/useAuth';

const featureCards = [
  {
    icon: FiCamera,
    title: 'Protected Detection Flow',
    description: 'Upload and camera capture lead smoothly into the waste analysis workflow.',
  },
  {
    icon: FiShield,
    title: 'Authentication + Roles',
    description: 'JWT-backed sessions support users and municipality admins with role-based access.',
  },
  {
    icon: FiCompass,
    title: 'Community Reporting',
    description: 'Waste reports capture geolocation, store images, and award eco points for action.',
  },
  {
    icon: FiRepeat,
    title: 'Eco Points System',
    description: 'Points unlock levels from Eco Starter to Sustainability Champion across the dashboard.',
  },
  {
    icon: FiMapPin,
    title: 'Recycling Centers',
    description: 'Nearby recycling centers are discovered with live user location and map-ready cards.',
  },
  {
    icon: FiGlobe,
    title: 'AI Sustainability Assistant',
    description: 'Groq-powered guidance explains disposal, reduce, reuse, recycle, and recover steps.',
  },
];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();

  useEffect(() => {
    if (location.state?.authPrompt) {
      openAuthModal(location.state.authMode || 'choice', location.state.redirectTo || null);
      navigate('/', { replace: true, state: null });
    }
  }, [location.state, navigate, openAuthModal]);

  return (
    <>
      <Hero />

      <section id="features" className="page-shell section-shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Features</p>
            <h2 className="soft-heading mt-2 text-3xl text-slate-900">Everything in one eco workflow</h2>
          </div>
          <div className="chip">
            <FiCheckCircle />
            Public browsing, protected actions
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
    </>
  );
}
