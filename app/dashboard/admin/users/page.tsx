"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Trash2, Circle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { type UserDoc } from "@/lib/firestore"
import { buildBackendUrl } from "@/lib/api"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(buildBackendUrl("/api/users"))
        const payload = await response.json()
        if (response.ok && payload?.success) {
          setUsers(payload.users || [])
        } else {
          setUsers([])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])


  async function handleDelete(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      const response = await fetch(buildBackendUrl(`/api/users/${userId}`), { method: "DELETE" })
      if (!response.ok) throw new Error("Failed")
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
                  <TableCell><div className="flex items-center gap-2"><Circle className="h-3 w-3 fill-green-500 text-green-500" /><span className="text-sm text-green-700">Active</span></div></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
