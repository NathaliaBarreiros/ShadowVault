"use client"

import { useState } from "react"
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
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Globe,
  Save,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Copy,
  Lock,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateAndVerifyZKProof, PasswordStrengthResult } from "../../../lib/noir-integration"
import { useVerifyPasswordStrength, useCommitVaultItem, prepareProofForVerification } from "../../../lib/contract-integration"
import { useAccount } from "wagmi"

interface NetworkOption {
  id: string
  name: string
  speed: string
  cost: string
  color: string
}

export default function AddPasswordPage() {
  const router = useRouter()
  const { address } = useAccount()
  
  // Contract integration hooks
  const { 
    verifyPasswordStrength, 
    isPending: isVerifyingOnChain, 
    isSuccess: onChainVerificationSuccess,
    error: onChainError,
    hash: transactionHash
  } = useVerifyPasswordStrength()
  
  const { 
    commitVaultItem, 
    isPending: isCommitting, 
    isSuccess: commitSuccess 
  } = useCommitVaultItem()
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    category: "",
    network: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [strengthLabel, setStrengthLabel] = useState("No password")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [zkProof, setZkProof] = useState<any>(null)
  const [zkVerified, setZkVerified] = useState<boolean | null>(null)
  const [isGeneratingZK, setIsGeneratingZK] = useState(false)
  const [onChainVerificationStatus, setOnChainVerificationStatus] = useState<string>("")

  const networks: NetworkOption[] = [
    { id: "zircuit", name: "Zircuit", speed: "Fastest", cost: "Low", color: "bg-green-100 text-green-800" },
    { id: "optimism", name: "Optimism", speed: "Fast", cost: "Low", color: "bg-red-100 text-red-800" },
    { id: "arbitrum", name: "Arbitrum", speed: "Fast", cost: "Medium", color: "bg-orange-100 text-orange-800" },
    { id: "polygon", name: "Polygon", speed: "Medium", cost: "Very Low", color: "bg-purple-100 text-purple-800" },
    { id: "ethereum", name: "Ethereum", speed: "Slow", cost: "High", color: "bg-blue-100 text-blue-800" },
  ]

  const categories = [
    { id: "work", name: "Work", icon: "💼" },
    { id: "social", name: "Social", icon: "👥" },
    { id: "finance", name: "Finance", icon: "💰" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "shopping", name: "Shopping", icon: "🛒" },
    { id: "other", name: "Other", icon: "📁" },
  ]

  const analyzePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0)
      setStrengthLabel("No password")
      setAiSuggestions([])
      return
    }

    let score = 0
    const suggestions: string[] = []

    // Length check
    if (password.length >= 12) score += 25
    else if (password.length >= 8) score += 15
    else suggestions.push("Use at least 12 characters")

    // Character variety
    if (/[a-z]/.test(password)) score += 15
    else suggestions.push("Add lowercase letters")

    if (/[A-Z]/.test(password)) score += 15
    else suggestions.push("Add uppercase letters")

    if (/[0-9]/.test(password)) score += 15
    else suggestions.push("Add numbers")

    if (/[^a-zA-Z0-9]/.test(password)) score += 20
    else suggestions.push("Add special characters")

    // Pattern checks
    if (!/(.)\1{2,}/.test(password)) score += 10
    else suggestions.push("Avoid repeating characters")

    setPasswordStrength(Math.min(score, 100))
    setAiSuggestions(suggestions)

    if (score >= 80) setStrengthLabel("Very Strong")
    else if (score >= 60) setStrengthLabel("Strong")
    else if (score >= 40) setStrengthLabel("Medium")
    else if (score >= 20) setStrengthLabel("Weak")
    else setStrengthLabel("Very Weak")
  }

  const generatePassword = async () => {
    setIsGenerating(true)

    // Simulate AI password generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    const len = 24;
    const array = new Uint32Array(len);

    let password = ""
    
    crypto.getRandomValues(array);
    password = Array.from(array, x => chars[x % chars.length]).join('');
    
    setFormData((prev) => ({ ...prev, password }))
    analyzePasswordStrength(password)
    setIsGenerating(false)

    return password;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "password") {
      analyzePasswordStrength(value)
    }
  }

  const copyPassword = async () => {
    await navigator.clipboard.writeText(formData.password)
  }

  const generateZKProof = async () => {
    if (!formData.password) return
    
    setIsGeneratingZK(true)
    setZkProof(null)
    setZkVerified(null)
    
    try {
      const result = await generateAndVerifyZKProof(formData.password)
      console.log('🔐 ZK Proof result:', result)
      console.log('🔐 result.isValid:', result.isValid)
      console.log('🔐 result.proof:', result.proof)
      
      setZkProof(result.proof)
      setZkVerified(result.isValid)
      
      console.log('🔐 ZK Proof generated successfully:', result)
      console.log('🔐 Setting zkVerified to:', result.isValid)
      
      // Force state update
      setTimeout(() => {
        console.log('🔐 zkVerified after timeout:', result.isValid)
        setZkVerified(result.isValid)
      }, 100)
    } catch (error) {
      console.error('❌ Error generating ZK proof:', error)
      setZkVerified(false)
    } finally {
      setIsGeneratingZK(false)
    }
  }

  const verifyOnChain = async () => {
    if (!zkProof || !address) {
      alert("Please generate ZK proof first and ensure wallet is connected")
      return
    }

    try {
      setOnChainVerificationStatus("Preparing proof for blockchain...")
      
      // Prepare proof data for on-chain verification
      const { proof, publicInputs } = prepareProofForVerification(zkProof)
      
      console.log("🔗 Sending proof to Zircuit testnet...", {
        proofLength: proof?.length || 'undefined',
        proofType: typeof proof,
        publicInputs,
        userAddress: address
      })
      
      // Call the smart contract - pass arguments directly, not wrapped in args object
      verifyPasswordStrength({
        proof: proof,
        publicInputs: publicInputs,
        user: address
      })
      
      setOnChainVerificationStatus("Transaction sent! Waiting for confirmation...")
    } catch (error) {
      console.error("❌ Error verifying on-chain:", error)
      setOnChainVerificationStatus("Error: " + (error as Error).message)
    }
  }

  const savePasswordWithVerification = async () => {
    if (!zkProof || !address) {
      alert("Please generate ZK proof first and ensure wallet is connected")
      return
    }

    try {
      setIsSaving(true)
      
      // TODO: Step 1: Create VaultItemCipher (encryption)
      // TODO: Step 2: Upload to IPFS
      // TODO: Step 3: Create ZircuitObject
      
      // For now, we'll just verify the password strength on-chain
      const { proof, publicInputs } = prepareProofForVerification(zkProof)
      
      // Mock data for demonstration
      const itemIdHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      const itemCommitment = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      const itemCipherCID = "QmMockCidForDemonstration"
      
      console.log("🔗 Committing vault item to Zircuit testnet...")
      
      // Commit to smart contract - pass arguments directly, not wrapped in args object
      commitVaultItem({
        itemIdHash: itemIdHash,
        itemCommitment: itemCommitment,
        itemCipherCID: itemCipherCID,
        proof: proof,
        publicInputs: publicInputs
      })
      
    } catch (error) {
      console.error("❌ Error saving password:", error)
      alert("Error saving password: " + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate saving to blockchain
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSaving(false)
    router.push("/vault")
  }

  const getStrengthColor = () => {
    if (passwordStrength >= 80) return "text-green-600"
    if (passwordStrength >= 60) return "text-blue-600"
    if (passwordStrength >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const isFormValid = formData.name && formData.username && formData.password && formData.category && formData.network

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/vault">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Add New Password</h1>
                <p className="text-sm text-muted-foreground">Secure your credentials across chains</p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Password Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Netflix, GitHub, Gmail"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    placeholder="e.g., netflix.com"
                    value={formData.url}
                    onChange={(e) => handleInputChange("url", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username/Email *</Label>
                <Input
                  id="username"
                  placeholder="your.email@example.com"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                />
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password *</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={generatePassword} disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Strong Password
                        </>
                      )}
                    </Button>
                    {formData.password && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={generateZKProof} 
                        disabled={isGeneratingZK}
                      >
                        {isGeneratingZK ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating ZK Proof...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Generate ZK Proof
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter or generate a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    {formData.password && (
                      <Button type="button" variant="ghost" size="sm" onClick={copyPassword}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AI Strength Analysis</span>
                      <span className={`text-sm font-bold ${getStrengthColor()}`}>
                        {passwordStrength}/100 ({strengthLabel})
                      </span>
                    </div>
                    <Progress value={passwordStrength} className="h-2" />

                    {aiSuggestions.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">AI Recommendations:</p>
                            <ul className="text-sm text-orange-700 mt-1 space-y-1">
                              {aiSuggestions.map((suggestion, index) => (
                                <li key={index}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ZK Proof Result */}
                    {zkVerified !== null && (
                      <div className={`border rounded-lg p-3 ${
                        zkVerified 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          {zkVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm font-medium ${
                              zkVerified ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {zkVerified ? 'ZK Proof Valid' : 'ZK Proof Failed'}
                            </p>
                            <p className={`text-sm ${
                              zkVerified ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {zkVerified 
                                ? 'Password strength verified with Zero-Knowledge proof'
                                : 'Password does not meet strength criteria for ZK proof'
                              }
                            </p>
                            {zkProof && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Circuit Hash: {zkProof.circuitHash}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* On-Chain Verification */}
                    {zkVerified === true && (
                      <div className="space-y-3">
                        {/* Debug info */}
                        <div className="text-xs text-muted-foreground">
                          Debug: zkVerified={zkVerified}, address={address ? 'connected' : 'not connected'}, isVerifyingOnChain={isVerifyingOnChain}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={verifyOnChain}
                          disabled={isVerifyingOnChain || !address}
                          className="w-full"
                        >
                          {isVerifyingOnChain ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Verifying on Zircuit...
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-2" />
                              Verify on Zircuit Testnet
                            </>
                          )}
                        </Button>

                        {onChainVerificationStatus && (
                          <div className="text-sm text-muted-foreground">
                            {onChainVerificationStatus}
                          </div>
                        )}

                        {onChainVerificationSuccess && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">
                                  ✅ Verified on Zircuit Testnet!
                                </p>
                                <p className="text-sm text-green-700">
                                  Password strength proof verified on-chain
                                </p>
                                
                                {transactionHash && (
                                  <div className="mt-2 pt-2 border-t border-green-200">
                                    <p className="text-xs text-green-600 mb-1">Transaction Hash:</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800 font-mono">
                                        {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-green-600 hover:text-green-800"
                                        onClick={() => {
                                          const explorerUrl = `https://sepolia.basescan.org/tx/${transactionHash}`;
                                          window.open(explorerUrl, '_blank');
                                        }}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {onChainError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-red-800">
                                  ❌ On-Chain Verification Failed
                                </p>
                                <p className="text-sm text-red-700">
                                  {(() => {
                                    console.log("🔍 onChainError object:", onChainError);
                                    console.log("🔍 onChainError type:", typeof onChainError);
                                    console.log("🔍 onChainError keys:", Object.keys(onChainError || {}));
                                    console.log("🔍 onChainError.message:", onChainError.message);
                                    console.log("🔍 onChainError.message type:", typeof onChainError.message);
                                    return onChainError.message || "Unknown error occurred";
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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

              {/* Network Selection */}
              <div className="space-y-3">
                <Label>Storage Network *</Label>
                <p className="text-sm text-muted-foreground">Choose which blockchain to store your password on</p>
                <div className="grid grid-cols-1 gap-3">
                  {networks.map((network) => (
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this password..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/vault")}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSave}
                  disabled={!isFormValid || isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving to {networks.find((n) => n.id === formData.network)?.name}...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Password
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
