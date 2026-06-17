/**
 * Local Sustainability Service
 * Provides deterministic 4R recommendations and DIY ideas without OpenAI.
 */

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const joinWasteTypes = (wasteTypes = []) => {
  const uniqueTypes = [...new Set(wasteTypes.map((item) => normalizeText(item)).filter(Boolean))];
  return uniqueTypes.length > 0 ? uniqueTypes.join(', ') : 'mixed waste';
};

const CATEGORY_HINTS = {
  plastic: {
    reduce: 'Choose refillable containers and avoid single-use plastic packaging wherever possible.',
    reuse: 'Repurpose sturdy bottles and containers as organizers, planters, or storage jars.',
    recycle: 'Rinse items clean, remove caps when required locally, and place them in the plastics stream.',
    recover: 'If recycling is unavailable, route contaminated plastic to approved waste-to-energy systems.',
  },
  paper: {
    reduce: 'Go paper-light by switching to digital receipts, notes, and bills wherever possible.',
    reuse: 'Use clean paper for draft notes, packing material, or quick household checklists.',
    recycle: 'Keep paper dry and free from food residue before placing it in paper recycling.',
    recover: 'Soiled paper can sometimes be composted or sent to approved recovery facilities.',
  },
  glass: {
    reduce: 'Buy in bulk or choose refill programs to reduce glass packaging waste.',
    reuse: 'Reuse glass jars and bottles for storage, pantry organization, or decor pieces.',
    recycle: 'Keep glass sorted by color if required locally and drop it at a glass recycling point.',
    recover: 'Broken or contaminated glass should go to approved disposal or recovery facilities.',
  },
  metal: {
    reduce: 'Pick durable products and refillable metal containers to cut down on disposable metal waste.',
    reuse: 'Turn cans or metal containers into organizers, planters, or desk accessories.',
    recycle: 'Empty and rinse metal containers before sending them to scrap or metal recycling.',
    recover: 'When recycling is not possible, metal recovery facilities can reclaim valuable material.',
  },
  e_waste: {
    reduce: 'Extend device life with repairs, software updates, and battery care to delay disposal.',
    reuse: 'Donate working electronics or repurpose them as spare devices or learning tools.',
    recycle: 'Take batteries, phones, and small electronics to certified e-waste collectors only.',
    recover: 'Use authorized e-waste processors to recover metals and safely manage hazardous parts.',
  },
  organic: {
    reduce: 'Plan meals carefully and store food well to reduce avoidable organic waste.',
    reuse: 'Convert fruit and vegetable scraps into compost, broth, or garden feed where appropriate.',
    recycle: 'Use composting or municipal organics collection for clean food scraps and yard waste.',
    recover: 'Anaerobic digestion or composting systems can recover nutrients and energy from organics.',
  },
  mixed: {
    reduce: 'Buy only what you need and choose products with minimal packaging to lower waste overall.',
    reuse: 'Sort reusable pieces first so the most useful parts get a second life before disposal.',
    recycle: 'Separate materials carefully and send each item to the correct local recycling stream.',
    recover: 'For leftovers that cannot be recycled, use approved recovery or disposal routes.',
  },
};

const detectCategory = (wasteTypes = []) => {
  const text = joinWasteTypes(wasteTypes);
  if (text.includes('plastic')) return 'plastic';
  if (text.includes('paper') || text.includes('cardboard') || text.includes('magazine') || text.includes('newspaper')) return 'paper';
  if (text.includes('glass')) return 'glass';
  if (text.includes('metal') || text.includes('can') || text.includes('aluminium') || text.includes('aluminum')) return 'metal';
  if (text.includes('battery') || text.includes('electronic') || text.includes('e-waste') || text.includes('phone') || text.includes('laptop')) return 'e_waste';
  if (text.includes('food') || text.includes('organic') || text.includes('fruit') || text.includes('vegetable')) return 'organic';
  return 'mixed';
};

const buildRecommendationText = (wasteTypes = []) => {
  const category = detectCategory(wasteTypes);
  const hint = CATEGORY_HINTS[category] || CATEGORY_HINTS.mixed;

  return {
    reduce: hint.reduce,
    reuse: hint.reuse,
    recycle: hint.recycle,
    recover: hint.recover,
  };
};

