"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Wheat,
  Home,
  LogOut,
  Package,
  FileText,
  Truck,
  CreditCard,
  Users,
  ShoppingCart,
  Store,
  ShoppingBag,
  MapPin,
  ClipboardCheck,
  CheckSquare,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  
  // Get current role from pathname
  const role = pathname.split("/")[2] || "farmer"

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <Wheat className="h-8 w-8 text-sidebar-primary" />
            <span className="text-xl font-bold">MilletChain</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60 mb-2">
              {role === "farmer" && "Farmer Dashboard"}
              {role === "shg" && "SHG Dashboard"}
              {role === "consumer" && "Consumer Dashboard"}
              {role === "admin" && "Admin Dashboard"}
            </p>
          </div>
          <DashboardNav role={role} pathname={pathname} />
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Wheat className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">MilletChain</span>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-b border-border bg-card p-2 overflow-x-auto">
          <MobileNav role={role} pathname={pathname} />
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

interface NavProps {
  role: string
  pathname: string
}

function DashboardNav({ role, pathname }: NavProps) {
  const navItems = getNavItems(role)
  
  return (
    <ul className="space-y-1">
      {navItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === item.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function MobileNav({ role, pathname }: NavProps) {
  const navItems = getNavItems(role)
  
  return (
    <div className="flex gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </div>
  )
}

function getNavItems(role: string) {
  const baseItems = [
    { href: `/dashboard/${role}`, label: "Overview", icon: Home },
  ]

  const roleSpecificItems: Record<string, Array<{ href: string; label: string; icon: typeof Home }>> = {
    farmer: [
      { href: `/dashboard/farmer`, label: "Overview", icon: Home },
      { href: `/dashboard/farmer/listings`, label: "My Listings", icon: Package },
      { href: `/dashboard/farmer/orders`, label: "Orders", icon: Truck },
      { href: `/dashboard/farmer/payments`, label: "Payments", icon: CreditCard },
    ],
    shg: [
      { href: `/dashboard/shg`, label: "Overview", icon: Home },
      { href: `/dashboard/shg/farmers`, label: "Pending Verifications", icon: ClipboardCheck },
      { href: `/dashboard/shg/orders`, label: "Verified Crops", icon: CheckSquare },
      { href: `/dashboard/shg/batches`, label: "Verification History", icon: FileText },
    ],
    consumer: [
      { href: `/dashboard/consumer`, label: "Overview", icon: Home },
      { href: `/dashboard/consumer/products`, label: "Browse Crops", icon: Store },
      { href: `/dashboard/consumer/orders`, label: "My Orders", icon: ShoppingBag },
      { href: `/dashboard/consumer/tracking`, label: "Track Orders", icon: MapPin },
    ],
    admin: [
      { href: `/dashboard/admin`, label: "Overview", icon: Home },
      { href: `/dashboard/admin/users`, label: "User Management", icon: Users },
      { href: `/dashboard/admin/quality`, label: "SHG-Taluk Assignment", icon: MapPin },
      { href: `/dashboard/admin/batches`, label: "Disputes", icon: ClipboardCheck },
      { href: `/dashboard/admin/analytics`, label: "Analytics", icon: BarChart3 },
    ],
  }

  return roleSpecificItems[role] || baseItems
}
