"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  ArrowLeft,
  Globe,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface Network {
  id: string
  name: string
  chainId: number
  status: "active" | "syncing" | "offline"
  avgLatency: number
  passwordCount: number
  gasPrice: string
  lastSync: string
  color: string
  isPreferred: boolean
}

interface CrossChainOperation {
  id: string
  type: "retrieve" | "sync" | "backup"
  fromNetwork: string
  toNetwork: string
  status: "pending" | "success" | "failed"
  timestamp: string
  latency: number
}

export default function NetworksPage() {
  const [autoOptimization, setAutoOptimization] = useState(true)
  const [preferredNetwork, setPreferredNetwork] = useState("zircuit")
  const [syncInProgress, setSyncInProgress] = useState(false)

  const networks: Network[] = [
    {
      id: "ethereum",
      name: "Ethereum",
      chainId: 1,
      status: "active",
      avgLatency: 180,
      passwordCount: 87,
      gasPrice: "25 gwei",
      lastSync: "2 minutes ago",
      color: "#3B82F6",
      isPreferred: false,
    },
    {
      id: "polygon",
      name: "Polygon",
      chainId: 137,
      status: "active",
      avgLatency: 120,
      passwordCount: 62,
      gasPrice: "30 gwei",
      lastSync: "1 minute ago",
      color: "#8B5CF6",
      isPreferred: false,
    },
    {
      id: "zircuit",
      name: "Zircuit",
      chainId: 48900,
      status: "active",
      avgLatency: 95,
      passwordCount: 98,
      gasPrice: "0.1 gwei",
      lastSync: "30 seconds ago",
      color: "#10B981",
      isPreferred: true,
    },
    {
      id: "arbitrum",
      name: "Arbitrum",
      chainId: 42161,
      status: "syncing",
      avgLatency: 140,
      passwordCount: 45,
      gasPrice: "0.5 gwei",
      lastSync: "5 minutes ago",
      color: "#F59E0B",
      isPreferred: false,
    },
    {
      id: "optimism",
      name: "Optimism",
      chainId: 10,
      status: "active",
      avgLatency: 110,
      passwordCount: 33,
      gasPrice: "0.3 gwei",
      lastSync: "3 minutes ago",
      color: "#EF4444",
      isPreferred: false,
    },
  ]

  const recentOperations: CrossChainOperation[] = [
    {
      id: "1",
      type: "retrieve",
      fromNetwork: "Ethereum",
      toNetwork: "Current Session",
      status: "success",
      timestamp: "2 minutes ago",
      latency: 180,
    },
    {
      id: "2",
      type: "sync",
      fromNetwork: "Zircuit",
      toNetwork: "Polygon",
      status: "success",
      timestamp: "15 minutes ago",
      latency: 95,
    },
    {
      id: "3",
      type: "backup",
      fromNetwork: "Ethereum",
      toNetwork: "Arbitrum",
      status: "pending",
      timestamp: "1 hour ago",
      latency: 0,
    },
    {
      id: "4",
      type: "retrieve",
      fromNetwork: "Polygon",
      toNetwork: "Current Session",
      status: "success",
      timestamp: "3 hours ago",
      latency: 120,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      case "offline":
        return <WifiOff className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "retrieve":
        return <Globe className="w-4 h-4 text-blue-600" />
      case "sync":
        return <RefreshCw className="w-4 h-4 text-green-600" />
      case "backup":
        return <Shield className="w-4 h-4 text-orange-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const handleSyncAll = async () => {
    setSyncInProgress(true)
    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setSyncInProgress(false)
  }

  const totalPasswords = networks.reduce((sum, network) => sum + network.passwordCount, 0)
  const avgLatency = Math.round(networks.reduce((sum, network) => sum + network.avgLatency, 0) / networks.length)
  const activeNetworks = networks.filter((n) => n.status === "active").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Globe className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Cross-Chain Networks</h1>
                <p className="text-sm text-muted-foreground">Manage multi-chain infrastructure</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">
                <Wifi className="w-3 h-3 mr-1" />
                {activeNetworks} Networks Active
              </Badge>
              <Button onClick={handleSyncAll} disabled={syncInProgress} variant="outline" size="sm">
                {syncInProgress ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync All
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Passwords</p>
                  <p className="text-2xl font-bold text-primary">{totalPasswords}</p>
                </div>
                <Shield className="w-8 h-8 text-primary/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">Distributed across {networks.length} networks</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <p className="text-2xl font-bold text-secondary">{avgLatency}ms</p>
                </div>
                <Clock className="w-8 h-8 text-secondary/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">15% faster this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Networks</p>
                  <p className="text-2xl font-bold text-accent">{activeNetworks}</p>
                </div>
                <Globe className="w-8 h-8 text-accent/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">All systems operational</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cross-Chain Ops</p>
                  <p className="text-2xl font-bold text-primary">1,247</p>
                </div>
                <Activity className="w-8 h-8 text-primary/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">8% increase today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Network Status */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Globe className="w-5 h-5 text-primary" />
                  Network Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {networks.map((network) => (
                    <div
                      key={network.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(network.status)}
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: network.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{network.name}</h4>
                            {network.isPreferred && (
                              <Badge variant="outline" className="text-xs">
                                Preferred
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Chain ID: {network.chainId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Passwords</p>
                            <p className="font-semibold">{network.passwordCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Latency</p>
                            <p className="font-semibold">{network.avgLatency}ms</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gas</p>
                            <p className="font-semibold">{network.gasPrice}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Last sync: {network.lastSync}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cross-Chain Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-card-foreground">Cross-Chain Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Preferred Network</label>
                  <Select value={preferredNetwork} onValueChange={setPreferredNetwork}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: network.color }} />
                            {network.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    New passwords will be stored on this network by default
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-Optimization</p>
                    <p className="text-xs text-muted-foreground">Automatically move passwords to faster networks</p>
                  </div>
                  <Switch checked={autoOptimization} onCheckedChange={setAutoOptimization} />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Network Performance</h4>
                  {networks.slice(0, 3).map((network) => (
                    <div key={network.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>{network.name}</span>
                        <span>{network.avgLatency}ms</span>
                      </div>
                      <Progress value={Math.max(0, 100 - network.avgLatency / 3)} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Cross-Chain Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Activity className="w-5 h-5 text-accent" />
              Recent Cross-Chain Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOperations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getOperationIcon(operation.type)}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} Operation
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {operation.fromNetwork} → {operation.toNetwork}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {operation.latency > 0 && (
                      <span className="text-xs text-muted-foreground">{operation.latency}ms</span>
                    )}
                    <span className="text-xs text-muted-foreground">{operation.timestamp}</span>
                    <Badge
                      variant={
                        operation.status === "success"
                          ? "default"
                          : operation.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {operation.status === "success" && <CheckCircle className="w-2 h-2 mr-1" />}
                      {operation.status === "pending" && <Clock className="w-2 h-2 mr-1" />}
                      {operation.status === "failed" && <AlertTriangle className="w-2 h-2 mr-1" />}
                      {operation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
