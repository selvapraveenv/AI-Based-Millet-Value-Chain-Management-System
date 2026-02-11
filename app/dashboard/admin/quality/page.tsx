"use client"

import { useState, useEffect } from "react"
import { Loader2, MapPin, Plus, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAllUsers, updateUser, type UserDoc } from "@/lib/firestore"

export default function SHGTalukAssignmentPage() {
  const [shgs, setShgs] = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSHG, setEditingSHG] = useState<UserDoc | null>(null)
  const [newTaluk, setNewTaluk] = useState("")
  const [editTaluks, setEditTaluks] = useState<string[]>([])

  useEffect(() => {
    async function fetchSHGs() {
      try {
        const allUsers = await getAllUsers()
        setShgs(allUsers.filter((u) => u.role === "shg"))
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSHGs()
  }, [])

  function addTaluk() {
    const t = newTaluk.trim()
    if (!t) return
    if (editTaluks.includes(t)) { toast.error("Taluk already assigned"); return }
    setEditTaluks([...editTaluks, t])
    setNewTaluk("")
  }

  function removeTaluk(taluk: string) {
    setEditTaluks(editTaluks.filter((t) => t !== taluk))
  }

  async function handleSave() {
    if (!editingSHG) return
    try {
      await updateUser(editingSHG.id!, { assignedTaluks: editTaluks })
      toast.success("Taluk assignments updated")
      setEditingSHG(null)
      const allUsers = await getAllUsers()
      setShgs(allUsers.filter((u) => u.role === "shg"))
    } catch (error) {
      toast.error("Failed to update assignments")
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
                    <TableCell><Badge variant={shg.status === "active" ? "default" : "secondary"}>{shg.status || "active"}</Badge></TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => { setEditingSHG(shg); setEditTaluks(shg.assignedTaluks || []); setNewTaluk("") }}>Edit Taluks</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Assign Taluks to {shg.name}</DialogTitle><DialogDescription>Add or remove taluk assignments for this SHG</DialogDescription></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {editTaluks.length === 0 ? <p className="text-sm text-muted-foreground">No taluks assigned</p> : editTaluks.map((t) => (
                                <Badge key={t} variant="secondary" className="flex items-center gap-1">{t}<button onClick={() => removeTaluk(t)}><X className="h-3 w-3" /></button></Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input placeholder="Enter taluk name" value={newTaluk} onChange={(e) => setNewTaluk(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTaluk() } }} />
                              <Button variant="outline" size="sm" onClick={addTaluk}><Plus className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <DialogFooter><Button onClick={handleSave}>Save Assignments</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
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
