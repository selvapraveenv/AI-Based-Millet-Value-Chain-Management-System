/**
 * AI Service - Rule-based AI logic for price, demand, and quality
 * 
 * This service implements:
 * 1. Price suggestion based on market rules
 * 2. Demand forecasting using historical data
 * 3. Quality anomaly detection
 */

import { getFirestore, Collections } from '../config/firebase.js';

/**
 * BASE PRICES (Rs per kg) - Market baseline
 * These are standard market prices used as reference
 */
const BASE_PRICES = {
  'Finger Millet': 45,
  'Pearl Millet': 40,
  'Foxtail Millet': 55,
  'Little Millet': 50,
  'Kodo Millet': 52,
  'Barnyard Millet': 48,
  'Proso Millet': 46,
  'Browntop Millet': 54
};

/**
 * LOCATION MULTIPLIERS - Regional demand factors
 * Higher multiplier = higher demand in that region
 */
const LOCATION_FACTORS = {
  'Karnataka': 1.1,
  'Tamil Nadu': 1.05,
  'Andhra Pradesh': 1.08,
  'Telangana': 1.07,
  'Maharashtra': 1.0,
  'Kerala': 1.15,
  'Other': 0.95
};

/**
 * QUALITY MULTIPLIERS
 * Premium quality commands higher prices
 */
const QUALITY_FACTORS = {
  'Premium': 1.2,
  'Standard': 1.0,
  'Basic': 0.85
};

/**
 * Calculate AI-based price suggestion
 * 
 * Algorithm:
 * 1. Start with base price for millet type
 * 2. Apply location factor (regional demand)
 * 3. Apply quality factor
 * 4. Apply bulk discount for large quantities
 * 5. Add seasonal variation from historical data
 * 
 * @param {Object} params - Price calculation parameters
 * @returns {Object} Price suggestion with breakdown
 */
export async function calculatePriceSuggestion({ milletType, quantity, location, quality }) {
  const db = getFirestore();

  try {
    // Step 1: Get base price
    const basePrice = BASE_PRICES[milletType] || 45;

    // Step 2: Apply location factor
    const locationFactor = LOCATION_FACTORS[location] || LOCATION_FACTORS['Other'];

    // Step 3: Apply quality factor
    const qualityFactor = QUALITY_FACTORS[quality] || QUALITY_FACTORS['Standard'];

    // Step 4: Calculate bulk discount
    // Larger quantities get small discount (encourages bulk buying)
    let bulkDiscount = 0;
    if (quantity > 100) bulkDiscount = 0.05; // 5% discount
    if (quantity > 500) bulkDiscount = 0.08; // 8% discount
    if (quantity > 1000) bulkDiscount = 0.10; // 10% discount

    // Step 5: Get historical price data for seasonal adjustment
    const priceHistory = await db.collection(Collections.PRICE_HISTORY)
      .where('milletType', '==', milletType)
      .orderBy('timestamp', 'desc')
      .limit(30)
      .get();

    let seasonalFactor = 1.0;
    if (!priceHistory.empty) {
      // Calculate average price trend from last 30 days
      const recentPrices = priceHistory.docs.map(doc => doc.data().price);
      const avgRecentPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      
      // If recent prices are higher than base, increase seasonal factor
      seasonalFactor = avgRecentPrice / basePrice;
      
      // Cap seasonal variation between 0.9 and 1.15
      seasonalFactor = Math.max(0.9, Math.min(1.15, seasonalFactor));
    }

    // Final price calculation
    let suggestedPrice = basePrice * locationFactor * qualityFactor * seasonalFactor;
    suggestedPrice = suggestedPrice * (1 - bulkDiscount);

    // Round to 2 decimal places
    suggestedPrice = Math.round(suggestedPrice * 100) / 100;

    // Calculate total cost
    const totalCost = suggestedPrice * quantity;

    return {
      success: true,
      milletType,
      quantity,
      location,
      quality,
      suggestedPrice,
      totalCost: Math.round(totalCost * 100) / 100,
      priceBreakdown: {
        basePrice,
        locationFactor,
        qualityFactor,
        bulkDiscount: `${(bulkDiscount * 100)}%`,
        seasonalFactor: Math.round(seasonalFactor * 100) / 100
      },
      recommendation: quantity > 100 
        ? 'Bulk discount applied - Good deal for large quantities!'
        : 'Consider ordering in bulk (>100kg) for better pricing',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Price calculation error:', error);
    throw new Error('Failed to calculate price suggestion');
  }
}

/**
 * Forecast demand for millet types
 * 
 * Algorithm:
 * 1. Analyze recent order patterns
 * 2. Calculate trend (increasing/decreasing)
 * 3. Factor in seasonal patterns
 * 4. Generate demand level for each millet
 * 
 * @param {Object} params - Forecast parameters
 * @returns {Object} Demand forecast for each millet type
 */
export async function forecastDemand({ location, period }) {
  const db = getFirestore();

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get recent orders
    let ordersQuery = db.collection(Collections.ORDERS)
      .where('createdAt', '>=', startDate);

    if (location !== 'All India') {
      ordersQuery = ordersQuery.where('location', '==', location);
    }

    const ordersSnapshot = await ordersQuery.get();

    // Analyze orders by millet type
    const demandData = {};
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const millet = order.milletType || 'Unknown';
      
      if (!demandData[millet]) {
        demandData[millet] = {
          totalOrders: 0,
          totalQuantity: 0
        };
      }
      
      demandData[millet].totalOrders++;
      demandData[millet].totalQuantity += order.quantity || 0;
    });

    // Calculate demand levels
    const forecast = Object.keys(BASE_PRICES).map(milletType => {
      const data = demandData[milletType] || { totalOrders: 0, totalQuantity: 0 };
      
      // Determine demand level based on order count
      let demandLevel = 'Low';
      let trend = 'Stable';
      
      if (data.totalOrders > 20) demandLevel = 'High';
      else if (data.totalOrders > 10) demandLevel = 'Medium';
      
      // Simple trend calculation (would be more sophisticated with more data)
      if (data.totalOrders > 15) trend = 'Increasing';
      else if (data.totalOrders < 5) trend = 'Decreasing';

      return {
        milletType,
        demandLevel,
        trend,
        ordersCount: data.totalOrders,
        totalQuantity: data.totalQuantity,
        averageOrderSize: data.totalOrders > 0 
          ? Math.round(data.totalQuantity / data.totalOrders) 
          : 0
      };
    });

    // Sort by demand level (High to Low)
    forecast.sort((a, b) => {
      const order = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return order[b.demandLevel] - order[a.demandLevel];
    });

    return {
      success: true,
      location,
      period,
      generatedAt: new Date().toISOString(),
      forecast,
      summary: {
        totalOrders: ordersSnapshot.size,
        dateRange: {
          from: startDate.toISOString(),
          to: now.toISOString()
        }
      }
    };

  } catch (error) {
    console.error('Demand forecast error:', error);
    throw new Error('Failed to generate demand forecast');
  }
}

