export const CATEGORY_ORDER = ['plastic', 'paper', 'glass', 'metal', 'cardboard', 'other'];

export const CATEGORY_LABELS = {
  plastic: 'Plastic',
  paper: 'Paper',
  glass: 'Glass',
  metal: 'Metal',
  cardboard: 'Cardboard',
  other: 'Other',
};

export const CATEGORY_COLORS = {
  plastic: 'rgba(16, 185, 129, 0.94)',
  paper: 'rgba(59, 130, 246, 0.94)',
  glass: 'rgba(168, 85, 247, 0.94)',
  metal: 'rgba(245, 158, 11, 0.94)',
  cardboard: 'rgba(239, 68, 68, 0.92)',
  other: 'rgba(20, 184, 166, 0.94)',
};

export const normalizeCategory = (value = '') => {
  const text = String(value).toLowerCase().trim();
  if (text.includes('cardboard')) return 'cardboard';
  if (text.includes('plastic')) return 'plastic';
  if (text.includes('paper') || text.includes('newspaper') || text.includes('magazine')) return 'paper';
  if (text.includes('glass')) return 'glass';
  if (text.includes('metal') || text.includes('aluminium') || text.includes('aluminum') || text.includes('tin') || text.includes('can')) return 'metal';
  return 'other';
};

export const formatConfidence = (value) => `${Math.round(Number(value || 0) * 100)}%`;

export const formatDate = (value) => {
  if (!value) return 'Unknown date';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const aggregateDetections = (detections = []) => {
  const groups = new Map();

  detections.forEach((detection) => {
    const key = String(detection.class || 'Unknown').trim();
    const existing = groups.get(key) || { className: key, count: 0, confidenceTotal: 0 };
    existing.count += 1;
    existing.confidenceTotal += Number(detection.confidence || 0);
    groups.set(key, existing);
  });

  return Array.from(groups.values())
    .map((item) => ({
      className: item.className,
      count: item.count,
      confidence: item.count ? item.confidenceTotal / item.count : 0,
    }))
    .sort((a, b) => b.count - a.count || b.confidence - a.confidence);
};

export const buildPieData = (detections = []) => {
  const counts = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

  detections.forEach((detection) => {
    const category = normalizeCategory(detection.class);
    counts[category] = (counts[category] || 0) + 1;
  });

  return CATEGORY_ORDER.map((category) => ({
    label: CATEGORY_LABELS[category],
    value: counts[category] || 0,
    color: CATEGORY_COLORS[category],
  }));
};

export const getTopWasteType = (detections = []) => {
  if (!detections.length) return null;

  const counts = new Map();
  detections.forEach((detection) => {
    const key = String(detection.class || '').toLowerCase().trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
};

export const summarizeDetections = (detections = []) => {
  const totalObjects = detections.length;
  let recyclable = 0;
  let nonRecyclable = 0;

  const recyclableKeywords = [
    'plastic bottle',
    'plastic bag',
    'plastic container',
    'paper',
    'cardboard',
    'glass bottle',
    'glass jar',
    'metal can',
    'aluminium can',
    'tin can',
    'newspaper',
    'magazine',
    'carton',
  ];

  detections.forEach((detection) => {
    const label = String(detection.class || '').toLowerCase().trim();
    if (recyclableKeywords.includes(label)) {
      recyclable += 1;
    } else {
      nonRecyclable += 1;
    }
  });

  const mostDetected = getTopWasteType(detections);

  return {
    totalObjects,
    recyclable,
    nonRecyclable,
    mostDetected,
  };
};
