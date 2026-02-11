"use client"

import { useState, useEffect } from "react"
import { CreditCard, TrendingUp, ArrowDownRight, ArrowUpRight, Wallet, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFarmerPayments, getFarmerPaymentStats } from "@/lib/firestore"

const DEMO_FARMER_ID = "farmer1"

export default function FarmerPayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [paymentStats, setPaymentStats] = useState({ totalEarnings: 0, pendingPayments: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [paymentsData, statsData] = await Promise.all([
          getFarmerPayments(DEMO_FARMER_ID),
          getFarmerPaymentStats(DEMO_FARMER_ID),
        ])
        setPayments(paymentsData)
        setPaymentStats(statsData)
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const statsDisplay = [
    { label: "Total Earnings", value: "Rs " + paymentStats.totalEarnings.toLocaleString(), icon: Wallet, change: "All time earnings", positive: true },
    { label: "Pending Payments", value: "Rs " + paymentStats.pendingPayments.toLocaleString(), icon: CreditCard, change: "Awaiting settlement", positive: false },
    { label: "This Month", value: "Rs " + paymentStats.thisMonth.toLocaleString(), icon: TrendingUp, change: "Current month", positive: true },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment History</h1>
        <p className="text-muted-foreground">Track your earnings from consumer purchases</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {statsDisplay.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className={"text-xs flex items-center gap-1 mt-1 " + (stat.positive ? "text-primary" : "text-muted-foreground")}>
                {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">Transaction History</CardTitle><CardDescription>All payment transactions from consumers</CardDescription></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No payments yet</p>
              <p className="text-sm text-muted-foreground text-center">Payment transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">From Consumer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{payment.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.consumerName || "Consumer"}</td>
                      <td className="py-3 px-4 text-sm font-bold text-primary">Rs {(payment.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.method || "UPI"}</td>
                      <td className="py-3 px-4"><Badge className={payment.status === "completed" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}>{payment.status === "completed" ? "Completed" : "Pending"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
