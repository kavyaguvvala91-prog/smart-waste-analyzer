import { motion } from 'framer-motion';
import { FiAward, FiShield, FiTrendingUp } from 'react-icons/fi';
import StatisticsCard from '../components/StatisticsCard';
import { useAuth } from '../context/useAuth';
import { buildPointProgress, getEcoLevel } from '../utils/eco';

const rewards = [
  { title: 'Report Waste', points: '+10', description: 'Capture the location, image, and waste type so municipality workers can respond.' },
  { title: 'Complete Detection', points: 'Impact', description: 'Scan waste and use the result to guide better disposal and reuse decisions.' },
  { title: 'Earn Level Badges', points: 'Milestones', description: 'Move from Eco Starter to Green Guardian and Sustainability Champion.' },
];

export default function EcoPoints() {
  const { user, ecoLevel } = useAuth();
  const level = getEcoLevel(user?.points || 0);
  const progress = buildPointProgress(user?.points || 0);
  const maxWidth = progress.target > 0 ? Math.min(100, (progress.current / progress.target) * 100) : 100;

  return (
    <section className="page-shell section-shell space-y-8">
      <motion.div whileHover={{ y: -3 }} className="glass-card-strong p-7">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Eco Points</p>
        <h1 className="soft-heading mt-2 text-4xl text-slate-900">Your sustainability balance</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Eco points reward useful civic actions. Right now, reporting waste earns the fastest points, but the dashboard keeps the rest of your sustainability work visible too.
        </p>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatisticsCard icon={FiAward} title="Eco Points" value={user?.points || 0} subtitle="Current balance" tone="emerald" />
        <StatisticsCard icon={FiShield} title="Current Level" value={ecoLevel.label || level.label} subtitle={`Tier range ${level.range}`} tone="forest" />
        <StatisticsCard icon={FiTrendingUp} title="Next Milestone" value={progress.nextLabel} subtitle={`Need ${Math.max(0, progress.target - progress.current)} more points`} tone="sage" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="glass-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Progress</p>
          <h2 className="soft-heading mt-2 text-2xl text-slate-900">Move toward the next eco tier</h2>
          <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{level.icon} {level.label}</span>
              <span>{user?.points || 0} points</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                style={{ width: `${maxWidth}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-emerald-700">
              <span>{level.range}</span>
              <span>{progress.nextLabel}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">How To Earn</p>
          <h2 className="soft-heading mt-2 text-2xl text-slate-900">Reward loop</h2>
          <div className="mt-5 grid gap-4">
            {rewards.map((reward) => (
              <div key={reward.title} className="rounded-2xl border border-emerald-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{reward.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{reward.description}</p>
                  </div>
                  <span className="chip">{reward.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
