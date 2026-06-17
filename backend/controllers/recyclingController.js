/**
 * Recycling Controller
 * Finds nearby recycling centers based on user location and waste type
 */

import { findNearbyRecyclingCenters } from '../services/recyclingService.js';

/**
 * GET /api/recycling-centers
 * Query params: latitude, longitude, wasteType (optional)
 * Output: Array of nearby recycling centers sorted by distance
 */
export const getRecyclingCenters = async (req, res, next) => {
  try {
    const { latitude, longitude, wasteType } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      const err = new Error('Query parameters "latitude" and "longitude" are required.');
      err.statusCode = 400;
      throw err;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      const err = new Error('"latitude" and "longitude" must be valid numbers.');
      err.statusCode = 400;
      throw err;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const err = new Error('Coordinates out of valid range. Latitude: -90 to 90, Longitude: -180 to 180.');
      err.statusCode = 400;
      throw err;
    }

    // Find nearby centers
    const centers = await findNearbyRecyclingCenters(lat, lng, wasteType || '');

    res.status(200).json({
      success: true,
      count: centers.length,
      location: { latitude: lat, longitude: lng },
      wasteType: wasteType || null,
      centers: centers.map((center) => ({
        name: center.name,
        address: center.address,
        rating: center.rating,
        mapsUrl: center.mapsUrl || center.mapsLink || null,
        distance: center.distance,
        openNow: center.openNow,
        latitude: center.latitude,
        longitude: center.longitude,
      })),
    });
  } catch (error) {
    next(error);
  }
};
