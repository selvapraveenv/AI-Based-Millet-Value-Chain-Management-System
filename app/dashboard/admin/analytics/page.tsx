"use client"

import { useState, useEffect } from "react"
import { Loader2, TrendingUp, Users, ShieldCheck, ShoppingBag, IndianRupee } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAnalyticsData } from "@/lib/firestore"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const d = await getAnalyticsData()
        setData(d)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !data) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-foreground">Analytics</h1><p className="text-muted-foreground">Platform performance and insights</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle><IndianRupee className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">Rs {data.totalRevenue.toLocaleString()}</div><p className="text-xs text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{data.revenueGrowth}%</p></CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{data.activeUsers}</div><p className="text-xs text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{data.userGrowth}%</p></CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Verified Crops</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{data.verifiedCrops}</div><p className="text-xs text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{data.cropGrowth}%</p></CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{data.totalOrders}</div><p className="text-xs text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{data.orderGrowth}%</p></CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Platform Growth</CardTitle><CardDescription>Farmers and orders over time</CardDescription></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="farmers" stroke="#22c55e" name="Farmers" /><Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Revenue Trend</CardTitle><CardDescription>Monthly revenue in Rs</CardDescription></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#22c55e" name="Revenue (Rs)" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Millet Distribution</CardTitle><CardDescription>Breakdown by millet type (%)</CardDescription></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.milletDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{data.milletDistribution.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Farmers by Region</CardTitle><CardDescription>Distribution across districts</CardDescription></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.regionData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="region" type="category" width={120} /><Tooltip /><Bar dataKey="farmers" fill="#3b82f6" name="Farmers" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
