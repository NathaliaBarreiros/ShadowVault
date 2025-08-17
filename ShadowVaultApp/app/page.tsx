"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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
  Info,
  ChevronRight,
  ExternalLink,
  Play,
  X,
  RefreshCw,
  Download,
  LogOut,
  FileText,
  Key,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"

interface ProofDetails {
  txHash: string
  blockNumber: number
  timestamp: string
  gasUsed: string
  circuitVersion: string
  policyId: string
  verifyingKeyHash: string
  commitmentHash: string
  hyperlaneMessageId: string
}

interface DemoStep {
  name: string
  status: "pending" | "running" | "completed" | "error"
  duration?: number
}

const UnifiedChip = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  onClick,
  tooltip,
}: {
  children: React.ReactNode
  variant?: "neutral" | "selected" | "disabled"
  size?: "sm" | "md"
  className?: string
  onClick?: () => void
  tooltip?: string
}) => {
  const baseClasses = "inline-flex items-center rounded-md font-medium transition-colors"
  const sizeClasses = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
  const variantClasses = {
    neutral: "bg-accent/50 text-accent-foreground hover:bg-accent/70",
    selected: "bg-primary/10 text-primary border border-primary/20",
    disabled: "bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed",
  }

  const chip = (
    <span
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${onClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2" : ""} ${className}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </span>
  )

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return chip
}

export default function ShadowVaultDashboard() {
  const { signOut, user } = useAuth()
  const [securityScore] = useState(94)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null)
  const [securityToggles, setSecurityToggles] = useState({
    threatMonitoring: true,
    autoUpdates: true,
    breachDetection: true,
    aiAnalysis: false,
  })

  const [isProofModalOpen, setIsProofModalOpen] = useState(false)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([
    { name: "Encrypt (local)", status: "pending" },
    { name: "Store (Base)", status: "pending" },
    { name: "Prove (Noir)", status: "pending" },
    { name: "Verify (Zircuit)", status: "pending" },
    { name: "Bridge (Hyperlane)", status: "pending" },
  ])
  const [showBackupCallout, setShowBackupCallout] = useState(true)
  const [networkHealthChecking, setNetworkHealthChecking] = useState(false)

  const proofDetails: ProofDetails = {
    txHash: "0x8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
    blockNumber: 18234567,
    timestamp: "2024-01-15T14:30:25Z",
    gasUsed: "142,350",
    circuitVersion: "v2.1.0",
    policyId: "policy_7x9k2m4n",
    verifyingKeyHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    commitmentHash: "0x9f8e7d6c5b4a3928374650192837465019283746501928374650192837465019",
    hyperlaneMessageId: "0x4d3c2b1a0f9e8d7c6b5a4938271605948372615094837261509483726150948372",
  }

  const recentActivity = [
    {
      id: 1,
      type: "PASSWORD_DECRYPTED_LOCAL",
      action: "Decrypted Netflix password locally",
      time: "2 min ago",
      status: "success",
      chains: ["Base"],
      severity: "success",
    },
    {
      id: 2,
      type: "ZK_PROOF_VERIFIED",
      action: "Proof verified on Zircuit",
      time: "15 min ago",
      status: "warning",
      chains: ["Zircuit"],
      severity: "warning",
      isProofItem: true, // Added flag to identify proof items
    },
    {
      id: 3,
      type: "ENCRYPTED_STORED_BASE",
      action: "Stored encrypted item on Base",
      time: "1 hr ago",
      status: "success",
      chains: ["Base"],
      severity: "success",
    },
    {
      id: 4,
      type: "BRIDGED_METADATA",
      action: "Linked Base ↔ Zircuit",
      time: "3 hr ago",
      status: "success",
      chains: ["Bridge"],
      severity: "info",
    },
  ]

  const quickActions = [
    { icon: Plus, label: "Add Password", variant: "default", href: "/vault/add", primary: true },
    {
      icon: Play,
      label: "Run Demo (Encrypt → Prove → Verify)",
      variant: "outline",
      href: "#",
      primary: false,
      isDemo: true,
    },
    { icon: Vault, label: "View Vault", variant: "outline", href: "/vault" },
    { icon: Key, label: "Add Seal", variant: "outline", href: "/seals/add", sealAction: true },
    { icon: FileText, label: "View Seals", variant: "outline", href: "/seals", sealAction: true },
    { icon: Shield, label: "Security Scan", variant: "outline", href: "/security" },
    { icon: BarChart3, label: "Analytics", variant: "outline", href: "/analytics" },
  ]

  const networks = [
    {
      name: "Base",
      purpose: "Storage",
      status: "active",
      latency: "45ms",
      logo: Globe,
      rpcLabel: "Base Mainnet",
      lastCheck: "30s ago",
      failureCount: 0,
    },
    {
      name: "Zircuit",
      purpose: "Verify",
      status: "active",
      latency: "32ms",
      logo: Shield,
      rpcLabel: "Zircuit Testnet",
      lastCheck: "45s ago",
      failureCount: 0,
    },
    {
      name: "Hyperlane",
      purpose: "Bridge",
      status: "active",
      latency: "67ms",
      logo: Zap,
      rpcLabel: "Hyperlane Bridge",
      lastCheck: "1m ago",
      failureCount: 1,
    },
  ]

  const securityStatus = [
    { key: "threatMonitoring", label: "Threat Monitoring", lastRun: "2 min ago" },
    { key: "autoUpdates", label: "Auto-Updates", nextRun: "in 4 hrs" },
    { key: "breachDetection", label: "Breach Detection", lastRun: "1 hr ago" },
    { key: "aiAnalysis", label: "AI Analysis", nextRun: "in 12 hrs" },
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

  const getColorRail = (severity: string) => {
    switch (severity) {
      case "success":
        return "border-l-green-500"
      case "warning":
        return "border-l-amber-500"
      case "info":
        return "border-l-blue-500"
      default:
        return "border-l-gray-500"
    }
  }

  const getStatusIcon = (severity: string) => {
    const iconClass = "w-5 h-5"
    switch (severity) {
      case "success":
        return <CheckCircle className={`${iconClass} ${getStatusColor(severity)}`} />
      case "warning":
        return <AlertTriangle className={`${iconClass} ${getStatusColor(severity)}`} />
      case "info":
        return <Activity className={`${iconClass} ${getStatusColor(severity)}`} />
      default:
        return <Clock className={`${iconClass} ${getStatusColor(severity)}`} />
    }
  }

  const copyWalletAddress = () => {
    if (!user?.address) return
    navigator.clipboard.writeText(user.address)
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    })
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSecurityToggle = (key: string) => {
    setSecurityToggles((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleChainChipClick = (chain: string) => {
    const explorerUrls = {
      Base: "https://basescan.org/tx/0x8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
      Zircuit: "https://explorer.zircuit.com/tx/0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      Bridge: null, // No explorer, will copy ID instead
    }

    const url = explorerUrls[chain as keyof typeof explorerUrls]
    if (url) {
      window.open(url, "_blank")
      toast({
        title: "Opening Explorer",
        description: `Opening ${chain} transaction in explorer`,
      })
    } else {
      navigator.clipboard.writeText("msg_4d3c2b1a0f9e8d7c")
      toast({
        title: "Copied!",
        description: `${chain} message ID copied to clipboard`,
      })
    }
  }

  const runDemo = async () => {
    setIsDemoRunning(true)
    const stepDurations = [800, 1200, 2000, 1500, 900] // Different durations for each step

    for (let i = 0; i < demoSteps.length; i++) {
      // Set current step to running
      setDemoSteps((prev) => prev.map((step, index) => (index === i ? { ...step, status: "running" } : step)))

      // Wait for step duration
      await new Promise((resolve) => setTimeout(resolve, stepDurations[i]))

      // Set current step to completed with duration
      setDemoSteps((prev) =>
        prev.map((step, index) => (index === i ? { ...step, status: "completed", duration: stepDurations[i] } : step)),
      )
    }

    setIsDemoRunning(false)

    // Add consolidated feed entry
    const totalTime = stepDurations.reduce((a, b) => a + b, 0)
    toast({
      title: "Demo Completed!",
      description: `End-to-end flow completed in ${(totalTime / 1000).toFixed(1)}s`,
    })
  }

  const recheckNetworks = async () => {
    setNetworkHealthChecking(true)
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate health check
    setNetworkHealthChecking(false)
    toast({
      title: "Networks Rechecked",
      description: "All network health metrics updated",
    })
  }

  const copyDebugBundle = () => {
    const debugBundle = {
      ...proofDetails,
      timestamp: new Date().toISOString(),
      networkStatus: networks.map((n) => ({ name: n.name, status: n.status, latency: n.latency })),
    }

    navigator.clipboard.writeText(JSON.stringify(debugBundle, null, 2))
    toast({
      title: "Debug Bundle Copied!",
      description: "Complete proof details copied to clipboard",
    })
  }

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [isFeedDetailsOpen, setIsFeedDetailsOpen] = useState(false)
  const [selectedFeedItem, setSelectedFeedItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFeedItemClick = (activity: any) => {
    setSelectedFeedItem(activity)
    setIsFeedDetailsOpen(true)
  }

  const copyFeedDebugBundle = () => {
    if (!selectedFeedItem) return

    const debugBundle = {
      activityId: selectedFeedItem.id,
      type: selectedFeedItem.type,
      action: selectedFeedItem.action,
      timestamp: new Date().toISOString(),
      txHash: "0x8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
      blockNumber: 18234567,
      gasUsed: "142,350",
      chains: selectedFeedItem.chains,
      severity: selectedFeedItem.severity,
      networkStatus: networks.map((n) => ({ name: n.name, status: n.status, latency: n.latency })),
    }

    navigator.clipboard.writeText(JSON.stringify(debugBundle, null, 2))
    toast({
      title: "Debug Bundle Copied!",
      description: "Activity details copied to clipboard",
    })
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {showBackupCallout && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">No encrypted backup detected</p>
                  <p className="text-xs text-amber-700">Create a secure backup to protect your vault</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    setShowBackupCallout(false)
                    toast({
                      title: "Backup Created!",
                      description: "Encrypted backup stored securely",
                    })
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBackupCallout(false)}
                  className="text-amber-700 hover:text-amber-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-[#0F766E] rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">ShadowVault</h1>
                  <p className="text-sm text-muted-foreground">Mission Control</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-5">
                <div className="flex items-center gap-3 px-3 py-2 bg-accent/50 rounded-xl">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/diverse-user-avatars.png" />
                    <AvatarFallback className="bg-[#0F766E] text-white text-sm">
                      {user?.email ? user.email.slice(0, 2).toUpperCase() : "JD"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    {/* <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-semibold text-foreground max-w-[120px] truncate">
                          {user?.email || "user@example.com"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user?.email || "user@example.com"}</p>
                      </TooltipContent>
                    </Tooltip> */}
                    <button
                      onClick={copyWalletAddress}
                      className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-2 py-1 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 min-h-[40px] min-w-[40px]"
                    >
                      <span className="whitespace-nowrap">
                        {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "0x1234...5678"}
                      </span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 bg-transparent min-h-[40px]"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Networks
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Network Health Panel</h4>
                        <div className="flex items-center gap-2">
                          <UnifiedChip variant="neutral" size="sm">
                            Testnet
                          </UnifiedChip>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={recheckNetworks}
                            disabled={networkHealthChecking}
                            className="h-6 px-2 bg-transparent"
                          >
                            <RefreshCw className={`w-3 h-3 ${networkHealthChecking ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                      </div>
                      {networks.map((network) => (
                        <div key={network.name} className="space-y-2 p-3 bg-accent/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <network.logo className="w-4 h-4 text-muted-foreground" />
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  network.status === "active"
                                    ? network.failureCount > 0
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <div>
                                <div className="font-medium text-sm">{network.name}</div>
                                <div className="text-xs text-muted-foreground">{network.purpose}</div>
                              </div>
                            </div>
                            <Badge variant={network.failureCount > 0 ? "destructive" : "secondary"} className="text-xs">
                              {network.latency}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="block font-medium">RPC</span>
                              <span>{network.rpcLabel}</span>
                            </div>
                            <div>
                              <span className="block font-medium">Last Check</span>
                              <span>{network.lastCheck}</span>
                            </div>
                            <div>
                              <span className="block font-medium">Failures (1h)</span>
                              <span className={network.failureCount > 0 ? "text-amber-600" : "text-green-600"}>
                                {network.failureCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Link href="/vault/add">
                  <Button className="bg-[#0F766E] hover:bg-[#11867D] text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 disabled:opacity-50 min-h-[40px]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Password
                  </Button>
                </Link>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 bg-transparent min-h-[40px] min-w-[40px]"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign out</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="min-h-[40px] min-w-[40px]"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-card to-card/80 border-primary/20 rounded-xl p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Shield className="w-5 h-5 text-[#0F766E]" />
                    Security Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="animate-pulse">
                      <div className="flex items-center gap-6 mb-6">
                        <div className="w-24 h-24 bg-accent/50 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-8 bg-accent/50 rounded w-24"></div>
                          <div className="h-4 bg-accent/50 rounded w-32"></div>
                          <div className="h-4 bg-accent/50 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-accent/30 rounded-xl p-4 animate-pulse">
                            <div className="h-6 bg-accent/50 rounded w-12 mx-auto mb-2"></div>
                            <div className="h-4 bg-accent/50 rounded w-20 mx-auto"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-6">
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
                                className="text-[#0F766E] transition-all duration-500"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold text-[#0F766E]">{securityScore}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-3xl font-bold text-foreground">{securityScore}/100</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setIsScoreModalOpen(true)}
                                    className="p-1 hover:bg-accent rounded-full focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2"
                                  >
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View security score breakdown</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="text-muted-foreground">Excellent Security</p>
                            <div className="flex items-center gap-1 text-green-600 mt-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-medium">+2 this week</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Link href="/vault" className="group">
                          <div className="bg-accent/30 rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 min-h-[40px]">
                            <div className="text-2xl font-bold text-[#0F766E]">247</div>
                            <p className="text-sm text-muted-foreground">Passwords Secured</p>
                          </div>
                        </Link>
                        <Link href="/networks" className="group">
                          <div className="bg-accent/30 rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 min-h-[40px]">
                            <div className="text-2xl font-bold text-[#0F766E]">2</div>
                            <p className="text-sm text-muted-foreground">Networks Active</p>
                          </div>
                        </Link>
                        <Link href="/security" className="group">
                          <div className="bg-accent/30 rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 min-h-[40px]">
                            <div className="text-2xl font-bold text-[#0F766E]">12</div>
                            <p className="text-sm text-muted-foreground">Auto Checks Today</p>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card className="hover:shadow-md transition-shadow rounded-xl p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, index) => {
                      if (action.isDemo) {
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            className="min-h-24 w-full flex-col gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 min-w-[40px] hover:bg-accent hover:text-accent-foreground col-span-2 bg-transparent"
                            onClick={runDemo}
                            disabled={isDemoRunning}
                          >
                            <action.icon className="w-5 h-5" />
                            <span className="text-xs font-medium text-center">{action.label}</span>
                          </Button>
                        )
                      }

                      return (
                        <Link key={index} href={action.href}>
                          <Button
                            variant={action.primary ? "default" : "outline"}
                            className={`min-h-24 w-full flex-col gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 min-w-[40px] ${
                              action.primary
                                ? "bg-[#0F766E] hover:bg-[#11867D] text-white"
                                : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {action.primary ? (
                              <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                                <action.icon className="w-4 h-4" />
                              </div>
                            ) : (
                              <action.icon className="w-5 h-5" />
                            )}
                            <span className="text-xs font-medium">{action.label}</span>
                          </Button>
                        </Link>
                      )
                    })}
                  </div>

                  {isDemoRunning && (
                    <div className="mt-4 p-4 bg-accent/20 rounded-xl border">
                      <h4 className="font-semibold text-sm mb-3">Demo Progress</h4>
                      <div className="space-y-2">
                        {demoSteps.map((step, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center">
                              {step.status === "completed" && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {step.status === "running" && (
                                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                              )}
                              {step.status === "pending" && <div className="w-2 h-2 bg-muted rounded-full" />}
                            </div>
                            <span className="text-sm flex-1">{step.name}</span>
                            {step.duration && <span className="text-xs text-muted-foreground">{step.duration}ms</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <Card className="hover:shadow-md transition-shadow rounded-xl p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Activity className="w-5 h-5 text-[#0F766E]" />
                    Live Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-accent/20 animate-pulse">
                          <div className="w-5 h-5 bg-accent/50 rounded-full flex-shrink-0 mt-0.5"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-accent/50 rounded w-3/4"></div>
                            <div className="h-3 bg-accent/50 rounded w-1/2"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="h-6 bg-accent/50 rounded w-16"></div>
                            <div className="h-6 bg-accent/50 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className={`flex items-start gap-4 p-3 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors border-l-2 ${getColorRail(activity.severity)} focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 cursor-pointer group min-h-[40px]`}
                          tabIndex={0}
                          role="button"
                          onMouseEnter={() => setHoveredActivity(activity.id)}
                          onMouseLeave={() => setHoveredActivity(null)}
                          onClick={() => handleFeedItemClick(activity)}
                          onKeyDown={(e) => e.key === "Enter" && handleFeedItemClick(activity)}
                        >
                          <div className="flex-shrink-0 mt-0.5">{getStatusIcon(activity.severity)}</div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{activity.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground cursor-help">{activity.time}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>2024-01-15 14:30:25 UTC</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {activity.chains.map((chain) => (
                                <UnifiedChip
                                  key={chain}
                                  variant="neutral"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() => handleChainChipClick(chain)}
                                  tooltip={chain === "Bridge" ? "Copy ID" : "Open in explorer"}
                                >
                                  {chain === "Base" && <Globe className="w-2 h-2" />}
                                  {chain === "Zircuit" && <Shield className="w-2 h-2" />}
                                  {chain === "Bridge" && <Zap className="w-2 h-2" />}
                                  <span className="hidden sm:inline">{chain}</span>
                                </UnifiedChip>
                              ))}
                            </div>
                            {hoveredActivity === activity.id && (
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card className="hover:shadow-md transition-shadow rounded-xl p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <div className="p-2 bg-accent rounded-lg">
                      <Zap className="w-5 h-5 text-accent-foreground" />
                    </div>
                    AI Security Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 px-3 rounded-lg bg-accent/20 animate-pulse"
                        >
                          <div className="space-y-1">
                            <div className="h-4 bg-accent/50 rounded w-24"></div>
                            <div className="h-3 bg-accent/50 rounded w-16"></div>
                          </div>
                          <div className="w-10 h-6 bg-accent/50 rounded-full"></div>
                        </div>
                      ))}
                      <div className="h-10 bg-accent/50 rounded w-full mt-4"></div>
                    </div>
                  ) : (
                    <>
                      {securityStatus.map((item, index) => {
                        const isActive = securityToggles[item.key as keyof typeof securityToggles]
                        return (
                          <div
                            key={index}
                            className={`w-full flex items-center justify-between py-3 px-3 rounded-lg transition-colors min-h-[48px] ${
                              isActive
                                ? "bg-[#0F766E]/10 hover:bg-[#0F766E]/15 border border-[#0F766E]/20"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <div 
                              className="text-left flex-1 cursor-pointer"
                              onClick={() => handleSecurityToggle(item.key)}
                            >
                              <span className="text-sm text-foreground block">{item.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.lastRun ? `Last: ${item.lastRun}` : `Next: ${item.nextRun}`}
                              </span>
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleSecurityToggle(item.key)}
                              className="focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2"
                            />
                          </div>
                        )
                      })}

                      <Link href="/security">
                        <Button className="w-full mt-4 bg-[#0F766E] hover:bg-[#11867D] text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 disabled:opacity-50 min-h-[40px]">
                          <Zap className="w-4 h-4 mr-2" />
                          Open Security Center
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F766E]" />
                Security Score Breakdown
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#0F766E] mb-2">{securityScore}/100</div>
                <p className="text-muted-foreground">Excellent Security Rating</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Password Strength</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">+35 pts</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">ZK Proof Verification</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">+25 pts</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Cross-Chain Security</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">+20 pts</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">AI Threat Detection</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">+14 pts</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Score verified on Zircuit using zero-knowledge proofs
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isFeedDetailsOpen} onOpenChange={setIsFeedDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0F766E]" />
                Activity Details
              </DialogTitle>
            </DialogHeader>
            {selectedFeedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Activity Type</label>
                      <p className="text-sm font-mono mt-1">{selectedFeedItem.type}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Action</label>
                      <p className="text-sm mt-1">{selectedFeedItem.action}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                      <p className="text-sm mt-1">{selectedFeedItem.time}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Severity</label>
                      <Badge
                        variant={selectedFeedItem.severity === "success" ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {selectedFeedItem.severity}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-accent/50 px-2 py-1 rounded flex-1 truncate">
                          0x8f2a3b4c...d0e1f2a
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              "0x8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
                            )
                          }
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              "https://basescan.org/tx/0x8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Block Number</label>
                      <p className="text-sm font-mono mt-1">18,234,567</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gas Used</label>
                      <p className="text-sm font-mono mt-1">142,350</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Networks</label>
                      <div className="flex gap-1 mt-1">
                        {selectedFeedItem.chains.map((chain: string) => (
                          <UnifiedChip key={chain} variant="neutral" size="sm">
                            {chain}
                          </UnifiedChip>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={copyFeedDebugBundle} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Debug Bundle
                  </Button>
                  <Button variant="outline" onClick={() => setIsFeedDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ... existing proof modal code ... */}

        <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F766E]" />
                Proof Verification Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-accent/50 px-2 py-1 rounded flex-1 truncate">
                        {proofDetails.txHash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(proofDetails.txHash)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://explorer.zircuit.com/tx/${proofDetails.txHash}`, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Block Number</label>
                    <p className="text-sm font-mono mt-1">{proofDetails.blockNumber.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gas Used</label>
                    <p className="text-sm font-mono mt-1">{proofDetails.gasUsed}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Circuit Version</label>
                    <Badge variant="secondary" className="mt-1">
                      {proofDetails.circuitVersion}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                    <p className="text-sm mt-1">{new Date(proofDetails.timestamp).toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Policy ID</label>
                    <code className="text-xs bg-accent/50 px-2 py-1 rounded block mt-1">{proofDetails.policyId}</code>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verifying Key Hash</label>
                    <code className="text-xs bg-accent/50 px-2 py-1 rounded block mt-1 truncate">
                      {proofDetails.verifyingKeyHash}
                    </code>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Commitment Hash</label>
                    <code className="text-xs bg-accent/50 px-2 py-1 rounded block mt-1 truncate">
                      {proofDetails.commitmentHash}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Hyperlane Message ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-accent/50 px-2 py-1 rounded flex-1 truncate">
                    {proofDetails.hyperlaneMessageId}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(proofDetails.hyperlaneMessageId)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={copyDebugBundle} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Debug Bundle
                </Button>
                <Button variant="outline" onClick={() => setIsProofModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Link href="/vault/add">
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-[#0F766E] hover:bg-[#11867D] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 disabled:opacity-50"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        <div className="lg:hidden h-20" />
      </div>
    </TooltipProvider>
  )
}
