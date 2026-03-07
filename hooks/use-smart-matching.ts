/**
 * useSmartMatching - Hook for AI product matching
 * Handles fetching and caching smart product matches
 */

import { useState, useCallback } from "react";
import { buildBackendUrl } from "@/lib/api";

export interface MatchPreferences {
  maxPrice: number;
  preferredQuality: "Premium" | "Standard" | "Basic";
  milletTypes?: string[];
  maxDistance?: number;
}

export interface ProductMatch {
  listingId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  milletType: string;
  quality: string;
  quantity: number;
  unit: string;
  pricePerKg: number;
  totalPrice: number;
  location: string;
  taluk: string;
  harvestDate: string;
  daysOld: number;
  matchScore: number;
  farmerCredibility: number;
  matchReasons: {
    quality: string;
    price: string;
    freshness: string;
    seller: string;
  };
}

export interface SmartMatchResponse {
  success: boolean;
  matchesFound: number;
  topMatches: ProductMatch[];
  statistics: {
    totalMatches: number;
    averageMatchScore: number;
    priceRange: {
      min: number;
      max: number;
      avg: number;
    };
    qualitiesAvailable: string[];
    milletsAvailable: string[];
  };
  message: string;
  recommendation: string;
}

export function useSmartMatching() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SmartMatchResponse | null>(null);

  const findMatches = useCallback(async (preferences: MatchPreferences) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildBackendUrl("/api/ai/smart-match"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to find matches");
      }

      const data = await response.json();
      setResults(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    results,
    findMatches,
    clearResults,
  };
}

/**
 * Get matching score explanation
 */
export function getMatchScoreExplanation(score: number): {
  level: string;
  description: string;
  recommendation: string;
} {
  if (score >= 85) {
    return {
      level: "Excellent",
      description: "Perfect match for your requirements",
      recommendation: "Highly recommended - This is an ideal product for you",
    };
  } else if (score >= 70) {
    return {
      level: "Good",
      description: "Strong match with high compatibility",
      recommendation: "Recommended - Good value and quality match",
    };
  } else if (score >= 50) {
    return {
      level: "Fair",
      description: "Acceptable match with some trade-offs",
      recommendation: "Consider comparing with other options",
    };
  } else {
    return {
      level: "Poor",
      description: "Limited match for your requirements",
      recommendation: "Adjust your preferences for better matches",
    };
  }
}

/**
 * Calculate total cost for multiple units
 */
export function calculateTotalCost(
  pricePerKg: number,
  quantity: number,
): number {
  return Math.round(pricePerKg * quantity * 100) / 100;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`;
}

/**
 * Get freshness badge info
 */
export function getFreshnessInfo(daysOld: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (daysOld <= 7) {
    return { label: "Fresh", color: "text-green-600", icon: "🌱" };
  } else if (daysOld <= 30) {
    return { label: "Recent", color: "text-blue-600", icon: "📦" };
  } else if (daysOld <= 60) {
    return { label: "Good", color: "text-yellow-600", icon: "⏱️" };
  } else {
    return { label: "Mature", color: "text-orange-600", icon: "📅" };
  }
}

/**
 * Credibility tier badge
 */
export function getCredibilityTier(score: number): {
  tier: string;
  color: string;
  icon: string;
} {
  if (score >= 85) {
    return { tier: "Diamond", color: "text-blue-600", icon: "💎" };
  } else if (score >= 75) {
    return { tier: "Platinum", color: "text-gray-400", icon: "🏆" };
  } else if (score >= 65) {
    return { tier: "Gold", color: "text-yellow-600", icon: "🥇" };
  } else if (score >= 55) {
    return { tier: "Silver", color: "text-gray-500", icon: "🥈" };
  } else {
    return { tier: "Bronze", color: "text-orange-600", icon: "🥉" };
  }
}
