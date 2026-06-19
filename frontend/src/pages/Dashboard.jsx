import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  FiAlertCircle,
  FiBarChart2,
  FiClock,
  FiLayers,
  FiMapPin,
  FiPackage,
  FiPieChart,
  FiRepeat,
  FiShield,
} from 'react-icons/fi';
import StatisticsCard from '../components/StatisticsCard';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorCard from '../components/ErrorCard';
import { useAuth } from '../context/useAuth';
import { getDashboardOverview, resolveMediaUrl, updateReportStatus } from '../services/api';
import { buildPointProgress, getEcoLevel } from '../utils/eco';

const COLORS = ['#10B981', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444', '#14B8A6'];

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const statusTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingReportId, setSavingReportId] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboardOverview();
        setOverview(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Dashboard could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = overview?.stats || {};
  const profile = overview?.profile || {
    name: user?.name,
    email: user?.email,
    points: user?.points || 0,
    ecoLevel: getEcoLevel(user?.points || 0),
  };
  const pointProgress = buildPointProgress(profile?.points || 0);
  const reportLocations = overview?.reportLocations || [];

  const monthlyPieData = overview?.charts?.monthlyTrend?.map((entry) => ({
    month: entry.month,
    detections: entry.detections,
    value: entry.detections,
  })) || [];

  const wasteDistribution = overview?.charts?.wasteDistribution || [];
  const reports = overview?.reports || [];

  const handleStatusChange = async (reportId, status) => {
    try {
      setSavingReportId(reportId);
      const response = await updateReportStatus(reportId, status);
      setOverview((current) => ({
        ...current,
        stats: {
          ...current?.stats,
          pendingReports: (current?.stats?.pendingReports || 0) - ((current?.reports || []).find((report) => report.id === reportId)?.status === 'pending' ? 1 : 0) + (status === 'pending' ? 1 : 0),
          inProgressReports: (current?.stats?.inProgressReports || 0) - ((current?.reports || []).find((report) => report.id === reportId)?.status === 'in_progress' ? 1 : 0) + (status === 'in_progress' ? 1 : 0),
          resolvedReports: (current?.stats?.resolvedReports || 0) - ((current?.reports || []).find((report) => report.id === reportId)?.status === 'resolved' ? 1 : 0) + (status === 'resolved' ? 1 : 0),
        },
        reports: (current?.reports || []).map((report) =>
          report.id === reportId ? { ...report, status: response.report.status } : report
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update report status.');
    } finally {
      setSavingReportId(null);
    }
  };

  const pendingReports = stats.pendingReports ?? stats.pending ?? 0;
  const inProgressReports = stats.inProgressReports ?? stats.in_progress ?? 0;
  const resolvedReports = stats.resolvedReports ?? stats.resolved ?? 0;
  const formatLocation = (report) => {
    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return 'Location unavailable';
    }
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  };

  if (loading) {
    return (
      <section className="page-shell section-shell">
        <LoadingSpinner label="Loading dashboard..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-shell section-shell">
        <ErrorCard title="Dashboard error" message={error} />
      </section>
    );
  }

  return (
    <section className="page-shell section-shell space-y-8">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div whileHover={{ y: -3 }} className="glass-card-strong p-7">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
            {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}
          </p>
          <h1 className="soft-heading mt-2 text-4xl text-slate-900">
            {isAdmin ? 'Municipality waste operations' : 'Your eco impact overview'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {isAdmin
              ? 'Track community reports, update statuses, and locate waste hotspots in one place.'
              : 'See your points, level, detections, reports, and sustainability score at a glance.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="chip">
              <FiShield />
              {profile?.ecoLevel?.icon || getEcoLevel(profile?.points || 0).icon} {profile?.ecoLevel?.label || getEcoLevel(profile?.points || 0).label}
            </div>
            <div className="chip">
              <FiRepeat />
              Eco Points: {profile?.points || 0}
            </div>
            <div className="chip">
              <FiClock />
              {isAdmin ? `${reports.length} live reports` : `${stats.reportsSubmitted || 0} reports submitted`}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:grid-cols-2">
          <StatisticsCard icon={FiRepeat} title="Eco Points" value={profile?.points || 0} subtitle="Community reward balance" tone="emerald" />
          <StatisticsCard icon={FiShield} title="User Level" value={profile?.ecoLevel?.label || getEcoLevel(profile?.points || 0).label} subtitle="Current sustainability tier" tone="forest" />
          <StatisticsCard icon={FiPackage} title={isAdmin ? 'Pending Reports' : 'Reports Submitted'} value={isAdmin ? pendingReports : stats.reportsSubmitted || 0} subtitle={isAdmin ? 'Needs municipality review' : 'Waste reports you have created'} tone="light" />
          <StatisticsCard icon={FiBarChart2} title="Sustainability Score" value={`${stats.sustainabilityScore || 0}%`} subtitle="Recycle-friendly detection rate" tone="sage" />
        </div>
      </div>

      {isAdmin ? (
        <div className="grid gap-5 md:grid-cols-3">
          <StatisticsCard icon={FiAlertCircle} title="Pending Reports" value={pendingReports} subtitle="Waiting for action" tone="light" />
          <StatisticsCard icon={FiMapPin} title="In Progress" value={inProgressReports} subtitle="Municipality is working on them" tone="forest" />
          <StatisticsCard icon={FiPieChart} title="Resolved Reports" value={resolvedReports} subtitle="Closed and cleaned up" tone="emerald" />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          <StatisticsCard icon={FiLayers} title="Total Detections" value={stats.totalDetections || 0} subtitle="Saved scan sessions" tone="light" />
          <StatisticsCard icon={FiRepeat} title="Reports Submitted" value={stats.reportsSubmitted || 0} subtitle="Waste locations reported" tone="forest" />
          <StatisticsCard icon={FiShield} title="Your Level" value={profile?.ecoLevel?.label || getEcoLevel(profile?.points || 0).label} subtitle="Current tier in the eco ladder" tone="emerald" />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div whileHover={{ y: -3 }} className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Monthly Detection Trend</p>
              <h2 className="soft-heading mt-2 text-2xl text-slate-900">Monthly detections by month</h2>
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={monthlyPieData} dataKey="value" nameKey="month" outerRadius={92} innerRadius={46} paddingAngle={3}>
                  {monthlyPieData.map((entry, index) => (
                    <Cell key={`month-${entry.month}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid gap-5">
          <motion.div whileHover={{ y: -3 }} className="glass-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Waste Distribution</p>
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
                  <XAxis dataKey="category" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {wasteDistribution.map((entry, index) => (
                      <Cell key={`cell-${entry.category}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <motion.div whileHover={{ y: -3 }} className="glass-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Recent Activity</p>
          <div className="mt-5 grid gap-3">
            {(overview?.recentActivity || []).map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{activity.mostDetected || 'Unknown waste'}</p>
                    <p className="text-xs text-slate-500">
                      {activity.totalObjects} objects detected - {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="chip">{activity.recyclable} recyclable</span>
                </div>
              </div>
            ))}
            {(overview?.recentActivity || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-500">
                No recent activity yet.
              </div>
            ) : null}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
                {isAdmin ? 'Waste Report Locations' : 'Your Progress'}
              </p>
              <h2 className="soft-heading mt-2 text-2xl text-slate-900">
                {isAdmin ? 'Reports on the map' : 'Next reward milestone'}
              </h2>
            </div>
          </div>

          {isAdmin ? (
            <div className="mt-5 grid gap-4">
              <MapView centers={reportLocations.map((report) => ({
                name: `${report.wasteType} - ${statusLabels[report.status] || report.status}`,
                address: 'Reported location',
                latitude: report.latitude,
                longitude: report.longitude,
                distance: new Date(report.createdAt).toLocaleDateString(),
                mapsUrl: `https://www.google.com/maps?q=${report.latitude},${report.longitude}`,
              }))} />
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6">
              <p className="text-sm font-semibold text-slate-700">
                Current points: <span className="font-black text-slate-900">{profile?.points || 0}</span>
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                  style={{ width: `${Math.min(100, ((pointProgress.current % pointProgress.target) / pointProgress.target) * 100 || 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Next level: {pointProgress.nextLabel}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-emerald-700">
                You are growing toward the next eco tier.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {isAdmin ? (
        <motion.div whileHover={{ y: -3 }} className="glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Waste Reports</p>
              <h2 className="soft-heading mt-2 text-2xl text-slate-900">Municipality queue</h2>
            </div>
            <span className="chip">Most common waste: {stats.mostCommonWasteType || 'N/A'}</span>
          </div>

          <div className="mt-6 grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-[28px] border border-emerald-100 bg-white p-5">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr_auto] lg:items-center">
                  <img
                    src={resolveMediaUrl(report.imageUrl)}
                    alt={report.wasteType}
                    className="h-28 w-full rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-lg font-bold text-slate-900">{report.wasteType}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Reported by {report.user?.name || 'Unknown'} - {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Location: {formatLocation(report)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`chip border ${statusTone[report.status] || statusTone.pending}`}>
                      {statusLabels[report.status] || report.status}
                    </span>
                    {Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude)) ? (
                      <a
                        href={`https://www.google.com/maps?q=${Number(report.latitude)},${Number(report.longitude)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="secondary-button justify-center"
                      >
                        Open Location
                      </a>
                    ) : (
                      <span className="secondary-button justify-center opacity-60">No location</span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="secondary-button px-4 py-2"
                        disabled={savingReportId === report.id || report.status === 'in_progress'}
                        onClick={() => handleStatusChange(report.id, 'in_progress')}
                      >
                        Mark In Progress
                      </button>
                      <button
                        type="button"
                        className="primary-button px-4 py-2"
                        disabled={savingReportId === report.id || report.status === 'resolved'}
                        onClick={() => handleStatusChange(report.id, 'resolved')}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-500">
                No waste reports yet.
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link to="/analysis" className="primary-button">
          Back to analysis
        </Link>
        <Link to="/history" className="secondary-button">
          View history
        </Link>
      </div>
    </section>
  );
}
