"use client"

import { useState, useEffect } from "react"
import { Loader2, MapPin, Package, CheckCircle, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdersForTracking } from "@/lib/firestore"

const DEMO_CONSUMER_ID = "consumer1"

const STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed by Farmer", icon: CheckCircle },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
]

function getStepIndex(status: string) {
  const idx = STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getOrdersForTracking(DEMO_CONSUMER_ID)
        setOrders(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Order Tracking</h1>
        <p className="text-muted-foreground">Track the status of your orders from farmers</p>
      </div>
      {activeOrders.length === 0 ? (
        <Card className="border-border"><CardContent className="py-8 text-center"><p className="text-muted-foreground">No active orders to track</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const currentStep = getStepIndex(order.status)
            return (
              <Card key={order.id} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle className="text-foreground">{order.productName}</CardTitle><CardDescription>From {order.sellerName} - {order.quantity} {order.unit}</CardDescription></div>
                    <Badge variant={order.status === "shipped" ? "default" : "secondary"}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {STEPS.map((step, i) => {
                      const StepIcon = step.icon
                      const isComplete = i <= currentStep
                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          <div className={"flex items-center justify-center w-10 h-10 rounded-full " + (isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><StepIcon className="h-5 w-5" /></div>
                          <p className={"text-xs mt-2 text-center " + (isComplete ? "text-primary font-medium" : "text-muted-foreground")}>{step.label}</p>
                          {i < STEPS.length - 1 && <div className={"h-0.5 w-full mt-2 " + (i < currentStep ? "bg-primary" : "bg-muted")} />}
                        </div>
                      )
                    })}
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
