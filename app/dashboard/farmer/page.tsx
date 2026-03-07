"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, Clock, Truck, CreditCard, TrendingUp, Loader2, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRoleProtection } from "@/hooks/use-role-protection"

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ activeListings: 0, verifiedListings: 0, pendingVerification: 0, activeOrders: 0, totalEarnings: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const authUser = useAuthUser()
  const roleError = useRoleProtection("farmer")
  const displayName = authUser?.name?.trim() || "Farmer"

  useEffect(() => {
    async function fetchData() {
      try {
        const user = getLoggedInUser()
        if (!user) return

        // Fetch farmer's listings
        const listingsResponse = await fetch(buildBackendUrl(`/api/listings/farmer/${user.id}`))
        const listingsData = await listingsResponse.json()
        const listings = listingsData.listings || []

        // Fetch farmer's orders
        const ordersResponse = await fetch(buildBackendUrl(`/api/orders/seller/${user.id}`))
        const ordersData = await ordersResponse.json()
        const orders = ordersData.orders || []

        // Fetch farmer payment stats
        const paymentsResponse = await fetch(buildBackendUrl(`/api/payments/farmer/${encodeURIComponent(user.id)}`))
        const paymentsPayload = await paymentsResponse.json()
        const paymentStats = paymentsResponse.ok && paymentsPayload?.success
          ? paymentsPayload.stats || { totalEarnings: 0 }
          : { totalEarnings: 0 }

        // Calculate stats
        const activeListings = listings.filter((l: any) => l.status === 'active').length
        const verifiedListings = listings.filter((l: any) => l.verificationStatus === 'verified').length
        const pendingVerification = listings.filter((l: any) => l.verificationStatus === 'pending').length
        const activeOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length
        const totalEarnings = Number(paymentStats.totalEarnings || 0)

        setStats({
          activeListings,
          verifiedListings,
          pendingVerification,
          activeOrders,
          totalEarnings,
        })
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

  const statsDisplay = [
    { label: "Active Listings", value: String(stats.activeListings), icon: Package, change: "Total active crops" },
    { label: "Verified Crops", value: String(stats.verifiedListings), icon: CheckCircle, change: "SHG verified" },
    { label: "Pending Verification", value: String(stats.pendingVerification), icon: Clock, change: "Awaiting SHG review" },
    { label: "Active Orders", value: String(stats.activeOrders), icon: Truck, change: "From consumers" },
    { label: "Total Earnings", value: "Rs " + stats.totalEarnings.toLocaleString(), icon: CreditCard, change: "From sales" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {displayName}</h1>
          <p className="text-muted-foreground">Manage your millet crops and track consumer orders</p>
        </div>
        <Link href="/dashboard/farmer/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Button>
        </Link>
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
                        <span className={"inline-flex items-center px-2 py-1 rounded-full text-xs font-medium " + (order.status === "delivered" ? "bg-primary/10 text-primary" : order.status === "cancelled" ? "bg-destructive/10 text-destructive" : order.status === "payment_completed" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground")}>
                          {order.status === "payment_completed" ? "Payment Completed" : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
