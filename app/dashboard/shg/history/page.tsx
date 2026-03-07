"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Leaf, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuthUser } from "@/hooks/use-auth-user"
import { buildBackendUrl } from "@/lib/api"

export default function VerificationHistory() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, verified: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "rejected">("all")

  // Filter states
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [milletType, setMilletType] = useState("")
  const [farmerName, setFarmerName] = useState("")
  const [taluk, setTaluk] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const user = useAuthUser()

  useEffect(() => {
    async function fetchVerifications() {
      try {
        if (!user) return

        const params = new URLSearchParams()
        params.append("shgId", user.id)
        
        if (statusFilter !== "all") params.append("status", statusFilter)
        if (startDate) params.append("startDate", startDate)
        if (endDate) params.append("endDate", endDate)
        if (milletType) params.append("milletType", milletType)
        if (farmerName) params.append("farmerName", farmerName)
        if (taluk) params.append("taluk", taluk)

        const response = await fetch(buildBackendUrl(`/api/verifications?${params}`))
        const payload = await response.json()
        
        if (response.ok && payload?.success) {
          setVerifications(payload.verifications || [])
          setStats(payload.stats || { total: 0, verified: 0, rejected: 0 })
        }
      } catch (error) {
        console.error("Error fetching verifications:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVerifications()
  }, [user, statusFilter, startDate, endDate, milletType, farmerName, taluk])

  const handleResetFilters = () => {
    setStartDate("")
    setEndDate("")
    setMilletType("")
    setFarmerName("")
    setTaluk("")
    setShowFilters(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const hasActiveFilters = startDate || endDate || milletType || farmerName || taluk

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Verification History</h1>
        <p className="text-muted-foreground">Track crops you've verified - both approved and rejected. Sorted by date (newest first)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Verifications</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground">Filters</CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm">From Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm">To Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="millet-type" className="text-sm">Millet Type</Label>
                <Input
                  id="millet-type"
                  placeholder="e.g., Pearl Millet"
                  value={milletType}
                  onChange={(e) => setMilletType(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmer-name" className="text-sm">Farmer Name</Label>
                <Input
                  id="farmer-name"
                  placeholder="Search farmer..."
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taluk" className="text-sm">Taluk</Label>
                <Input
                  id="taluk"
                  placeholder="Search taluk..."
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs for filtering */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="verified">Approved ({stats.verified})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {verifications.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No verifications yet</p>
                <p className="text-sm text-muted-foreground text-center">
                  {statusFilter === "all"
                    ? "Start verifying crops from farmers in your assigned taluks"
                    : `No ${statusFilter} crops yet`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {verifications.map((verification) => (
                <Card key={verification.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {verification.milletType}
                        </CardTitle>
                        <CardDescription>
                          From {verification.farmerName}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={verification.status === "verified" ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {verification.status === "verified" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Approved
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Rejected
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="font-medium text-foreground">{verification.quantity} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taluk</p>
                          <p className="font-medium text-foreground">{verification.taluk}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Verified Date</p>
                          <p className="font-medium text-foreground">
                            {formatDate(verification.verifiedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {verification.notes && (
                      <div className="bg-muted rounded p-3 text-sm">
                        <p className="text-muted-foreground font-medium mb-1">Notes:</p>
                        <p className="text-foreground">{verification.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
