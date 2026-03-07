"use client"

import { useState, useEffect } from "react"
import { Search, CheckCircle, XCircle, MapPin, Loader2, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"

export default function SHGPendingVerifications() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [verifyNotes, setVerifyNotes] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const user = getLoggedInUser()
  const taluks = user?.assignedTaluks || []

  useEffect(() => {
    async function fetchData() {
      try {
        const taluksQuery = encodeURIComponent((taluks || []).join(","))
        const response = await fetch(buildBackendUrl(`/api/listings/pending?taluks=${taluksQuery}`))
        const payload = await response.json()
        const data = response.ok && payload?.success ? payload.listings || [] : []
        console.log("SHG pending verifications fetched:", data.length, "items")
        if (data.length > 0) {
          console.log("Sample pending listing:", data[0])
        }
        setListings(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleVerify = async (listing: any, status: "verified" | "rejected") => {
    if (!user) return
    try {
      const response = await fetch(buildBackendUrl(`/api/listings/${listing.id}/verify`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shgId: user.id,
          shgName: user.name,
          status,
          notes: verifyNotes,
          imageUrl: imageUrl || "/placeholder.jpg",
        }),
      })
      if (!response.ok) throw new Error("Verification failed")
      setListings(listings.filter(l => l.id !== listing.id))
      setVerifyNotes("")
      setImageUrl("")
    } catch (error) {
      console.error("Error verifying:", error)
    }
  }

  const filtered = listings.filter(l =>
    l.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.milletType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pending Verifications</h1>
        <p className="text-muted-foreground">Crops from farmers in your assigned taluks awaiting quality verification</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by farmer, millet, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>
      {filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No pending verifications</p>
            <p className="text-sm text-muted-foreground text-center">All crops in your taluks have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((listing) => (
            <Card key={listing.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{listing.milletType}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{listing.location} ({listing.taluk})</CardDescription>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Farmer</p><p className="font-medium text-foreground">{listing.farmerName}</p></div>
                    <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-foreground">{listing.farmerPhone}</p></div>
                    <div><p className="text-muted-foreground">Quantity</p><p className="font-medium text-foreground">{listing.quantity} {listing.unit || "kg"}</p></div>
                    <div><p className="text-muted-foreground">Price</p><p className="font-medium text-primary">Rs {listing.pricePerKg}/kg</p></div>
                    <div><p className="text-muted-foreground">Quality</p><p className="font-medium text-foreground">{listing.quality}</p></div>
                    <div><p className="text-muted-foreground">Harvest Date</p><p className="font-medium text-foreground">{listing.harvestDate}</p></div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild><Button className="w-full"><ClipboardCheck className="mr-2 h-4 w-4" />Review & Verify</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Verify Crop Quality</DialogTitle>
                        <DialogDescription>Review {listing.milletType} from {listing.farmerName}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><p className="text-muted-foreground">Millet Type</p><p className="font-medium">{listing.milletType}</p></div>
                          <div><p className="text-muted-foreground">Quantity</p><p className="font-medium">{listing.quantity} kg</p></div>
                        </div>
                        <div className="space-y-2"><Label>Verification Image URL</Label><Input placeholder="Enter image URL after physical inspection" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Verification Notes</Label><Textarea placeholder="Enter quality assessment notes..." value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} /></div>
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => handleVerify(listing, "verified")}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                          <Button variant="destructive" className="flex-1" onClick={() => handleVerify(listing, "rejected")}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
