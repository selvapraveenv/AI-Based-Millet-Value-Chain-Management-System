"use client"

import { useState, useEffect } from "react"
import { Loader2, Package, AlertTriangle, Upload, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getOrdersByBuyer, createDispute, uploadDisputeProof, updateDispute } from "@/lib/firestore"
import { getLoggedInUser } from "@/lib/auth"

export default function ConsumerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [disputeOrder, setDisputeOrder] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeDescription, setDisputeDescription] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const user = getLoggedInUser()
        if (!user) return
        const data = await getOrdersByBuyer(user.id)
        setOrders(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const statusColor = (s: string) => {
    if (s === "delivered") return "default"
    if (s === "shipped") return "secondary"
    if (s === "confirmed") return "outline"
    return "destructive"
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file")
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Video must be under 30MB")
      return
    }
    setVideoFile(file)
  }

  async function handleSubmitDispute() {
    if (!disputeOrder || !disputeReason || !disputeDescription.trim()) {
      toast.error("Please fill all fields")
      return
    }
    if (!videoFile) {
      toast.error("Please upload a proof video (required)")
      return
    }
    const user = getLoggedInUser()
    if (!user) return
    setSubmitting(true)
    try {
      const disputeId = await createDispute({
        orderId: disputeOrder.id,
        consumerId: user.id,
        consumerName: user.name,
        farmerId: disputeOrder.sellerId,
        farmerName: disputeOrder.sellerName,
        productName: disputeOrder.productName,
        reason: disputeReason,
        description: disputeDescription.trim(),
        priority: "medium",
      })
      const videoUrl = await uploadDisputeProof(videoFile, disputeId)
      await updateDispute(disputeId, { proofVideoUrl: videoUrl })
      toast.success("Dispute filed successfully! Admin will review your proof.")
      setDisputeOrder(null)
      setDisputeReason("")
      setDisputeDescription("")
      setVideoFile(null)
    } catch (error) {
      console.error("Error filing dispute:", error)
      toast.error("Failed to file dispute")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const delivered = orders.filter((o) => o.status === "delivered").length
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">Track your purchases from farmers</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{orders.length}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{active}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{delivered}</div></CardContent></Card>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">Order History</CardTitle><CardDescription>All purchases from farmers</CardDescription></CardHeader>
        <CardContent>
          {orders.length === 0 ? <p className="text-center py-8 text-muted-foreground">No orders yet. Browse verified crops to get started!</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Farmer</TableHead><TableHead>Quantity</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-foreground">{order.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{order.sellerName}</TableCell>
                    <TableCell className="text-muted-foreground">{order.quantity} {order.unit}</TableCell>
                    <TableCell className="text-foreground font-medium">Rs {order.totalPrice}</TableCell>
                    <TableCell><Badge variant={statusColor(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge></TableCell>
                    <TableCell>
                      {order.status === "delivered" ? (
                        <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => { setDisputeOrder(order); setDisputeReason(""); setDisputeDescription(""); setVideoFile(null) }}>
                          <AlertTriangle className="mr-1 h-3 w-3" /> File Dispute
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!disputeOrder} onOpenChange={(open) => { if (!open) setDisputeOrder(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> File a Dispute</DialogTitle>
            <DialogDescription>Report an issue with your order — {disputeOrder?.productName} from {disputeOrder?.sellerName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Poor Quality / Not as described</SelectItem>
                  <SelectItem value="quantity">Wrong Quantity Received</SelectItem>
                  <SelectItem value="damaged">Damaged During Delivery</SelectItem>
                  <SelectItem value="wrong_item">Wrong Item Received</SelectItem>
                  <SelectItem value="not_received">Item Not Received</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the issue in detail..." value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Proof Video (Required, max 30MB)</Label>
              {videoFile ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground flex-1 truncate">{videoFile.name}</span>
                  <span className="text-xs text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <Button variant="ghost" size="sm" onClick={() => setVideoFile(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload a video showing the issue</p>
                  <Input type="file" accept="video/*" onChange={handleVideoSelect} className="max-w-xs mx-auto" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOrder(null)}>Cancel</Button>
            <Button onClick={handleSubmitDispute} disabled={submitting || !disputeReason || !disputeDescription.trim() || !videoFile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
