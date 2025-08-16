"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Globe, Zap, Lock, ArrowRight, CheckCircle, Star } from "lucide-react"
import Link from "next/link"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/20 to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center w-24 h-24 bg-primary rounded-3xl">
              <Shield className="w-14 h-14 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-foreground mb-6">
            The Future of <br />
            <span className="text-primary">Password Security</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            ShadowVault combines revolutionary Web3 technology with familiar Web2 experience. Store passwords once,
            access them everywhere with AI-powered security that works invisibly.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              30-Second Setup
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              No Crypto Knowledge Required
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Security
            </Badge>
          </div>

          <Link href="/onboarding">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl">
              Get Started Free
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground mt-6">
            Join thousands of users protecting their digital lives with ShadowVault
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-16">Revolutionary Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Cross-Chain Access</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Store passwords on one blockchain, access from any network. Sub-200ms retrieval times across Ethereum,
                  Polygon, Zircuit, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mx-auto mb-6">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI Security Agent</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time threat detection, automatic password updates, and breach monitoring. Your AI guardian works
                  24/7 to protect you.
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-2xl mx-auto mb-6">
                  <Lock className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Zero Complexity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Familiar password manager interface powered by cutting-edge Web3 technology. No wallets, gas fees, or
                  crypto knowledge required.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-20 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-16">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full mx-auto text-primary-foreground font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold">Sign Up</h3>
              <p className="text-muted-foreground">Enter your email and we'll set up your secure vault in 30 seconds</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-full mx-auto text-accent-foreground font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold">Add Passwords</h3>
              <p className="text-muted-foreground">
                Import existing passwords or add new ones with AI strength analysis
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-secondary rounded-full mx-auto text-secondary-foreground font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold">Stay Protected</h3>
              <p className="text-muted-foreground">Access from anywhere while AI monitors and protects automatically</p>
            </div>
          </div>

          <div className="mt-16">
            <Link href="/onboarding">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4">
                Start Your 30-Second Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
