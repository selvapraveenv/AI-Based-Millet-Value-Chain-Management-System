"use client"

import { useState, useEffect } from "react"
import { Clock, Truck, CheckCircle, Loader2, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  placed: { label: "New Order", icon: Clock, color: "bg-slate-100 text-slate-700 border border-slate-300" },
  confirmed: { label: "Awaiting Payment", icon: Clock, color: "bg-yellow-100 text-yellow-700 border border-yellow-300" },
  payment_completed: { label: "Payment Received", icon: CheckCircle, color: "bg-cyan-100 text-cyan-700 border border-cyan-300" },
  processing: { label: "Processing", icon: Truck, color: "bg-blue-100 text-blue-700 border border-blue-300" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-700 border border-purple-300" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-700 border border-green-300" },
  cancelled: { label: "Cancelled", icon: Clock, color: "bg-red-100 text-red-700 border border-red-300" },
}

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const user = getLoggedInUser()
        if (!user) return
        const response = await fetch(buildBackendUrl(`/api/orders/seller/${encodeURIComponent(user.id)}`))
        const payload = await response.json()
        const ordersData = response.ok && payload?.success ? payload.orders || [] : []
        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const nextStatus: Record<string, { next: string; label: string }> = {
    placed: { next: "confirmed", label: "Confirm Order" },
    payment_completed: { next: "processing", label: "Start Processing" },
    processing: { next: "shipped", label: "Mark as Shipped" },
    shipped: { next: "delivered", label: "Mark as Delivered" },
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const user = getLoggedInUser()
      if (!user) throw new Error("No user")
      const response = await fetch(buildBackendUrl(`/api/orders/${orderId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          userId: user.id,
          userRole: user.role,
        }),
      })
      if (!response.ok) throw new Error("Failed to update")
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders from Consumers</h1>
        <p className="text-muted-foreground">Track orders placed by consumers for your crops</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-700" /></div><div><p className="text-2xl font-bold text-foreground">{orders.filter(o => ["placed","confirmed"].includes(o.status)).length}</p><p className="text-sm text-muted-foreground">New / Awaiting Payment</p></div></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center"><Truck className="h-6 w-6 text-blue-700" /></div><div><p className="text-2xl font-bold text-foreground">{orders.filter(o => ["payment_completed","processing","shipped"].includes(o.status)).length}</p><p className="text-sm text-muted-foreground">Paid / In Transit</p></div></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-white" /></div><div><p className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === "delivered").length}</p><p className="text-sm text-muted-foreground">Completed</p></div></CardContent></Card>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">All Orders</CardTitle><CardDescription>Complete history of consumer orders</CardDescription></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground">Consumer orders will appear here once your crops are verified and purchased</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Consumer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                </tr></thead>
                <tbody>
                  {orders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.placed
                    return (
                      <tr key={order.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{order.id?.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{order.buyerName}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{order.productName}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{order.quantity} {order.unit}</td>
                        <td className="py-3 px-4 text-sm font-medium text-primary">Rs {order.totalPrice}</td>
                        <td className="py-3 px-4"><Badge className={status.color}><status.icon className="mr-1 h-3 w-3" />{status.label}</Badge></td>
                        <td className="py-3 px-4">
                          {order.status === "confirmed" ? (
                            <span className="text-xs text-muted-foreground font-medium">Waiting for buyer payment</span>
                          ) : nextStatus[order.status] ? (
                            <Button size="sm" disabled={updatingId === order.id} onClick={() => handleUpdateStatus(order.id, nextStatus[order.status].next)}>
                              {updatingId === order.id ? "Updating..." : nextStatus[order.status].label}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
