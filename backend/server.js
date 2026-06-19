/**
 * Smart Waste Analyzer - Main Server
 * Entry point for the Express application
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import detectionRoutes from './routes/detectionRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import diyRoutes from './routes/diyRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import recyclingRoutes from './routes/recyclingRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Middleware imports
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Database connection
import connectDB from './config/db.js';
import bootstrapAdminUser from './services/adminBootstrap.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await bootstrapAdminUser();

  app.listen(PORT, () => {
    console.log(`\n🚀 Smart Waste Analyzer API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
  });
};

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet sets secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded images
}));

// CORS configuration
const defaultAllowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://smart-waste-analyzer.vercel.app']
  : [];

const allowedOrigins = [
  ...defaultAllowedOrigins,
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter((origin, index, array) => array.indexOf(origin) === index);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: allowedOrigins.length > 0,
}));

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter for AI-intensive endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'AI request limit reached. Please wait before trying again.' },
});

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files ─────────────────────────────────────────────────────────────
// Serve uploaded images publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Waste Analyzer API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/detect', aiLimiter, detectionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/diy', aiLimiter, diyRoutes);
app.use('/api/recommendations', aiLimiter, recommendationRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/recycling-centers', recyclingRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
startServer().catch((error) => {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
});

export default app;
