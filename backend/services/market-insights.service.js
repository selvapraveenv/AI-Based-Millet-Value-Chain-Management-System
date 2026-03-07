/**
 * Market Insights Service - Real-time market analysis
 *
 * Analyzes trading data to provide:
 * - Trending crop varieties
 * - Most sold products
 * - Highest trade volumes
 * - Price trends
 * - Market demand patterns
 */

import { getFirestore, Collections } from "../config/firebase.js";

/**
 * Get comprehensive market insights
 * Aggregates real-time data from orders and listings
 */
export async function getMarketInsights() {
  const db = getFirestore();

  try {
    // Fetch all orders, listings, and price history in parallel
    const [ordersSnap, listingsSnap, priceHistorySnap] = await Promise.all([
      db.collection(Collections.ORDERS).get(),
      db.collection(Collections.LISTINGS).get(),
      db.collection(Collections.PRICE_HISTORY).get(),
    ]);

    const orders = [];
    const listings = [];
    const priceHistory = [];

    ordersSnap.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    listingsSnap.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() });
    });

    priceHistorySnap.forEach((doc) => {
      priceHistory.push({ id: doc.id, ...doc.data() });
    });

    // Calculate insights from the data
    const insights = {
      trendingCrops: calculateTrendingCrops(orders, listings),
      mostSoldCrops: calculateMostSoldCrops(orders, listings),
      highestTrades: calculateHighestTrades(orders),
      priceAnalysis: calculatePriceAnalysis(listings, priceHistory),
      demandPatterns: calculateDemandPatterns(orders),
      marketVolatility: calculateMarketVolatility(priceHistory),
      topFarmers: calculateTopFarmers(orders, listings),
      regionalInsights: calculateRegionalInsights(orders, listings),
      seasonalTrends: calculateSeasonalTrends(orders),
      summary: calculateSummary(orders, listings),
    };

    return {
      success: true,
      timestamp: new Date(),
      data: insights,
    };
  } catch (error) {
    console.error("Market insights error:", error);
    throw error;
  }
}

function calculateTrendingCrops(orders, listings) {
  const cropTrends = {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // First try to get recent orders (last 30 days)
  let recentOrders = [];
  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt || 0);
    if (orderDate > thirtyDaysAgo) {
      recentOrders.push(order);
      const cropName = order.milletType || order.cropType || "Unknown";
      cropTrends[cropName] = (cropTrends[cropName] || 0) + 1;
    }
  });

  // If no recent orders, use all orders as fallback
  if (Object.keys(cropTrends).length === 0) {
    orders.forEach((order) => {
      const cropName = order.milletType || order.cropType || "Unknown";
      cropTrends[cropName] = (cropTrends[cropName] || 0) + 1;
    });
  }

  const baseOrders = recentOrders.length > 0 ? recentOrders : orders;

  return Object.entries(cropTrends)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cropName, count]) => {
      const relatedListings = listings.filter(
        (l) => (l.milletType || l.cropType) === cropName,
      );
      const avgPrice =
        relatedListings.length > 0
          ? relatedListings.reduce((sum, l) => sum + (l.pricePerKg || 0), 0) /
            relatedListings.length
          : 0;

      return {
        name: cropName,
        orderCount: count,
        trend: "Upward",
        avgPrice: Math.round(avgPrice * 100) / 100,
        growthPercentage: Math.round(
          (count / Math.max(baseOrders.length, 1)) * 100,
        ),
        listingsCount: relatedListings.length,
      };
    });
}

function calculateMostSoldCrops(orders, listings) {
  const cropSales = {};

  orders.forEach((order) => {
    const cropName = order.milletType || order.cropType || "Unknown";
    const quantity = order.quantity || 0;
    cropSales[cropName] = (cropSales[cropName] || 0) + quantity;
  });

  return Object.entries(cropSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([cropName, quantity], index) => {
      const relatedOrders = orders.filter(
        (o) => (o.milletType || o.cropType) === cropName,
      );
      const totalValue = relatedOrders.reduce((sum, o) => {
        return sum + (o.quantity || 0) * (o.pricePerKg || 0);
      }, 0);

      return {
        rank: index + 1,
        name: cropName,
        totalQuantity: Math.round(quantity),
        unit: "kg",
        totalValue: Math.round(totalValue),
        orderCount: relatedOrders.length,
        avgOrderSize: Math.round(quantity / Math.max(relatedOrders.length, 1)),
        consumers: new Set(relatedOrders.map((o) => o.userId)).size,
      };
    });
}

