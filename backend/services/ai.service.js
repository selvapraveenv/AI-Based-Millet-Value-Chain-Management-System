/**
 * AI Service - Rule-based AI logic for price, demand, and quality
 *
 * This service implements:
 * 1. Price suggestion based on market rules
 * 2. Demand forecasting using historical data
 * 3. Quality anomaly detection
 */

import { getFirestore, Collections } from "../config/firebase.js";

/**
 * BASE PRICES (Rs per kg) - Market baseline
 * These are standard market prices used as reference
 */
const BASE_PRICES = {
  "Finger Millet": 45,
  "Pearl Millet": 40,
  "Foxtail Millet": 55,
  "Little Millet": 50,
  "Kodo Millet": 52,
  "Barnyard Millet": 48,
  "Proso Millet": 46,
  "Browntop Millet": 54,
};

/**
 * LOCATION MULTIPLIERS - Regional demand factors
 * Higher multiplier = higher demand in that region
 */
const LOCATION_FACTORS = {
  Karnataka: 1.1,
  "Tamil Nadu": 1.05,
  "Andhra Pradesh": 1.08,
  Telangana: 1.07,
  Maharashtra: 1.0,
  Kerala: 1.15,
  Other: 0.95,
};

/**
 * QUALITY MULTIPLIERS
 * Premium quality commands higher prices
 */
const QUALITY_FACTORS = {
  Premium: 1.2,
  Standard: 1.0,
  Basic: 0.85,
};

const QUALITY_SCORE_MATRIX = {
  Premium: { Premium: 100, Standard: 90, Basic: 70 },
  Standard: { Standard: 100, Premium: 90, Basic: 70 },
  Basic: { Basic: 100, Standard: 80, Premium: 70 },
};

function toDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
}

