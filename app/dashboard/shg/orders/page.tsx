"use client"

import { useState, useEffect } from "react"
import { CheckCircle, MapPin, Loader2, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getVerifiedByShg } from "@/lib/firestore"

const DEMO_SHG_ID = "shg1"

export default function SHGVerifiedCrops() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getVerifiedByShg(DEMO_SHG_ID)
        setListings(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{listing.milletType}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{listing.location}</CardDescription>
                  </div>
                  <Badge className={"bg-primary/10 text-primary"}><CheckCircle className="mr-1 h-3 w-3" />{listing.verificationStatus === "verified" ? "Verified" : "Rejected"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Farmer:</span><span className="text-foreground font-medium">{listing.farmerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Quantity:</span><span className="text-foreground font-medium">{listing.quantity} {listing.unit || "kg"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price:</span><span className="text-primary font-medium">Rs {listing.pricePerKg}/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="text-foreground font-medium">{listing.status}</span></div>
                  {listing.verificationNotes && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs text-foreground">{listing.verificationNotes}</div>
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