function calculateHighestTrades(orders) {
  return orders
    .filter((o) => o.status !== "cancelled")
    .map((order) => ({
      orderId: order.id,
      cropType: order.milletType || order.cropType,
      quantity: order.quantity,
      pricePerKg: order.pricePerKg,
      totalValue: (order.quantity || 0) * (order.pricePerKg || 0),
      status: order.status,
      date: order.createdAt,
      consumerId: order.userId,
      farmerId: order.farmerId,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10)
    .map((trade, index) => ({
      ...trade,
      rank: index + 1,
    }));
}

function calculatePriceAnalysis(listings, priceHistory) {
  const prices = listings.map((l) => l.pricePerKg || 0).filter((p) => p > 0);
  const cropPrices = {};

  listings.forEach((listing) => {
    const cropName = listing.milletType || listing.cropType || "Unknown";
    if (!cropPrices[cropName]) {
      cropPrices[cropName] = [];
    }
    cropPrices[cropName].push(listing.pricePerKg || 0);
  });

  const priceTrends = Object.entries(cropPrices).map(([cropName, prices]) => {
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const volatility = (((maxPrice - minPrice) / avgPrice) * 100).toFixed(2);

    return {
      crop: cropName,
      currentAvgPrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      volatility: parseFloat(volatility),
      priceRange: Math.round((maxPrice - minPrice) * 100) / 100,
      listingCount: prices.length,
    };
  });

  return {
    overallAvgPrice:
      prices.length > 0
        ? Math.round(
            (prices.reduce((a, b) => a + b, 0) / prices.length) * 100,
          ) / 100
        : 0,
    highestPrice: Math.max(...prices, 0),
    lowestPrice: Math.min(...prices.filter((p) => p > 0), 0),
    priceRange:
      Math.max(...prices, 0) - Math.min(...prices.filter((p) => p > 0), 0),
    cropPriceTrends: priceTrends.sort(
      (a, b) => b.currentAvgPrice - a.currentAvgPrice,
    ),
  };
}

function calculateDemandPatterns(orders) {
  const demandByHour = {};
  const demandByDay = {};
  const demandByWeek = {};
  const now = new Date();

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt || now);
    if (orderDate > now) return;

    const hour = orderDate.getHours();
    demandByHour[hour] = (demandByHour[hour] || 0) + 1;

    const dayOfWeek = orderDate.getDay();
    demandByDay[dayOfWeek] = (demandByDay[dayOfWeek] || 0) + 1;

    const weekNum = Math.floor((now - orderDate) / (7 * 24 * 60 * 60 * 1000));
    if (weekNum < 12) {
      demandByWeek[weekNum] = (demandByWeek[weekNum] || 0) + 1;
    }
  });

  return {
    peakHours: Object.entries(demandByHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        orders: count,
        period: `${hour}:00-${hour}:59`,
      })),
    peakDays: Object.entries(demandByDay)
      .sort((a, b) => b[1] - a[1])
      .map(([day, count]) => ({
        day: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][day],
        orders: count,
      })),
    weeklyTrend: Object.entries(demandByWeek)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .slice(0, 12)
      .map(([week, count]) => ({
        week: -parseInt(week),
        orders: count,
      })),
  };
}

function calculateMarketVolatility(priceHistory) {
  if (priceHistory.length === 0) {
    return {
      overallVolatility: 0,
      volatileProducts: [],
      stableProducts: [],
    };
  }

  const volatilityByProduct = {};

  priceHistory.forEach((record) => {
    const productId = record.productId || "Unknown";
    if (!volatilityByProduct[productId]) {
      volatilityByProduct[productId] = [];
    }
    volatilityByProduct[productId].push(record.price || 0);
  });

  const volatilityAnalysis = Object.entries(volatilityByProduct).map(
    ([product, prices]) => {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance =
        prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) /
        prices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = ((stdDev / avg) * 100).toFixed(2);

      return {
        product,
        volatility: parseFloat(coefficientOfVariation),
        avgPrice: Math.round(avg * 100) / 100,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        priceChanges: prices.length,
      };
    },
  );

  const sortedByVolatility = volatilityAnalysis.sort(
    (a, b) => b.volatility - a.volatility,
  );

  return {
    overallVolatility:
      Math.round(
        (volatilityAnalysis.reduce((sum, p) => sum + p.volatility, 0) /
          volatilityAnalysis.length) *
          100,
      ) / 100,
    volatileProducts: sortedByVolatility.slice(0, 5),
    stableProducts: sortedByVolatility.slice(-5).reverse(),
  };
}

