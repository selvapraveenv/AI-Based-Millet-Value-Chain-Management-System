"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Loader2, CheckCircle, AlertCircle, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createUser } from "@/lib/firestore"

export default function AddSHGPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    district: "",
    state: "Karnataka",
    pincode: "",
  })
  const [talukInput, setTalukInput] = useState("")
  const [assignedTaluks, setAssignedTaluks] = useState<string[]>([])
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const addTaluk = () => {
    const trimmed = talukInput.trim()
    if (trimmed && !assignedTaluks.includes(trimmed)) {
      setAssignedTaluks([...assignedTaluks, trimmed])
      setTalukInput("")
    }
  }

  const removeTaluk = (taluk: string) => {
    setAssignedTaluks(assignedTaluks.filter((t) => t !== taluk))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTaluk()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!form.name || !form.phone || !form.email || !form.password || !form.address || !form.district || !form.pincode) {
      setResult({ success: false, message: "Please fill in all required fields." })
      return
    }
    if (assignedTaluks.length === 0) {
      setResult({ success: false, message: "Please assign at least one taluk to this SHG." })
      return
    }

    setLoading(true)
    try {
      await createUser({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        address: form.address,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        role: "shg",
        verified: true,
        assignedTaluks: assignedTaluks,
        status: "active",
      })
      setResult({ success: true, message: `SHG "${form.name}" added successfully!` })
      toast.success("SHG member added successfully!")
      setForm({ name: "", phone: "", email: "", password: "", address: "", district: "", state: "Karnataka", pincode: "" })
      setAssignedTaluks([])
    } catch (error) {
      console.error("Error creating SHG:", error)
      setResult({ success: false, message: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
      toast.error("Failed to add SHG member")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New SHG Member</h1>
        <p className="text-muted-foreground">Register a new Self-Help Group and assign taluks for crop verification</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form Card */}
        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="h-5 w-5" />
              SHG Registration Form
            </CardTitle>
            <CardDescription>Fill in the details to register a new SHG on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SHG Name & Phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">SHG Name <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="e.g. Mahila Self Help Group" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                  <Input id="phone" placeholder="e.g. 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" placeholder="e.g. shg@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <Input id="password" type="password" placeholder="Set a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                <Input id="address" placeholder="Full address of the SHG office" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              {/* District, State, Pincode */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
                  <Input id="district" placeholder="e.g. Bengaluru Rural" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
                  <Input id="pincode" placeholder="e.g. 560001" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                </div>
              </div>

              {/* Assigned Taluks */}
              <div className="space-y-2">
                <Label>Assigned Taluks <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Add taluks this SHG will be responsible for verifying crops in</p>
                <div className="flex gap-2">
                  <Input placeholder="Type a taluk name and press Enter" value={talukInput} onChange={(e) => setTalukInput(e.target.value)} onKeyDown={handleKeyDown} />
                  <Button type="button" variant="outline" onClick={addTaluk} className="shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
                {assignedTaluks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignedTaluks.map((taluk) => (
                      <Badge key={taluk} variant="secondary" className="px-3 py-1 text-sm">
                        {taluk}
                        <button type="button" onClick={() => removeTaluk(taluk)} className="ml-2 hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Result Message */}
              {result && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${result.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {result.success ? <CheckCircle className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                  <span className="text-sm">{result.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding SHG...</>
                ) : (
                  <><UserPlus className="mr-2 h-4 w-4" />Add SHG Member</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-border h-fit">
          <CardHeader>
            <CardTitle className="text-foreground">SHG Role Info</CardTitle>
            <CardDescription>What an SHG member can do on the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">1. Verify Crops</p>
              <p>Physically verify farmer crop listings in their assigned taluks.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">2. Upload Proof</p>
              <p>Upload verification images and notes for quality assurance.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">3. Approve / Reject</p>
              <p>Approve or reject listings based on quality standards.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">4. Taluk-Based</p>
              <p>Each SHG only sees pending crops from their assigned taluks.</p>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-amber-500">⚠️ Make sure taluks don't overlap with existing SHGs to avoid duplicate verifications.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
