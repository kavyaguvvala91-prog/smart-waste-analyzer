/**
 * DIY Idea Model
 * Stores AI-generated DIY project ideas and their images
 */

import mongoose from 'mongoose';

const diyIdeaSchema = new mongoose.Schema(
  {
    wasteType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    diyIdea: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      default: '',
    },

    materials: {
      type: [String],
      default: [],
    },

    steps: {
      type: [String],
      default: [],
    },

    imageUrl: {
      type: String,
      default: null,
    },

    imagePrompt: {
      type: String,
      default: null,
    },

    imageStatus: {
      type: String,
      enum: ['generated', 'cached', 'fallback'],
      default: 'generated',
    },

    servedCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

diyIdeaSchema.index({ wasteType: 1, diyIdea: 1 }, { unique: true });
diyIdeaSchema.index({ wasteType: 1, createdAt: -1 });

const DIYIdea = mongoose.model('DIYIdea', diyIdeaSchema);

export default DIYIdea;
