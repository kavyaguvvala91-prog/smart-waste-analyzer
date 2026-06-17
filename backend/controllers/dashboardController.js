import Detection from '../models/Detection.js';
import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';

const getMonthKey = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getEcoLevel = (points) => {
  if (points >= 300) return { label: 'Sustainability Champion', icon: '🌍' };
  if (points >= 100) return { label: 'Green Guardian', icon: '♻' };
  return { label: 'Eco Starter', icon: '🌱' };
};

const mapDetectionRecord = (record) => ({
  id: record._id,
  createdAt: record.createdAt,
  totalObjects: Number(record.totalObjects || 0),
  recyclable: Number(record.recyclable || 0),
  nonRecyclable: Number(record.nonRecyclable || 0),
  mostDetected: record.mostDetected || null,
  categories: record.categories || {},
});

const mapReportRecord = (report) => ({
  id: report._id,
  createdAt: report.createdAt,
  status: report.status,
  wasteType: report.wasteType,
  imageUrl: report.imageUrl,
  latitude: Number(report.latitude),
  longitude: Number(report.longitude),
  user: report.userId ? {
    id: report.userId._id?.toString?.() || report.userId.id,
    name: report.userId.name,
    email: report.userId.email,
  } : null,
});

export const getDashboardOverview = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const detectionFilter = isAdmin ? {} : { userId: req.user.id };
    const reportFilter = isAdmin ? {} : { userId: req.user.id };

    const [detections, reports, profile] = await Promise.all([
      Detection.find(detectionFilter)
        .select('imageUrl totalObjects recyclable nonRecyclable mostDetected categories createdAt userId')
        .sort({ createdAt: -1 })
        .lean(),
      WasteReport.find(reportFilter)
        .populate('userId', 'name email role points')
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(req.user.id).select('_id name email role points').lean(),
    ]);

    let totalObjectsDetected = 0;
    let recyclableTotal = 0;
    let nonRecyclableTotal = 0;
    const categoryTotals = new Map();
    const wasteTypeCounts = new Map();
    const monthlyTotals = new Map();

    for (const detection of detections) {
      totalObjectsDetected += Number(detection.totalObjects || 0);
      recyclableTotal += Number(detection.recyclable || 0);
      nonRecyclableTotal += Number(detection.nonRecyclable || 0);

      const wasteType = String(detection.mostDetected || 'unknown').trim().toLowerCase();
      wasteTypeCounts.set(wasteType, (wasteTypeCounts.get(wasteType) || 0) + 1);

      const categories = detection.categories || {};
      const categoryEntries = categories instanceof Map ? Array.from(categories.entries()) : Object.entries(categories);
      for (const [category, value] of categoryEntries) {
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(value || 0));
      }

      const monthKey = getMonthKey(detection.createdAt);
      monthlyTotals.set(monthKey, {
        detections: (monthlyTotals.get(monthKey)?.detections || 0) + 1,
        objects: (monthlyTotals.get(monthKey)?.objects || 0) + Number(detection.totalObjects || 0),
      });
    }

    const sustainabilityScore = totalObjectsDetected > 0
      ? Math.max(0, Math.min(100, Math.round((recyclableTotal / totalObjectsDetected) * 100)))
      : 0;

    const ecoPoints = Number(profile?.points || 0);
    const ecoLevel = getEcoLevel(ecoPoints);

    const reportStats = reports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      { pending: 0, in_progress: 0, resolved: 0 }
    );

    const reportLocations = reports
      .map((report) => ({
        id: report._id,
        latitude: Number(report.latitude),
        longitude: Number(report.longitude),
        wasteType: report.wasteType,
        status: report.status,
        createdAt: report.createdAt,
      }))
      .filter((report) => Number.isFinite(report.latitude) && Number.isFinite(report.longitude))
      .slice(0, 20);

    const mostCommonWasteType = Array.from(wasteTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const response = {
      success: true,
      role: req.user.role,
      profile: {
        id: profile?._id?.toString?.() || profile?.id || req.user.id,
        name: profile?.name || req.user.name,
        email: profile?.email || req.user.email,
        role: req.user.role,
        points: ecoPoints,
        ecoLevel,
      },
      stats: {
        ecoPoints,
        ecoLevel,
        reportsSubmitted: reports.length,
        totalDetections: detections.length,
        sustainabilityScore,
        pendingReports: reportStats.pending || 0,
        inProgressReports: reportStats.in_progress || 0,
        resolvedReports: reportStats.resolved || 0,
        mostCommonWasteType,
      },
      charts: {
        wasteDistribution: Array.from(categoryTotals.entries())
          .map(([category, value]) => ({ category, value }))
          .sort((a, b) => b.value - a.value),
        monthlyTrend: Array.from(monthlyTotals.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([month, totals]) => ({ month, ...totals })),
        detectionCategories: detections.map((detection) => ({
          label: detection.mostDetected || 'Unknown',
          objects: Number(detection.totalObjects || 0),
        })),
      },
      recentActivity: detections.slice(0, 6).map(mapDetectionRecord),
      reports: reports.slice(0, 30).map(mapReportRecord),
      reportLocations,
    };

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
