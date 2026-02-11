"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FarmerRequests() {
  return (
    <div className="space-y-8">
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium text-foreground">This page has been removed</p>
          <p className="text-sm text-muted-foreground text-center mb-4">Consumers now buy directly from farmers. Check your Orders page instead.</p>
          <Link href="/dashboard/farmer/orders"><Button>View Orders</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
