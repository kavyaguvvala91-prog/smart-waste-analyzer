/**
 * Recycling Service
 * Finds nearby recycling centers using Google Maps Places API.
 * Falls back to OpenStreetMap if the Google key is not available.
 */

import axios from 'axios';

const getGoogleMapsKey = () => process.env.GOOGLE_MAPS_API_KEY?.trim();
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const CENTER_CACHE_TTL_MS = 30 * 60 * 1000;
const centerCache = new Map();
let googleMapsUnavailable = false;

const SEARCH_TERMS = [
  'recycling centers',
  'waste collection centers',
  'e-waste recycling facilities',
  'scrap collection centers',
];

const buildWasteSpecificTerms = (wasteType) => {
  const type = String(wasteType || '').toLowerCase();
  if (!type) return [];

  if (type.includes('plastic')) return ['plastic recycling center', 'plastic collection center'];
  if (type.includes('paper') || type.includes('cardboard')) return ['paper recycling center', 'paper collection center'];
  if (type.includes('glass')) return ['glass recycling center', 'glass collection center'];
  if (type.includes('metal') || type.includes('aluminium') || type.includes('can')) return ['metal scrap yard', 'metal recycling center'];
  if (type.includes('electronic') || type.includes('e-waste') || type.includes('battery')) return ['e-waste recycling center', 'electronic waste collection'];
  return [];
};

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCacheKey = (latitude, longitude, wasteType) =>
  [latitude.toFixed(4), longitude.toFixed(4), normalizeWasteType(wasteType)].join('|');

const normalizeWasteType = (value) => String(value || '').trim().toLowerCase();

const getCachedCenters = (key) => {
  const cached = centerCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CENTER_CACHE_TTL_MS) {
    centerCache.delete(key);
    return null;
  }
  return cached.centers;
};

const setCachedCenters = (key, centers) => {
  centerCache.set(key, {
    timestamp: Date.now(),
    centers,
  });
};

