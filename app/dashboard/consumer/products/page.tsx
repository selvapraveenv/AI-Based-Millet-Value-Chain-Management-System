"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getVerifiedListings, createOrder, updateListing } from "@/lib/firestore"
import { getLoggedInUser } from "@/lib/auth"

export default function BrowseCropsPage() {
  const [crops, setCrops] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [buyQuantity, setBuyQuantity] = useState("")
  const [selectedCrop, setSelectedCrop] = useState<any>(null)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    async function fetchCrops() {
      try {
        const data = await getVerifiedListings()
        setCrops(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCrops()
  }, [])

  const filteredCrops = crops.filter(
    (c) =>
      c.milletType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleBuy() {
    if (!selectedCrop || !buyQuantity) return
    const user = getLoggedInUser()
    if (!user) return
    const qty = parseFloat(buyQuantity)
    if (isNaN(qty) || qty <= 0 || qty > selectedCrop.quantity) {
      toast.error("Invalid quantity")
      return
    }
    setBuying(true)
    try {
      await createOrder({
        listingId: selectedCrop.id,
        buyerId: user.id,
        buyerName: user.name,
        buyerPhone: user.phone,
        sellerId: selectedCrop.farmerId,
        sellerName: selectedCrop.farmerName,
        sellerPhone: "",
        productName: selectedCrop.milletType,
        quantity: qty,
        unit: "kg",
        pricePerKg: selectedCrop.pricePerKg,
        totalPrice: qty * selectedCrop.pricePerKg,
        status: "placed",
        deliveryAddress: "Demo Address, Bangalore",
      })
      
      // Update the listing quantity after successful order
      const remainingQuantity = selectedCrop.quantity - qty
      await updateListing(selectedCrop.id, { quantity: remainingQuantity })
      
      toast.success("Order placed successfully!")
      setSelectedCrop(null)
      setBuyQuantity("")
      
      // Refresh listings - this will automatically filter out zero-quantity items
      const updated = await getVerifiedListings()
      setCrops(updated)
    } catch (error) {
      toast.error("Failed to place order")
    } finally {
      setBuying(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Browse Verified Crops</h1>
        <p className="text-muted-foreground">All crops are quality-verified by local SHGs before listing</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by crop, farmer, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>
      {filteredCrops.length === 0 ? (
        <Card className="border-border"><CardContent className="py-8 text-center"><p className="text-muted-foreground">No verified crops found</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCrops.map((crop) => (
            <Card key={crop.id} className="border-border flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-foreground">{crop.milletType}</CardTitle>
                  <Badge variant="default" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                </div>
                <p className="text-sm text-muted-foreground">by {crop.farmerName}</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span className="text-foreground">{crop.location}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taluk</span><span className="text-foreground">{crop.taluk || "N/A"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Available</span><span className="text-foreground">{crop.quantity} kg</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Price</span><span className="font-bold text-primary">Rs {crop.pricePerKg}/kg</span></div>
                {crop.verifiedByName && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verified by</span><span className="text-foreground">{crop.verifiedByName}</span></div>}
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild><Button className="w-full" onClick={() => { setSelectedCrop(crop); setBuyQuantity("") }}>Buy Now</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Purchase {crop.milletType}</DialogTitle>
                      <DialogDescription>From {crop.farmerName} - Rs {crop.pricePerKg}/kg ({crop.quantity} kg available)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Quantity (kg)</Label>
                        <Input type="number" min="1" max={crop.quantity} value={buyQuantity} onChange={(e) => setBuyQuantity(e.target.value)} placeholder="Enter quantity" />
                      </div>
                      {buyQuantity && !isNaN(parseFloat(buyQuantity)) && (
                        <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">Rs {(parseFloat(buyQuantity) * crop.pricePerKg).toFixed(2)}</span></p></div>
                      )}
                    </div>
                    <DialogFooter><Button onClick={handleBuy} disabled={buying}>{buying ? "Placing Order..." : "Confirm Purchase"}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
