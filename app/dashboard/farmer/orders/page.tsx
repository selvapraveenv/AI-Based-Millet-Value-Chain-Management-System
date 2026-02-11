"use client"

import { useState, useEffect } from "react"
import { Clock, Truck, CheckCircle, Loader2, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdersBySeller } from "@/lib/firestore"

const DEMO_FARMER_ID = "farmer1"

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  placed: { label: "New Order", icon: Clock, color: "bg-accent text-accent-foreground" },
  confirmed: { label: "Confirmed", icon: Clock, color: "bg-accent text-accent-foreground" },
  processing: { label: "Processing", icon: Truck, color: "bg-primary/10 text-primary" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-primary/10 text-primary" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-primary text-primary-foreground" },
  cancelled: { label: "Cancelled", icon: Clock, color: "bg-destructive text-destructive-foreground" },
}

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const ordersData = await getOrdersBySeller(DEMO_FARMER_ID)
        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching orders:", error)
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
        <h1 className="text-3xl font-bold text-foreground">Orders from Consumers</h1>
        <p className="text-muted-foreground">Track orders placed by consumers for your crops</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center"><Clock className="h-6 w-6 text-accent-foreground" /></div><div><p className="text-2xl font-bold text-foreground">{orders.filter(o => ["placed","confirmed"].includes(o.status)).length}</p><p className="text-sm text-muted-foreground">New Orders</p></div></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{orders.filter(o => ["processing","shipped"].includes(o.status)).length}</p><p className="text-sm text-muted-foreground">In Transit</p></div></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center"><CheckCircle className="h-6 w-6 text-primary-foreground" /></div><div><p className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === "delivered").length}</p><p className="text-sm text-muted-foreground">Completed</p></div></CardContent></Card>
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