const findCentersWithGoogle = async (latitude, longitude, wasteType) => {
  const googleMapsKey = getGoogleMapsKey();
  const keywordSet = new Set([...SEARCH_TERMS, ...buildWasteSpecificTerms(wasteType)]);
  const merged = new Map();

  for (const keyword of keywordSet) {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${latitude},${longitude}`,
        radius: 10000,
        keyword,
        key: googleMapsKey,
      },
      timeout: 10000,
    });

    const { results = [], status } = response.data || {};

    if (status === 'ZERO_RESULTS') continue;
    if (status !== 'OK') {
      if (status === 'REQUEST_DENIED') {
        const error = new Error('Google Maps API request denied.');
        error.code = 'GOOGLE_REQUEST_DENIED';
        throw error;
      }
      throw new Error(`Google Maps API error: ${status}`);
    }

    for (const place of results) {
      const placeLat = place.geometry?.location?.lat;
      const placeLng = place.geometry?.location?.lng;
      if (!place?.place_id || placeLat == null || placeLng == null || merged.has(place.place_id)) continue;

      const distanceKm = haversineDistance(latitude, longitude, placeLat, placeLng);

      merged.set(place.place_id, {
        name: place.name,
        address: place.vicinity || place.formatted_address || 'Address not available',
        rating: place.rating ?? null,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        distance: `${distanceKm.toFixed(1)} km`,
        distanceValue: distanceKm,
        latitude: placeLat,
        longitude: placeLng,
        openNow: place.opening_hours?.open_now ?? null,
        wasteTypes: [wasteType || 'Recycling'],
      });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => a.distanceValue - b.distanceValue)
    .slice(0, 12);
};

const buildOverpassQuery = (latitude, longitude, radius = 10000) => `
  [out:json][timeout:20];
  (
    node["amenity"="recycling"](around:${radius},${latitude},${longitude});
    node["amenity"="waste_disposal"](around:${radius},${latitude},${longitude});
    node["shop"="recycling"](around:${radius},${latitude},${longitude});
    way["amenity"="recycling"](around:${radius},${latitude},${longitude});
    way["amenity"="waste_disposal"](around:${radius},${latitude},${longitude});
    way["shop"="recycling"](around:${radius},${latitude},${longitude});
    relation["amenity"="recycling"](around:${radius},${latitude},${longitude});
    relation["amenity"="waste_disposal"](around:${radius},${latitude},${longitude});
    relation["shop"="recycling"](around:${radius},${latitude},${longitude});
  );
  out center tags;
`;

const normalizeOverpassElements = (elements = [], latitude, longitude, wasteType) =>
  elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;

      if (lat == null || lon == null) return null;

      const distanceKm = haversineDistance(latitude, longitude, lat, lon);
      const name = el.tags?.name || el.tags?.operator || 'Recycling Center';
      const address = [
        el.tags?.['addr:housenumber'],
        el.tags?.['addr:street'],
        el.tags?.['addr:city'],
      ]
        .filter(Boolean)
        .join(', ') || 'Address not available';

      return {
        name,
        address,
        distance: `${distanceKm.toFixed(1)} km`,
        distanceValue: distanceKm,
        latitude: lat,
        longitude: lon,
        wasteTypes: [wasteType || 'Recycling'],
        rating: null,
        mapsUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`,
        openNow: null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceValue - b.distanceValue)
    .slice(0, 10);

const buildFallbackSearchCenters = (latitude, longitude, wasteType) => {
  const wasteKey = normalizeWasteType(wasteType);
  const searchTerms = [
    ...(buildWasteSpecificTerms(wasteKey).slice(0, 2)),
    'recycling center',
    'waste collection center',
    'e-waste recycling facility',
    'scrap collection center',
  ];

  const uniqueTerms = [...new Set(searchTerms)].slice(0, 4);

  return uniqueTerms.map((term, index) => ({
    name: `${term.replace(/\b\w/g, (ch) => ch.toUpperCase())}`,
    address: 'Open a map search near your location',
    distance: index === 0 ? 'Nearby' : 'Search',
    distanceValue: index,
    latitude,
    longitude,
    wasteTypes: [wasteType || 'Recycling'],
    rating: null,
    mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${latitude},${longitude},14z`,
    openNow: null,
  }));
};

const findCentersWithOSM = async (latitude, longitude, wasteType) => {
  const query = buildOverpassQuery(latitude, longitude).replace(/\s+/g, ' ').trim();
  const payload = new URLSearchParams({ data: query }).toString();

  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json',
        },
        timeout: 20000,
      });

      const elements = response.data?.elements || [];
      const centers = normalizeOverpassElements(elements, latitude, longitude, wasteType);

      if (centers.length > 0) {
        return centers;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    if (String(lastError?.response?.status || '') !== '429') {
      console.warn('OpenStreetMap fallback failed:', lastError.message);
    }
  }

  return [];
};

export const findNearbyRecyclingCenters = async (latitude, longitude, wasteType = '') => {
  const cacheKey = getCacheKey(latitude, longitude, wasteType);
  const cached = getCachedCenters(cacheKey);
  if (cached) return cached;

  const googleMapsKey = getGoogleMapsKey();

  if (googleMapsKey && !googleMapsUnavailable) {
    try {
      const centers = await findCentersWithGoogle(latitude, longitude, wasteType);
      setCachedCenters(cacheKey, centers);
      return centers;
    } catch (error) {
      if (error?.code === 'GOOGLE_REQUEST_DENIED') {
        googleMapsUnavailable = true;
      } else {
        console.warn('Google Maps failed, falling back to OpenStreetMap:', error.message);
      }
    }
  }

  try {
    const centers = await findCentersWithOSM(latitude, longitude, wasteType);
    if (centers.length > 0) {
      setCachedCenters(cacheKey, centers);
      return centers;
    }
  } catch (error) {
    console.warn('Recycling center lookup failed:', error.message);
  }

  const fallbackCenters = buildFallbackSearchCenters(latitude, longitude, wasteType);
  setCachedCenters(cacheKey, fallbackCenters);
  return fallbackCenters;
};

export default { findNearbyRecyclingCenters };
