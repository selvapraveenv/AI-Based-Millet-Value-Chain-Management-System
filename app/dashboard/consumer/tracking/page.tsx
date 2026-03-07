"use client"

import { useState, useEffect } from "react"
import { Loader2, MapPin, Package, CheckCircle, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

const STEPS = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed by Farmer", icon: CheckCircle },
  { key: "payment_completed", label: "Payment Completed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
]

function normalizeOrderStatus(status: string) {
  const s = String(status || "").toLowerCase().trim()
  if (s === "pending") return "placed"
  return s
}

function getStepIndex(status: string) {
  const normalized = normalizeOrderStatus(status)
  const idx = STEPS.findIndex((s) => s.key === normalized)
  return idx >= 0 ? idx : 0
}

function getStatusBadgeColor(status: string): string {
  const normalized = normalizeOrderStatus(status)
  if (normalized === "delivered") return "bg-green-100 text-green-700 border-green-300"
  if (normalized === "cancelled") return "bg-red-100 text-red-700 border-red-300"
  if (normalized === "shipped") return "bg-purple-100 text-purple-700 border-purple-300"
  if (normalized === "processing") return "bg-blue-100 text-blue-700 border-blue-300"
  if (normalized === "payment_completed") return "bg-cyan-100 text-cyan-700 border-cyan-300"
  if (normalized === "confirmed") return "bg-yellow-100 text-yellow-700 border-yellow-300"
  if (normalized === "placed") return "bg-slate-100 text-slate-700 border-slate-300"
  return "bg-gray-100 text-gray-700 border-gray-300"
}

function getStatusLabel(status: string) {
  const normalized = normalizeOrderStatus(status)
  if (!normalized) return "Placed"
  if (normalized === "payment_completed") return "Payment Completed"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const user = useAuthUser()

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null

    async function fetchOrders(showRefresh = false) {
      try {
        if (!user) return
        if (showRefresh) {
          setRefreshing(true)
        }
        const response = await fetch(buildBackendUrl(`/api/orders/buyer/${encodeURIComponent(user.id)}`))
        const payload = await response.json()
        const data = response.ok && payload?.success ? payload.orders || [] : []
        setOrders(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
        if (showRefresh) {
          setRefreshing(false)
        }
      }
    }

    fetchOrders()

    if (user?.id) {
      pollTimer = setInterval(() => {
        fetchOrders(true)
      }, 10000)
    }

    return () => {
      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [user])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const activeOrders = orders.filter((o) => {
    const normalized = normalizeOrderStatus(o.status)
    return normalized !== "delivered" && normalized !== "cancelled"
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Order Tracking</h1>
        <p className="text-muted-foreground">Track each order through placed, confirmed, payment, processing, shipped, and delivered</p>
      </div>
      {activeOrders.length === 0 ? (
        <Card className="border-border"><CardContent className="py-8 text-center"><p className="text-muted-foreground">No active orders to track</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const normalizedStatus = normalizeOrderStatus(order.status)
            const currentStep = getStepIndex(normalizedStatus)
            return (
              <Card key={order.id} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle className="text-foreground">{order.productName}</CardTitle><CardDescription>From {order.sellerName} - {order.quantity} {order.unit}</CardDescription></div>
                    <Badge className={getStatusBadgeColor(normalizedStatus)}>{getStatusLabel(normalizedStatus)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                    {STEPS.map((step, i) => {
                      const StepIcon = step.icon
                      const isComplete = i <= currentStep
                      const isCurrent = i === currentStep
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2">
                          <div className={"flex items-center justify-center w-10 h-10 rounded-full border " + (isComplete ? "bg-green-500 text-white border-green-600" : "bg-muted text-muted-foreground border-border")}><StepIcon className="h-5 w-5" /></div>
                          <p className={"text-xs text-center " + (isCurrent ? "text-green-700 font-semibold" : isComplete ? "text-green-600" : "text-muted-foreground")}>{step.label}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    <span>{refreshing ? "Refreshing order status..." : "Auto-refreshes every 10 seconds"}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
