"use client"

import { useState, useEffect } from "react"
import { Store, ShoppingBag, MapPin, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getConsumerDashboardStats, getVerifiedListings, getOrdersByBuyer } from "@/lib/firestore"

const DEMO_CONSUMER_ID = "consumer1"

export default function ConsumerDashboard() {
  const [stats, setStats] = useState({ cropsAvailable: 0, yourOrders: 0, activeDeliveries: 0 })
  const [featuredCrops, setFeaturedCrops] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, crops, orders] = await Promise.all([
          getConsumerDashboardStats(DEMO_CONSUMER_ID),
          getVerifiedListings(),
          getOrdersByBuyer(DEMO_CONSUMER_ID),
        ])
        setStats(statsData)
        setFeaturedCrops(crops.slice(0, 4))
        setRecentOrders(orders.slice(0, 5))
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome, Consumer</h1>
        <p className="text-muted-foreground">Browse SHG-verified millet crops directly from farmers</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Verified Crops Available</CardTitle><Store className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.cropsAvailable}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Your Orders</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.yourOrders}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle><MapPin className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.activeDeliveries}</div></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between"><div><CardTitle className="text-foreground">Verified Crops</CardTitle><CardDescription>Fresh crops verified by SHGs</CardDescription></div><Link href="/dashboard/consumer/products"><Button variant="outline" size="sm">View All</Button></Link></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featuredCrops.length === 0 ? <p className="text-muted-foreground text-center py-4">No verified crops available yet</p> : featuredCrops.map((crop) => (
                <div key={crop.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1"><p className="font-medium text-foreground">{crop.milletType}</p><p className="text-sm text-muted-foreground">by {crop.farmerName} - {crop.location}</p></div>
                  <div className="text-right"><p className="font-bold text-primary">Rs {crop.pricePerKg}/kg</p><p className="text-xs text-muted-foreground">{crop.quantity} kg available</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between"><div><CardTitle className="text-foreground">Recent Orders</CardTitle><CardDescription>Your latest purchases</CardDescription></div><Link href="/dashboard/consumer/orders"><Button variant="outline" size="sm">View All</Button></Link></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? <p className="text-muted-foreground text-center py-4">No orders yet</p> : recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div><p className="font-medium text-foreground">{order.productName}</p><p className="text-sm text-muted-foreground">from {order.sellerName} - {order.quantity} {order.unit}</p></div>
                  <span className={"text-xs px-2 py-1 rounded-full " + (order.status === "delivered" ? "bg-primary text-primary-foreground" : order.status === "shipped" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground")}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
