"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

export default function ConsumerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState({ totalSpent: 0, pendingTransactions: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)

  const user = useAuthUser()

  useEffect(() => {
    async function fetchPayments() {
      try {
        if (!user) return

        const response = await fetch(buildBackendUrl(`/api/payments/consumer/${encodeURIComponent(user.id)}`))
        const payload = await response.json()

        if (response.ok && payload?.success) {
          setPayments(payload.payments || [])
          setStats(payload.stats || { totalSpent: 0, pendingTransactions: 0, thisMonth: 0 })
        }
      } catch (error) {
        console.error("Error fetching consumer payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [user])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">History of payments made for your orders</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rs {stats.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rs {stats.thisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rs {stats.pendingTransactions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Payment History</CardTitle>
          <CardDescription>Complete payment log for your orders</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No payments yet</p>
              <p className="text-sm text-muted-foreground text-center">Payments will appear here after you complete order payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">To Farmer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{payment.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.productName || "Order"}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.farmerName || "Farmer"}</td>
                      <td className="py-3 px-4 text-sm font-bold text-primary">Rs {(payment.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.method || "UPI"}</td>
                      <td className="py-3 px-4"><Badge className={payment.status === "completed" ? "bg-green-100 text-green-700 border border-green-300" : "bg-yellow-100 text-yellow-700 border border-yellow-300"}>{payment.status === "completed" ? "Completed" : "Pending"}</Badge></td>
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
