"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  Search,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Star,
  Filter,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Clock,
} from "lucide-react"
import Link from "next/link"

interface PasswordEntry {
  id: string
  name: string
  username: string
  password: string
  url: string
  network: "ethereum" | "polygon" | "zircuit" | "arbitrum" | "optimism"
  aiStrength: number
  lastAccessed: string
  category: "social" | "work" | "finance" | "entertainment" | "shopping"
  isFavorite: boolean
  needsUpdate: boolean
}

export default function VaultPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [copyingId, setCopyingId] = useState<string | null>(null)

  const passwords: PasswordEntry[] = [
    {
      id: "1",
      name: "Netflix",
      username: "john.doe@email.com",
      password: "SecurePass123!",
      url: "netflix.com",
      network: "ethereum",
      aiStrength: 92,
      lastAccessed: "2 minutes ago",
      category: "entertainment",
      isFavorite: true,
      needsUpdate: false,
    },
    {
      id: "2",
      name: "GitHub",
      username: "johndoe",
      password: "OldPassword456",
      url: "github.com",
      network: "polygon",
      aiStrength: 45,
      lastAccessed: "15 minutes ago",
      category: "work",
      isFavorite: false,
      needsUpdate: true,
    },
    {
      id: "3",
      name: "LinkedIn",
      username: "john.doe@email.com",
      password: "NewSecure789#",
      url: "linkedin.com",
      network: "zircuit",
      aiStrength: 96,
      lastAccessed: "1 hour ago",
      category: "work",
      isFavorite: true,
      needsUpdate: false,
    },
    {
      id: "4",
      name: "Chase Bank",
      username: "johndoe123",
      password: "BankSecure2024$",
      url: "chase.com",
      network: "arbitrum",
      aiStrength: 88,
      lastAccessed: "3 hours ago",
      category: "finance",
      isFavorite: false,
      needsUpdate: false,
    },
    {
      id: "5",
      name: "Amazon",
      username: "john.doe@email.com",
      password: "ShopSafe456!",
      url: "amazon.com",
      network: "optimism",
      aiStrength: 78,
      lastAccessed: "1 day ago",
      category: "shopping",
      isFavorite: false,
      needsUpdate: false,
    },
  ]

  const networkColors = {
    ethereum: "bg-blue-100 text-blue-800",
    polygon: "bg-purple-100 text-purple-800",
    zircuit: "bg-green-100 text-green-800",
    arbitrum: "bg-orange-100 text-orange-800",
    optimism: "bg-red-100 text-red-800",
  }

  const categoryIcons = {
    social: "👥",
    work: "💼",
    finance: "💰",
    entertainment: "🎬",
    shopping: "🛒",
  }

  const filteredPasswords = passwords.filter(
    (password) =>
      password.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.url.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyPassword = async (password: PasswordEntry) => {
    setCopyingId(password.id)

    // Simulate cross-chain retrieval delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    await navigator.clipboard.writeText(password.password)
    setCopyingId(null)
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-600"
    if (strength >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return "Strong"
    if (strength >= 60) return "Medium"
    return "Weak"
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
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Password Vault</h1>
                <p className="text-sm text-muted-foreground">{filteredPasswords.length} passwords secured</p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground">Welcome, {user.email}</p>
                )}
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              <Link href="/vault/add">Add Password</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search passwords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Password Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasswords.map((password) => (
            <Card key={password.id} className="relative hover:shadow-lg transition-shadow">
              {password.isFavorite && <Star className="absolute top-3 right-3 w-4 h-4 text-yellow-500 fill-current" />}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[password.category]}</span>
                    {password.name}
                  </CardTitle>
                  {password.needsUpdate && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={networkColors[password.network]}>
                    <Globe className="w-3 h-3 mr-1" />
                    {password.network}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {password.url}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Username */}
                <div>
                  <label className="text-xs text-muted-foreground">Username</label>
                  <p className="text-sm font-medium truncate">{password.username}</p>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs text-muted-foreground">Password</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono flex-1 truncate">
                      {showPasswords[password.id] ? password.password : "••••••••••••"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(password.id)}>
                      {showPasswords[password.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* AI Strength Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI Strength Score
                    </label>
                    <span className={`text-sm font-bold ${getStrengthColor(password.aiStrength)}`}>
                      {password.aiStrength}/100 ({getStrengthLabel(password.aiStrength)})
                    </span>
                  </div>
                  <Progress value={password.aiStrength} className="h-2" />
                  {password.needsUpdate && (
                    <p className="text-xs text-orange-600 mt-1">AI recommends updating this password</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {password.lastAccessed}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyPassword(password)}
                    disabled={copyingId === password.id}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    {copyingId === password.id ? (
                      <>
                        <Globe className="w-3 h-3 mr-1 animate-spin" />
                        Retrieving...
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPasswords.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No passwords found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Start by adding your first password"}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              <Link href="/vault/add">Add Password</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
