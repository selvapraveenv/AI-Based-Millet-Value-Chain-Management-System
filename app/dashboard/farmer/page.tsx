"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, Clock, Truck, CreditCard, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFarmerDashboardStats, getOrdersBySeller } from "@/lib/firestore"

const DEMO_FARMER_ID = "farmer1"

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ activeListings: 0, verifiedListings: 0, pendingVerification: 0, activeOrders: 0, totalEarnings: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardStats, orders] = await Promise.all([
          getFarmerDashboardStats(DEMO_FARMER_ID),
          getOrdersBySeller(DEMO_FARMER_ID),
        ])
        setStats(dashboardStats)
        setRecentOrders(orders.slice(0, 5))
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }

  const statsDisplay = [
    { label: "Active Listings", value: String(stats.activeListings), icon: Package, change: "Total active crops" },
    { label: "Verified Crops", value: String(stats.verifiedListings), icon: CheckCircle, change: "SHG verified" },
    { label: "Pending Verification", value: String(stats.pendingVerification), icon: Clock, change: "Awaiting SHG review" },
    { label: "Active Orders", value: String(stats.activeOrders), icon: Truck, change: "From consumers" },
    { label: "Total Earnings", value: "Rs " + stats.totalEarnings.toLocaleString(), icon: CreditCard, change: "From sales" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome, Farmer</h1>
        <p className="text-muted-foreground">Manage your millet crops and track consumer orders</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsDisplay.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Consumer Orders</CardTitle>
          <CardDescription>Latest orders from consumers for your crops</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Consumer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No consumer orders yet</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-sm text-foreground">{order.buyerName}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{order.productName}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{order.quantity} {order.unit}</td>
                      <td className="py-3 px-4 text-sm font-medium text-primary">Rs {order.totalPrice}</td>
                      <td className="py-3 px-4">
                        <span className={"inline-flex items-center px-2 py-1 rounded-full text-xs font-medium " + (order.status === "delivered" ? "bg-primary/10 text-primary" : order.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground")}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
