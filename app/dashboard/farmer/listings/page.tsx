"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Edit, Trash2, Loader2, Package, CheckCircle, Clock, XCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"

const milletTypes = ["Finger Millet (Ragi)", "Pearl Millet (Bajra)", "Foxtail Millet", "Barnyard Millet", "Little Millet", "Kodo Millet", "Proso Millet", "Sorghum (Jowar)"]
const taluks = ["Avinashi", "Palladam", "Udumalaipettai", "Dharapuram", "Kangeyam", "Madathukulam", "Uthukuli", "Erode", "Perundurai", "Gobi", "Sathyamangalam", "Bhavani", "Anthiyur", "Kodumudi", "Modakurichi", "Nambiyur", "Thalavadi"]

type AIPriceRecommendation = {
  recommendedPricePerKg: number
  suggestedPriceRange: {
    min: number
    max: number
  }
  demandLevel: "High" | "Medium" | "Low"
  expectedSaleTime: string
  reasoning: string
}

export default function FarmerListings() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<any>(null)
  const [editForm, setEditForm] = useState({ quantity: "", price: "" })
  const [editError, setEditError] = useState("")
  const [newListing, setNewListing] = useState({ type: "", quantity: "", location: "", price: "", taluk: "", harvestDate: "" })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiRecommendation, setAiRecommendation] = useState<AIPriceRecommendation | null>(null)

  const user = useMemo(() => getLoggedInUser(), [])

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) {
          setLoading(false)
          return
        }
        const response = await fetch(buildBackendUrl(`/api/listings/farmer/${user.id}`))
        const payload = await response.json()
        if (!response.ok) {
          console.error("Failed to fetch farmer listings:", payload)
        }
        const listingsData = response.ok && payload?.success ? payload.listings || [] : []
        console.log("Fetched farmer listings:", listingsData)
        setListings(listingsData)
      } catch (error) {
        console.error("Error fetching listings:", error)
        setListings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const updateNewListing = (patch: Partial<typeof newListing>) => {
    setNewListing((prev) => ({ ...prev, ...patch }))
    if (aiRecommendation) setAiRecommendation(null)
    if (aiError) setAiError("")
  }

  const handleGetAiPriceSuggestion = async () => {
    if (!newListing.type || !newListing.quantity || !newListing.location) {
      setAiError("Select millet type, quantity, and location to get AI pricing.")
      return
    }

    try {
      setAiLoading(true)
      setAiError("")

      const response = await fetch(buildBackendUrl("/api/ai/price-recommendation"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milletType: newListing.type,
          quantity: Number(newListing.quantity),
          location: newListing.location,
          taluk: newListing.taluk,
          quality: "Standard",
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || "Failed to fetch AI recommendation")
      }

      setAiRecommendation(payload)
    } catch (error: any) {
      setAiRecommendation(null)
      setAiError(error?.message || "Unable to get AI recommendation right now.")
    } finally {
      setAiLoading(false)
    }
  }

  const applyRecommendedPrice = () => {
    if (!aiRecommendation) return
    setNewListing((prev) => ({ ...prev, price: String(aiRecommendation.recommendedPricePerKg) }))
    setAiError("")
  }

  const handleAddListing = async () => {
    if (!user) {
      console.error("No user found")
      return
    }
    if (newListing.type && newListing.quantity && newListing.location && newListing.price && newListing.taluk) {
      try {
        console.log("Creating listing with user:", user)
        const listingData = {
          farmerId: user.id,
          farmerName: user.name,
          farmerPhone: user.phone || "",
          milletType: newListing.type,
          quantity: Number(newListing.quantity),
          unit: "kg",
          location: newListing.location,
          taluk: newListing.taluk,
          pricePerKg: Number(newListing.price),
          status: "active" as const,
          quality: "Grade A",
          harvestDate: newListing.harvestDate || new Date().toISOString().split('T')[0],
          verificationStatus: "pending" as const,
          verifiedBy: "",
          verifiedByName: "",
          verifiedImage: "",
          verificationDate: null,
          verificationNotes: "",
        }
        console.log("Listing data to create:", listingData)
        const response = await fetch(buildBackendUrl("/api/listings"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listingData),
        })

        if (!response.ok) {
          throw new Error("Failed to create listing")
        }

        const payload = await response.json()
        const added = payload?.listing || {
          id: payload?.id,
          ...listingData,
        }
        setListings([added, ...listings])
        setNewListing({ type: "", quantity: "", location: "", price: "", taluk: "", harvestDate: "" })
        setAiRecommendation(null)
        setAiError("")
        setIsDialogOpen(false)
      } catch (error) {
        console.error("Error creating listing:", error)
      }
    }
  }

  const handleDeleteListing = async (id: string) => {
    try {
      await fetch(buildBackendUrl(`/api/listings/${id}?farmerId=${encodeURIComponent(user?.id || "")}`), {
        method: "DELETE",
      })
    } catch (error) {
      console.log("Error deleting")
    }
    setListings(listings.filter(l => l.id !== id))
  }

  const openEditDialog = (listing: any) => {
    setEditingListing(listing)
    setEditForm({ quantity: String(listing.quantity), price: String(listing.pricePerKg) })
    setEditError("")
    setIsEditDialogOpen(true)
  }

  const handleEditListing = async () => {
    if (!editingListing) return
    const newQty = Number(editForm.quantity)
    const newPrice = Number(editForm.price)

    if (!newQty || newQty <= 0) { setEditError("Quantity must be greater than 0"); return }
    if (newQty > editingListing.quantity) { setEditError(`Quantity can only be reduced. Current: ${editingListing.quantity} kg`); return }
    if (!newPrice || newPrice <= 0) { setEditError("Price must be greater than 0"); return }

    try {
      const response = await fetch(buildBackendUrl(`/api/listings/${editingListing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: user?.id,
          quantity: newQty,
          pricePerKg: newPrice,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update listing")
      }

      setListings(listings.map(l => l.id === editingListing.id ? { ...l, quantity: newQty, pricePerKg: newPrice } : l))
      setIsEditDialogOpen(false)
      setEditingListing(null)
      setEditError("")
    } catch (error) {
      console.error("Error updating listing:", error)
      setEditError("Failed to update listing. Please try again.")
    }
  }

  const getVerificationBadge = (status: string) => {
    if (status === "verified") return <Badge className="bg-green-100 text-green-700 border border-green-300"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
    if (status === "rejected") return <Badge className="bg-red-100 text-red-700 border border-red-300"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
    return <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A"
    try {
      // Handle Firestore timestamps with toDate method
      if (typeof dateString === "object" && dateString?.toDate) {
        return dateString.toDate().toLocaleDateString()
      }
      // Handle ISO strings and date objects
      const date = typeof dateString === "string" ? new Date(dateString) : dateString
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleDateString()
    } catch {
      return "N/A"
    }
  }

  const formatCreatedDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      // Handle Firestore timestamps with toDate method
      if (timestamp?.toDate && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString()
      }
      // Handle ISO strings and direct date objects
      const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp)
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleDateString()
    } catch {
      return "N/A"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Crop Listings</h1>
          <p className="text-muted-foreground">Manage your millet crop listings. SHGs will verify quality before consumers can buy.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add New Listing</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Crop Listing</DialogTitle>
              <DialogDescription>Enter crop details. SHG in your taluk will verify quality.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-2">
                <Label>Millet Type</Label>
                <Select value={newListing.type} onValueChange={(v) => updateNewListing({ type: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select millet type" /></SelectTrigger>
                  <SelectContent>{milletTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Quantity (kg)</Label><Input className="h-9" type="number" placeholder="Enter quantity" value={newListing.quantity} onChange={(e) => updateNewListing({ quantity: e.target.value })} /></div>
                <div className="space-y-2"><Label>Price per kg (Rs)</Label><Input className="h-9" type="number" placeholder="Enter price" value={newListing.price} onChange={(e) => updateNewListing({ price: e.target.value })} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Location</Label><Input className="h-9" placeholder="Your location" value={newListing.location} onChange={(e) => updateNewListing({ location: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Taluk</Label>
                  <Select value={newListing.taluk} onValueChange={(v) => updateNewListing({ taluk: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select taluk" /></SelectTrigger>
                    <SelectContent>{taluks.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Harvest Date</Label><Input className="h-9" type="date" value={newListing.harvestDate} onChange={(e) => updateNewListing({ harvestDate: e.target.value })} max={new Date().toISOString().split('T')[0]} /></div>

              <Button
                variant="outline"
                onClick={handleGetAiPriceSuggestion}
                disabled={aiLoading || !newListing.type || !newListing.quantity || !newListing.location}
                className="w-full"
              >
                {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Get AI Price Suggestion
              </Button>

              {aiError && <p className="text-sm text-destructive">{aiError}</p>}

              {aiRecommendation && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">AI Recommendation</p>
                      <Badge className={aiRecommendation.demandLevel === "High" ? "bg-green-100 text-green-700 border border-green-300" : aiRecommendation.demandLevel === "Low" ? "bg-red-100 text-red-700 border border-red-300" : "bg-yellow-100 text-yellow-700 border border-yellow-300"}>
                        Demand: {aiRecommendation.demandLevel}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Recommended</p>
                        <p className="font-semibold text-primary">Rs {aiRecommendation.recommendedPricePerKg}/kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Suggested range</p>
                        <p className="font-semibold text-foreground">Rs {aiRecommendation.suggestedPriceRange.min} - {aiRecommendation.suggestedPriceRange.max}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Expected sale time: {aiRecommendation.expectedSaleTime}</p>
                    <p className="text-sm text-foreground">{aiRecommendation.reasoning}</p>
                    <Button type="button" onClick={applyRecommendedPrice} className="w-full">
                      Use Recommended Price
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleAddListing} className="w-full">Add Listing</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>
              {editingListing?.milletType} — You can reduce quantity and adjust price.
            </DialogDescription>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quantity (kg)</Label>
                <Input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  max={editingListing.quantity}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Current: {editingListing.quantity} kg — can only be reduced (e.g. after partial sale)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Price per kg (Rs)</Label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Current: Rs {editingListing.pricePerKg}/kg — can be increased or decreased
                </p>
              </div>
              {editError && (
                <div className="p-2 bg-destructive/10 text-destructive text-sm rounded">{editError}</div>
              )}
              <Button onClick={handleEditListing} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {listings.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No listings yet</p>
            <p className="text-sm text-muted-foreground text-center mb-4">Add your first crop listing to start selling</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="border-border">
              <CardHeader className="px-3 pt-3 pb-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base text-foreground line-clamp-1">{listing.milletType}</CardTitle>
                    <CardDescription className="text-sm mt-1">Posted {formatCreatedDate(listing.createdAt)}</CardDescription>
                  </div>
                  {getVerificationBadge(listing.verificationStatus)}
                </div>
              </CardHeader>
              <CardContent className="px-3 pt-1 pb-2 space-y-2">
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                  <div><p className="text-muted-foreground">Qty</p><p className="font-semibold text-foreground">{listing.quantity} {listing.unit || "kg"}</p></div>
                  <div><p className="text-muted-foreground">Rate</p><p className="font-semibold text-primary">{listing.pricePerKg}/kg</p></div>
                  <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-foreground">{Number(listing.quantity || 0) > 0 && Number(listing.pricePerKg || 0) > 0 ? `Rs ${(Number(listing.quantity) * Number(listing.pricePerKg)).toLocaleString()}` : "—"}</p></div>
                  <div><p className="text-muted-foreground">Harvest</p><p className="font-semibold text-foreground">{formatDate(listing.harvestDate)}</p></div>
                  <div><p className="text-muted-foreground">Taluk</p><p className="font-semibold text-foreground">{listing.taluk}</p></div>
                  <div><p className="text-muted-foreground">Verified By</p><p className="font-semibold text-foreground">{listing.verifiedByName || "—"}</p></div>
                </div>
                {listing.verificationNotes && (
                  <div className="p-2 rounded border border-border bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground font-medium">SHG Comments</p>
                        <p className="text-sm text-foreground truncate">{listing.verificationNotes}</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2 shrink-0">View</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>SHG Comments</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-72 overflow-y-auto rounded border border-border bg-muted/20 p-3">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{listing.verificationNotes}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="flex gap-1.5 px-3 pb-2 border-t border-border pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(listing)}>Edit</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this listing for {listing.milletType}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteListing(listing.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
