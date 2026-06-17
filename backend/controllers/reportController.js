import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';

const allowedStatuses = new Set(['pending', 'in_progress', 'resolved']);

const parseLocation = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const createWasteReport = async (req, res, next) => {
  try {
    const { imageUrl, wasteType, latitude, longitude, detectionId } = req.body || {};

    if (!String(imageUrl || '').trim() || !String(wasteType || '').trim()) {
      return res.status(400).json({ success: false, message: 'Image URL and waste type are required.' });
    }

    const lat = parseLocation(latitude);
    const lng = parseLocation(longitude);

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude must be valid numbers.' });
    }

    const report = await WasteReport.create({
      userId: req.user.id,
      imageUrl: String(imageUrl).trim(),
      wasteType: String(wasteType).trim(),
      latitude: lat,
      longitude: lng,
      status: 'pending',
      detectionId: detectionId || undefined,
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { points: 10 } },
      { new: true }
    ).select('_id name email role points');

    return res.status(201).json({
      success: true,
      report,
      awardedPoints: 10,
      user: updatedUser ? {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        points: updatedUser.points,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const reports = await WasteReport.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && allowedStatuses.has(String(status))) {
      filter.status = String(status);
    }

    const reports = await WasteReport.find(filter)
      .populate('userId', 'name email role points')
      .sort({ createdAt: -1 })
      .lean();

    const stats = reports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      { pending: 0, in_progress: 0, resolved: 0 }
    );

    return res.status(200).json({
      success: true,
      count: reports.length,
      stats,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!allowedStatuses.has(String(status))) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    const updated = await WasteReport.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).populate('userId', 'name email role points');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Waste report not found.' });
    }

    return res.status(200).json({
      success: true,
      report: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReportStats = async (_req, res, next) => {
  try {
    const [pending, inProgress, resolved, commonWasteType] = await Promise.all([
      WasteReport.countDocuments({ status: 'pending' }),
      WasteReport.countDocuments({ status: 'in_progress' }),
      WasteReport.countDocuments({ status: 'resolved' }),
      WasteReport.aggregate([
        { $group: { _id: '$wasteType', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        pending,
        inProgress,
        resolved,
        mostCommonWasteType: commonWasteType[0]?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
