"use client"

import { useState, useEffect } from "react"
import { Loader2, MapPin, Plus, X, Edit2, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { buildBackendUrl } from "@/lib/api"

type UserDoc = {
  id?: string
  role: string
  name: string
  district?: string
  assignedTaluks?: string[]
  status?: string
}

// Taluk list for assignments
const AVAILABLE_TALUKS = [
  "Avinashi",
  "Palladam",
  "Udumalaipettai",
  "Dharapuram",
  "Kangeyam",
  "Madathukulam",
  "Uthukuli",
  "Erode",
  "Perundurai",
  "Gobichettipalayam (Gobi)",
  "Sathyamangalam",
  "Bhavani",
  "Anthiyur",
  "Kodumudi",
  "Modakurichi",
  "Nambiyur",
  "Thalavadi",
]

export default function SHGTalukAssignmentPage() {
  const [shgs, setShgs] = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSHG, setEditingSHG] = useState<UserDoc | null>(null)
  const [selectedTaluk, setSelectedTaluk] = useState("")
  const [editTaluks, setEditTaluks] = useState<string[]>([])

  async function fetchSHGs() {
    try {
      const response = await fetch(buildBackendUrl("/api/users?role=shg"))
      const payload = await response.json()
      const users = response.ok && payload?.success ? payload.users || [] : []
      setShgs(users)
    } catch (error) {
      console.error("Error:", error)
      setShgs([])
    }
  }

  useEffect(() => {
    fetchSHGs().finally(() => setLoading(false))
  }, [])

  function addTaluk() {
    if (!selectedTaluk) return
    if (editTaluks.includes(selectedTaluk)) { toast.error("Taluk already assigned"); return }
    setEditTaluks([...editTaluks, selectedTaluk])
    setSelectedTaluk("")
  }

  function removeTaluk(taluk: string) {
    setEditTaluks(editTaluks.filter((t) => t !== taluk))
  }

  async function handleSave() {
    if (!editingSHG) return
    try {
      const response = await fetch(buildBackendUrl(`/api/users/${encodeURIComponent(editingSHG.id!)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTaluks: editTaluks }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update assignments")
      }

      toast.success("Taluk assignments updated")
      setEditingSHG(null)
      await fetchSHGs()
    } catch (error) {
      toast.error("Failed to update assignments")
    }
  }

  async function handleDelete(shgId: string, shgName: string) {
    try {
      const response = await fetch(buildBackendUrl(`/api/users/${encodeURIComponent(shgId)}`), {
        method: "DELETE",
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete SHG")
      }

      toast.success(`${shgName} deleted successfully`)
      setShgs(shgs.filter((s) => s.id !== shgId))
    } catch (error) {
      toast.error("Failed to delete SHG")
      console.error("Delete error:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SHG-Taluk Assignment</h1>
        <p className="text-muted-foreground">Assign SHGs to taluks for crop verification duties</p>
      </div>
      <Card className="border-border p-4 bg-muted/50">
        <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary mt-0.5" /><div><p className="font-medium text-foreground">How SHG-Taluk Assignment Works</p><p className="text-sm text-muted-foreground">Each SHG is assigned to one or more taluks. When a farmer uploads a crop listing from a taluk, only the SHGs assigned to that taluk can verify it. This ensures local quality checks by SHGs who know the area.</p></div></div>
      </Card>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">SHG Assignments ({shgs.length})</CardTitle><CardDescription>Manage which taluks each SHG is responsible for</CardDescription></CardHeader>
        <CardContent>
          {shgs.length === 0 ? <p className="text-center py-8 text-muted-foreground">No SHGs registered yet</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>SHG Name</TableHead><TableHead>District</TableHead><TableHead>Assigned Taluks</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {shgs.map((shg) => (
                  <TableRow key={shg.id}>
                    <TableCell className="font-medium text-foreground">{shg.name}</TableCell>
                    <TableCell className="text-muted-foreground">{shg.district || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {shg.assignedTaluks && shg.assignedTaluks.length > 0 ? shg.assignedTaluks.map((t) => <Badge key={t} variant="secondary">{t}</Badge>) : <span className="text-muted-foreground text-sm">No taluks assigned</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={shg.status === "active" ? "bg-green-500/90 hover:bg-green-500 text-white" : shg.status === "inactive" ? "bg-gray-500/90 hover:bg-gray-500 text-white" : "bg-blue-500/90 hover:bg-blue-500 text-white"}
                      >
                        {shg.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setEditingSHG(shg); setEditTaluks(shg.assignedTaluks || []); setSelectedTaluk("") }}>
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Assign Taluks to {shg.name}</DialogTitle><DialogDescription>Add or remove taluk assignments for this SHG</DialogDescription></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {editTaluks.length === 0 ? <p className="text-sm text-muted-foreground">No taluks assigned</p> : editTaluks.map((t) => (
                                <Badge key={t} variant="secondary" className="flex items-center gap-1">{t}<button onClick={() => removeTaluk(t)}><X className="h-3 w-3" /></button></Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Select value={selectedTaluk} onValueChange={setSelectedTaluk}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select a taluk" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AVAILABLE_TALUKS.map((taluk) => (
                                    <SelectItem key={taluk} value={taluk} disabled={editTaluks.includes(taluk)}>
                                      {taluk}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm" onClick={addTaluk} disabled={!selectedTaluk}><Plus className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <DialogFooter><Button onClick={handleSave}>Save Assignments</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete SHG</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{shg.name}</strong>? This will remove all their taluk assignments and they will no longer be able to verify crops. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(shg.id!, shg.name)} 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
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