/**
 * Perform quality check on a batch
 * 
 * Quality Rules:
 * 1. Moisture content should be < 14%
 * 2. Impurity level should be < 2%
 * 3. Grain size should be uniform
 * 4. Color should be natural
 * 5. Weight should match expected (within 5% tolerance)
 * 
 * @param {Object} batchData - Batch information
 * @returns {Object} Quality check result
 */
export async function performQualityCheck(batchData) {
  const db = getFirestore();
  const issues = [];
  const warnings = [];
  
  // Rule 1: Check moisture content
  if (batchData.moistureContent > 14) {
    issues.push({
      type: 'CRITICAL',
      parameter: 'Moisture Content',
      value: `${batchData.moistureContent}%`,
      threshold: '14%',
      message: 'Moisture content exceeds safe storage limit - Risk of fungal growth'
    });
  } else if (batchData.moistureContent > 12) {
    warnings.push({
      type: 'WARNING',
      parameter: 'Moisture Content',
      value: `${batchData.moistureContent}%`,
      message: 'Moisture content is slightly high - Monitor closely'
    });
  }

  // Rule 2: Check impurity level
  if (batchData.impurityLevel > 2) {
    issues.push({
      type: 'CRITICAL',
      parameter: 'Impurity Level',
      value: `${batchData.impurityLevel}%`,
      threshold: '2%',
      message: 'Impurity level exceeds acceptable limit - Requires cleaning'
    });
  } else if (batchData.impurityLevel > 1) {
    warnings.push({
      type: 'WARNING',
      parameter: 'Impurity Level',
      value: `${batchData.impurityLevel}%`,
      message: 'Impurity level is acceptable but could be improved'
    });
  }

  // Rule 3: Check grain size uniformity
  if (batchData.grainSize === 'Mixed' || batchData.grainSize === 'Small') {
    warnings.push({
      type: 'WARNING',
      parameter: 'Grain Size',
      value: batchData.grainSize,
      message: 'Non-uniform grain size - May affect market price'
    });
  }

  // Rule 4: Check color
  if (batchData.color === 'Discolored') {
    issues.push({
      type: 'CRITICAL',
      parameter: 'Color',
      value: batchData.color,
      message: 'Discoloration detected - Possible quality degradation'
    });
  } else if (batchData.color === 'Mixed') {
    warnings.push({
      type: 'WARNING',
      parameter: 'Color',
      value: batchData.color,
      message: 'Mixed color detected - May indicate multiple varieties'
    });
  }

  // Rule 5: Check weight accuracy
  if (batchData.weight && batchData.expectedWeight) {
    const weightVariance = Math.abs(batchData.weight - batchData.expectedWeight);
    const variancePercent = (weightVariance / batchData.expectedWeight) * 100;
    
    if (variancePercent > 5) {
      issues.push({
        type: 'CRITICAL',
        parameter: 'Weight',
        value: `${batchData.weight}kg`,
        expected: `${batchData.expectedWeight}kg`,
        variance: `${variancePercent.toFixed(2)}%`,
        message: 'Weight variance exceeds 5% - Possible measurement error or loss'
      });
    }
  }

  // Determine overall status
  const status = issues.length > 0 ? 'FLAGGED' : warnings.length > 0 ? 'PASSED_WITH_WARNINGS' : 'PASSED';
  const approved = issues.length === 0;

  // Calculate quality score (0-100)
  let qualityScore = 100;
  qualityScore -= issues.length * 20; // -20 for each critical issue
  qualityScore -= warnings.length * 5; // -5 for each warning
  qualityScore = Math.max(0, qualityScore);

  const result = {
    success: true,
    batchId: batchData.batchId,
    milletType: batchData.milletType,
    status,
    approved,
    qualityScore,
    issues,
    warnings,
    checkedAt: new Date().toISOString(),
    recommendation: approved 
      ? 'Batch meets quality standards - Approved for processing/sale'
      : 'Batch requires attention - Address critical issues before proceeding'
  };

  // Save quality check result to Firestore
  try {
    await db.collection(Collections.QUALITY_CHECKS).add({
      ...result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to save quality check:', error);
  }

  return result;
}
