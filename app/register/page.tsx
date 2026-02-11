"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wheat, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"farmer" | "consumer">("farmer")
  const [address, setAddress] = useState("")
  const [district, setDistrict] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match!")
      return
    }

    if (!name || !phone || !address || !district || !state || !pincode || !password) {
      setError("Please fill in all required fields!")
      return
    }

    setIsSubmitting(true)

    try {
      // Check if phone already exists
      const usersRef = collection(db, "users")
      const phoneQuery = query(usersRef, where("phone", "==", phone))
      const phoneSnapshot = await getDocs(phoneQuery)

      if (!phoneSnapshot.empty) {
        setError("An account with this phone number already exists!")
        setIsSubmitting(false)
        return
      }

      // Check if email already exists (if provided)
      if (email) {
        const emailQuery = query(usersRef, where("email", "==", email))
        const emailSnapshot = await getDocs(emailQuery)

        if (!emailSnapshot.empty) {
          setError("An account with this email already exists!")
          setIsSubmitting(false)
          return
        }
      }

      // Save user to Firestore
      await addDoc(collection(db, "users"), {
        name,
        phone,
        role,
        address,
        district,
        state,
        pincode,
        email: email || "",
        password,
        verified: false,
        createdAt: Timestamp.now(),
      })

      setIsSubmitting(false)
      setIsSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      console.error("Registration error:", err)
      setError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Wheat className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">MilletChain</span>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md border-border text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Registration Successful!</h2>
              <p className="text-muted-foreground">
                Your account has been created. Redirecting to login...
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Wheat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">MilletChain</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Register Form */}
      <main className="flex flex-1 items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Create Account</CardTitle>
            <CardDescription>Join the MilletChain network today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label>
                  I am a <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("farmer")}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                      role === "farmer"
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium text-foreground">🌾 Farmer</div>
                      <div className="text-xs text-muted-foreground mt-1">Sell millet crops</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("consumer")}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                      role === "consumer"
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium text-foreground">🛒 Consumer</div>
                      <div className="text-xs text-muted-foreground mt-1">Buy millet products</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-input resize-none"
                  rows={2}
                  required
                />
              </div>

              {/* District & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="district">
                    District <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="district"
                    type="text"
                    placeholder="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="bg-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="bg-input"
                    required
                  />
                </div>
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pincode"
                  type="text"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email ID <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500 text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Register"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {"Already have an account? "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
