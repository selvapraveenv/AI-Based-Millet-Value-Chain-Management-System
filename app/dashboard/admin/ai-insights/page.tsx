"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { buildBackendUrl } from "@/lib/api";

interface Trend {
  milletType: string;
  currentPrice: number;
  currentDemandCount: number;
  predictedDemandCount: number;
  growthRate: number;
  trend: "Upward" | "Downward" | "Stable";
  demandLevel: string;
  volatility: number;
  recommendation: string;
  predictionConfidence: string;
  historicalMonth1: number;
  historicalMonth2: number;
  historicalMonth3: number;
  historicalAverage: number;
  demandCount?: number; // Optional for backward compatibility
  totalQuantity?: number;
  averageOrderSize?: number;
}

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        buildBackendUrl("/api/ai/demand-forecast"),
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Use real data from API
      if (
        data.forecast &&
        Array.isArray(data.forecast) &&
        data.forecast.length > 0
      ) {
        setTrends(data.forecast);
      } else {
        // No data available from database
        setError(
          "No millet data available for analysis. Please ensure orders exist in the database.",
        );
        setTrends([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Error fetching data");
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "Upward")
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "Downward")
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 text-gray-500">→</div>;
  };

  const getTrendBadgeColor = (trend: string) => {
    if (trend === "Upward") return "bg-green-100 text-green-800";
    if (trend === "Downward") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Prepare data for charts
  const demandChartData = trends
    .sort((a, b) => b.predictedDemandCount - a.predictedDemandCount)
    .slice(0, 8);
  const volatilityChartData = trends
    .sort((a, b) => b.volatility - a.volatility)
    .slice(0, 8);
  const priceChartData = trends
    .map((t) => ({ name: t.milletType, price: t.currentPrice }))
    .sort((a, b) => b.price - a.price);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Data</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Market Insights</h1>
        <p className="text-muted-foreground mt-1">
          Data-driven analysis of millet market trends and patterns
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demand">Demand Trends</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Analysis</TabsTrigger>
          <TabsTrigger value="volatility">Market Volatility</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trends.length}</div>
                <p className="text-xs text-muted-foreground">
                  millet types tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Market Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {Math.round(
                    trends.reduce((sum, t) => sum + t.currentPrice, 0) /
                      trends.length,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">per kg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Predicted Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trends.reduce((sum, t) => sum + t.predictedDemandCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  orders forecasted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Volatility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    trends.reduce((sum, t) => sum + t.volatility, 0) /
                      trends.length,
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">price variation</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Smart insights for stakeholders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trends.slice(0, 5).map((trend) => (
                <div
                  key={trend.milletType}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{trend.milletType}</h4>
                      <Badge className={getTrendBadgeColor(trend.trend)}>
                        {trend.trend}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {trend.recommendation}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Current: ₹{trend.currentPrice}/kg | Demand:{" "}
                      {trend.demandCount} | Volatility:{" "}
                      {trend.volatility.toFixed(1)}%
                    </div>
                  </div>
                  <div className="ml-2 text-right">
                    {getTrendIcon(trend.trend)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demand Trends Tab */}
        <TabsContent value="demand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Predicted Demand by Millet Type (Next 30 Days)
              </CardTitle>
              <CardDescription>AI forecasted order frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demandChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="milletType"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="predictedDemandCount" fill="#3b82f6">
                    {demandChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? "#3b82f6" : "#8b5cf6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Predicted Demand Details</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="space-y-2">
                {trends
                  .sort(
                    (a, b) => b.predictedDemandCount - a.predictedDemandCount,
                  )
                  .map((trend) => (
                    <div
                      key={trend.milletType}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{trend.milletType}</div>
                        <div className="text-xs text-muted-foreground">
                          Current: {trend.currentDemandCount} → Predicted:{" "}
                          {trend.predictedDemandCount} (
                          {trend.growthRate > 0 ? "+" : ""}
                          {trend.growthRate}%)
                        </div>
                      </div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(trend.predictedDemandCount / Math.max(...trends.map((t) => t.predictedDemandCount))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Analysis Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Market Prices</CardTitle>
              <CardDescription>Price per kg by millet type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}/kg`} />
                  <Bar dataKey="price" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Highest Priced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trends
                    .sort((a, b) => b.currentPrice - a.currentPrice)
                    .slice(0, 3)
                    .map((trend) => (
                      <div key={trend.milletType}>
                        <p className="text-sm font-medium">
                          {trend.milletType}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{trend.currentPrice}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Lowest Priced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trends
                    .sort((a, b) => a.currentPrice - b.currentPrice)
                    .slice(0, 3)
                    .map((trend) => (
                      <div key={trend.milletType}>
                        <p className="text-sm font-medium">
                          {trend.milletType}
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          ₹{trend.currentPrice}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Price Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum</p>
                    <p className="text-lg font-bold">
                      ₹{Math.min(...trends.map((t) => t.currentPrice))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Maximum</p>
                    <p className="text-lg font-bold">
                      ₹{Math.max(...trends.map((t) => t.currentPrice))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Volatility Tab */}
        <TabsContent value="volatility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Volatility</CardTitle>
              <CardDescription>
                Higher volatility = more price fluctuations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volatilityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="milletType"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                  />
                  <Bar dataKey="volatility" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volatility Ranking</CardTitle>
              <CardDescription>
                Products ranked by price stability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trends
                .sort((a, b) => b.volatility - a.volatility)
                .map((trend, idx) => (
                  <div
                    key={trend.milletType}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      <div>
                        <p className="font-medium">{trend.milletType}</p>
                        <p className="text-xs text-muted-foreground">
                          {trend.volatility > 15
                            ? "High"
                            : trend.volatility > 8
                              ? "Medium"
                              : "Low"}{" "}
                          volatility
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">
                        {trend.volatility.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
