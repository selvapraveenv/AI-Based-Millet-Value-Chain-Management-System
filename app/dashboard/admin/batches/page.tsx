"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAllDisputes, updateDispute } from "@/lib/firestore"

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolution, setResolution] = useState("")
  const [selectedDispute, setSelectedDispute] = useState<any>(null)

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const data = await getAllDisputes()
        setDisputes(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDisputes()
  }, [])

  async function handleResolve() {
    if (!selectedDispute || !resolution.trim()) return
    try {
      await updateDispute(selectedDispute.id, { status: "resolved", resolution: resolution.trim() })
      toast.success("Dispute resolved")
      setSelectedDispute(null)
      setResolution("")
      const data = await getAllDisputes()
      setDisputes(data)
    } catch (error) {
      toast.error("Failed to resolve dispute")
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
          {disputes.length === 0 ? <p className="text-center py-8 text-muted-foreground">No disputes filed</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Filed By</TableHead><TableHead>Against</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-foreground">{d.title}</TableCell>
                    <TableCell className="text-muted-foreground">{d.filedByName}</TableCell>
                    <TableCell className="text-muted-foreground">{d.againstName}</TableCell>
                    <TableCell><Badge variant="outline">{d.type || "general"}</Badge></TableCell>
                    <TableCell><Badge variant={d.status === "open" ? "destructive" : "default"}>{d.status}</Badge></TableCell>
                    <TableCell>
                      {d.status === "open" ? (
                        <Dialog>
                          <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => { setSelectedDispute(d); setResolution("") }}>Resolve</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Resolve Dispute</DialogTitle><DialogDescription>{d.title} - filed by {d.filedByName}</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-3 bg-muted rounded-lg"><p className="text-sm font-medium text-foreground">Description</p><p className="text-sm text-muted-foreground mt-1">{d.description}</p></div>
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
    </div>
  )
}
