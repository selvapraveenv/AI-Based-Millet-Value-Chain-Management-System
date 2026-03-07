"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2, FileText, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

export default function SHGVerificationHistory() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, verified: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  const user = useAuthUser()

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) return
        const response = await fetch(buildBackendUrl(`/api/verifications?shgId=${encodeURIComponent(user.id)}`))
        const payload = await response.json()
        
        if (response.ok && payload?.success) {
          const verifs = payload.verifications || []
          setVerifications(verifs)
          setStats(payload.stats || { total: 0, verified: 0, rejected: 0 })
          console.log("🔍 Verification history fetched:", verifs.length, "items")
          console.log("📦 Full API Response:", JSON.stringify(payload, null, 2))
          
          if (verifs.length > 0) {
            verifs.forEach((v, index) => {
              console.log(`\n📋 Verification ${index + 1}:`, {
                id: v.id,
                farmerName: v.farmerName,
                milletType: v.milletType,
                quantity: v.quantity,
                quantityType: typeof v.quantity,
                pricePerKg: v.pricePerKg,
                priceType: typeof v.pricePerKg,
                harvestDate: v.harvestDate,
                harvestDateType: typeof v.harvestDate,
                unit: v.unit,
                status: v.status
              })
            })
          }
        }
      } catch (error) {
        console.error("Error fetching verification history:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Verification History</h1>
        <p className="text-muted-foreground">Complete log of all your crop verifications</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{stats.verified}</p><p className="text-sm text-muted-foreground">Approved</p></div></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center"><XCircle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold text-foreground">{stats.rejected}</p><p className="text-sm text-muted-foreground">Rejected</p></div></CardContent></Card>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">All Verifications</CardTitle><CardDescription>Your complete verification activity</CardDescription></CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No verification history</p>
              <p className="text-sm text-muted-foreground">Your verification activity will be logged here</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {verifications.map((v) => {
                // Safely extract and validate all fields
                const isVerified = String(v?.status || "").toLowerCase() === "verified"
                const milletType = String(v?.milletType || "Unknown").trim()
                const quantity = parseInt(v?.quantity) || 0
                const unit = String(v?.unit || "kg").trim()
                const pricePerKg = parseFloat(v?.pricePerKg) || 0
                const priceUnit = String(v?.priceUnit || "kg").trim()
                const harvestDate = String(v?.harvestDate || "").trim() || "N/A"
                const farmerName = String(v?.farmerName || "Farmer").trim()
                const totalValue = quantity * pricePerKg
                const verifiedDate = v?.verifiedAt ? new Date(typeof v.verifiedAt === "string" ? v.verifiedAt : v.verifiedAt).toLocaleDateString() : "N/A"
                
                // Debug logging
                console.log(`[History] ID: ${v.id}, Status: ${v.status}, Qty: ${quantity}, Price: ${pricePerKg}`)
                
                return (
                  <Card key={v.id} className="border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base text-foreground line-clamp-1">{milletType}</CardTitle>
                          <CardDescription className="text-xs mt-1">From {farmerName}</CardDescription>
                        </div>
                        <Badge className={isVerified ? "bg-green-100 text-green-700 border border-green-300 text-xs" : "bg-red-100 text-red-700 border border-red-300 text-xs"}>
                          {isVerified ? <><CheckCircle className="mr-1 h-3 w-3" />Approved</> : <><XCircle className="mr-1 h-3 w-3" />Rejected</>}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><p className="text-muted-foreground">Qty</p><p className="font-semibold text-foreground">{quantity > 0 ? `${quantity} ${unit}` : "—"}</p></div>
                        <div><p className="text-muted-foreground">Rate</p><p className="font-semibold text-primary">{pricePerKg > 0 ? `Rs ${pricePerKg}/${priceUnit}` : "—"}</p></div>
                        <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-foreground">{totalValue > 0 ? `Rs ${totalValue.toLocaleString()}` : "—"}</p></div>
                        <div><p className="text-muted-foreground">Harvest Date</p><p className="font-semibold text-foreground text-xs">{harvestDate}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
