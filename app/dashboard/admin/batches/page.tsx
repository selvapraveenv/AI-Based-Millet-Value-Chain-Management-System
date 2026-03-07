"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertTriangle, CheckCircle, Play, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [resolution, setResolution] = useState("")
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [viewingDetails, setViewingDetails] = useState<any>(null)
  const [viewingVideo, setViewingVideo] = useState<any>(null)
  const authUser = useAuthUser()

  const getProofUrl = (dispute: any) => String(dispute?.proofVideoUrl || "").trim()
  const getProofType = (dispute: any) => String(dispute?.proofFileType || "").toLowerCase()
  const getProofName = (dispute: any) => String(dispute?.proofFileName || "").trim()
  const hasProof = (dispute: any) => Boolean(getProofUrl(dispute) || getProofName(dispute))

  function formatDate(value: any) {
    if (!value) return "—"
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString()
    }
    if (typeof value === "object" && typeof value?._seconds === "number") {
      return new Date(value._seconds * 1000).toLocaleString()
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
  }

  async function fetchDisputes() {
    try {
      setLoadError(null)
      const response = await fetch(buildBackendUrl("/api/admin/disputes"))
      const payload = await response.json()

      if (response.ok && payload?.success) {
        setDisputes(Array.isArray(payload.disputes) ? payload.disputes : [])
        return
      }

      throw new Error(payload?.message || payload?.error || "Failed to fetch disputes")
    } catch (error) {
      console.error("Error loading disputes:", error)
      try {
        const fallbackResponse = await fetch(buildBackendUrl("/api/admin/disputes?status=open"))
        const fallbackPayload = await fallbackResponse.json()
        if (fallbackResponse.ok && fallbackPayload?.success) {
          setDisputes(Array.isArray(fallbackPayload.disputes) ? fallbackPayload.disputes : [])
          setLoadError(null)
          return
        }
      } catch (fallbackError) {
        console.error("Fallback disputes fetch failed:", fallbackError)
      }
      setDisputes([])
      setLoadError("Unable to load disputes right now")
    }
  }

  useEffect(() => {
    fetchDisputes().finally(() => setLoading(false))
  }, [])

  async function handleResolve() {
    if (!selectedDispute || !resolution.trim()) return
    try {
      const response = await fetch(buildBackendUrl(`/api/admin/disputes/${encodeURIComponent(selectedDispute.id)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolution: resolution.trim(),
          updatedBy: authUser?.id || "",
          updatedByName: authUser?.name || "",
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || "Failed to resolve dispute")
      }

      toast.success("Dispute resolved")
      setSelectedDispute(null)
      setResolution("")
      await fetchDisputes()
    } catch (error: any) {
      toast.error(error?.message || "Failed to resolve dispute")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const openCount = disputes.filter((d) => d.status === "open").length
  const resolvedCount = disputes.filter((d) => d.status === "resolved").length

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-foreground">Disputes</h1><p className="text-muted-foreground">Manage and resolve platform disputes</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Disputes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{disputes.length}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{openCount}</div></CardContent></Card>
        <Card className="border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{resolvedCount}</div></CardContent></Card>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">All Disputes</CardTitle><CardDescription>Review and resolve disputes between users</CardDescription></CardHeader>
        <CardContent>
          {loadError ? <p className="text-center py-2 text-destructive text-sm">{loadError}</p> : null}
          {disputes.length === 0 ? <p className="text-center py-8 text-muted-foreground">No disputes filed</p> : (
            <Table>
              <TableHeader><TableRow><TableHead className="text-sm">Reason</TableHead><TableHead className="text-sm">Consumer</TableHead><TableHead className="text-sm">Farmer</TableHead><TableHead className="text-sm">Product</TableHead><TableHead className="text-sm">Proof</TableHead><TableHead className="text-sm">Status</TableHead><TableHead className="text-sm">Details</TableHead><TableHead className="text-sm">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm text-foreground max-w-[180px] truncate align-middle">{d.reason || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle">{d.consumerName || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle">{d.farmerName || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle">{d.productName || "N/A"}</TableCell>
                    <TableCell>
                      {getProofUrl(d) ? (
                        <Button variant="outline" size="sm" onClick={() => setViewingVideo(d)}>
                          <Play className="mr-1 h-3 w-3" /> View Attachment
                        </Button>
                      ) : getProofName(d) ? (
                        <span className="text-sm text-muted-foreground">Attachment uploaded</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No proof</span>
                      )}
                    </TableCell>
                    <TableCell className="align-middle"><Badge variant={d.status === "open" ? "destructive" : "default"}>{d.status}</Badge></TableCell>
                    <TableCell className="align-middle">
                      <Button variant="outline" size="icon" onClick={() => setViewingDetails(d)} aria-label="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      {d.status === "open" ? (
                        <Dialog>
                          <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => { setSelectedDispute(d); setResolution("") }}>Resolve</Button></DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Resolve Dispute</DialogTitle><DialogDescription>{d.reason} — filed by {d.consumerName} against {d.farmerName}</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium text-foreground">Description</p>
                                <p className="text-sm text-muted-foreground mt-1">{d.description || "No description provided"}</p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium text-foreground">Product: {d.productName}</p>
                                <p className="text-sm text-muted-foreground mt-1">Order ID: {d.orderId?.slice(0, 12) || "N/A"}</p>
                              </div>
                              {getProofUrl(d) && getProofType(d).startsWith("video/") && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-foreground">Proof Video</p>
                                  <video controls className="w-full rounded-lg max-h-[250px] bg-black" src={getProofUrl(d)}>
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              <div className="space-y-2"><Label>Resolution</Label><Textarea placeholder="Enter your resolution..." value={resolution} onChange={(e) => setResolution(e.target.value)} rows={4} /></div>
                            </div>
                            <DialogFooter><Button onClick={handleResolve} disabled={!resolution.trim()}>Mark as Resolved</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" /> Resolved</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingVideo} onOpenChange={(open) => { if (!open) setViewingVideo(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Proof Attachment</DialogTitle>
            <DialogDescription>{viewingVideo?.reason} — {viewingVideo?.consumerName} vs {viewingVideo?.farmerName}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {hasProof(viewingVideo) && getProofType(viewingVideo).startsWith("video/") && (
              <video controls autoPlay className="w-full rounded-lg max-h-[400px] bg-black" src={getProofUrl(viewingVideo)}>
                Your browser does not support the video tag.
              </video>
            )}
            {hasProof(viewingVideo) && getProofType(viewingVideo).startsWith("image/") && (
              <img src={getProofUrl(viewingVideo)} alt="Dispute proof" className="w-full rounded-lg max-h-[400px] object-contain bg-muted" />
            )}
            {hasProof(viewingVideo) && getProofType(viewingVideo) === "application/pdf" && (
              <iframe src={getProofUrl(viewingVideo)} className="w-full h-[500px] rounded-lg border" title="Dispute proof PDF" />
            )}
            {hasProof(viewingVideo) && !getProofType(viewingVideo).startsWith("video/") && !getProofType(viewingVideo).startsWith("image/") && getProofType(viewingVideo) !== "application/pdf" && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <a href={getProofUrl(viewingVideo)} target="_blank" rel="noreferrer" className="text-primary underline">
                  Open attachment
                </a>
              </div>
            )}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">Description</p>
              <p className="text-sm text-muted-foreground mt-1">{viewingVideo?.description || "No description"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingDetails} onOpenChange={(open) => { if (!open) setViewingDetails(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
            <DialogDescription>{viewingDetails?.reason || "Dispute"} — filed by {viewingDetails?.consumerName || "Unknown"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p className="text-muted-foreground">Product: <span className="text-foreground">{viewingDetails?.productName || "N/A"}</span></p>
              <p className="text-muted-foreground">Status: <span className="text-foreground">{viewingDetails?.status || "N/A"}</span></p>
              <p className="text-muted-foreground">Order ID: <span className="text-foreground">{viewingDetails?.orderId || "N/A"}</span></p>
              <p className="text-muted-foreground">Priority: <span className="text-foreground">{viewingDetails?.priority || "N/A"}</span></p>
              <p className="text-muted-foreground">Created: <span className="text-foreground">{formatDate(viewingDetails?.createdAt)}</span></p>
              <p className="text-muted-foreground">Resolved: <span className="text-foreground">{formatDate(viewingDetails?.resolvedAt)}</span></p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">Description</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{viewingDetails?.description || "No description provided"}</p>
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">Attachment</p>
              {getProofUrl(viewingDetails) ? (
                <a href={getProofUrl(viewingDetails)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open uploaded attachment</a>
              ) : getProofName(viewingDetails) ? (
                <p className="text-sm text-muted-foreground">{getProofName(viewingDetails)} (file recorded, URL unavailable)</p>
              ) : (
                <p className="text-sm text-muted-foreground">No attachment uploaded</p>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">Admin Reply</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{String(viewingDetails?.resolution || "").trim() || "No admin reply yet"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
