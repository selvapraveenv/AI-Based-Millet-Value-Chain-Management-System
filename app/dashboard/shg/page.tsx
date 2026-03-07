"use client"

import { useState, useEffect } from "react"
import { ClipboardCheck, CheckCircle, XCircle, Clock, TrendingUp, Loader2, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRoleProtection } from "@/hooks/use-role-protection"

export default function SHGDashboard() {
  const [stats, setStats] = useState({ pendingCount: 0, verifiedCount: 0, rejectedCount: 0, totalReviewed: 0 })
  const [loading, setLoading] = useState(true)

  const user = getLoggedInUser()
  const authUser = useAuthUser()
  const roleError = useRoleProtection("shg")
  const displayName = authUser?.name?.trim() || "SHG Verifier"
  const taluks = user?.assignedTaluks || []

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) return
        const queryTaluks = encodeURIComponent((taluks || []).join(","))
        const response = await fetch(buildBackendUrl(`/api/listings/shg-stats?shgId=${encodeURIComponent(user.id)}&taluks=${queryTaluks}`))
        const payload = await response.json()
        if (response.ok && payload?.success) {
          setStats(payload.stats)
        }
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

  const statsDisplay = [
    { label: "Pending Verifications", value: String(stats.pendingCount), icon: Clock, change: "Crops awaiting review" },
    { label: "Verified Crops", value: String(stats.verifiedCount), icon: CheckCircle, change: "Approved for sale" },
    { label: "Rejected Crops", value: String(stats.rejectedCount), icon: XCircle, change: "Did not pass quality" },
    { label: "Total Reviewed", value: String(stats.totalReviewed), icon: ClipboardCheck, change: "All time reviews" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {displayName}</h1>
          <p className="text-muted-foreground">Verify crop quality for farmers in your assigned taluks: {taluks.join(", ") || "None assigned"}</p>
        </div>
        <Link href="/dashboard/shg/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Button>
        </Link>
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