function stdDev(values) {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function normalizeQuality(quality) {
  if (!quality) return "Standard";
  const normalized = String(quality).trim().toLowerCase();
  if (normalized === "premium") return "Premium";
  if (normalized === "basic") return "Basic";
  return "Standard";
}

function getFarmerCredibility(userDoc) {
  if (!userDoc) return 60;
  if (typeof userDoc.credibilityScore === "number")
    return Math.max(0, Math.min(100, userDoc.credibilityScore));
  if (typeof userDoc.rating === "number")
    return Math.max(0, Math.min(100, userDoc.rating * 20));
  if (typeof userDoc.verified === "boolean") return userDoc.verified ? 75 : 55;
  return 60;
}

function buildSmartMatchRecommendation(matchesFound, topMatch) {
  if (!matchesFound) {
    return "No close matches found. Try increasing max price or selecting more millet types.";
  }
  return `Top match: ${topMatch.farmerName}'s ${topMatch.milletType} at ₹${topMatch.pricePerKg}/kg (${topMatch.matchScore}% match)`;
}

export async function getSmartProductMatches(preferences) {
  const db = getFirestore();
  const maxPrice = Number(preferences.maxPrice || 0);
  const preferredQuality = normalizeQuality(preferences.preferredQuality);
  const milletTypes = Array.isArray(preferences.milletTypes)
    ? preferences.milletTypes.map((type) => String(type).trim().toLowerCase())
    : [];

  const listingsSnap = await db.collection("listings").get();
  const rawListings = listingsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const filteredListings = rawListings.filter((listing) => {
    const isVerified = listing.verificationStatus === "verified";
    const isActive = listing.status === "active";
    const hasQuantity = Number(listing.quantity || 0) > 0;
    const withinPrice = Number(listing.pricePerKg || 0) <= maxPrice;
    const matchesType =
      milletTypes.length === 0 ||
      milletTypes.includes(String(listing.milletType || "").toLowerCase());

    return isVerified && isActive && hasQuantity && withinPrice && matchesType;
  });

  if (!filteredListings.length) {
    return {
      success: true,
      matchesFound: 0,
      topMatches: [],
      statistics: {
        totalMatches: 0,
        averageMatchScore: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        qualitiesAvailable: [],
        milletsAvailable: [],
      },
      message: "No matching products found for your current preferences.",
      recommendation:
        "Try a higher max price or broader millet type selection.",
    };
  }

  const farmerIds = [
    ...new Set(
      filteredListings.map((listing) => listing.farmerId).filter(Boolean),
    ),
  ];
  const farmerMap = new Map();

  await Promise.all(
    farmerIds.map(async (farmerId) => {
      try {
        const userByDocId = await db.collection("users").doc(farmerId).get();
        if (userByDocId.exists) {
          farmerMap.set(farmerId, userByDocId.data());
          return;
        }

        const fallbackSnap = await db
          .collection("users")
          .where("id", "==", farmerId)
          .limit(1)
          .get();
        if (!fallbackSnap.empty) {
          farmerMap.set(farmerId, fallbackSnap.docs[0].data());
        }
      } catch {
        farmerMap.set(farmerId, null);
      }
    }),
  );

  const scored = filteredListings.map((listing) => {
    const quality = normalizeQuality(listing.quality);
    const qualityScore =
      QUALITY_SCORE_MATRIX[preferredQuality]?.[quality] ?? 75;

    const pricePerKg = Number(listing.pricePerKg || 0);
    const priceRatio = maxPrice > 0 ? pricePerKg / maxPrice : 1;
    const priceScore = Math.max(
      0,
      Math.min(100, Math.round((1 - priceRatio * 0.7) * 100)),
    );

    const farmerCredibility = getFarmerCredibility(
      farmerMap.get(listing.farmerId),
    );

    const harvestDate = toDateSafe(listing.harvestDate);
    const now = new Date();
    const daysOld = harvestDate
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 30;
    const freshnessScore = Math.max(
      0,
      Math.min(100, 100 - Math.floor(daysOld * 1.5)),
    );

    const weightedScore =
      qualityScore * 0.3 +
      priceScore * 0.25 +
      farmerCredibility * 0.25 +
      freshnessScore * 0.2;

    const matchScore = Math.max(0, Math.min(100, Math.round(weightedScore)));

    return {
      listingId: listing.id,
      farmerId: listing.farmerId || "",
      farmerName: listing.farmerName || "Unknown Farmer",
      farmerPhone: listing.farmerPhone || "",
      milletType: listing.milletType || "Unknown",
      quality,
      quantity: Number(listing.quantity || 0),
      unit: listing.unit || "kg",
      pricePerKg,
      totalPrice: Number(
        (Number(listing.quantity || 0) * pricePerKg).toFixed(2),
      ),
      location: listing.location || "",
      taluk: listing.taluk || "",
      harvestDate: harvestDate ? harvestDate.toISOString() : "",
      daysOld,
      matchScore,
      farmerCredibility,
      matchReasons: {
        quality:
          qualityScore >= 90
            ? "Excellent quality match"
            : qualityScore >= 75
              ? "Good quality fit"
              : "Acceptable quality fit",
        price:
          priceScore >= 85
            ? "Very competitive pricing"
            : priceScore >= 70
              ? "Reasonable price for budget"
              : "Near your max budget",
        freshness:
          freshnessScore >= 85
            ? "Recently harvested"
            : freshnessScore >= 65
              ? "Fresh and market-ready"
              : "Slightly older stock",
        seller:
          farmerCredibility >= 80
            ? "Highly trusted seller profile"
            : farmerCredibility >= 65
              ? "Reliable seller profile"
              : "Growing seller reputation",
      },
    };
  });

  const topMatches = scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
  const pricePoints = topMatches.map((item) => item.pricePerKg);

  return {
    success: true,
    matchesFound: topMatches.length,
    topMatches,
    statistics: {
      totalMatches: filteredListings.length,
      averageMatchScore: topMatches.length
        ? Math.round(average(topMatches.map((item) => item.matchScore)))
        : 0,
      priceRange: {
        min: pricePoints.length ? Math.min(...pricePoints) : 0,
        max: pricePoints.length ? Math.max(...pricePoints) : 0,
        avg: pricePoints.length ? Number(average(pricePoints).toFixed(2)) : 0,
      },
      qualitiesAvailable: [...new Set(topMatches.map((item) => item.quality))],
      milletsAvailable: [...new Set(topMatches.map((item) => item.milletType))],
    },
    message: `Found ${topMatches.length} strong matches out of ${filteredListings.length} eligible listings.`,
    recommendation: buildSmartMatchRecommendation(
      topMatches.length,
      topMatches[0],
    ),
  };
}

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
export async function calculatePriceSuggestion({
  milletType,
  quantity,
  location,
  quality,
}) {
  const db = getFirestore();

  try {
    // Step 1: Get base price
    const basePrice = BASE_PRICES[milletType] || 45;

    // Step 2: Apply location factor
    const locationFactor =
      LOCATION_FACTORS[location] || LOCATION_FACTORS["Other"];

    // Step 3: Apply quality factor
    const qualityFactor =
      QUALITY_FACTORS[quality] || QUALITY_FACTORS["Standard"];

    // Step 4: Calculate bulk discount
    // Larger quantities get small discount (encourages bulk buying)
    let bulkDiscount = 0;
    if (quantity > 100) bulkDiscount = 0.05; // 5% discount
    if (quantity > 500) bulkDiscount = 0.08; // 8% discount
    if (quantity > 1000) bulkDiscount = 0.1; // 10% discount

    // Step 5: Get historical price data for seasonal adjustment
    // Prefer indexed query, fallback to in-memory processing if index is unavailable.
    let recentPrices = [];
    try {
      const priceHistory = await db
        .collection(Collections.PRICE_HISTORY)
        .where("milletType", "==", milletType)
        .orderBy("timestamp", "desc")
        .limit(30)
        .get();

      recentPrices = priceHistory.docs
        .map((doc) => Number(doc.data().price || 0))
        .filter((price) => price > 0);
    } catch {
      const fallbackHistory = await db
        .collection(Collections.PRICE_HISTORY)
        .get();
      recentPrices = fallbackHistory.docs
        .map((doc) => doc.data())
        .filter((item) => item.milletType === milletType)
        .sort((a, b) => {
          const timeA = toDateSafe(a.timestamp)?.getTime() || 0;
          const timeB = toDateSafe(b.timestamp)?.getTime() || 0;
          return timeB - timeA;
        })
        .slice(0, 30)
        .map((item) => Number(item.price || 0))
        .filter((price) => price > 0);
    }

    let seasonalFactor = 1.0;
    if (recentPrices.length > 0) {
      // Calculate average price trend from last 30 days
      const avgRecentPrice = average(recentPrices);

      // If recent prices are higher than base, increase seasonal factor
      seasonalFactor = avgRecentPrice / basePrice;

      // Cap seasonal variation between 0.9 and 1.15
      seasonalFactor = Math.max(0.9, Math.min(1.15, seasonalFactor));
    }

    // Final price calculation
    let suggestedPrice =
      basePrice * locationFactor * qualityFactor * seasonalFactor;
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
        bulkDiscount: `${bulkDiscount * 100}%`,
        seasonalFactor: Math.round(seasonalFactor * 100) / 100,
      },
      recommendation:
        quantity > 100
          ? "Bulk discount applied - Good deal for large quantities!"
          : "Consider ordering in bulk (>100kg) for better pricing",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Price calculation error:", error);
    throw new Error("Failed to calculate price suggestion");
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

    switch (period) {
      case "weekly":
        startDate.setDate(now.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarterly":
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const ordersSnapshot = await db.collection(Collections.ORDERS).get();
    const listingsSnapshot = await db.collection("listings").get();

    const allOrders = ordersSnapshot.docs.map((doc) => doc.data());
    const allListings = listingsSnapshot.docs.map((doc) => doc.data());

    const filteredOrders = allOrders.filter((order) => {
      const orderDate = toDateSafe(order.createdAt || order.orderDate);
      if (!orderDate || orderDate < startDate) return false;
      if (
        location !== "All India" &&
        order.location &&
        order.location !== location
      )
        return false;
      return true;
    });

    const nowMs = now.getTime();
    const dayMs = 1000 * 60 * 60 * 24;

    const milletSet = new Set([
      ...Object.keys(BASE_PRICES),
      ...filteredOrders
        .map((order) => order.milletType || order.productName)
        .filter(Boolean),
      ...allListings.map((listing) => listing.milletType).filter(Boolean),
    ]);

    const forecast = [...milletSet].map((milletType) => {
      const milletOrders = filteredOrders.filter(
        (order) => (order.milletType || order.productName) === milletType,
      );
      const milletListings = allListings.filter(
        (listing) => listing.milletType === milletType,
      );

      let currentDemandCount = 0;
      let previousDemandCount = 0;
      let month3DemandCount = 0;
      let totalQuantity = 0;

      milletOrders.forEach((order) => {
        const orderDate = toDateSafe(order.createdAt || order.orderDate);
        if (!orderDate) return;
        const ageDays = (nowMs - orderDate.getTime()) / dayMs;
        totalQuantity += Number(order.quantity || 0);

        if (ageDays <= 30) currentDemandCount += 1;
        else if (ageDays <= 60) previousDemandCount += 1;
        else if (ageDays <= 90) month3DemandCount += 1;
      });

      const growthRate =
        previousDemandCount > 0
          ? ((currentDemandCount - previousDemandCount) / previousDemandCount) *
            100
          : currentDemandCount > 0
            ? 25
            : 0;

      const trend =
        growthRate > 8 ? "Upward" : growthRate < -8 ? "Downward" : "Stable";
      const predictedDemandCount = Math.max(
        0,
        Math.round(currentDemandCount * (1 + growthRate / 100)),
      );

      const prices = milletListings
        .map((listing) => Number(listing.pricePerKg || 0))
        .filter((price) => price > 0);

      const basePrice = BASE_PRICES[milletType] || 45;
      const currentPrice = prices.length
        ? Number(average(prices).toFixed(2))
        : basePrice;
      const volatility =
        prices.length > 1
          ? Number(((stdDev(prices) / currentPrice) * 100).toFixed(2))
          : 0;

      const demandLevel =
        predictedDemandCount > 20
          ? "High"
          : predictedDemandCount > 8
            ? "Medium"
            : "Low";
      const recommendation =
        trend === "Upward"
          ? "Increase listing visibility and stock planning for rising demand."
          : trend === "Downward"
            ? "Review pricing strategy and promotions to stimulate demand."
            : "Maintain current supply strategy and monitor weekly changes.";

      const dataPoints =
        currentDemandCount + previousDemandCount + month3DemandCount;
      const predictionConfidence =
        dataPoints >= 20 ? "High" : dataPoints >= 8 ? "Medium" : "Low";

      return {
        milletType,
        currentPrice,
        currentDemandCount,
        predictedDemandCount,
        growthRate: Number(growthRate.toFixed(2)),
        trend,
        demandLevel,
        volatility,
        recommendation,
        predictionConfidence,
        historicalMonth1: currentDemandCount,
        historicalMonth2: previousDemandCount,
        historicalMonth3: month3DemandCount,
        historicalAverage: Number(
          (
            (currentDemandCount + previousDemandCount + month3DemandCount) /
            3
          ).toFixed(2),
        ),
        demandCount: currentDemandCount,
        ordersCount: currentDemandCount,
        totalQuantity,
        averageOrderSize:
          currentDemandCount > 0
            ? Math.round(totalQuantity / currentDemandCount)
            : 0,
      };
    });

    // Sort by demand level (High to Low)
    forecast.sort((a, b) => {
      const order = { High: 3, Medium: 2, Low: 1 };
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
          to: now.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("Demand forecast error:", error);
    throw new Error("Failed to generate demand forecast");
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
      type: "CRITICAL",
      parameter: "Moisture Content",
      value: `${batchData.moistureContent}%`,
      threshold: "14%",
      message:
        "Moisture content exceeds safe storage limit - Risk of fungal growth",
    });
  } else if (batchData.moistureContent > 12) {
    warnings.push({
      type: "WARNING",
      parameter: "Moisture Content",
      value: `${batchData.moistureContent}%`,
      message: "Moisture content is slightly high - Monitor closely",
    });
  }

  // Rule 2: Check impurity level
  if (batchData.impurityLevel > 2) {
    issues.push({
      type: "CRITICAL",
      parameter: "Impurity Level",
      value: `${batchData.impurityLevel}%`,
      threshold: "2%",
      message: "Impurity level exceeds acceptable limit - Requires cleaning",
    });
  } else if (batchData.impurityLevel > 1) {
    warnings.push({
      type: "WARNING",
      parameter: "Impurity Level",
      value: `${batchData.impurityLevel}%`,
      message: "Impurity level is acceptable but could be improved",
    });
  }

  // Rule 3: Check grain size uniformity
  if (batchData.grainSize === "Mixed" || batchData.grainSize === "Small") {
    warnings.push({
      type: "WARNING",
      parameter: "Grain Size",
      value: batchData.grainSize,
      message: "Non-uniform grain size - May affect market price",
    });
  }

  // Rule 4: Check color
  if (batchData.color === "Discolored") {
    issues.push({
      type: "CRITICAL",
      parameter: "Color",
      value: batchData.color,
      message: "Discoloration detected - Possible quality degradation",
    });
  } else if (batchData.color === "Mixed") {
    warnings.push({
      type: "WARNING",
      parameter: "Color",
      value: batchData.color,
      message: "Mixed color detected - May indicate multiple varieties",
    });
  }

  // Rule 5: Check weight accuracy
  if (batchData.weight && batchData.expectedWeight) {
    const weightVariance = Math.abs(
      batchData.weight - batchData.expectedWeight,
    );
    const variancePercent = (weightVariance / batchData.expectedWeight) * 100;

    if (variancePercent > 5) {
      issues.push({
        type: "CRITICAL",
        parameter: "Weight",
        value: `${batchData.weight}kg`,
        expected: `${batchData.expectedWeight}kg`,
        variance: `${variancePercent.toFixed(2)}%`,
        message:
          "Weight variance exceeds 5% - Possible measurement error or loss",
      });
    }
  }

  // Determine overall status
  const status =
    issues.length > 0
      ? "FLAGGED"
      : warnings.length > 0
        ? "PASSED_WITH_WARNINGS"
        : "PASSED";
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
      ? "Batch meets quality standards - Approved for processing/sale"
      : "Batch requires attention - Address critical issues before proceeding",
  };

  // Save quality check result to Firestore
  try {
    await db.collection(Collections.QUALITY_CHECKS).add({
      ...result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to save quality check:", error);
  }

  return result;
}
