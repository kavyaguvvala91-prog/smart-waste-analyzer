/**
 * Detection Model
 * Stores results from YOLO AI waste detection
 */

import mongoose from 'mongoose';

const detectionItemSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
    trim: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
}, { _id: false });

const detectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Path or URL to the uploaded image
    imageUrl: {
      type: String,
      default: null,
    },

    // Array of detected objects from YOLO
    detections: {
      type: [detectionItemSchema],
      default: [],
    },

    // Summary statistics
    totalObjects: {
      type: Number,
      default: 0,
      min: 0,
    },

    recyclable: {
      type: Number,
      default: 0,
      min: 0,
    },

    nonRecyclable: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Category breakdown e.g. { plastic: 4, paper: 2 }
    categories: {
      type: Map,
      of: Number,
      default: {},
    },

    // Most frequently detected waste type
    mostDetected: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
    versionKey: false,
  }
);

// Index for efficient history queries (newest first)
detectionSchema.index({ createdAt: -1 });

const Detection = mongoose.model('Detection', detectionSchema);

export default Detection;
