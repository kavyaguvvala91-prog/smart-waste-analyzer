import mongoose from 'mongoose';

const wasteReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    wasteType: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    detectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Detection',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

wasteReportSchema.index({ createdAt: -1 });

const WasteReport = mongoose.model('WasteReport', wasteReportSchema);

export default WasteReport;
