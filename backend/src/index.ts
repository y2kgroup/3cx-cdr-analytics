import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { cdrRoutes } from './routes/cdr';
import { settingsRoutes } from './routes/settings';
import { startCdrServer } from './tcp/cdr-server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const CDR_PORT = parseInt(process.env.CDR_PORT || '5432');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/3cx_cdr';

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Routes
app.use('/api', cdrRoutes);
app.use('/api', settingsRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
  });

  startCdrServer(CDR_PORT);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer().catch(console.error);
