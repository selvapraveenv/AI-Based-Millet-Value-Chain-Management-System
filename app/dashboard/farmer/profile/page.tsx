"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRoleProtection } from "@/hooks/use-role-protection"
import { getLoggedInUser } from "@/lib/auth"
import { buildBackendUrl } from "@/lib/api"

export default function FarmerProfilePage() {
  const authUser = useAuthUser()
  const roleError = useRoleProtection("farmer")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    district: "",
    state: "",
    taluk: "",
  })

  useEffect(() => {
    const user = getLoggedInUser()
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        district: user.district || "",
        state: user.state || "",
        taluk: user.taluk || "",
      })
    }
    setLoading(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setError("")
      setSuccess("")
      setSaving(true)

      const user = getLoggedInUser()
      if (!user?.id) {
        setError("User not found")
        return
      }

      const response = await fetch(buildBackendUrl(`/api/users/${user.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || "Failed to update profile")
        return
      }

      // Update localStorage with new data
      const updatedUser = { ...user, ...result.user }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      window.dispatchEvent(new Event("focus"))

      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Error updating profile")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  if (roleError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">{roleError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/farmer">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
      </div>

      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-primary/10 border border-primary text-primary p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-foreground">
                State
              </Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter your state"
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-foreground">
                District
              </Label>
              <Input
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Enter your district"
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taluk" className="text-foreground">
                Taluk
              </Label>
              <Input
                id="taluk"
                name="taluk"
                value={formData.taluk}
                onChange={handleChange}
                placeholder="Enter your taluk"
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Link href="/dashboard/farmer">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
