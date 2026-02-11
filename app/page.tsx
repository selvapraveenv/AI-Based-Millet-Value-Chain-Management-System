"use client"

import Link from "next/link"
import { ArrowRight, Wheat, Users, ShoppingCart, Shield, TrendingUp, Truck, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Wheat,
    title: "For Farmers",
    description: "List your millet crops, receive purchase requests from SHGs, and track payments seamlessly.",
  },
  {
    icon: Users,
    title: "For Self-Help Groups",
    description: "Source millets directly from farmers, manage processing, and sell finished products to consumers.",
  },
  {
    icon: ShoppingCart,
    title: "For Consumers",
    description: "Browse quality millet products with full traceability from farm to table.",
  },
  {
    icon: Shield,
    title: "For Administrators",
    description: "Verify quality, approve batches, and ensure compliance across the supply chain.",
  },
]

const stats = [
  { value: "500+", label: "Registered Farmers" },
  { value: "50+", label: "Active SHGs" },
  { value: "10K+", label: "Orders Delivered" },
  { value: "98%", label: "Quality Approval" },
]

const benefits = [
  "Direct farmer-to-consumer traceability",
  "Digital payment tracking and transparency",
  "Quality verification at every step",
  "Support for local farming communities",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Wheat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">MilletChain</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
          </nav>
          <Link href="/login">
            <Button>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Wheat className="h-4 w-4" />
              AI-Powered Supply Chain Management
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl text-balance">
              Transforming the Millet Supply Chain
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl text-pretty">
              A digital coordination platform connecting farmers, self-help groups, and consumers with complete transparency, traceability, and seamless payments.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Login / Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Role-Based Features
            </h2>
            <p className="text-muted-foreground">
              Tailored experiences for every stakeholder in the millet supply chain.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-y border-border bg-card py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              A simple, transparent flow from farm to table.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Farmers List Crops</h3>
              <p className="text-sm text-muted-foreground">
                Farmers register and list their millet crops with details like type, quantity, and location.
              </p>
              <div className="absolute right-0 top-8 hidden h-0.5 w-1/2 bg-border md:block" />
            </div>
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">SHGs Process & Package</h3>
              <p className="text-sm text-muted-foreground">
                Self-help groups purchase, process, and package millets into quality products.
              </p>
              <div className="absolute left-0 top-8 hidden h-0.5 w-full bg-border md:block" />
            </div>
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Consumers Purchase</h3>
              <p className="text-sm text-muted-foreground">
                Consumers browse products with full traceability and place orders directly.
              </p>
              <div className="absolute left-0 top-8 hidden h-0.5 w-1/2 bg-border md:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Why Choose MilletChain?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Our platform ensures transparency at every step, supporting farmers and delivering quality products to consumers.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border bg-card p-6">
                <TrendingUp className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Better Prices</h3>
                <p className="text-sm text-muted-foreground">Fair prices for farmers, competitive rates for consumers.</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <Shield className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Quality Assured</h3>
                <p className="text-sm text-muted-foreground">Every batch verified by admin before reaching consumers.</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <Truck className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Easy Tracking</h3>
                <p className="text-sm text-muted-foreground">Track orders from procurement to delivery.</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <Users className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Community Support</h3>
                <p className="text-sm text-muted-foreground">Empowering local SHGs and farming communities.</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Join the MilletChain network today and be part of the sustainable millet revolution.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Login / Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Wheat className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">MilletChain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-Based Millets Chain Management System - Final Year Project
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
