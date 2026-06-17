/**
 * DIY Controller
 * Generates DIY project ideas using OpenAI and images using Pollinations AI.
 * Implements MongoDB-backed caching to avoid redundant API calls.
 */

import DIYIdea from '../models/DIYIdea.js';
import { generateDIYIdea } from '../services/openaiService.js';
import { buildPlaceholderImageUrl, generateDIYImage } from '../services/pollinationsService.js';

const normalizeText = (value) => String(value || '').trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const PROJECT_LIBRARY = {
  plastic_bottle: [
    {
      title: 'Plant Pot',
      description: 'Turn a plastic bottle into a self-watering plant pot for herbs, succulents, or small desk plants.',
    },
    {
      title: 'Bird Feeder',
      description: 'Create a simple outdoor bird feeder that supports local wildlife and keeps the bottle in use.',
    },
    {
      title: 'Pen Holder',
      description: 'Cut and decorate the bottle into a sturdy desk pen holder or organizer for stationery.',
    },
  ],
  glass_bottle: [
    {
      title: 'Decorative Lamp',
      description: 'Reuse a glass bottle as an ambient lamp centerpiece with a warm, modern glow.',
    },
    {
      title: 'Vase',
      description: 'Transform the bottle into a minimalist vase for fresh or dried flowers.',
    },
    {
      title: 'Candle Holder',
      description: 'Make a polished candle holder for shelves, tables, or gifting.',
    },
  ],
  metal_can: [
    {
      title: 'Desk Organizer',
      description: 'Repurpose a metal can into a durable organizer for pens, tools, or utensils.',
    },
    {
      title: 'Planter',
      description: 'Create a small planter for herbs or cuttings with an industrial look.',
    },
    {
      title: 'Lantern',
      description: 'Punch decorative patterns into the can and use it as a hanging lantern or tealight holder.',
    },
  ],
};

const PROJECT_ALIASES = {
  plastic: 'plastic_bottle',
  plastic_bottle: 'plastic_bottle',
  glass: 'glass_bottle',
  glass_bottle: 'glass_bottle',
  bottle: 'plastic_bottle',
  metal: 'metal_can',
  metal_can: 'metal_can',
  can: 'metal_can',
};

const buildProjectLibrary = (wasteType) => {
  const normalized = normalizeKey(wasteType).replace(/\s+/g, '_');
  const aliasKey = PROJECT_ALIASES[normalized] || normalized;

  return {
    key: aliasKey,
    projects: PROJECT_LIBRARY[aliasKey] || [
      {
        title: 'Storage Jar',
        description: 'Clean and reuse the item as a small home storage solution or desk accessory.',
      },
      {
        title: 'Planter',
        description: 'Give the object a second life as a decorative planter or garden helper.',
      },
      {
        title: 'Organizer',
        description: 'Turn the waste item into a compact organizer for practical everyday use.',
      },
    ],
  };
};

const serializeDIYIdea = (idea) => ({
  id: idea._id,
  wasteType: idea.wasteType,
  diyIdea: idea.diyIdea,
  title: idea.title,
  description: idea.description,
  materials: idea.materials,
  steps: idea.steps,
  imageUrl: idea.imageUrl,
  imagePrompt: idea.imagePrompt,
  imageStatus: idea.imageStatus,
  createdAt: idea.createdAt,
});

const serializeDIYProject = (project) => ({
  title: project.title,
  description: project.description,
  imageUrl: project.imageUrl,
  placeholderUrl: project.placeholderUrl || null,
  imagePrompt: project.imagePrompt || null,
  imageFallback: Boolean(project.imageFallback),
});

