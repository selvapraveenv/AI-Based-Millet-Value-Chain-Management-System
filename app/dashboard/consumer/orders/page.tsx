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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

function normalizeOrderStatus(status: string) {
  const s = String(status || "").toLowerCase().trim()
  if (s === "pending") return "placed"
  return s
}

function formatOrderStatus(status: string) {
  const normalized = normalizeOrderStatus(status)
  if (!normalized) return "Placed"
  if (normalized === "payment_completed") return "Payment Completed"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export default function ConsumerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [disputeOrder, setDisputeOrder] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeDescription, setDisputeDescription] = useState("")
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const user = useAuthUser()

  useEffect(() => {
    async function fetchOrders() {
      try {
        if (!user) return
        const response = await fetch(buildBackendUrl(`/api/orders/buyer/${encodeURIComponent(user.id)}`))
        const payload = await response.json()
        const data = response.ok && payload?.success ? payload.orders || [] : []
        setOrders(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  const statusColor = (s: string) => {
    const normalized = normalizeOrderStatus(s)
    if (normalized === "delivered") return "bg-green-100 text-green-700 border-green-300"
    if (normalized === "cancelled") return "bg-red-100 text-red-700 border-red-300"
    if (normalized === "payment_completed") return "bg-cyan-100 text-cyan-700 border-cyan-300"
    if (normalized === "shipped") return "bg-purple-100 text-purple-700 border-purple-300"
    if (normalized === "processing") return "bg-blue-100 text-blue-700 border-blue-300"
    if (normalized === "confirmed") return "bg-yellow-100 text-yellow-700 border-yellow-300"
    if (normalized === "placed") return "bg-slate-100 text-slate-700 border-slate-300"
    return "bg-gray-100 text-gray-700 border-gray-300"
  }

  async function handlePayNow(order: any) {
    if (!user) return

    setPayingOrderId(order.id)
    try {
      const response = await fetch(buildBackendUrl(`/api/orders/${encodeURIComponent(order.id)}/pay`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userRole: user.role,
          method: "UPI",
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to complete payment")
      }

      setOrders((prev) =>
        prev.map((existing) =>
          existing.id === order.id
            ? { ...existing, status: "payment_completed", paymentCompletedAt: new Date().toISOString() }
            : existing,
        ),
      )
      toast.success("Payment completed. Order will now move to processing.")
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error?.message || "Failed to complete payment")
    } finally {
      setPayingOrderId(null)
    }
  }

  function handleAttachmentSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isAllowedType =
      file.type.startsWith("video/") ||
      file.type.startsWith("image/") ||
      file.type === "application/pdf"

    if (!isAllowedType) {
      toast.error("Please select a valid attachment (video, image, or PDF)")
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Attachment must be under 30MB")
      return
    }
    setAttachmentFile(file)
  }

  async function handleSubmitDispute() {
    console.log("🔔 handleSubmitDispute called", {
      hasDisputeOrder: !!disputeOrder,
      hasReason: !!disputeReason,
      hasDescription: !!disputeDescription.trim(),
      hasAttachment: !!attachmentFile,
      hasUser: !!user
    })
    
    if (!disputeOrder || !disputeReason || !disputeDescription.trim()) {
      console.error("❌ Validation failed: missing fields")
      toast.error("Please fill all fields")
      return
    }
    if (!attachmentFile) {
      console.warn("⚠️ Submitting dispute without attachment")
    }
    if (!user) {
      console.error("❌ Validation failed: no user")
      return
    }
    
    console.log("✅ Starting dispute submission...", {
      orderId: disputeOrder.id,
      reason: disputeReason,
      attachmentName: attachmentFile?.name || null,
      attachmentSize: attachmentFile?.size || 0
    })
    
    setSubmitting(true)
    try {
      // Use FormData to send file with JSON data
      const formData = new FormData()
      formData.append("orderId", disputeOrder.id)
      formData.append("consumerId", user.id)
      formData.append("consumerName", user.name)
      formData.append("farmerId", disputeOrder.sellerId)
      formData.append("farmerName", disputeOrder.sellerName)
      formData.append("productName", disputeOrder.productName)
      formData.append("reason", disputeReason)
      formData.append("description", disputeDescription.trim())
      formData.append("priority", "medium")
      if (attachmentFile) {
        formData.append("proofVideo", attachmentFile)
        formData.append("proofFileName", attachmentFile.name)
        formData.append("proofFileType", attachmentFile.type)
        formData.append("proofFileSize", attachmentFile.size.toString())
      }

      console.log("📤 Sending dispute request to backend...")
      const url = buildBackendUrl("/api/disputes/create")
      console.log("URL:", url)
      
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      console.log("📥 Response received:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      const payload = await response.json()
      console.log("📦 Response payload:", payload)
      
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || "Failed to file dispute")
      }

      console.log("✅ Dispute filed successfully!", payload)
      toast.success("Dispute filed successfully! Admin will review your proof.")
      setDisputeOrder(null)
      setDisputeReason("")
      setDisputeDescription("")
      setAttachmentFile(null)
    } catch (error: any) {
      console.error("❌ Error filing dispute:", error)
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack
      })
      toast.error(error?.message || "Failed to file dispute")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const delivered = orders.filter((o) => normalizeOrderStatus(o.status) === "delivered").length
  const active = orders.filter((o) => {
    const normalized = normalizeOrderStatus(o.status)
    return normalized !== "delivered" && normalized !== "cancelled"
  }).length

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
                    <TableCell><Badge className={statusColor(order.status)}>{formatOrderStatus(order.status)}</Badge></TableCell>
                    <TableCell>
                      {normalizeOrderStatus(order.status) === "confirmed" ? (
                        <Button size="sm" disabled={payingOrderId === order.id} onClick={() => handlePayNow(order)}>
                          {payingOrderId === order.id ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Paying...</> : "Pay Now"}
                        </Button>
                      ) : normalizeOrderStatus(order.status) === "delivered" ? (
                        <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => { setDisputeOrder(order); setDisputeReason(""); setDisputeDescription(""); setAttachmentFile(null) }}>
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
              <Label>Attachment (Optional, max 30MB)</Label>
              {attachmentFile ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground flex-1 truncate">{attachmentFile.name}</span>
                  <span className="text-xs text-muted-foreground">{(attachmentFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <Button variant="ghost" size="sm" onClick={() => setAttachmentFile(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload proof (video, image, or PDF)</p>
                  <Input type="file" accept="video/*,image/*,application/pdf" onChange={handleAttachmentSelect} className="max-w-xs mx-auto" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOrder(null)}>Cancel</Button>
            <Button onClick={handleSubmitDispute} disabled={submitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
