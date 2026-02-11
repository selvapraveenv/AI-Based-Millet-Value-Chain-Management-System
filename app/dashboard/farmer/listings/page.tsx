"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, Package, CheckCircle, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getListingsByFarmer, createListing, deleteListing } from "@/lib/firestore"

const DEMO_FARMER_ID = "farmer1"
const milletTypes = ["Finger Millet (Ragi)", "Pearl Millet (Bajra)", "Foxtail Millet", "Barnyard Millet", "Little Millet", "Kodo Millet", "Proso Millet", "Sorghum (Jowar)"]

export default function FarmerListings() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newListing, setNewListing] = useState({ type: "", quantity: "", location: "", price: "", taluk: "" })

  useEffect(() => {
    async function fetchData() {
      try {
        const listingsData = await getListingsByFarmer(DEMO_FARMER_ID)
        setListings(listingsData)
      } catch (error) {
        console.error("Error fetching listings:", error)
        setListings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddListing = async () => {
    if (newListing.type && newListing.quantity && newListing.location && newListing.price && newListing.taluk) {
      try {
        const newId = await createListing({
          farmerId: DEMO_FARMER_ID, farmerName: "Ramesh Kumar", farmerPhone: "9876543001",
          milletType: newListing.type, quantity: Number(newListing.quantity), unit: "kg",
          location: newListing.location, taluk: newListing.taluk, pricePerKg: Number(newListing.price),
          status: "active", quality: "Grade A", harvestDate: new Date().toISOString().split('T')[0],
          verificationStatus: "pending", verifiedBy: "", verifiedByName: "",
          verifiedImage: "", verificationDate: null, verificationNotes: "",
        })
        const added = { id: newId, farmerId: DEMO_FARMER_ID, farmerName: "Ramesh Kumar", milletType: newListing.type,
          quantity: Number(newListing.quantity), unit: "kg", location: newListing.location, taluk: newListing.taluk,
          pricePerKg: Number(newListing.price), status: "active", quality: "Grade A",
          verificationStatus: "pending", verifiedBy: "", verifiedByName: "", verifiedImage: "", verificationNotes: "" }
        setListings([added, ...listings])
      } catch (error) {
        console.error("Error creating listing:", error)
      }
      setNewListing({ type: "", quantity: "", location: "", price: "", taluk: "" })
      setIsDialogOpen(false)
    }
  }

  const handleDeleteListing = async (id: string) => {
    try { await deleteListing(id) } catch (error) { console.log("Error deleting") }
    setListings(listings.filter(l => l.id !== id))
  }

  const getVerificationBadge = (status: string) => {
    if (status === "verified") return <Badge className="bg-primary/10 text-primary"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
    if (status === "rejected") return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
    return <Badge className="bg-accent text-accent-foreground"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Crop Listings</h1>
          <p className="text-muted-foreground">Manage your millet crop listings. SHGs will verify quality before consumers can buy.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add New Listing</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Crop Listing</DialogTitle>
              <DialogDescription>Enter crop details. SHG in your taluk will verify quality.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Millet Type</Label>
                <Select value={newListing.type} onValueChange={(v) => setNewListing({ ...newListing, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select millet type" /></SelectTrigger>
                  <SelectContent>{milletTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Quantity (kg)</Label><Input type="number" placeholder="Enter quantity" value={newListing.quantity} onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input placeholder="Your location" value={newListing.location} onChange={(e) => setNewListing({ ...newListing, location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Taluk</Label><Input placeholder="Your taluk" value={newListing.taluk} onChange={(e) => setNewListing({ ...newListing, taluk: e.target.value })} /></div>
              <div className="space-y-2"><Label>Price per kg (Rs)</Label><Input type="number" placeholder="Enter price" value={newListing.price} onChange={(e) => setNewListing({ ...newListing, price: e.target.value })} /></div>
              <Button onClick={handleAddListing} className="w-full">Add Listing</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {listings.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No listings yet</p>
            <p className="text-sm text-muted-foreground text-center mb-4">Add your first crop listing to start selling</p>
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
                    <CardDescription>{listing.location} ({listing.taluk})</CardDescription>
                  </div>
                  {getVerificationBadge(listing.verificationStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Quantity:</span><span className="text-foreground font-medium">{listing.quantity} {listing.unit || "kg"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Price:</span><span className="text-foreground font-medium">Rs {listing.pricePerKg}/kg</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Value:</span><span className="text-primary font-bold">Rs {listing.quantity * listing.pricePerKg}</span></div>
                  {listing.verificationStatus === "verified" && listing.verifiedByName && (
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verified by:</span><span className="text-foreground font-medium">{listing.verifiedByName}</span></div>
                  )}
                  {listing.verificationStatus === "rejected" && listing.verificationNotes && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">{listing.verificationNotes}</div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent"><Edit className="mr-2 h-3 w-3" />Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent" onClick={() => handleDeleteListing(listing.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
