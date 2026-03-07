"use client"

import { useState, useEffect } from "react"
import { Users, ShieldCheck, AlertTriangle, ShoppingBag, Loader2, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRoleProtection } from "@/hooks/use-role-protection"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalFarmers: 0, totalSHGs: 0, totalConsumers: 0, verifiedListings: 0, pendingVerifications: 0, openSupportIssues: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentSupportIssues, setRecentSupportIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const authUser = useAuthUser()
  const roleError = useRoleProtection("admin")
  const displayName = authUser?.name?.trim() || "Admin"

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResponse, ordersResponse, supportResponse] = await Promise.all([
          fetch(buildBackendUrl("/api/admin/summary")),
          fetch(buildBackendUrl("/api/admin/orders?limit=5")),
          fetch(buildBackendUrl("/api/disputes/admin/system?status=open")),
        ])

        const statsPayload = await statsResponse.json()
        const ordersPayload = await ordersResponse.json()
        const supportPayload = await supportResponse.json()

        if (statsResponse.ok && statsPayload?.success) {
          setStats(statsPayload.stats)
        }

        setRecentOrders(ordersResponse.ok && ordersPayload?.success ? ordersPayload.orders || [] : [])
        setRecentSupportIssues(supportResponse.ok && supportPayload?.success ? supportPayload.disputes || [] : [])
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
          <p className="text-muted-foreground">Manage the MilletChain platform</p>
        </div>
        <Link href="/dashboard/admin/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Farmers</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.totalFarmers}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">SHGs</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.totalSHGs}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Consumers</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.totalConsumers}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Verified Crops</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{stats.verifiedListings}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.pendingVerifications}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Support Issues</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{stats.openSupportIssues}</div></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground">Recent Orders</CardTitle><CardDescription>Latest transactions on the platform</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? <p className="text-muted-foreground text-center py-4">No orders yet</p> : recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div><p className="font-medium text-foreground">{order.productName}</p><p className="text-sm text-muted-foreground">{order.buyerName} from {order.sellerName}</p></div>
                  <div className="text-right"><p className="font-bold text-foreground">Rs {order.totalPrice}</p><p className={"text-xs " + (order.status === "delivered" ? "text-primary" : "text-muted-foreground")}>{order.status}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-foreground">Open Support Issues</CardTitle>
                <CardDescription>System and platform queries raised by users</CardDescription>
              </div>
              <Link href="/dashboard/admin/support">
                <Button variant="outline" size="sm">Open</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSupportIssues.length === 0 ? <p className="text-muted-foreground text-center py-4">No open support issues</p> : recentSupportIssues.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div><p className="font-medium text-foreground">{d.title || d.reason || "Support Issue"}</p><p className="text-sm text-muted-foreground">Raised by {d.raisedByName || "Unknown"} ({d.raisedByRole || "user"})</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
