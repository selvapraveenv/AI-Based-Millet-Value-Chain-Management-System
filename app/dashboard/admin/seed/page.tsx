"use client"

import { useState } from "react"
import { Database, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabase } from "@/lib/seed-data"

export default function SeedDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeedDatabase = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await seedDatabase()
      if (response.success) {
        setResult({ success: true, message: "Database seeded successfully! Sample data has been added." })
      } else {
        setResult({ success: false, message: "Failed to seed database. Check console for errors." })
      }
    } catch (error) {
      console.error("Seed error:", error)
      setResult({ success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Database Management</h1>
        <p className="text-muted-foreground">Manage your Firestore database for testing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Seed Database Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Database className="h-5 w-5" />
              Seed Database
            </CardTitle>
            <CardDescription>
              Add sample data to Firestore for testing. This will create sample farmers, SHGs, products, orders, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">This will add:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>7 Sample Farmers</li>
                <li>6 Sample SHGs</li>
                <li>5 Sample Listings</li>
                <li>6 Sample Products</li>
                <li>5 Sample Orders</li>
                <li>3 Sample Requests</li>
                <li>3 Sample Batches</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleSeedDatabase} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database with Sample Data
                </>
              )}
            </Button>
            
            {result && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                result.success 
                  ? "bg-primary/10 text-primary" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                )}
                <span className="text-sm">{result.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">How It Works</CardTitle>
            <CardDescription>
              Understanding the database seeding process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">1. Firebase Connection</p>
              <p>Uses your Firebase config from lib/firebase.ts to connect to Firestore.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">2. Sample Data</p>
              <p>Adds realistic sample data for all collections (farmers, shgs, products, orders, etc.)</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">3. Relationships</p>
              <p>Automatically links data with proper IDs (farmer → listing → product → order)</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">4. Ready to Test</p>
              <p>After seeding, all dashboard pages will show real data from Firestore!</p>
            </div>
            
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-amber-500">
                ⚠️ Note: Running seed multiple times will add duplicate data. Clear Firestore first if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Overview */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Firestore Collections</CardTitle>
          <CardDescription>
            Overview of database collections created by the seed function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[
              { name: "farmers", description: "Farmer profiles and stats" },
              { name: "shgs", description: "Self-Help Group data" },
              { name: "listings", description: "Farmer crop listings" },
              { name: "products", description: "Processed products for sale" },
              { name: "orders", description: "Customer orders" },
              { name: "requests", description: "SHG purchase requests" },
              { name: "batches", description: "Processing batches" },
              { name: "users", description: "User accounts (from Auth)" },
            ].map((coll) => (
              <div key={coll.name} className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-sm font-medium text-foreground">{coll.name}</p>
                <p className="text-xs text-muted-foreground">{coll.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
