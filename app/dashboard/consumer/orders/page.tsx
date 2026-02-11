"use client"

import { useState, useEffect } from "react"
import { Loader2, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getOrdersByBuyer } from "@/lib/firestore"

const DEMO_CONSUMER_ID = "consumer1"

export default function ConsumerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getOrdersByBuyer(DEMO_CONSUMER_ID)
        setOrders(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const statusColor = (s: string) => {
    if (s === "delivered") return "default"
    if (s === "shipped") return "secondary"
    if (s === "confirmed") return "outline"
    return "destructive"
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const delivered = orders.filter((o) => o.status === "delivered").length
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">Track your purchases from farmers</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{orders.length}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{active}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{delivered}</div></CardContent></Card>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">Order History</CardTitle><CardDescription>All purchases from farmers</CardDescription></CardHeader>
        <CardContent>
          {orders.length === 0 ? <p className="text-center py-8 text-muted-foreground">No orders yet. Browse verified crops to get started!</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Farmer</TableHead><TableHead>Quantity</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-foreground">{order.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{order.sellerName}</TableCell>
                    <TableCell className="text-muted-foreground">{order.quantity} {order.unit}</TableCell>
                    <TableCell className="text-foreground font-medium">Rs {order.totalPrice}</TableCell>
                    <TableCell><Badge variant={statusColor(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
