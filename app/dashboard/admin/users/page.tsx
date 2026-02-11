"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Trash2, Edit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getAllUsers, updateUser, deleteUserDoc, type UserDoc } from "@/lib/firestore"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<UserDoc | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editStatus, setEditStatus] = useState("")

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAllUsers()
        setUsers(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  async function handleUpdate() {
    if (!editingUser) return
    try {
      await updateUser(editingUser.id!, { name: editName, role: editRole, status: editStatus })
      toast.success("User updated")
      setEditingUser(null)
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      toast.error("Failed to update user")
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await deleteUserDoc(userId)
      toast.success("User deleted")
      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-foreground">User Management</h1><p className="text-muted-foreground">Manage all platform users</p></div>
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="farmer">Farmer</SelectItem><SelectItem value="shg">SHG</SelectItem><SelectItem value="consumer">Consumer</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">Users ({filtered.length})</CardTitle><CardDescription>All registered users on the platform</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>District</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{user.district || "N/A"}</TableCell>
                  <TableCell><Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status || "active"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => { setEditingUser(user); setEditName(user.name); setEditRole(user.role); setEditStatus(user.status || "active") }}><Edit className="h-4 w-4" /></Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update user details</DialogDescription></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Role</Label><Select value={editRole} onValueChange={setEditRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="farmer">Farmer</SelectItem><SelectItem value="shg">SHG</SelectItem><SelectItem value="consumer">Consumer</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Status</Label><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div>
                          </div>
                          <DialogFooter><Button onClick={handleUpdate}>Save Changes</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {user.role !== "admin" && <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id!)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
