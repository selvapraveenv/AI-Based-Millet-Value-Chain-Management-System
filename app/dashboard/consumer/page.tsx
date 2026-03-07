"use client"

import { useState, useEffect } from "react"
import { Store, ShoppingBag, MapPin, Loader2, User, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRoleProtection } from "@/hooks/use-role-protection"

export default function ConsumerDashboard() {
  const [stats, setStats] = useState({ cropsAvailable: 0, yourOrders: 0, activeDeliveries: 0, totalSpent: 0 })
  const [featuredCrops, setFeaturedCrops] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const authUser = useAuthUser()
  const roleError = useRoleProtection("consumer")
  const displayName = authUser?.name?.trim() || "Consumer"

  useEffect(() => {
    async function fetchData() {
      try {
        const user = getLoggedInUser()
        if (!user) return

        // Fetch verified listings (marketplace)
        const cropsResponse = await fetch(buildBackendUrl("/api/listings/verified"))
        const cropsData = await cropsResponse.json()
        const listings = cropsData.listings || []

        // Fetch consumer's orders
        const ordersResponse = await fetch(buildBackendUrl(`/api/orders/buyer/${user.id}`))
        const ordersData = await ordersResponse.json()
        const orders = ordersData.orders || []

        const paymentsResponse = await fetch(buildBackendUrl(`/api/payments/consumer/${encodeURIComponent(user.id)}`))
        const paymentsPayload = await paymentsResponse.json()
        const paymentStats = paymentsResponse.ok && paymentsPayload?.success ? paymentsPayload.stats || { totalSpent: 0 } : { totalSpent: 0 }

        // Calculate stats
        const activeDeliveries = orders.filter((o: any) => ['confirmed', 'payment_completed', 'processing', 'shipped'].includes(String(o.status || '').toLowerCase())).length

        setStats({
          cropsAvailable: listings.length,
          yourOrders: orders.length,
          activeDeliveries,
          totalSpent: Number(paymentStats.totalSpent || 0),
        })
        setFeaturedCrops(listings.slice(0, 4))
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

  if (roleError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">{roleError}</p>
          <p className="text-sm text-muted-foreground">Please log in with the correct credentials to access this dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {displayName}</h1>
          <p className="text-muted-foreground">Browse SHG-verified millet crops directly from farmers</p>
        </div>
        <Link href="/dashboard/consumer/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Verified Crops Available</CardTitle><Store className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.cropsAvailable}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Your Orders</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.yourOrders}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle><MapPin className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.activeDeliveries}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">Rs {stats.totalSpent.toLocaleString()}</div></CardContent></Card>
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
