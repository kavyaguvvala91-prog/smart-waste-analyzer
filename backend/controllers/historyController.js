/**
 * History Controller
 * Retrieves past detection records from MongoDB
 */

import Detection from '../models/Detection.js';

const getMonthKey = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * GET /api/history
 * Returns all past detection records, newest first.
 * Supports optional pagination via ?page=1&limit=20
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = req.user?.role === 'admin' ? {} : { userId: req.user.id };

    const [records, total] = await Promise.all([
      Detection.find(filter)
        .select('imageUrl totalObjects mostDetected recyclable nonRecyclable categories createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Detection.countDocuments(),
    ]);

    const history = records.map((record) => ({
      id: record._id,
      date: record.createdAt,
      imageUrl: record.imageUrl,
      totalObjects: record.totalObjects,
      mostDetected: record.mostDetected,
      recyclable: record.recyclable,
      nonRecyclable: record.nonRecyclable,
      categories: record.categories,
    }));

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/history/summary
 * Returns dashboard-ready aggregates for the frontend dashboard section.
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { userId: req.user.id };
    const records = await Detection.find(filter)
      .select('totalObjects recyclable nonRecyclable mostDetected categories createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const totalUploads = records.length;
    let totalObjectsDetected = 0;
    let recyclableTotal = 0;
    let nonRecyclableTotal = 0;

    const wasteTypeCounts = new Map();
    const categoryTotals = new Map();
    const monthlyTotals = new Map();

    for (const record of records) {
      totalObjectsDetected += Number(record.totalObjects || 0);
      recyclableTotal += Number(record.recyclable || 0);
      nonRecyclableTotal += Number(record.nonRecyclable || 0);

      const wasteType = String(record.mostDetected || 'unknown').trim().toLowerCase();
      wasteTypeCounts.set(wasteType, (wasteTypeCounts.get(wasteType) || 0) + 1);

      const recordCategories = record.categories || {};
      const categoryEntries = recordCategories instanceof Map
        ? Array.from(recordCategories.entries())
        : Object.entries(recordCategories);

      for (const [category, value] of categoryEntries) {
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(value || 0));
      }

      const monthKey = getMonthKey(record.createdAt);
      monthlyTotals.set(monthKey, {
        uploads: (monthlyTotals.get(monthKey)?.uploads || 0) + 1,
        objects: (monthlyTotals.get(monthKey)?.objects || 0) + Number(record.totalObjects || 0),
      });
    }

    const mostCommonWasteType = Array.from(wasteTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const sustainabilityScore = totalObjectsDetected > 0
      ? Math.max(0, Math.min(100, Math.round((recyclableTotal / totalObjectsDetected) * 100)))
      : 0;

    const monthlyTrend = Array.from(monthlyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, totals]) => ({
        month,
        uploads: totals.uploads,
        objects: totals.objects,
      }));

    const wasteDistribution = Array.from(categoryTotals.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    const recentActivity = records.slice(0, 6).map((record) => ({
      id: record._id,
      createdAt: record.createdAt,
      mostDetected: record.mostDetected,
      totalObjects: record.totalObjects,
      recyclable: record.recyclable,
      nonRecyclable: record.nonRecyclable,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUploads,
        totalObjectsDetected,
        mostCommonWasteType,
        sustainabilityScore,
        recyclableTotal,
        nonRecyclableTotal,
      },
      monthlyTrend,
      wasteDistribution,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/history/:id
 * Returns a single detection record with full detections array.
 */
export const getDetectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await Detection.findById(id).lean();

    if (!record) {
      const err = new Error(`Detection record with id "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (req.user?.role !== 'admin' && String(record.userId || '') !== String(req.user.id)) {
      const err = new Error('You do not have permission to view this detection record.');
      err.statusCode = 403;
      throw err;
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
    if (error.name === 'CastError') {
      const err = new Error(`Invalid detection ID format: "${req.params.id}"`);
      err.statusCode = 400;
      return next(err);
    }
    next(error);
  }
};

/**
 * DELETE /api/history/:id
 * Deletes a single detection record.
 */
export const deleteDetection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Detection.findById(id).lean();

    if (!record) {
      const err = new Error(`Detection record with id "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (req.user?.role !== 'admin' && String(record.userId || '') !== String(req.user.id)) {
      const err = new Error('You do not have permission to delete this detection record.');
      err.statusCode = 403;
      throw err;
    }

    const deleted = await Detection.findByIdAndDelete(id);

    if (!deleted) {
      const err = new Error(`Detection record with id "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      message: 'Detection record deleted successfully.',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      const err = new Error(`Invalid detection ID format: "${req.params.id}"`);
      err.statusCode = 400;
      return next(err);
    }
    next(error);
  }
};