const saveDIYIdeaImage = async ({ wasteType, diyIdea, title, description, imageResult, existingId = null }) => {
  const normalizedWasteType = normalizeKey(wasteType);
  const normalizedDIYIdea = normalizeKey(diyIdea);

  if (existingId) {
    return DIYIdea.findByIdAndUpdate(
      existingId,
      {
        $set: {
          wasteType: normalizedWasteType,
          diyIdea: normalizedDIYIdea,
          title: normalizeText(title),
          description: normalizeText(description) || `DIY project for ${normalizeText(title)}`,
          imageUrl: imageResult.imageUrl,
          imagePrompt: imageResult.imagePrompt,
          imageStatus: imageResult.fallback ? 'fallback' : 'generated',
        },
      },
      { new: true }
    );
  }

  return DIYIdea.findOneAndUpdate(
    { wasteType: normalizedWasteType, diyIdea: normalizedDIYIdea },
    {
      $set: {
        wasteType: normalizedWasteType,
        diyIdea: normalizedDIYIdea,
        title: normalizeText(title),
        description: normalizeText(description) || `DIY project for ${normalizeText(title)}`,
        imageUrl: imageResult.imageUrl,
        imagePrompt: imageResult.imagePrompt,
        imageStatus: imageResult.fallback ? 'fallback' : 'generated',
      },
      $setOnInsert: {
        materials: [],
        steps: [],
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

/**
 * POST /api/diy
 * Generates a DIY idea for a given waste type. Caches results in MongoDB.
 *
 * Input: { wasteType: "plastic bottle" }
 * Output: { title, description, materials, steps, imageUrl }
 */
export const getDIYIdea = async (req, res, next) => {
  try {
    const { wasteType } = req.body;

    if (!wasteType || typeof wasteType !== 'string' || wasteType.trim().length === 0) {
      const err = new Error('Request body must contain a non-empty "wasteType" string.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedWasteType = normalizeKey(wasteType);
    const cached = await DIYIdea.findOne({ wasteType: normalizedWasteType }).sort({ createdAt: -1 });

    if (cached) {
      await DIYIdea.findByIdAndUpdate(cached._id, { $inc: { servedCount: 1 } });

      if (cached.imageUrl) {
        return res.status(200).json({
          success: true,
          cached: true,
          imageFallback: cached.imageStatus === 'fallback',
          imageMessage:
            cached.imageStatus === 'fallback'
              ? 'Placeholder image cached because Pollinations was unavailable when this image was generated.'
              : null,
          idea: serializeDIYIdea(cached),
        });
      }

      const imageResult = await generateDIYImage(normalizedWasteType, cached.title);
      const updated = await saveDIYIdeaImage({
        wasteType: normalizedWasteType,
        diyIdea: cached.title,
        title: cached.title,
        description: cached.description,
        imageResult,
        existingId: cached._id,
      });

      return res.status(200).json({
        success: true,
        cached: true,
        imageFallback: imageResult.fallback,
        imageMessage: imageResult.message,
        idea: serializeDIYIdea(updated),
      });
    }

    const idea = await generateDIYIdea(normalizedWasteType);
    const imageResult = await generateDIYImage(normalizedWasteType, idea.title);

    const diyRecord = await DIYIdea.create({
      wasteType: normalizedWasteType,
      diyIdea: normalizeKey(idea.title),
      title: idea.title,
      description: idea.description,
      materials: idea.materials,
      steps: idea.steps,
      imageUrl: imageResult.imageUrl,
      imagePrompt: imageResult.imagePrompt,
      imageStatus: imageResult.fallback ? 'fallback' : 'generated',
    });

    res.status(201).json({
      success: true,
      cached: false,
      imageFallback: imageResult.fallback,
      imageMessage: imageResult.message,
      idea: serializeDIYIdea(diyRecord),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/diy/image
 * Returns or generates an image for a given DIY idea.
 * Caches image URL in MongoDB to avoid regeneration.
 *
 * Input: { wasteType: "plastic bottle", diyIdea: "Plant Pot" }
 * Output: { imageUrl }
 */
export const getDIYImage = async (req, res, next) => {
  try {
    const { wasteType, diyIdea, title } = req.body;
    const requestedDIYIdea = normalizeText(diyIdea || title);

    if (!wasteType || !requestedDIYIdea) {
      const err = new Error('Request body must contain "wasteType" and "diyIdea".');
      err.statusCode = 400;
      throw err;
    }

    const normalizedWasteType = normalizeKey(wasteType);
    const normalizedDIYIdea = normalizeKey(requestedDIYIdea);

    const existing = await DIYIdea.findOne({
      wasteType: normalizedWasteType,
      $or: [{ diyIdea: normalizedDIYIdea }, { title: requestedDIYIdea }],
    }).sort({ createdAt: -1 });

    if (existing?.imageUrl) {
      await DIYIdea.findByIdAndUpdate(existing._id, { $inc: { servedCount: 1 } });

      return res.status(200).json({
        success: true,
        cached: true,
        fallback: existing.imageStatus === 'fallback',
        imageUrl: existing.imageUrl,
        imagePrompt: existing.imagePrompt,
        message:
          existing.imageStatus === 'fallback'
            ? 'Placeholder image cached because Pollinations was unavailable earlier.'
            : null,
      });
    }

    const imageResult = await generateDIYImage(normalizedWasteType, requestedDIYIdea);

    const updateFilter = existing?._id
      ? { _id: existing._id }
      : {
          wasteType: normalizedWasteType,
          diyIdea: normalizedDIYIdea,
        };

    const imageRecord = await DIYIdea.findOneAndUpdate(
      updateFilter,
      {
        $set: {
          wasteType: normalizedWasteType,
          diyIdea: normalizedDIYIdea,
          title: requestedDIYIdea,
          description: `DIY image for ${requestedDIYIdea}`,
          imageUrl: imageResult.imageUrl,
          imagePrompt: imageResult.imagePrompt,
          imageStatus: imageResult.fallback ? 'fallback' : 'generated',
        },
        $setOnInsert: {
          materials: [],
          steps: [],
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (imageResult.fallback) {
      return res.status(503).json({
        success: false,
        cached: false,
        fallback: true,
        imageUrl: imageRecord.imageUrl,
        imagePrompt: imageRecord.imagePrompt,
        message: imageResult.message,
      });
    }

    return res.status(200).json({
      success: true,
      cached: false,
      fallback: false,
      imageUrl: imageRecord.imageUrl,
      imagePrompt: imageRecord.imagePrompt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/diy/all
 * Returns all saved DIY ideas (for the 4R/DIY Ideas page).
 */
export const getAllDIYIdeas = async (req, res, next) => {
  try {
    const ideas = await DIYIdea.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: ideas.length,
      ideas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/diy/generate
 * Returns three on-demand DIY reuse projects with Pollinations-generated images.
 */
export const generateDIYProjects = async (req, res, next) => {
  try {
    const { wasteType } = req.body;

    if (!wasteType || typeof wasteType !== 'string' || wasteType.trim().length === 0) {
      const error = new Error('Request body must contain a non-empty "wasteType" string.');
      error.statusCode = 400;
      throw error;
    }

    const library = buildProjectLibrary(wasteType);
    const projects = await Promise.all(
      library.projects.map(async (project) => {
        const imageResult = await generateDIYImage(library.key, project.title);
        return {
          ...project,
          imageUrl: imageResult.imageUrl,
          placeholderUrl: buildPlaceholderImageUrl(library.key, project.title, 'Green DIY preview'),
          imagePrompt: imageResult.imagePrompt,
          imageFallback: imageResult.fallback,
          sourceUrl: imageResult.sourceUrl || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      wasteType: library.key,
      projects: projects.map(serializeDIYProject),
    });
  } catch (error) {
    next(error);
  }
};
