"use client"

import { useState, useEffect } from "react"
import { Loader2, TrendingUp, DollarSign, Zap, Users, ShoppingCart, BarChart3, Target, AlertCircle, RefreshCw, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buildBackendUrl } from "@/lib/api"
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

interface MarketInsights {
  trendingCrops: any[]
  mostSoldCrops: any[]
  highestTrades: any[]
  priceAnalysis: any
  demandPatterns: any
  marketVolatility: any
  topFarmers: any[]
  regionalInsights: any[]
  seasonalTrends: any[]
  summary: any
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

export default function MarketInsightsPage() {
  const [data, setData] = useState<MarketInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchMarketInsights()
    
    if (autoRefresh) {
      const interval = setInterval(fetchMarketInsights, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function fetchMarketInsights() {
    try {
      setError(null)
      const response = await fetch(buildBackendUrl('/api/market-insights'))
      
      if (!response.ok) {
        throw new Error('Failed to fetch market insights')
      }
      
      const result = await response.json()
      setData(result.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching market insights:', err)
      setError(err instanceof Error ? err.message : 'Failed to load market insights')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchMarketInsights()
  }

  const downloadReport = () => {
    if (!data) return
    
    const report = JSON.stringify(data, null, 2)
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report))
    element.setAttribute('download', `market-insights-${new Date().toISOString().split('T')[0]}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const summary = data.summary

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Market Insights</h1>
          <p className="text-muted-foreground mt-1">
            Real-time market analysis and trading intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Now'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">Data auto-refreshes every 30 seconds</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={autoRefresh ? 'text-blue-600' : 'text-gray-600'}
        >
          {autoRefresh ? '✓ Auto-refresh ON' : 'Auto-refresh OFF'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{summary.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> {summary.activeOrders || 0} active orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.totalQuantitySold?.toLocaleString() || '0'} kg</div>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> {summary.completedOrders || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.uniqueFarmers || '0'}</div>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> {summary.uniqueConsumers || 0} consumers
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{summary.averageOrderValue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              Average per order
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trending">Trending Crops</TabsTrigger>
          <TabsTrigger value="top-sales">Top Sales</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="demand">Demand</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Trending Crops (Last 30 Days)</CardTitle>
                <CardDescription>Most in-demand varieties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.trendingCrops?.map((crop, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-opacity-50 bg-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{crop.name}</p>
                          <p className="text-xs text-muted-foreground">{crop.listingsCount} active listings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="mb-1">{crop.growthPercentage}% growth</Badge>
                        <p className="text-sm font-medium text-foreground">₹{crop.avgPrice}/kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Trending Distribution</CardTitle>
                <CardDescription>Market share by crop</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.trendingCrops?.map(c => ({ name: c.name, value: c.orderCount }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {data.trendingCrops?.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top-sales" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Most Sold Crops</CardTitle>
                <CardDescription>By total quantity and value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.mostSoldCrops?.slice(0, 6).map((crop) => (
                    <div key={crop.rank} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-medium text-foreground">
                          {crop.rank}. {crop.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {crop.orderCount} orders • {crop.consumers} consumers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{crop.totalQuantity} kg</p>
                        <p className="text-xs text-primary">₹{crop.totalValue?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Highest Trade Transactions</CardTitle>
                <CardDescription>Top 5 individual trades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.highestTrades?.slice(0, 5).map((trade, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={trade.status === 'delivered' ? 'default' : 'secondary'}>
                          {trade.status}
                        </Badge>
                        <span className="font-bold text-lg text-green-600">₹{trade.totalValue?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground">
                        <strong>{trade.cropType}</strong> • {trade.quantity}kg @ ₹{trade.pricePerKg}/kg
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Order ID: {trade.orderId?.slice(0, 8)}...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Price Summary</CardTitle>
                <CardDescription>Market pricing statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-muted-foreground mb-1">Average Price</p>
                    <p className="text-xl font-bold text-green-700">₹{data.priceAnalysis?.overallAvgPrice?.toFixed(2)}/kg</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-muted-foreground mb-1">Highest Price</p>
                    <p className="text-xl font-bold text-blue-700">₹{data.priceAnalysis?.highestPrice?.toFixed(2)}/kg</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-muted-foreground mb-1">Lowest Price</p>
                    <p className="text-xl font-bold text-orange-700">₹{data.priceAnalysis?.lowestPrice?.toFixed(2)}/kg</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-muted-foreground mb-1">Price Range</p>
                    <p className="text-xl font-bold text-purple-700">₹{data.priceAnalysis?.priceRange?.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Price by Crop</CardTitle>
                <CardDescription>Current market rates</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.priceAnalysis?.cropPriceTrends?.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="crop" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Bar dataKey="currentAvgPrice" fill="#22c55e" name="Avg Price" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Volatility Analysis</CardTitle>
              <CardDescription>Price stability by crop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.priceAnalysis?.cropPriceTrends?.map((crop, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{crop.crop}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{crop.minPrice.toFixed(2)} - ₹{crop.maxPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={crop.volatility > 15 ? 'destructive' : 'default'}>
                        {crop.volatility.toFixed(2)}% volatility
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Peak Hours</CardTitle>
                <CardDescription>When orders are highest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.demandPatterns?.peakHours?.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="font-medium text-foreground">{hour.period}</span>
                      <span className="text-sm font-bold text-blue-600">{hour.orders} orders</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Peak Days</CardTitle>
                <CardDescription>Weekly demand distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.demandPatterns?.peakDays || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Weekly Demand Trend</CardTitle>
              <CardDescription>Last 12 weeks of activity</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.demandPatterns?.weeklyTrend?.slice(-12) || []}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Top Performing Farmers
                </CardTitle>
                <CardDescription>By total revenue generated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topFarmers?.map((farmer) => (
                  <div key={farmer.farmerId} className="p-3 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-foreground">#{farmer.rank} {farmer.name}</p>
                        <p className="text-xs text-muted-foreground">{farmer.totalOrders} orders fulfiled</p>
                      </div>
                      <Badge>₹{farmer.totalRevenue?.toLocaleString()}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Qty Sold</p>
                        <p className="font-bold text-foreground">{farmer.totalQuantitySold} kg</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Crops</p>
                        <p className="font-bold text-foreground">{farmer.uniqueCrops}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Regional Analysis</CardTitle>
                <CardDescription>Trading activity by region</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.regionalInsights?.map((region, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-foreground">{region.region}</p>
                      <Badge variant="outline">{region.orders} orders</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Farmers</p>
                        <p className="font-bold text-foreground">{region.farmers}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Crops</p>
                        <p className="font-bold text-foreground">{region.crops}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Value</p>
                        <p className="font-bold text-green-600">₹{(region.totalTradeValue / 1000).toFixed(1)}k</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Seasonal Trends</CardTitle>
              <CardDescription>Monthly order patterns and revenue</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.seasonalTrends?.slice(-12) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Market Volatility Summary</CardTitle>
              <CardDescription>Most and least volatile products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Most Volatile
                  </h4>
                  <div className="space-y-2">
                    {data.marketVolatility?.volatileProducts?.slice(0, 3).map((product, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-foreground">{product.product}</p>
                        <p className="text-xs text-muted-foreground">
                          Volatility: <span className="font-bold text-red-600">{product.volatility.toFixed(2)}%</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    Most Stable
                  </h4>
                  <div className="space-y-2">
                    {data.marketVolatility?.stableProducts?.slice(0, 3).map((product, index) => (
                      <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-sm font-medium text-foreground">{product.product}</p>
                        <p className="text-xs text-muted-foreground">
                          Volatility: <span className="font-bold text-green-600">{product.volatility.toFixed(2)}%</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center py-4 border-t">
        Data updates automatically every 30 seconds. Last refresh: {lastUpdated?.toLocaleString()}
      </div>
    </div>
  )
}
