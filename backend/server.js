/**
 * MilletChain Backend - Main Server File
 * Final Year Project: AI-Based Millets Chain Management System
 * 
 * This server handles:
 * 1. AI-based price suggestions
 * 2. Demand forecasting
 * 3. Quality anomaly detection
 * 4. Order workflow logic
 * 5. Traceability data aggregation
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase.js';

// Import route handlers
import aiRoutes from './routes/ai.routes.js';
import orderRoutes from './routes/order.routes.js';
import traceabilityRoutes from './routes/traceability.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests from Next.js frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize Firebase Admin SDK
initializeFirebase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MilletChain Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/traceability', traceabilityRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     MilletChain Backend API Server Started           ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/ai/price-suggestion');
  console.log('  GET  /api/ai/demand-forecast');
  console.log('  POST /api/ai/quality-check');
  console.log('  POST /api/orders/update-status');
  console.log('  GET  /api/traceability/:batchId');
  console.log('═══════════════════════════════════════════════════════');
});
