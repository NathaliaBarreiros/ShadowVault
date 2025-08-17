"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  Plus,
  Search,
  Download,
  ExternalLink,
  ArrowLeft,
  Filter,
  Star,
  AlertTriangle,
  Globe,
  Clock,
  FileText,
  Image,
  File,
  Award,
  Eye,
  Loader2,
  Wallet
} from "lucide-react"
import Link from "next/link"
import { useSealVault, useSealSearch } from "@/lib/seal/hooks"
import { SealEntry } from "@/lib/seal/types"

export default function SealsPage() {
  const { address, isConnected } = useAccount()
  const {
    seals,
    loading,
    error,
    retrieveSeal,
    selectSeal,
    clearError
  } = useSealVault()

  const {
    searchState,
    filteredSeals,
    setQuery,
    setFilters,
    clearFilters
  } = useSealSearch(seals)

  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const networkColors = {
    ethereum: "bg-blue-100 text-blue-800",
    polygon: "bg-purple-100 text-purple-800", 
    zircuit: "bg-green-100 text-green-800",
    arbitrum: "bg-orange-100 text-orange-800",
    optimism: "bg-red-100 text-red-800",
  }

  const typeIcons = {
    document: FileText,
    contract: Award,
    certificate: Shield,
    image: Image,
    other: File,
  }

  const getStatusColor = (status: SealEntry['status']) => {
    switch (status) {
      case 'sealed': return 'text-green-600'
      case 'accessible': return 'text-blue-600'
      case 'expired': return 'text-red-600'
      case 'error': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusLabel = (status: SealEntry['status']) => {
    switch (status) {
      case 'sealed': return 'Sealed'
      case 'accessible': return 'Accessible'
      case 'expired': return 'Expired'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async (seal: SealEntry) => {
    setDownloadingId(seal.id)

    try {
      console.log('[SealsPage] 📥 Downloading seal:', seal.name)
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const result = await retrieveSeal(seal)
      
      if (result.success && result.data && result.filename) {
        // Create download blob and trigger download
        const blob = new Blob([result.data], { type: result.mimeType || 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        console.log('[SealsPage] ✅ Download completed:', result.filename)
      } else {
        console.error('[SealsPage] ❌ Download failed:', result.error)
      }
    } catch (error) {
      console.error('[SealsPage] ❌ Download error:', error)
    } finally {
      setDownloadingId(null)
    }
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
                <h1 className="text-xl font-bold text-foreground">Seal Vault</h1>
                <p className="text-sm text-muted-foreground">{filteredSeals.length} documents sealed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-100 text-purple-800">
                <Shield className="w-3 h-3 mr-1" />
                IBE Encrypted
              </Badge>
              <Button 
                className="bg-primary hover:bg-primary/90"
                disabled={!isConnected}
              >
                <Plus className="w-4 h-4 mr-2" />
                <Link href={isConnected ? "/seals/add" : "#"}>Add Seal</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Wallet Connection Check */}
        {!isConnected && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Wallet Not Connected</p>
                    <p className="text-sm text-orange-700">
                      Connect your wallet to view and manage your sealed documents
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Address Display */}
        {isConnected && address && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="w-4 h-4" />
              <span>Wallet: {address.slice(0, 6)}...{address.slice(-4)}</span>
              <Badge variant="outline" className="text-xs">Connected</Badge>
            </div>
          </div>
        )}
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search seals..."
              value={searchState.query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          {(searchState.query || Object.keys(searchState.filters).length > 0) && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-muted-foreground">Loading seals...</p>
            </div>
          </div>
        )}

        {/* Seals Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeals.map((seal) => {
              const TypeIcon = typeIcons[seal.type]
              return (
                <Card key={seal.id} className="relative hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TypeIcon className="w-5 h-5 text-primary" />
                        {seal.name}
                      </CardTitle>
                      {seal.metadata.tags.includes('important') && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={networkColors[seal.network as keyof typeof networkColors] || "bg-gray-100 text-gray-800"}>
                        <Globe className="w-3 h-3 mr-1" />
                        {seal.network}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {seal.type}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(seal.status)}>
                        {getStatusLabel(seal.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* File Info */}
                    <div>
                      <label className="text-xs text-muted-foreground">File</label>
                      <p className="text-sm font-medium truncate">{seal.originalFilename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(seal.fileSize)} • {seal.mimeType}
                      </p>
                    </div>

                    {/* Description */}
                    {seal.description && (
                      <div>
                        <label className="text-xs text-muted-foreground">Description</label>
                        <p className="text-sm text-muted-foreground line-clamp-2">{seal.description}</p>
                      </div>
                    )}

                    {/* Encryption Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Encryption
                        </label>
                        <span className="text-sm font-bold text-purple-600">
                          {seal.encryptedData.threshold}-of-{seal.encryptedData.servers.length} IBE
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: {seal.encryptedData.threshold} servers required
                      </div>
                    </div>

                    {/* Tags */}
                    {seal.metadata.tags.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground">Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {seal.metadata.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {seal.metadata.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{seal.metadata.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {seal.lastAccessed ? (
                          <>Last: {new Date(seal.lastAccessed).toLocaleDateString()}</>
                        ) : (
                          'Never accessed'
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectSeal(seal)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(seal)}
                          disabled={downloadingId === seal.id}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          {downloadingId === seal.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Decrypting...
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Access Count */}
                    <div className="text-xs text-muted-foreground">
                      Accessed {seal.accessCount} time{seal.accessCount !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSeals.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No seals found</h3>
            <p className="text-muted-foreground mb-4">
              {searchState.query || Object.keys(searchState.filters).length > 0
                ? "Try adjusting your search terms or filters"
                : "Start by adding your first sealed document"}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              <Link href="/seals/add">Add Seal</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}