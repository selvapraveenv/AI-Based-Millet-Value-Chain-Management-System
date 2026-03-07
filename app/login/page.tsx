"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wheat, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildBackendUrl } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!emailOrPhone || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(buildBackendUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          password,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.message || "Something went wrong. Please try again.")
        return
      }

      const userData = payload.user

      let authenticatedUser = {
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        role: userData.role,
        district: userData.district,
        state: userData.state,
        taluk: userData.taluk || "",
        assignedTaluks: userData.assignedTaluks || [],
      }

      try {
        const profileResponse = await fetch(buildBackendUrl(`/api/users/${userData.id}`))
        const profilePayload = await profileResponse.json()

        if (profileResponse.ok && profilePayload?.success && profilePayload?.user) {
          const profile = profilePayload.user
          authenticatedUser = {
            id: profile.id,
            name: profile.name || userData.name,
            phone: profile.phone || userData.phone,
            email: profile.email || userData.email,
            role: profile.role || userData.role,
            district: profile.district || userData.district,
            state: profile.state || userData.state,
            taluk: profile.taluk || "",
            assignedTaluks: profile.assignedTaluks || [],
          }
        }
      } catch (profileError) {
        console.warn("Failed to refresh profile after login, using login payload", profileError)
      }

      // Store authenticated user info in localStorage for session
      localStorage.setItem("user", JSON.stringify(authenticatedUser))

      // Notify listeners in current tab that auth user changed
      window.dispatchEvent(new Event("focus"))

      // Redirect based on role
      router.push(`/dashboard/${authenticatedUser.role}`)
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
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

      {/* Login Form */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Phone</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your email or phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500 text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {"Don't have an account? "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Register here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
