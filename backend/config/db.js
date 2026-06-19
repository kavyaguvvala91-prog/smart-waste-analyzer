/**
 * Database Configuration
 * Connects to MongoDB using Mongoose with retry logic
 */

import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = String(process.env.MONGODB_URI || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

  if (!uri) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    // Allow longer-running AI-adjacent requests and slower cloud DB sockets.
    socketTimeoutMS: 120000,
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
