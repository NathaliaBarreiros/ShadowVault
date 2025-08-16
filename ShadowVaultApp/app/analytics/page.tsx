"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, ArrowLeft, BarChart3, TrendingUp, Globe, Clock, Zap, Activity, Settings, Download } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")

  // Cross-chain performance data
  const performanceData = [
    { time: "00:00", ethereum: 180, polygon: 120, zircuit: 95, arbitrum: 140, optimism: 110 },
    { time: "04:00", ethereum: 165, polygon: 115, zircuit: 88, arbitrum: 135, optimism: 105 },
    { time: "08:00", ethereum: 195, polygon: 135, zircuit: 102, arbitrum: 155, optimism: 125 },
    { time: "12:00", ethereum: 210, polygon: 145, zircuit: 98, arbitrum: 160, optimism: 130 },
    { time: "16:00", ethereum: 175, polygon: 125, zircuit: 92, arbitrum: 145, optimism: 115 },
    { time: "20:00", ethereum: 185, polygon: 130, zircuit: 96, arbitrum: 150, optimism: 120 },
  ]

  // Security trends data
  const securityTrends = [
    { date: "Jan 1", score: 78, threats: 12, updates: 3 },
    { date: "Jan 8", score: 82, threats: 8, updates: 5 },
    { date: "Jan 15", score: 85, threats: 6, updates: 4 },
    { date: "Jan 22", score: 89, threats: 4, updates: 6 },
    { date: "Jan 29", score: 92, threats: 3, updates: 2 },
    { date: "Feb 5", score: 94, threats: 2, updates: 3 },
  ]

  // Network usage distribution
  const networkUsage = [
    { name: "Ethereum", value: 35, color: "#3B82F6" },
    { name: "Polygon", value: 25, color: "#8B5CF6" },
    { name: "Zircuit", value: 20, color: "#10B981" },
    { name: "Arbitrum", value: 12, color: "#F59E0B" },
    { name: "Optimism", value: 8, color: "#EF4444" },
  ]

  // Password access patterns
  const accessPatterns = [
    { category: "Work", accesses: 145, avgTime: 95 },
    { category: "Social", accesses: 89, avgTime: 120 },
    { category: "Finance", accesses: 67, avgTime: 180 },
    { category: "Entertainment", accesses: 234, avgTime: 85 },
    { category: "Shopping", accesses: 156, avgTime: 110 },
  ]

  // AI improvement tracking
  const aiImprovements = [
    { week: "Week 1", passwordsUpdated: 12, threatsBlocked: 8, scoreIncrease: 2 },
    { week: "Week 2", passwordsUpdated: 15, threatsBlocked: 12, scoreIncrease: 3 },
    { week: "Week 3", passwordsUpdated: 8, threatsBlocked: 15, scoreIncrease: 1 },
    { week: "Week 4", passwordsUpdated: 18, threatsBlocked: 20, scoreIncrease: 4 },
  ]

  const networkColors = {
    ethereum: "#3B82F6",
    polygon: "#8B5CF6",
    zircuit: "#10B981",
    arbitrum: "#F59E0B",
    optimism: "#EF4444",
  }

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
              <div className="flex items-center justify-center w-10 h-10 bg-secondary rounded-lg">
                <BarChart3 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">Performance insights & optimization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Access Time</p>
                  <p className="text-2xl font-bold text-primary">127ms</p>
                </div>
                <Clock className="w-8 h-8 text-primary/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">12% faster</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cross-Chain Ops</p>
                  <p className="text-2xl font-bold text-secondary">1,247</p>
                </div>
                <Globe className="w-8 h-8 text-secondary/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">8% increase</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Actions</p>
                  <p className="text-2xl font-bold text-accent">53</p>
                </div>
                <Zap className="w-8 h-8 text-accent/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">15% more</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                  <p className="text-2xl font-bold text-primary">94</p>
                </div>
                <Shield className="w-8 h-8 text-primary/20" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+2 points</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cross-Chain Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Globe className="w-5 h-5 text-primary" />
                Cross-Chain Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis label={{ value: "Access Time (ms)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ethereum" stroke={networkColors.ethereum} strokeWidth={2} />
                  <Line type="monotone" dataKey="polygon" stroke={networkColors.polygon} strokeWidth={2} />
                  <Line type="monotone" dataKey="zircuit" stroke={networkColors.zircuit} strokeWidth={2} />
                  <Line type="monotone" dataKey="arbitrum" stroke={networkColors.arbitrum} strokeWidth={2} />
                  <Line type="monotone" dataKey="optimism" stroke={networkColors.optimism} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Security Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Shield className="w-5 h-5 text-primary" />
                Security Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={securityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="score" stackId="1" stroke="#164e63" fill="#164e63" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Network Usage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Activity className="w-5 h-5 text-secondary" />
                Network Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={networkUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {networkUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {networkUsage.map((network) => (
                  <div key={network.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: network.color }} />
                      <span className="text-sm">{network.name}</span>
                    </div>
                    <span className="text-sm font-medium">{network.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Access Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <BarChart3 className="w-5 h-5 text-accent" />
                Access Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={accessPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accesses" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {accessPatterns.map((pattern) => (
                  <div key={pattern.category} className="flex items-center justify-between text-sm">
                    <span>{pattern.category}</span>
                    <span className="text-muted-foreground">{pattern.avgTime}ms avg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Improvements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Zap className="w-5 h-5 text-accent" />
                AI Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={aiImprovements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passwordsUpdated" fill="#10B981" />
                  <Bar dataKey="threatsBlocked" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Score Increase</span>
                  <span className="font-bold text-green-600">+10 points</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Weekly Improvement</span>
                  <span className="font-bold text-primary">+2.5 points</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-sm">Network Optimization</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Move 15 passwords from Ethereum to Zircuit for 40% faster access times.
                </p>
                <Button size="sm" variant="outline">
                  Apply Suggestion
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">AI Automation</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Enable auto-rotation for entertainment passwords to improve security score by 3 points.
                </p>
                <Button size="sm" variant="outline">
                  Enable Auto-Rotation
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <h4 className="font-semibold text-sm">Usage Patterns</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Pre-cache work passwords during business hours for instant access.
                </p>
                <Button size="sm" variant="outline">
                  Configure Caching
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
