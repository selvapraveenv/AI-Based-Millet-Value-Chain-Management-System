"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getVerificationHistory } from "@/lib/firestore"

const DEMO_SHG_ID = "shg1"

export default function SHGVerificationHistory() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getVerificationHistory(DEMO_SHG_ID)
        setVerifications(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Verification History</h1>
        <p className="text-muted-foreground">Complete log of all your crop verifications</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{verifications.filter(v => v.status === "verified").length}</p><p className="text-sm text-muted-foreground">Approved</p></div></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center"><XCircle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold text-foreground">{verifications.filter(v => v.status === "rejected").length}</p><p className="text-sm text-muted-foreground">Rejected</p></div></CardContent></Card>
      </div>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground">All Verifications</CardTitle><CardDescription>Your complete verification activity</CardDescription></CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No verification history</p>
              <p className="text-sm text-muted-foreground">Your verification activity will be logged here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((v) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{v.milletType || "Millet Crop"}</span>
                      <Badge className={v.status === "verified" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                        {v.status === "verified" ? <><CheckCircle className="mr-1 h-3 w-3" />Verified</> : <><XCircle className="mr-1 h-3 w-3" />Rejected</>}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Farmer: {v.farmerName || "Unknown"} - {v.quantity || 0} kg</p>
                    {v.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {v.notes}</p>}
                  </div>
                  <div className="text-sm text-muted-foreground">{v.taluk || "N/A"}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
