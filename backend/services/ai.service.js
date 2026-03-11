/**
 * AI Service - Data-driven AI logic for price, demand, and quality
 *
 * This service implements:
 * 1. Price suggestion from platform and public market data
 * 2. Demand forecasting using observed historical data
 * 3. Quality anomaly detection
 */

import { getFirestore, Collections } from "../config/firebase.js";

const EXTERNAL_MARKET_CONFIG = {
  timeoutMs: Number(process.env.EXTERNAL_MARKET_TIMEOUT_MS || 6000),
  commodityOnlineMilletsUrl:
    process.env.COMMODITYONLINE_MILLETS_URL ||
    "https://www.commodityonline.com/mandiprices/millets",
  agmarknetPriceUrl: process.env.AGMARKNET_PRICE_URL || "",
  dataGovApiBaseUrl:
    process.env.DATA_GOV_API_BASE_URL || "https://api.data.gov.in/resource",
  dataGovApiKey: process.env.DATA_GOV_API_KEY || "",
  dataGovMarketResourceIds: (process.env.DATA_GOV_MARKET_RESOURCE_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  extraHtmlSources: parseConfiguredMarketSources(
    process.env.EXTRA_MARKET_SOURCE_URLS || "",
  ),
};

const QUALITY_SCORE_MATRIX = {
  Premium: { Premium: 100, Standard: 90, Basic: 70 },
  Standard: { Standard: 100, Premium: 90, Basic: 70 },
  Basic: { Basic: 100, Standard: 80, Premium: 70 },
};

function parseConfiguredMarketSources(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, url] = entry.split("|").map((part) => part.trim());
      if (!name || !url) return null;
      return { name, url };
    })
    .filter(Boolean);
}

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

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function parseNumber(value) {
  const normalized = String(value || "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function quantile(values, percentile) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function summarizePriceSeries(values) {
  const sanitized = values.filter(
    (price) => Number.isFinite(price) && price > 0,
  );
  if (!sanitized.length) {
    return {
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      q25: 0,
      q75: 0,
      volatility: 0,
    };
  }

  return {
    count: sanitized.length,
    min: round2(Math.min(...sanitized)),
    max: round2(Math.max(...sanitized)),
    average: round2(average(sanitized)),
    median: round2(median(sanitized)),
    q25: round2(quantile(sanitized, 0.25)),
    q75: round2(quantile(sanitized, 0.75)),
    volatility:
      sanitized.length > 1 && average(sanitized) > 0
        ? round2((stdDev(sanitized) / average(sanitized)) * 100)
        : 0,
  };
}

function buildLocationTerms({ location, taluk }) {
  return unique(
    [location, taluk]
      .flatMap((value) => [
        String(value || "").trim(),
        ...String(value || "")
          .split(/[\/,()-]/)
          .map((part) => part.trim()),
      ])
      .filter((value) => value.length >= 3),
  );
}

function buildCommodityTerms(milletType) {
  const full = String(milletType || "").trim();
  const bracketMatch = full.match(/\(([^)]+)\)/);
  const bracketValue = bracketMatch ? bracketMatch[1].trim() : "";
  const genericFree = full.replace(/\([^)]*\)/g, " ").trim();

  return unique(
    [full, bracketValue, genericFree]
      .flatMap((value) => [
        value,
        ...String(value || "")
          .split(/[\/,()-]/)
          .map((part) => part.trim()),
      ])
      .map((value) => value.replace(/\bmillets?\b/gi, "").trim())
      .filter((value) => value.length >= 3),
  );
}