function calculateTopFarmers(orders, listings) {
  const farmerStats = {};

  orders.forEach((order) => {
    const farmerId = order.farmerId || "Unknown";
    if (!farmerStats[farmerId]) {
      farmerStats[farmerId] = {
        orders: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        crops: new Set(),
      };
    }
    farmerStats[farmerId].orders += 1;
    farmerStats[farmerId].totalQuantity += order.quantity || 0;
    farmerStats[farmerId].totalRevenue +=
      (order.quantity || 0) * (order.pricePerKg || 0);
    farmerStats[farmerId].crops.add(order.milletType || order.cropType);
  });

  listings.forEach((listing) => {
    if (listing.farmerId && farmerStats[listing.farmerId]) {
      farmerStats[listing.farmerId].name =
        listing.farmerName || listing.farmerId;
    }
  });

  return Object.entries(farmerStats)
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
    .slice(0, 5)
    .map((entry, index) => ({
      rank: index + 1,
      farmerId: entry[0],
      name: entry[1].name || `Farmer ${entry[0].slice(0, 8)}`,
      totalOrders: entry[1].orders,
      totalQuantitySold: Math.round(entry[1].totalQuantity),
      totalRevenue: Math.round(entry[1].totalRevenue),
      uniqueCrops: entry[1].crops.size,
      avgOrderValue: Math.round(entry[1].totalRevenue / entry[1].orders),
    }));
}

function calculateRegionalInsights(orders, listings) {
  const regionData = {};

  listings.forEach((listing) => {
    const region = listing.region || listing.district || "Unknown";
    if (!regionData[region]) {
      regionData[region] = {
        listings: 0,
        farmers: new Set(),
        crops: new Set(),
      };
    }
    regionData[region].listings += 1;
    regionData[region].farmers.add(listing.farmerId);
    regionData[region].crops.add(listing.milletType || listing.cropType);
  });

  orders.forEach((order) => {
    const region = order.region || order.district || "Unknown";
    if (!regionData[region]) {
      regionData[region] = {
        listings: 0,
        farmers: new Set(),
        crops: new Set(),
        orders: 0,
        totalValue: 0,
      };
    }
    regionData[region].orders = (regionData[region].orders || 0) + 1;
    regionData[region].totalValue =
      (regionData[region].totalValue || 0) +
      (order.quantity || 0) * (order.pricePerKg || 0);
  });

  return Object.entries(regionData)
    .sort((a, b) => (b[1].orders || 0) - (a[1].orders || 0))
    .slice(0, 5)
    .map(([region, data]) => ({
      region,
      listings: data.listings,
      farmers: data.farmers.size,
      crops: data.crops.size,
      orders: data.orders || 0,
      totalTradeValue: Math.round(data.totalValue || 0),
    }));
}

function calculateSeasonalTrends(orders) {
  const monthData = {};
  const now = new Date();

  orders.forEach((order) => {
    const date = new Date(order.createdAt || now);
    if (date > now) return;

    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (!monthData[key]) {
      monthData[key] = {
        orders: 0,
        quantity: 0,
        revenue: 0,
        crops: new Set(),
      };
    }
    monthData[key].orders += 1;
    monthData[key].quantity += order.quantity || 0;
    monthData[key].revenue += (order.quantity || 0) * (order.pricePerKg || 0);
    monthData[key].crops.add(order.milletType || order.cropType);
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return Object.entries(monthData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, data]) => ({
      month: months[parseInt(month.split("-")[1]) - 1],
      orders: data.orders,
      quantity: Math.round(data.quantity),
      revenue: Math.round(data.revenue),
      uniqueCrops: data.crops.size,
    }));
}

function calculateSummary(orders, listings) {
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const completedOrders = orders.filter((o) => o.status === "delivered");

  const totalRevenue = activeOrders.reduce(
    (sum, o) => sum + (o.quantity || 0) * (o.pricePerKg || 0),
    0,
  );

  const totalQuantity = activeOrders.reduce(
    (sum, o) => sum + (o.quantity || 0),
    0,
  );

  const prices = listings.map((l) => l.pricePerKg || 0).filter((p) => p > 0);

  return {
    totalListings: listings.length,
    activeListings: listings.filter((l) => l.status === "active").length,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    activeOrders: activeOrders.length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    totalQuantitySold: Math.round(totalQuantity),
    totalRevenue: Math.round(totalRevenue),
    totalCrops: new Set(listings.map((l) => l.milletType || l.cropType)).size,
    uniqueFarmers: new Set(listings.map((l) => l.farmerId)).size,
    uniqueConsumers: new Set(orders.map((o) => o.userId)).size,
    averageOrderValue:
      completedOrders.length > 0
        ? Math.round(totalRevenue / completedOrders.length)
        : 0,
    averagePrice:
      prices.length > 0
        ? Math.round(
            (prices.reduce((a, b) => a + b, 0) / prices.length) * 100,
          ) / 100
        : 0,
  };
}
