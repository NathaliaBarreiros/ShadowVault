"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  ArrowLeft,
  Upload,
  File,
  Image,
  FileText,
  Award,
  Save,
  AlertCircle,
  CheckCircle,
  Globe,
  Eye,
  EyeOff,
  X,
  Loader2,
  Key,
  Clock,
  Tag,
  Wallet
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSealVault, useFileUpload } from "@/lib/seal/hooks"
import { SealFormData } from "@/lib/seal/types"

interface NetworkOption {
  id: string
  name: string
  speed: string
  cost: string
  color: string
  sealSupported: boolean
}

interface AccessPolicyOption {
  id: string
  name: string
  description: string
  threshold: number
  security: 'basic' | 'enhanced' | 'maximum'
}

export default function AddSealPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { createSeal, loading } = useSealVault()
  const { 
    file, 
    preview, 
    uploading, 
    progress, 
    selectFile, 
    clearFile 
  } = useFileUpload()

  const [formData, setFormData] = useState<Omit<SealFormData, 'file'>>({
    name: "",
    description: "",
    type: "document",
    category: "",
    tags: [],
    threshold: 2,
    accessPolicy: "",
    network: "zircuit",
  })

  const [currentTag, setCurrentTag] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const networks: NetworkOption[] = [
    { 
      id: "zircuit", 
      name: "Zircuit", 
      speed: "Fastest", 
      cost: "Low", 
      color: "bg-green-100 text-green-800",
      sealSupported: true 
    },
    { 
      id: "optimism", 
      name: "Optimism", 
      speed: "Fast", 
      cost: "Low", 
      color: "bg-red-100 text-red-800",
      sealSupported: true 
    },
    { 
      id: "arbitrum", 
      name: "Arbitrum", 
      speed: "Fast", 
      cost: "Medium", 
      color: "bg-orange-100 text-orange-800",
      sealSupported: false 
    },
    { 
      id: "polygon", 
      name: "Polygon", 
      speed: "Medium", 
      cost: "Very Low", 
      color: "bg-purple-100 text-purple-800",
      sealSupported: true 
    },
    { 
      id: "ethereum", 
      name: "Ethereum", 
      speed: "Slow", 
      cost: "High", 
      color: "bg-blue-100 text-blue-800",
      sealSupported: false 
    },
  ]

  const documentTypes = [
    { id: "document", name: "Document", icon: FileText, description: "General documents, PDFs, text files" },
    { id: "contract", name: "Contract", icon: Award, description: "Legal contracts, agreements" },
    { id: "certificate", name: "Certificate", icon: Shield, description: "Certificates, credentials, licenses" },
    { id: "image", name: "Image", icon: Image, description: "Photos, diagrams, illustrations" },
    { id: "other", name: "Other", icon: File, description: "Any other file type" },
  ]

  const accessPolicies: AccessPolicyOption[] = [
    {
      id: "personal",
      name: "Personal Access",
      description: "Only you can access this document",
      threshold: 2,
      security: 'basic'
    },
    {
      id: "shared",
      name: "Shared Access",
      description: "Share with specific users",
      threshold: 2,
      security: 'enhanced'
    },
    {
      id: "organization",
      name: "Organization",
      description: "Organization-wide access control",
      threshold: 3,
      security: 'enhanced'
    },
    {
      id: "high_security",
      name: "High Security",
      description: "Maximum security for sensitive documents",
      threshold: 3,
      security: 'maximum'
    }
  ]

  const categories = [
    { id: "legal", name: "Legal", icon: "⚖️" },
    { id: "medical", name: "Medical", icon: "🏥" },
    { id: "financial", name: "Financial", icon: "💰" },
    { id: "personal", name: "Personal", icon: "👤" },
    { id: "business", name: "Business", icon: "💼" },
    { id: "education", name: "Education", icon: "🎓" },
    { id: "other", name: "Other", icon: "📁" },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Auto-set threshold based on access policy
    if (field === 'accessPolicy') {
      const policy = accessPolicies.find(p => p.id === value)
      if (policy) {
        setFormData((prev) => ({ ...prev, threshold: policy.threshold }))
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      selectFile(selectedFile)
      
      // Auto-fill name if empty
      if (!formData.name) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "")
        setFormData(prev => ({ ...prev, name: nameWithoutExt }))
      }
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSave = async () => {
    if (!address) {
      console.error('No wallet address available')
      return
    }

    if (!file) {
      console.error('No file selected')
      return
    }

    setIsSaving(true)

    try {
      console.log('[AddSeal] 🔐 Starting seal creation process...')
      
      const sealFormData: SealFormData = {
        ...formData,
        file
      }

      console.log('[AddSeal] 📋 Seal form data:', {
        name: sealFormData.name,
        type: sealFormData.type,
        filename: file.name,
        fileSize: file.size,
        threshold: sealFormData.threshold,
        accessPolicy: sealFormData.accessPolicy,
        network: sealFormData.network
      })

      const result = await createSeal(sealFormData)

      if (result.success && result.sealEntry) {
        console.log('[AddSeal] ✅ Seal created successfully!', {
          sealId: result.sealEntry.id,
          blobId: result.blobId,
          suiObjectId: result.suiObjectId
        })

        router.push("/seals")
      } else {
        console.error('[AddSeal] ❌ Seal creation failed:', result.error)
      }

    } catch (error) {
      console.error('[AddSeal] ❌ Error during seal creation:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getThresholdDescription = (threshold: number) => {
    switch (threshold) {
      case 1: return "Low security - Only 1 server required"
      case 2: return "Standard security - 2 of 3 servers required"
      case 3: return "High security - 3 of 3 servers required"
      default: return `${threshold} servers required for decryption`
    }
  }

  const isFormValid = isConnected && address && formData.name && formData.type && formData.category && 
                      formData.network && formData.accessPolicy && file

  const selectedPolicy = accessPolicies.find(p => p.id === formData.accessPolicy)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/seals">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Add New Seal</h1>
                <p className="text-sm text-muted-foreground">Encrypt and store documents securely</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              <Key className="w-3 h-3 mr-1" />
              IBE Encryption
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
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
                        Connect your wallet to create and seal documents
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-4">
                <Label>Document File *</Label>
                {!file ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept="*/*"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports all file types • Max 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <File className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearFile}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {preview && (
                      <div className="mt-3">
                        <img src={preview} alt="Preview" className="max-w-full h-32 object-cover rounded" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Employment Contract, Medical Records"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the document..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Access Policy */}
              <div className="space-y-3">
                <Label>Access Policy *</Label>
                <div className="grid grid-cols-1 gap-3">
                  {accessPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.accessPolicy === policy.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleInputChange("accessPolicy", policy.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              formData.accessPolicy === policy.id ? "bg-primary" : "bg-muted"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{policy.name}</span>
                              <Badge 
                                className={
                                  policy.security === 'basic' ? 'bg-blue-100 text-blue-800' :
                                  policy.security === 'enhanced' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                <Key className="w-3 h-3 mr-1" />
                                {policy.security}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{policy.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Threshold: {policy.threshold} servers required
                            </p>
                          </div>
                        </div>
                        {formData.accessPolicy === policy.id && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Advanced Settings</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showAdvanced ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 border border-border rounded-lg p-4">
                    {/* Threshold Setting */}
                    <div className="space-y-2">
                      <Label>Encryption Threshold: {formData.threshold}</Label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="1"
                          max="3"
                          value={formData.threshold}
                          onChange={(e) => handleInputChange("threshold", e.target.value)}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">
                          {getThresholdDescription(formData.threshold)}
                        </p>
                      </div>
                    </div>

                    {/* Expiration */}
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={formData.expiresAt || ""}
                        onChange={(e) => handleInputChange("expiresAt", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Network Selection */}
              <div className="space-y-3">
                <Label>Storage Network *</Label>
                <p className="text-sm text-muted-foreground">Choose which blockchain to store your seal on</p>
                <div className="grid grid-cols-1 gap-3">
                  {networks.filter(network => network.sealSupported).map((network) => (
                    <div
                      key={network.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.network === network.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleInputChange("network", network.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              formData.network === network.id ? "bg-primary" : "bg-muted"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{network.name}</span>
                              <Badge className={network.color}>
                                <Globe className="w-3 h-3 mr-1" />
                                {network.speed}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Gas cost: {network.cost}</p>
                          </div>
                        </div>
                        {formData.network === network.id && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Summary */}
              {selectedPolicy && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-800">Encryption Summary</p>
                      <p className="text-sm text-purple-700 mt-1">
                        Your document will be encrypted using Identity-Based Encryption (IBE) with {selectedPolicy.security} security.
                        {selectedPolicy.threshold} of 3 key servers will be required for decryption.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/seals")}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSave}
                  disabled={!isFormValid || isSaving || loading}
                >
                  {isSaving || loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Seal...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Seal
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}