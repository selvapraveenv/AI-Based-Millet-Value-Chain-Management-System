"use client"

import { useState, useEffect } from "react"
import { Users, ShieldCheck, AlertTriangle, ShoppingBag, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDashboardStats, getAllOrders, getAllDisputes } from "@/lib/firestore"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalFarmers: 0, totalSHGs: 0, totalConsumers: 0, verifiedListings: 0, pendingVerifications: 0, openDisputes: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentDisputes, setRecentDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, orders, disputes] = await Promise.all([
          getAdminDashboardStats(),
          getAllOrders(),
          getAllDisputes(),
        ])
        setStats(statsData)
        setRecentOrders(orders.slice(0, 5))
        setRecentDisputes(disputes.filter((d: any) => d.status === "open").slice(0, 5))
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
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage the MilletChain platform</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Farmers</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.totalFarmers}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">SHGs</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.totalSHGs}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Consumers</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.totalConsumers}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Verified Crops</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{stats.verifiedListings}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.pendingVerifications}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Disputes</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{stats.openDisputes}</div></CardContent></Card>
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
          <CardHeader><CardTitle className="text-foreground">Open Disputes</CardTitle><CardDescription>Issues requiring admin attention</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDisputes.length === 0 ? <p className="text-muted-foreground text-center py-4">No open disputes</p> : recentDisputes.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div><p className="font-medium text-foreground">{d.title}</p><p className="text-sm text-muted-foreground">Filed by {d.filedByName}</p></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">{d.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
