/**
 * AI Routes - Handles AI-based logic endpoints
 * 
 * Endpoints:
 * 1. POST /api/ai/price-suggestion - Calculate optimal price for millet
 * 2. GET  /api/ai/demand-forecast - Forecast demand for different millets
 * 3. POST /api/ai/quality-check - Detect quality anomalies
 */

import express from 'express';
import {
  calculatePriceSuggestion,
  forecastDemand,
  performQualityCheck
} from '../services/ai.service.js';

const router = express.Router();

/**
 * POST /api/ai/price-suggestion
 * Calculate optimal price based on market conditions
 * 
 * Body: {
 *   milletType: string (e.g., "Finger Millet", "Pearl Millet")
 *   quantity: number (in kg)
 *   location: string (e.g., "Karnataka", "Tamil Nadu")
 *   quality: string (optional: "Premium", "Standard", "Basic")
 * }
 */
router.post('/price-suggestion', async (req, res) => {
  try {
    const { milletType, quantity, location, quality } = req.body;

    // Validate input
    if (!milletType || !quantity || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['milletType', 'quantity', 'location']
      });
    }

    // Call AI service to calculate price
    const result = await calculatePriceSuggestion({
      milletType,
      quantity,
      location,
      quality: quality || 'Standard'
    });

    res.json(result);
  } catch (error) {
    console.error('Price suggestion error:', error);
    res.status(500).json({
      error: 'Failed to calculate price suggestion',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/demand-forecast
 * Forecast demand levels for all millet types
 * 
 * Query params:
 *   location: string (optional)
 *   period: string (optional: "weekly", "monthly", "quarterly")
 */
router.get('/demand-forecast', async (req, res) => {
  try {
    const { location, period } = req.query;

    // Call AI service to forecast demand
    const forecast = await forecastDemand({
      location: location || 'All India',
      period: period || 'monthly'
    });

    res.json(forecast);
  } catch (error) {
    console.error('Demand forecast error:', error);
    res.status(500).json({
      error: 'Failed to generate demand forecast',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/quality-check
 * Detect quality anomalies in a batch
 * 
 * Body: {
 *   batchId: string
 *   milletType: string
 *   moistureContent: number (percentage)
 *   impurityLevel: number (percentage)
 *   grainSize: string ("Uniform", "Mixed", "Small")
 *   color: string ("Natural", "Discolored", "Mixed")
 *   weight: number (actual weight in kg)
 *   expectedWeight: number (expected weight in kg)
 * }
 */
router.post('/quality-check', async (req, res) => {
  try {
    const batchData = req.body;

    // Validate required fields
    if (!batchData.batchId || !batchData.milletType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['batchId', 'milletType']
      });
    }

    // Perform quality check
    const qualityResult = await performQualityCheck(batchData);

    res.json(qualityResult);
  } catch (error) {
    console.error('Quality check error:', error);
    res.status(500).json({
      error: 'Failed to perform quality check',
      message: error.message
    });
  }
});

export default router;
