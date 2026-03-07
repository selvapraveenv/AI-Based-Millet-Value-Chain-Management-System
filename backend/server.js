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

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { initializeFirebase } from "./config/firebase.js";

// Import route handlers
import aiRoutes from "./routes/ai.routes.js";
import orderRoutes from "./routes/order.routes.js";
import traceabilityRoutes from "./routes/traceability.routes.js";
import marketInsightsRoutes from "./routes/market-insights.routes.js";
import authRoutes from "./routes/auth.routes.js";
import listingsRoutes from "./routes/listings.routes.js";
import usersRoutes from "./routes/users.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import disputesRoutes from "./routes/disputes.routes.js";
import verificationsRoutes from "./routes/verifications.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import fixNamesRoutes from "./routes/fix-names.routes.js";
import inspectRoutes from "./routes/inspect.routes.js";
import fixDataRoutes from "./routes/fix-data.routes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads (store in memory for Firebase upload)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit for dispute attachments
  },
  fileFilter: (req, file, cb) => {
    // Accept common dispute proof attachments
    if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only video, image, or PDF files are allowed"), false);
    }
  },
});

// Middleware
app.use(cors()); // Allow cross-origin requests from Next.js frontend
app.use(express.json({ limit: "50mb" })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Parse URL-encoded bodies
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize Firebase Admin SDK
initializeFirebase();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "MilletChain Backend API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/ai", aiRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/traceability", traceabilityRoutes);
app.use("/api/market-insights", marketInsightsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/disputes", uploadMemory.single("proofVideo"), disputesRoutes);
app.use("/api/verifications", verificationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/fix", fixNamesRoutes);
app.use("/api/inspect", inspectRoutes);
app.use("/api/data-fix", fixDataRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║     MilletChain Backend API Server Started           ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log("");
  console.log("Available endpoints:");
  console.log("  POST /api/ai/smart-match");
  console.log("  POST /api/ai/price-suggestion");
  console.log("  GET  /api/ai/demand-forecast");
  console.log("  POST /api/ai/quality-check");
  console.log("  POST /api/orders/update-status");
  console.log("  GET  /api/traceability/:batchId");
  console.log("  GET  /api/market-insights");
  console.log("  GET  /api/market-insights/trending");
  console.log("  GET  /api/market-insights/top-trades");
  console.log("  GET  /api/market-insights/price-analysis");
  console.log("  POST /api/auth/login");
  console.log("═══════════════════════════════════════════════════════");
});
