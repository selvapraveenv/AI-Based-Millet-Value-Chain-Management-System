"use client"

import { useState, useEffect } from "react"
import { CheckCircle, MapPin, Loader2, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

export default function SHGVerifiedCrops() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const user = useAuthUser()

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) return
        const response = await fetch(
          buildBackendUrl(`/api/verifications?shgId=${encodeURIComponent(user.id)}&status=verified`)
        )
        const payload = await response.json()

        if (response.ok && payload?.success) {
          const verifications = payload.verifications || []
          setListings(verifications)
          console.log("🔍 SHG verified crops fetched:", verifications.length, "items")
          console.log("📦 Full API Response:", JSON.stringify(payload, null, 2))
          
          if (verifications.length > 0) {
            verifications.forEach((v, index) => {
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
                taluk: v.taluk,
                location: v.location,
                status: v.status
              })
            })
          }
        }
      } catch (error) {
        console.error("Error fetching verified crops:", error)
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
        <h1 className="text-3xl font-bold text-foreground">Verified Crops</h1>
        <p className="text-muted-foreground">Crops you have verified and approved for consumer purchase</p>
      </div>
      {listings.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No verified crops yet</p>
            <p className="text-sm text-muted-foreground text-center">Crops you verify will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((verification) => {
            // Safely extract and validate all fields
            const milletType = String(verification?.milletType || "Unknown Millet").trim()
            const quantity = parseInt(verification?.quantity) || 0
            const unit = String(verification?.unit || "kg").trim()
            const pricePerKg = parseFloat(verification?.pricePerKg) || 0
            const priceUnit = String(verification?.priceUnit || "kg").trim()
            const harvestDate = String(verification?.harvestDate || "").trim() || "N/A"
            const shgName = String(verification?.shgName || "SHG").trim()
            const totalValue = quantity * pricePerKg
            
            // Debug logging
            console.log(`[Verified Crops] ID: ${verification.id}, Qty: ${quantity}, Price: ${pricePerKg}, Harvest: ${harvestDate}`)
            
            return (
              <Card key={verification.id} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base text-foreground line-clamp-1">{milletType}</CardTitle>
                      <CardDescription className="text-xs mt-1">Verified by {shgName}</CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border border-green-300 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Qty</p><p className="font-semibold text-foreground">{quantity > 0 ? `${quantity} ${unit}` : "—"}</p></div>
                    <div><p className="text-muted-foreground">Rate</p><p className="font-semibold text-primary">{pricePerKg > 0 ? `Rs ${pricePerKg}/${priceUnit}` : "—"}</p></div>
                    <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-foreground">{totalValue > 0 ? `Rs ${totalValue.toLocaleString()}` : "—"}</p></div>
                    <div><p className="text-muted-foreground">Harvest</p><p className="font-semibold text-foreground text-xs">{harvestDate}</p></div>
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
