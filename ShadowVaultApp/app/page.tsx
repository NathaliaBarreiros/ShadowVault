"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import {
  Shield,
  Activity,
  Plus,
  Zap,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Vault,
  BarChart3,
  Copy,
  ChevronDown,
  Menu,
} from "lucide-react"
import Link from "next/link"

export default function ShadowVaultDashboard() {
  const [securityScore] = useState(94)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const recentActivity = [
    {
      id: 1,
      type: "cross-chain",
      action: "Retrieved Netflix password",
      time: "2 min ago",
      status: "success",
      chains: ["Base", "Bridge"],
      severity: "success",
    },
    {
      id: 2,
      type: "ai-security",
      action: "Detected GitHub password in breach database",
      time: "15 min ago",
      status: "warning",
      chains: ["Zircuit"],
      severity: "warning",
    },
    {
      id: 3,
      type: "password-update",
      action: "Auto-updated LinkedIn password",
      time: "1 hr ago",
      status: "success",
      chains: ["Base"],
      severity: "success",
    },
    {
      id: 4,
      type: "cross-chain",
      action: "Synced vault to Polygon network",
      time: "3 hr ago",
      status: "success",
      chains: ["Base", "Bridge"],
      severity: "info",
    },
  ]

  const quickActions = [
    { icon: Plus, label: "Add Password", variant: "default", href: "/vault/add", primary: true },
    { icon: Vault, label: "View Vault", variant: "outline", href: "/vault" },
    { icon: Shield, label: "Security Scan", variant: "outline", href: "/security" },
    { icon: BarChart3, label: "Analytics", variant: "outline", href: "/analytics" },
  ]

  const networks = [
    { name: "Base", purpose: "Storage", status: "active", latency: "45ms" },
    { name: "Zircuit", purpose: "Verify", status: "active", latency: "32ms" },
    { name: "Hyperlane", purpose: "Bridge", status: "active", latency: "78ms" },
  ]

  const securityStatus = [
    { label: "Threat Monitoring", status: "Active", enabled: true },
    { label: "Auto-Updates", status: "Enabled", enabled: true },
    { label: "Breach Detection", status: "Protected", enabled: true },
    { label: "AI Analysis", status: "Running", enabled: true },
  ]

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-amber-600"
      case "info":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle className={`w-4 h-4 ${getStatusColor(severity)}`} />
      case "warning":
        return <AlertTriangle className={`w-4 h-4 ${getStatusColor(severity)}`} />
      case "info":
        return <Activity className={`w-4 h-4 ${getStatusColor(severity)}`} />
      default:
        return <Clock className={`w-4 h-4 ${getStatusColor(severity)}`} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ShadowVault</h1>
                <p className="text-sm text-muted-foreground">Mission Control</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-2 bg-accent/50 rounded-xl">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/diverse-user-avatars.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">JD</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-foreground">john@example.com</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>0x1234...5678</span>
                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0 focus-ring">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="focus-ring bg-transparent">
                    <Globe className="w-4 h-4 mr-2" />
                    Networks
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Network Status</h4>
                    {networks.map((network) => (
                      <div key={network.name} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${network.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <div>
                            <div className="font-medium text-sm">{network.name}</div>
                            <div className="text-xs text-muted-foreground">{network.purpose}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{network.latency}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Link href="/vault/add">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground focus-ring button-press">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Password
                </Button>
              </Link>

              <Badge variant="outline" className="text-xs">
                Testnet
              </Badge>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Row 1: Security Score (8/12) + Quick Actions (4/12) */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="card-hover bg-gradient-to-br from-card to-card/80 border-primary/20 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Shield className="w-5 h-5 text-primary" />
                  Security Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    {/* Circular gauge representation */}
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - securityScore / 100)}`}
                          className="text-primary transition-all duration-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{securityScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-foreground mb-1">{securityScore}/100</div>
                      <p className="text-muted-foreground">Excellent Security</p>
                      <div className="flex items-center gap-1 text-green-600 mt-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">+2 this week</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-accent/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary">247</div>
                    <p className="text-sm text-muted-foreground">Passwords Secured</p>
                  </div>
                  <div className="bg-accent/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary">5</div>
                    <p className="text-sm text-muted-foreground">Networks Active</p>
                  </div>
                  <div className="bg-accent/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <p className="text-sm text-muted-foreground">Auto Checks Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Card className="card-hover rounded-xl">
              <CardHeader>
                <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Button
                        variant={action.primary ? "default" : "outline"}
                        className={`min-h-24 min-w-10 w-full flex-col gap-2 focus-ring button-press ${
                          action.primary
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {action.icon && <action.icon className="w-5 h-5" />}
                        <span className="text-xs font-medium">{action.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Live Activity (8/12) + Security Center (4/12) */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="card-hover rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  Live Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors"
                    >
                      {/* Timeline status icon */}
                      <div className="flex-shrink-0 mt-1">{getStatusIcon(activity.severity)}</div>

                      {/* Middle content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      </div>

                      {/* Right chain chips */}
                      <div className="flex gap-1">
                        {activity.chains.map((chain) => (
                          <Badge key={chain} variant="secondary" className="text-xs px-2 py-1">
                            {chain === "Base" && <Globe className="w-2 h-2 mr-1" />}
                            {chain === "Zircuit" && <Shield className="w-2 h-2 mr-1" />}
                            {chain === "Bridge" && <Zap className="w-2 h-2 mr-1" />}
                            {chain}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Card className="card-hover rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <div className="p-2 bg-accent rounded-lg">
                    <Zap className="w-5 h-5 text-accent-foreground" />
                  </div>
                  AI Security Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            item.status === "Active" || item.status === "Protected" || item.status === "Running"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.status}
                        </Badge>
                        <Switch checked={item.enabled} className="focus-ring" />
                      </div>
                    </div>
                  ))}

                  <Link href="/security">
                    <Button className="w-full mt-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground focus-ring button-press">
                      <Zap className="w-4 h-4 mr-2" />
                      Open Security Center
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Link href="/vault/add">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg focus-ring button-press"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