const DIY_LIBRARY = {
  plastic: {
    title: 'Plant Pot Set',
    description: 'Turn a plastic bottle into a simple planter for herbs, succulents, or desktop greenery.',
    materials: ['plastic bottle', 'scissors', 'soil', 'small plant', 'paint or marker'],
    steps: [
      'Step 1: Wash and dry the bottle completely.',
      'Step 2: Cut the bottle to the desired planter height.',
      'Step 3: Add drainage holes near the bottom.',
      'Step 4: Decorate the exterior and fill it with soil.',
      'Step 5: Plant your seedling and water lightly.',
    ],
  },
  glass: {
    title: 'Decorative Lamp',
    description: 'Reuse a glass bottle as a cozy decorative lamp or vase-inspired centerpiece.',
    materials: ['glass bottle', 'string lights', 'clean cloth', 'decor tape', 'base stand'],
    steps: [
      'Step 1: Clean the bottle and remove any labels.',
      'Step 2: Place a safe light source inside or around the bottle.',
      'Step 3: Add decorative accents to the neck or base.',
      'Step 4: Arrange it on a stable surface away from water.',
      'Step 5: Enjoy the ambient glow as a home accent piece.',
    ],
  },
  metal: {
    title: 'Desk Organizer',
    description: 'Repurpose a metal can into a compact organizer for stationery or tools.',
    materials: ['metal can', 'sandpaper', 'paint', 'tape', 'pens or tools'],
    steps: [
      'Step 1: Remove sharp edges and smooth the rim carefully.',
      'Step 2: Wash and dry the can thoroughly.',
      'Step 3: Paint or wrap the outside for a clean finish.',
      'Step 4: Sort items into the can and place it on your desk.',
      'Step 5: Keep frequently used items within easy reach.',
    ],
  },
  organic: {
    title: 'Compost Starter',
    description: 'Use clean organic scraps to build a small compost starter for a garden or planter bed.',
    materials: ['fruit scraps', 'vegetable scraps', 'dry leaves', 'soil', 'small bin'],
    steps: [
      'Step 1: Collect only clean organic scraps.',
      'Step 2: Layer brown and green materials in a small bin.',
      'Step 3: Mix gently and keep the pile lightly moist.',
      'Step 4: Turn the compost regularly for airflow.',
      'Step 5: Use the finished compost in garden soil.',
    ],
  },
  mixed: {
    title: 'Home Storage Hack',
    description: 'Reuse the detected item as a compact storage solution for home or desk organization.',
    materials: ['clean waste item', 'scissors', 'tape', 'paint', 'labels'],
    steps: [
      'Step 1: Clean the item and remove any loose parts.',
      'Step 2: Trim or reshape it for safe use.',
      'Step 3: Decorate the surface to match your space.',
      'Step 4: Label it for a specific storage purpose.',
      'Step 5: Put it to work as an everyday organizer.',
    ],
  },
};

const detectDIYCategory = (wasteType) => {
  const text = normalizeText(wasteType);
  if (text.includes('plastic')) return 'plastic';
  if (text.includes('glass')) return 'glass';
  if (text.includes('metal') || text.includes('can') || text.includes('aluminium') || text.includes('aluminum')) return 'metal';
  if (text.includes('organic') || text.includes('food') || text.includes('fruit') || text.includes('vegetable')) return 'organic';
  return 'mixed';
};

export const generate4RRecommendations = async (wasteTypes) => {
  return buildRecommendationText(wasteTypes);
};

export const generateDIYIdea = async (wasteType) => {
  const category = detectDIYCategory(wasteType);
  const idea = DIY_LIBRARY[category] || DIY_LIBRARY.mixed;

  return {
    title: idea.title,
    description: `${idea.description} Detected waste: ${normalizeText(wasteType) || 'mixed waste'}.`,
    materials: idea.materials,
    steps: idea.steps,
  };
};

export default { generate4RRecommendations, generateDIYIdea };
