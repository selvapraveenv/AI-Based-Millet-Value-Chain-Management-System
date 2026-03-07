"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

export default function SHGProducts() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const user = useAuthUser()

  useEffect(() => {
    async function fetchVerifiedCrops() {
      try {
        if (!user) return

        const response = await fetch(
          buildBackendUrl(`/api/verifications?shgId=${encodeURIComponent(user.id)}&status=verified`)
        )
        const payload = await response.json()
        
        if (response.ok && payload?.success) {
          setVerifications(payload.verifications || [])
          setVerifiedCount(payload.stats?.verified || 0)
        }
      } catch (error) {
        console.error("Error fetching verified crops:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVerifiedCrops()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading verified crops...</span>
      </div>
    )
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verified Crops</h1>
          <p className="text-muted-foreground">Crops you have approved for marketplace listing</p>
        </div>
        <Link href="/dashboard/shg/history">
          <Button variant="outline">View History & Rejected</Button>
        </Link>
      </div>

      {/* Count Card */}
      <Card className="border-border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Total Verified Crops</CardTitle>
              <CardDescription>All crops verified and approved by you</CardDescription>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">{verifiedCount}</div>
        </CardContent>
      </Card>

      {/* Crops Grid */}
      {verifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No verified crops yet</p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Crops you verify will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {verifications.map((verification) => (
            <Card key={verification.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{verification.milletType}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{verification.taluk}</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Farmer</p><p className="font-medium text-foreground">{verification.farmerName}</p></div>
                    <div><p className="text-muted-foreground">Quantity</p><p className="font-medium text-foreground">{verification.quantity} kg</p></div>
                    <div><p className="text-muted-foreground">Verified Date</p><p className="font-medium text-foreground">{formatDate(verification.verifiedAt)}</p></div>
                    <div><p className="text-muted-foreground">Status</p><p className="font-medium text-primary">✓ Approved</p></div>
                  </div>
                  {verification.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Notes:</p>
                      <p className="text-xs text-foreground">{verification.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