function matchesTerms(text, terms) {
  if (!terms.length) return true;
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchTextWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 MilletChain/1.0",
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractLabeledQuintalPrice(text, label) {
  const pattern = new RegExp(
    `${escapeRegExp(label)}[\\s\\S]{0,250}?(?:₹|Rs\\.?)\\s*([\\d,]+(?:\\.\\d+)?)\\s*\/\\s*Quintal`,
    "i",
  );
  const match = text.match(pattern);
  return match ? parseNumber(match[1]) / 100 : 0;
}

function extractUpdatedAt(text) {
  const match = text.match(
    /(?:Last price updated|Price updated)\s*:?\s*([^\n<]{4,80})/i,
  );
  return match ? match[1].trim() : "";
}

function extractUnitPrices(text) {
  return [
    ...String(text || "").matchAll(
      /(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:\/-)?\s*(?:\/\s*)?(Quintal|Kg|kg)\b/gi,
    ),
  ]
    .map((match) => {
      const value = parseNumber(match[1]);
      const unit = String(match[2] || "").toLowerCase();
      if (!value) return 0;
      return unit === "quintal" ? value / 100 : value;
    })
    .filter((price) => price > 0);
}

function extractContextualPrices(text, searchTerms) {
  if (!searchTerms.length) return extractUnitPrices(text).slice(0, 20);

  const prices = [];
  for (const term of searchTerms) {
    const pattern = new RegExp(`.{0,220}${escapeRegExp(term)}.{0,220}`, "gi");
    for (const match of text.matchAll(pattern)) {
      prices.push(...extractUnitPrices(match[0]));
    }
  }

  return unique(prices.map((price) => round2(price))).filter(
    (price) => price > 0,
  );
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function collectCommodityOnlineMarketSignal({ locationTerms }) {
  const html = await fetchTextWithTimeout(
    EXTERNAL_MARKET_CONFIG.commodityOnlineMilletsUrl,
    EXTERNAL_MARKET_CONFIG.timeoutMs,
  );
  const text = stripHtml(html);

  const averagePricePerKg = extractLabeledQuintalPrice(text, "Average Price");
  const minPricePerKg = extractLabeledQuintalPrice(text, "Lowest Market Price");
  const maxPricePerKg = extractLabeledQuintalPrice(
    text,
    "Costliest Market Price",
  );
  const updatedAt = extractUpdatedAt(text);

  const locationPrices = extractContextualPrices(text, locationTerms);
  const effectiveSamples = locationPrices.length
    ? locationPrices
    : [averagePricePerKg].filter((price) => price > 0);

  if (!effectiveSamples.length && !averagePricePerKg) {
    return null;
  }

  return {
    source: "CommodityOnline",
    url: EXTERNAL_MARKET_CONFIG.commodityOnlineMilletsUrl,
    updatedAt,
    averagePricePerKg: round2(
      locationPrices.length ? average(locationPrices) : averagePricePerKg,
    ),
    range: {
      min: round2(
        locationPrices.length
          ? Math.min(...locationPrices)
          : minPricePerKg || averagePricePerKg,
      ),
      max: round2(
        locationPrices.length
          ? Math.max(...locationPrices)
          : maxPricePerKg || averagePricePerKg,
      ),
    },
    matchedLocation: locationPrices.length
      ? locationTerms.join(", ")
      : "all-markets",
    samplePricesPerKg: effectiveSamples.map((price) => round2(price)),
  };
}

async function collectConfiguredHtmlMarketSignal({ name, url, locationTerms }) {
  const html = await fetchTextWithTimeout(
    url,
    EXTERNAL_MARKET_CONFIG.timeoutMs,
  );
  const text = stripHtml(html);
  const samplePricesPerKg = extractContextualPrices(text, locationTerms);
  if (!samplePricesPerKg.length) return null;

  const stats = summarizePriceSeries(samplePricesPerKg);
  return {
    source: name,
    url,
    updatedAt: extractUpdatedAt(text),
    averagePricePerKg: stats.average,
    range: {
      min: stats.min,
      max: stats.max,
    },
    matchedLocation: locationTerms.join(", ") || "all-markets",
    samplePricesPerKg,
  };
}

async function collectDataGovMarketSignals({ milletType, locationTerms }) {
  if (
    !EXTERNAL_MARKET_CONFIG.dataGovApiKey ||
    !EXTERNAL_MARKET_CONFIG.dataGovMarketResourceIds.length
  ) {
    return [];
  }

  const commodityTerms = buildCommodityTerms(milletType);
  const sources = [];

  for (const resourceId of EXTERNAL_MARKET_CONFIG.dataGovMarketResourceIds) {
    try {
      const url = `${EXTERNAL_MARKET_CONFIG.dataGovApiBaseUrl}/${resourceId}?api-key=${encodeURIComponent(EXTERNAL_MARKET_CONFIG.dataGovApiKey)}&format=json&limit=100`;
      const payload = await fetchJsonWithTimeout(
        url,
        EXTERNAL_MARKET_CONFIG.timeoutMs,
      );

      const records = Array.isArray(payload?.records) ? payload.records : [];
      const matchedRecords = records.filter((record) => {
        const allValues = Object.values(record || {}).join(" ");
        return (
          matchesTerms(allValues, commodityTerms) &&
          matchesTerms(allValues, locationTerms)
        );
      });

      const samplePricesPerKg = matchedRecords
        .map((record) => {
          const modalPrice = parseNumber(
            record.modal_price ||
              record.modal ||
              record.price ||
              record.max_price,
          );
          return modalPrice > 0 ? modalPrice / 100 : 0;
        })
        .filter((price) => price > 0)
        .slice(0, 30)
        .map((price) => round2(price));

      if (!samplePricesPerKg.length) continue;

      const stats = summarizePriceSeries(samplePricesPerKg);
      sources.push({
        source: `DataGov:${resourceId}`,
        url,
        updatedAt: payload?.updated_date || payload?.last_updated || "",
        averagePricePerKg: stats.average,
        range: {
          min: stats.min,
          max: stats.max,
        },
        matchedLocation: locationTerms.join(", ") || "all-markets",
        samplePricesPerKg,
      });
    } catch (error) {
      console.warn(
        `DataGov market signal fetch failed for ${resourceId}:`,
        error.message,
      );
    }
  }

  return sources;
}

async function collectExternalMarketSignals({ milletType, location, taluk }) {
  const locationTerms = buildLocationTerms({ location, taluk });
  const sources = [];
  const prices = [];

  try {
    const commodityOnline = await collectCommodityOnlineMarketSignal({
      locationTerms,
    });
    if (commodityOnline) {
      sources.push(commodityOnline);
      prices.push(...commodityOnline.samplePricesPerKg);
    }
  } catch (error) {
    console.warn("CommodityOnline market signal fetch failed:", error.message);
  }

  if (EXTERNAL_MARKET_CONFIG.agmarknetPriceUrl) {
    try {
      const agmarknet = await collectConfiguredHtmlMarketSignal({
        name: "Agmarknet",
        url: EXTERNAL_MARKET_CONFIG.agmarknetPriceUrl,
        locationTerms,
      });
      if (agmarknet) {
        sources.push(agmarknet);
        prices.push(...agmarknet.samplePricesPerKg);
      }
    } catch (error) {
      console.warn("Agmarknet market signal fetch failed:", error.message);
    }
  }

  const dataGovSources = await collectDataGovMarketSignals({
    milletType,
    locationTerms,
  });
  dataGovSources.forEach((source) => {
    sources.push(source);
    prices.push(...source.samplePricesPerKg);
  });

  await Promise.all(
    EXTERNAL_MARKET_CONFIG.extraHtmlSources.map(async (sourceConfig) => {
      try {
        const source = await collectConfiguredHtmlMarketSignal({
          name: sourceConfig.name,
          url: sourceConfig.url,
          locationTerms,
        });
        if (source) {
          sources.push(source);
          prices.push(...source.samplePricesPerKg);
        }
      } catch (error) {
        console.warn(
          `${sourceConfig.name} market signal fetch failed:`,
          error.message,
        );
      }
    }),
  );

  return {
    prices: unique(prices.map((price) => round2(price))).filter(
      (price) => price > 0,
    ),
    sources,
  };
}

function parseGeminiJson(text) {
  if (!text) return null;

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
}

function normalizeDemandLevel(level) {
  const normalized = String(level || "").toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  return "Medium";
}

function inferExpectedSaleTime({
  quantity,
  recentOrderQuantity,
  observationDays,
}) {
  const dailyVelocity =
    recentOrderQuantity > 0
      ? recentOrderQuantity / Math.max(observationDays || 30, 1)
      : 0;

  if (dailyVelocity <= 0) {
    return "Insufficient recent demand data";
  }

  const estimatedDays = Math.max(1, Math.ceil(quantity / dailyVelocity));
  if (estimatedDays < 7)
    return `${estimatedDays} day${estimatedDays === 1 ? "" : "s"}`;
  if (estimatedDays < 45) {
    const weeks = Math.ceil(estimatedDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.ceil(estimatedDays / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}

function sanitizePriceRecommendation(payload, fallback, quantity) {
  const recommended = Number(payload?.recommendedPricePerKg);
  const min = Number(payload?.suggestedPriceRange?.min);
  const max = Number(payload?.suggestedPriceRange?.max);

  const safeRecommended =
    Number.isFinite(recommended) && recommended > 0
      ? round2(recommended)
      : fallback.recommendedPricePerKg;

  const safeMin =
    Number.isFinite(min) && min > 0
      ? round2(Math.min(min, safeRecommended))
      : fallback.suggestedPriceRange.min;
  const safeMax =
    Number.isFinite(max) && max > 0
      ? round2(Math.max(max, safeRecommended))
      : fallback.suggestedPriceRange.max;

  return {
    recommendedPricePerKg: safeRecommended,
    suggestedPriceRange: {
      min: safeMin,
      max: safeMax,
    },
    demandLevel: normalizeDemandLevel(
      payload?.demandLevel || fallback.demandLevel,
    ),
    expectedSaleTime:
      String(payload?.expectedSaleTime || "").trim() ||
      fallback.expectedSaleTime,
    reasoning: String(payload?.reasoning || "").trim() || fallback.reasoning,
  };
}

function calculateHeuristicPriceRecommendation({
  recentMarketplacePrices,
  historicalTransactionPrices,
  externalMarketPrices,
  demandLevel,
  recentOrderQuantity,
  quantity,
}) {
  const observedPrices = [
    ...recentMarketplacePrices,
    ...historicalTransactionPrices,
    ...externalMarketPrices,
  ].filter((price) => price > 0);

  if (!observedPrices.length) {
    throw new Error("Insufficient market data to generate recommendation");
  }

  const stats = summarizePriceSeries(observedPrices);
  const recommendedPricePerKg = stats.median || stats.average;
  const suggestedMin = stats.q25 || stats.min || recommendedPricePerKg;
  const suggestedMax = stats.q75 || stats.max || recommendedPricePerKg;

  return {
    recommendedPricePerKg: round2(recommendedPricePerKg),
    suggestedPriceRange: {
      min: round2(Math.min(suggestedMin, recommendedPricePerKg)),
      max: round2(Math.max(suggestedMax, recommendedPricePerKg)),
    },
    demandLevel,
    expectedSaleTime: inferExpectedSaleTime({
      quantity,
      recentOrderQuantity,
      observationDays: 30,
    }),
    reasoning: `Recommendation is derived from observed platform listings, transaction history, and live public market prices near the selected market area.`,
  };
}

async function collectRecentMarketplacePrices(db, milletType, location, taluk) {
  let listings = [];
  const locationTerms = buildLocationTerms({ location, taluk });

  try {
    const snap = await db
      .collection(Collections.LISTINGS)
      .where("milletType", "==", milletType)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(60)
      .get();

    listings = snap.docs.map((doc) => doc.data());
  } catch {
    const fallbackSnap = await db.collection(Collections.LISTINGS).get();
    listings = fallbackSnap.docs
      .map((doc) => doc.data())
      .filter(
        (item) => item.milletType === milletType && item.status === "active",
      )
      .sort((a, b) => {
        const timeA = toDateSafe(a.createdAt)?.getTime() || 0;
        const timeB = toDateSafe(b.createdAt)?.getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 60);
  }

  const regional = listings
    .filter((item) =>
      matchesTerms(
        [item.location, item.taluk, item.market, item.district, item.state]
          .filter(Boolean)
          .join(" "),
        locationTerms,
      ),
    )
    .map((item) => Number(item.pricePerKg || 0))
    .filter((price) => price > 0);

  if (regional.length >= 5) return regional;

  return listings
    .map((item) => Number(item.pricePerKg || 0))
    .filter((price) => price > 0)
    .slice(0, 40);
}

async function collectHistoricalTransactionPrices(
  db,
  milletType,
  location,
  taluk,
) {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let orders = [];
  const locationTerms = buildLocationTerms({ location, taluk });

  try {
    const snap = await db
      .collection(Collections.ORDERS)
      .where("milletType", "==", milletType)
      .orderBy("createdAt", "desc")
      .limit(120)
      .get();
    orders = snap.docs.map((doc) => doc.data());
  } catch {
    const fallbackSnap = await db.collection(Collections.ORDERS).get();
    orders = fallbackSnap.docs
      .map((doc) => doc.data())
      .filter((item) => item.milletType === milletType)
      .sort((a, b) => {
        const timeA = toDateSafe(a.createdAt || a.orderDate)?.getTime() || 0;
        const timeB = toDateSafe(b.createdAt || b.orderDate)?.getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 120);
  }

  const regionalRecent = orders
    .filter((order) => {
      const orderTime = toDateSafe(
        order.createdAt || order.orderDate,
      )?.getTime();
      const inRange = orderTime ? orderTime >= ninetyDaysAgo : false;
      const isRegional = matchesTerms(
        [order.location, order.taluk, order.market, order.district, order.state]
          .filter(Boolean)
          .join(" "),
        locationTerms,
      );
      return inRange && isRegional;
    })
    .map((order) => Number(order.pricePerKg || 0))
    .filter((price) => price > 0);

  if (regionalRecent.length >= 3) return regionalRecent;

  const fallbackTransactionPrices = orders
    .filter((order) => {
      const orderTime = toDateSafe(
        order.createdAt || order.orderDate,
      )?.getTime();
      return orderTime ? orderTime >= ninetyDaysAgo : false;
    })
    .map((order) => Number(order.pricePerKg || 0))
    .filter((price) => price > 0);

  if (fallbackTransactionPrices.length) return fallbackTransactionPrices;

  const priceHistorySnap = await db
    .collection(Collections.PRICE_HISTORY)
    .where("milletType", "==", milletType)
    .get();

  return priceHistorySnap.docs
    .map((doc) => Number(doc.data().price || 0))
    .filter((price) => price > 0)
    .slice(-60);
}

async function calculateRegionalDemandSummary(db, milletType, location, taluk) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const locationTerms = buildLocationTerms({ location, taluk });

  const [ordersSnap, listingsSnap] = await Promise.all([
    db
      .collection(Collections.ORDERS)
      .where("milletType", "==", milletType)
      .get(),
    db
      .collection(Collections.LISTINGS)
      .where("milletType", "==", milletType)
      .get(),
  ]);

  const recentRegionalOrders = ordersSnap.docs
    .map((doc) => doc.data())
    .filter((order) => {
      const orderTime = toDateSafe(
        order.createdAt || order.orderDate,
      )?.getTime();
      if (!orderTime || orderTime < thirtyDaysAgo) return false;
      return matchesTerms(
        [order.location, order.taluk, order.market, order.district, order.state]
          .filter(Boolean)
          .join(" "),
        locationTerms,
      );
    });

  const regionalActiveListings = listingsSnap.docs
    .map((doc) => doc.data())
    .filter(
      (listing) =>
        listing.status === "active" &&
        matchesTerms(
          [
            listing.location,
            listing.taluk,
            listing.market,
            listing.district,
            listing.state,
          ]
            .filter(Boolean)
            .join(" "),
          locationTerms,
        ),
    );

  const recentOrderCount = recentRegionalOrders.length;
  const activeSupplyCount = regionalActiveListings.length;
  const recentOrderQuantity = recentRegionalOrders.reduce(
    (sum, order) => sum + Number(order.quantity || 0),
    0,
  );
  const activeSupplyQuantity = regionalActiveListings.reduce(
    (sum, listing) => sum + Number(listing.quantity || 0),
    0,
  );
  const demandPressure = activeSupplyCount
    ? recentOrderCount / activeSupplyCount
    : recentOrderCount;

  const demandLevel =
    demandPressure >= 1.3 || recentOrderCount >= 15
      ? "High"
      : demandPressure >= 0.7 || recentOrderCount >= 6
        ? "Medium"
        : "Low";

  return {
    demandLevel,
    recentOrderCount,
    recentOrderQuantity,
    activeSupplyCount,
    activeSupplyQuantity,
    demandPressure: Number(demandPressure.toFixed(2)),
  };
}

async function requestGeminiPriceRecommendation({
  listingInput,
  baseSuggestedPrice,
  recentMarketplacePrices,
  historicalTransactionPrices,
  externalMarketSignals,
  regionalDemand,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const recentAvg = recentMarketplacePrices.length
    ? round2(average(recentMarketplacePrices))
    : 0;
  const historicalAvg = historicalTransactionPrices.length
    ? round2(average(historicalTransactionPrices))
    : 0;
  const externalAvg = externalMarketSignals.prices.length
    ? round2(average(externalMarketSignals.prices))
    : 0;
  const externalSourcesSummary = externalMarketSignals.sources.length
    ? externalMarketSignals.sources
        .map(
          (source) =>
            `${source.source}: avg ₹${source.averagePricePerKg}/kg, range ₹${source.range.min}-₹${source.range.max}/kg, scope ${source.matchedLocation}, updated ${source.updatedAt || "unknown"}`,
        )
        .join("; ")
    : "No live public market source available";

  const prompt = `You are an agricultural pricing analyst for millet trading.
Return only valid JSON (no markdown, no extra text) with this exact schema:
{
  "recommendedPricePerKg": number,
  "suggestedPriceRange": { "min": number, "max": number },
  "demandLevel": "High" | "Medium" | "Low",
  "expectedSaleTime": "string",
  "reasoning": "short explanation"
}

Listing Input:
- milletType: ${listingInput.milletType}
- quantityKg: ${listingInput.quantity}
- location: ${listingInput.location}
- quality: ${listingInput.quality}
- taluk: ${listingInput.taluk || "N/A"}

Observed Central Market Price:
- observedMedianPricePerKg: ${baseSuggestedPrice}

Market Signals:
- recentMarketplacePricesCount: ${recentMarketplacePrices.length}
- recentMarketplaceAvgPrice: ${recentAvg}
- historicalTransactionPricesCount: ${historicalTransactionPrices.length}
- historicalTransactionAvgPrice: ${historicalAvg}
- externalPublicMarketPricesCount: ${externalMarketSignals.prices.length}
- externalPublicMarketAvgPrice: ${externalAvg}
- externalPublicMarketSources: ${externalSourcesSummary}
- demandLevelFromData: ${regionalDemand.demandLevel}
- recentRegionalOrders: ${regionalDemand.recentOrderCount}
- recentRegionalOrderQuantityKg: ${regionalDemand.recentOrderQuantity}
- activeRegionalListings: ${regionalDemand.activeSupplyCount}
- activeRegionalSupplyKg: ${regionalDemand.activeSupplyQuantity}
- demandPressure: ${regionalDemand.demandPressure}

Rules:
- Keep recommendation aligned with current observed market trend.
- Do not invent any price disconnected from the observed data.
- Price range min <= recommended <= max.
- Reasoning must be one short sentence.`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("\n") || "";

  return parseGeminiJson(text);
}

export async function getPriceRecommendation({
  milletType,
  quantity,
  location,
  quality,
  taluk,
}) {
  const db = getFirestore();
  const safeQuantity = Number(quantity || 0);
  const normalizedQuality = normalizeQuality(quality);

  const baseSuggestion = await calculatePriceSuggestion({
    milletType,
    quantity: safeQuantity,
    location,
    quality: normalizedQuality,
    taluk,
  });

  const [recentMarketplacePrices, historicalTransactionPrices, regionalDemand] =
    await Promise.all([
      collectRecentMarketplacePrices(db, milletType, location, taluk),
      collectHistoricalTransactionPrices(db, milletType, location, taluk),
      calculateRegionalDemandSummary(db, milletType, location, taluk),
    ]);

  const externalMarketSignals = await collectExternalMarketSignals({
    milletType,
    location,
    taluk,
  });

  const fallbackRecommendation = calculateHeuristicPriceRecommendation({
    recentMarketplacePrices,
    historicalTransactionPrices,
    externalMarketPrices: externalMarketSignals.prices,
    demandLevel: regionalDemand.demandLevel,
    recentOrderQuantity: regionalDemand.recentOrderQuantity,
    quantity: safeQuantity,
  });

  try {
    const aiPayload = await requestGeminiPriceRecommendation({
      listingInput: {
        milletType,
        quantity: safeQuantity,
        location,
        quality: normalizedQuality,
        taluk,
      },
      baseSuggestedPrice: baseSuggestion.suggestedPrice,
      recentMarketplacePrices,
      historicalTransactionPrices,
      externalMarketSignals,
      regionalDemand,
    });

    const recommendation = sanitizePriceRecommendation(
      aiPayload,
      fallbackRecommendation,
      safeQuantity,
    );

    return {
      ...recommendation,
      marketSignals: {
        platformRecentAvgPricePerKg: recentMarketplacePrices.length
          ? round2(average(recentMarketplacePrices))
          : 0,
        historicalTransactionAvgPricePerKg: historicalTransactionPrices.length
          ? round2(average(historicalTransactionPrices))
          : 0,
        externalMarketAvgPricePerKg: externalMarketSignals.prices.length
          ? round2(average(externalMarketSignals.prices))
          : 0,
        externalSources: externalMarketSignals.sources,
      },
    };
  } catch (error) {
    console.warn(
      "Gemini price recommendation unavailable, using heuristic fallback:",
      error.message,
    );
    return {
      ...fallbackRecommendation,
      marketSignals: {
        platformRecentAvgPricePerKg: recentMarketplacePrices.length
          ? round2(average(recentMarketplacePrices))
          : 0,
        historicalTransactionAvgPricePerKg: historicalTransactionPrices.length
          ? round2(average(historicalTransactionPrices))
          : 0,
        externalMarketAvgPricePerKg: externalMarketSignals.prices.length
          ? round2(average(externalMarketSignals.prices))
          : 0,
        externalSources: externalMarketSignals.sources,
      },
    };
  }
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
  taluk,
}) {
  const db = getFirestore();

  try {
    const [
      recentMarketplacePrices,
      historicalTransactionPrices,
      regionalDemand,
    ] = await Promise.all([
      collectRecentMarketplacePrices(db, milletType, location, taluk),
      collectHistoricalTransactionPrices(db, milletType, location, taluk),
      calculateRegionalDemandSummary(db, milletType, location, taluk),
    ]);

    const externalMarketSignals = await collectExternalMarketSignals({
      milletType,
      location,
      taluk,
    });

    const observedPrices = [
      ...recentMarketplacePrices,
      ...historicalTransactionPrices,
      ...externalMarketSignals.prices,
    ].filter((price) => price > 0);

    if (!observedPrices.length) {
      throw new Error("Insufficient market data to generate price suggestion");
    }

    const stats = summarizePriceSeries(observedPrices);
    const suggestedPrice = stats.median || stats.average;
    const totalCost = suggestedPrice * quantity;

    return {
      success: true,
      milletType,
      quantity,
      location,
      quality,
      suggestedPrice: round2(suggestedPrice),
      totalCost: Math.round(totalCost * 100) / 100,
      priceBreakdown: {
        observedSamples: stats.count,
        observedMedianPricePerKg: stats.median,
        observedAveragePricePerKg: stats.average,
        observedRange: {
          min: stats.q25 || stats.min,
          max: stats.q75 || stats.max,
        },
        platformRecentAvgPricePerKg: recentMarketplacePrices.length
          ? round2(average(recentMarketplacePrices))
          : 0,
        historicalTransactionAvgPricePerKg: historicalTransactionPrices.length
          ? round2(average(historicalTransactionPrices))
          : 0,
        externalMarketAvgPricePerKg: externalMarketSignals.prices.length
          ? round2(average(externalMarketSignals.prices))
          : 0,
        demandPressure: regionalDemand.demandPressure,
      },
      recommendation:
        "Derived from observed platform, transaction, and public market price trends.",
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
    const priceHistorySnapshot = await db
      .collection(Collections.PRICE_HISTORY)
      .get();

    const allOrders = ordersSnapshot.docs.map((doc) => doc.data());
    const allListings = listingsSnapshot.docs.map((doc) => doc.data());
    const allPriceHistory = priceHistorySnapshot.docs.map((doc) => doc.data());

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
      ...filteredOrders
        .map((order) => order.milletType || order.productName)
        .filter(Boolean),
      ...allListings.map((listing) => listing.milletType).filter(Boolean),
      ...allPriceHistory
        .map((item) => item.milletType || item.commodity)
        .filter(Boolean),
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
      const historicalPrices = allPriceHistory
        .filter((item) => (item.milletType || item.commodity) === milletType)
        .map((item) => Number(item.price || item.modal_price || 0))
        .filter((price) => price > 0);

      const currentPrice = prices.length
        ? Number(average(prices).toFixed(2))
        : historicalPrices.length
          ? Number(average(historicalPrices).toFixed(2))
          : 0;
      const volatility =
        prices.length > 1 && currentPrice > 0
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
