"use client"

import { useState, useEffect } from "react"
import { ClipboardCheck, CheckCircle, XCircle, Clock, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSHGDashboardStats } from "@/lib/firestore"

const DEMO_SHG_ID = "shg1"
const DEMO_TALUKS = ["Devanahalli", "Nelamangala"]

export default function SHGDashboard() {
  const [stats, setStats] = useState({ pendingCount: 0, verifiedCount: 0, rejectedCount: 0, totalReviewed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSHGDashboardStats(DEMO_SHG_ID, DEMO_TALUKS)
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Loading dashboard...</span></div>
  }

  const statsDisplay = [
    { label: "Pending Verifications", value: String(stats.pendingCount), icon: Clock, change: "Crops awaiting review" },
    { label: "Verified Crops", value: String(stats.verifiedCount), icon: CheckCircle, change: "Approved for sale" },
    { label: "Rejected Crops", value: String(stats.rejectedCount), icon: XCircle, change: "Did not pass quality" },
    { label: "Total Reviewed", value: String(stats.totalReviewed), icon: ClipboardCheck, change: "All time reviews" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome, SHG Verifier</h1>
        <p className="text-muted-foreground">Verify crop quality for farmers in your assigned taluks: {DEMO_TALUKS.join(", ")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-primary" />{stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Your Role</CardTitle>
          <CardDescription>Quality verification workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl mb-2">1</div>
              <p className="font-medium text-foreground">Physical Inspection</p>
              <p className="text-sm text-muted-foreground">Visit farmer location and inspect crop quality</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl mb-2">2</div>
              <p className="font-medium text-foreground">Upload Evidence</p>
              <p className="text-sm text-muted-foreground">Take photos and upload verification images</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl mb-2">3</div>
              <p className="font-medium text-foreground">Approve or Reject</p>
              <p className="text-sm text-muted-foreground">Verified crops become available for consumers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
