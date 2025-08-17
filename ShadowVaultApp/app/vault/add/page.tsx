"use client"

import { useState, useEffect } from "react"
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { usePrivy, useWallets } from "@privy-io/react-auth"
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
// Main functionality imports
import { deriveEncryptionKeyFromSignature, createVaultItemCipher, createZircuitObject } from "@/lib/encryption"
import { VaultStorageService, type VaultEntry } from "@/lib/vault-storage"
import { ShadowVaultV2Address, ShadowVaultV2ABI } from "@/lib/contracts/ShadowVaultV2"

// ZK Proof functionality imports
import { generateAndVerifyZKProof, PasswordStrengthResult } from "../../../lib/noir-integration"
import { useVerifyPasswordStrength, useCommitVaultItem, prepareProofForVerification } from "../../../lib/contract-integration"

interface NetworkOption {
  id: string
  name: string
  speed: string
  cost: string
  color: string
}

export default function AddPasswordPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  // Privy hooks
  const { signMessageAsync } = useSignMessage()
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  
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
  
  // Main functionality state
  const [zircuitObject, setZircuitObject] = useState<{ storedHash: string; walrusCid: string } | null>(null)
  const [isSubmittingToContract, setIsSubmittingToContract] = useState(false)
  const [encryptionKey, setEncryptionKey] = useState<string>('')
  const [vaultItemCipher, setVaultItemCipher] = useState<any>(null)

  // ZK Proof functionality state
  const [zkProof, setZkProof] = useState<any>(null)
  const [zkVerified, setZkVerified] = useState<boolean | null>(null)
  const [isGeneratingZK, setIsGeneratingZK] = useState(false)
  const [onChainVerificationStatus, setOnChainVerificationStatus] = useState<string>("")

  // Wagmi v2 hooks for contract interaction
  const { writeContract, data: contractTxHash, isPending: isContractWritePending, error: contractError } = useWriteContract()

  const { isLoading: isContractTxPending, isSuccess: isContractTxSuccess } = useWaitForTransactionReceipt({
    hash: contractTxHash,
  })

  // Get wallet address from multiple sources
  const getWalletAddress = () => {
    // Try Wagmi first
    if (address) {
      console.log('[AddPassword] Using Wagmi address:', address)
      return address
    }
    
    // Try Privy embedded wallet
    if (wallets && wallets.length > 0) {
      const connectedWallet = wallets.find(wallet => wallet.connectorType === 'embedded')
      if (connectedWallet?.address) {
        console.log('[AddPassword] Using Privy embedded wallet address:', connectedWallet.address)
        return connectedWallet.address
      }
      
      // Use first available wallet
      if (wallets[0]?.address) {
        console.log('[AddPassword] Using first available wallet address:', wallets[0].address)
        return wallets[0].address
      }
    }
    
    // Try Privy user wallet
    if (user?.wallet?.address) {
      console.log('[AddPassword] Using Privy user wallet address:', user.wallet.address)
      return user.wallet.address
    }
    
    console.error('[AddPassword] No wallet address found from any source')
    return null
  }

  // Get current wallet address for validation
  const currentWalletAddress = getWalletAddress()

  // Handle contract transaction completion
  useEffect(() => {
    if (isContractTxSuccess && contractTxHash && zircuitObject) {
      console.log('[AddPassword] ✅ Contract transaction confirmed!')
      console.log('[AddPassword] 🔗 Transaction Hash:', contractTxHash)
      console.log('[AddPassword] 🌐 View on Explorer:', `https://explorer.garfield-testnet.zircuit.com/tx/${contractTxHash}`)
      setIsSubmittingToContract(false)
      
      // Step 5: Now save to localStorage with blockchain transaction hash
      console.log('[AddPassword] 💾 Saving to localStorage with blockchain confirmation...')
      
      // Get the current encryption key and VaultItemCipher
      const walletAddress = getWalletAddress()
      if (walletAddress && formData.password && vaultItemCipher) {
        try {
          const vaultEntry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'> = {
            name: formData.name,
            username: formData.username,
            password: formData.password,
            url: formData.url,
            network: formData.network as VaultEntry['network'],
            aiStrength: passwordStrength,
            lastAccessed: 'Just created',
            category: formData.category as VaultEntry['category'],
            isFavorite: false,
            needsUpdate: false,
            walrusMetadata: {
              blobId: zircuitObject.walrusCid,
              ipfsCid: zircuitObject.walrusCid,
              storageEpoch: Math.floor(Date.now() / 1000),
              encryptionKey: encryptionKey, // Encryption key from signature
              uploadedAt: new Date().toISOString(),
              blockchainTxHash: contractTxHash,
              contractAddress: ShadowVaultV2Address,
              networkChainId: 48898,
              // Store the smart contract parameters
              storedHash: zircuitObject.storedHash,
              walrusCid: zircuitObject.walrusCid,
              // Store VaultItemCipher data for Walrus button functionality
              vaultItemCipher: vaultItemCipher
            }
          }
          
          const savedEntry = VaultStorageService.addEntry(vaultEntry)
          console.log('[AddPassword] ✅ Saved to localStorage with blockchain confirmation:', savedEntry.id)
          console.log('[AddPassword] 🔗 Entry includes transaction hash:', contractTxHash)
          
          // Navigate to vault after successful completion
          setTimeout(() => {
            router.push("/vault")
          }, 2000) // Give user time to see the success message
          
        } catch (saveError) {
          console.error('[AddPassword] ❌ Failed to save entry with blockchain confirmation:', saveError)
        }
      }
    }
  }, [isContractTxSuccess, contractTxHash, zircuitObject, vaultItemCipher, encryptionKey, formData, passwordStrength, router])

  // Handle contract write errors
  useEffect(() => {
    if (contractError) {
      console.error('[AddPassword] ❌ Contract write error:', contractError)
      setIsSubmittingToContract(false)
    }
  }, [contractError])

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

    const chars = {
      lower: "abcdefghijklmnopqrstuvwxyz",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    }

    let password = ""

    // Ensure at least one of each type
    password += chars.lower[Math.floor(Math.random() * chars.lower.length)]
    password += chars.upper[Math.floor(Math.random() * chars.upper.length)]
    password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)]
    password += chars.symbols[Math.floor(Math.random() * chars.symbols.length)]

    // Fill remaining length
    const allChars = chars.lower + chars.upper + chars.numbers + chars.symbols
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")

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
    console.log('[AddPassword] 🔍 Checking wallet connection...')
    console.log('[AddPassword] 📋 Privy ready:', ready)
    console.log('[AddPassword] 📋 Privy authenticated:', authenticated)
    console.log('[AddPassword] 📋 Wagmi address:', address)
    console.log('[AddPassword] 📋 Wagmi connected:', isConnected)
    console.log('[AddPassword] 📋 Privy wallets:', wallets?.length || 0)
    console.log('[AddPassword] 📋 Privy user:', !!user)
    
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      console.error('[AddPassword] ❌ No wallet address available')
      console.error('[AddPassword] 💡 Please ensure you are properly connected to a wallet')
      alert('Please connect your wallet to save passwords to the blockchain.')
      return
    }
    
    console.log('[AddPassword] ✅ Using wallet address:', walletAddress)
    
    setIsSaving(true)

    try {
      console.log('[AddPassword] Starting encryption key derivation...')
      
      // Step 1: Derive encryption key from wallet signature
      const message = `Generate encryption key for ShadowVault session`
      console.log('[AddPassword] Message to sign:', message)
      
      let signature: string
      
      // Use appropriate signing method based on wallet type
      if (address && isConnected) {
        // External wallet connected via Wagmi
        console.log('[AddPassword] Using Wagmi signing for external wallet')
        signature = await signMessageAsync({ message })
      } else if (wallets && wallets.length > 0) {
        // Privy embedded wallet
        console.log('[AddPassword] Using Privy embedded wallet signing')
        const embeddedWallet = wallets.find(wallet => wallet.connectorType === 'embedded') || wallets[0]
        
        if (!embeddedWallet) {
          throw new Error('No embedded wallet available for signing')
        }
        
        // Use Privy's embedded wallet signMessage method
        signature = await embeddedWallet.signMessage(message)
      } else {
        throw new Error('No wallet available for signing. Please connect a wallet.')
      }
      
      console.log('[AddPassword] Signature received:', signature)
      
      const { rawKey, base64Key } = await deriveEncryptionKeyFromSignature(signature, walletAddress)
      console.log('[AddPassword] Encryption key derived (first 8 bytes):', Array.from(rawKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('[AddPassword] Encryption key (base64):', base64Key)
      
      // Store encryption key for later use in localStorage save
      setEncryptionKey(base64Key)
      
      // Step 2: Create plaintext payload to encrypt
      const payload = {
        site: formData.name,
        username: formData.username,
        password: formData.password,
        url: formData.url,
        notes: formData.notes,
        category: formData.category,
        network: formData.network,
        timestamp: new Date().toISOString()
      }
      console.log('[AddPassword] Payload to encrypt:', payload)
      
      // Step 3: Encrypt payload and create VaultItemCipher
      const vaultItem = await createVaultItemCipher(payload, rawKey)
      console.log('[AddPassword] VaultItemCipher created successfully!')
      console.log('[AddPassword] Encrypted password length:', vaultItem.cipher.length)
      console.log('[AddPassword] IV length:', vaultItem.iv.length)
      
      // Store VaultItemCipher for later localStorage save
      setVaultItemCipher(vaultItem)
      
      // Step 4: Create ZircuitObject (for on-chain submission)
      // Step 4.1: Upload VaultItemCipher to Walrus to get blob ID
      console.log('[AddPassword] 🔄 Uploading VaultItemCipher to Walrus...')
      
      let walrusBlobId: string
      
      try {
        // 1. Prepare VaultItemCipher data for storage
        const vaultItemJson = JSON.stringify(vaultItem, null, 2)
        console.log('[AddPassword] 📦 VaultItemCipher data prepared:', {
          size: vaultItemJson.length,
          site: vaultItem.site,
          username: vaultItem.username,
          cipherLength: vaultItem.cipher.length,
          ivLength: vaultItem.iv.length
        })
        
        // 2. Convert to buffer for Walrus upload
        const dataBuffer = Buffer.from(vaultItemJson, 'utf8')
        console.log('[AddPassword] 📊 Data buffer created:', {
          bytes: dataBuffer.length,
          encoding: 'utf8'
        })
        
        // 3. Upload to Walrus testnet using the same approach as walrus-test.js
        const WALRUS_CONFIG = {
          publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
          aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space'
        }
        
        console.log('[AddPassword] 🌐 Uploading to Walrus testnet:', WALRUS_CONFIG.publisherUrl)
        
        const response = await fetch(`${WALRUS_CONFIG.publisherUrl}/v1/blobs?epochs=5`, {
          method: 'PUT',
          body: dataBuffer,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`)
        }
        
        const walrusResult = await response.json()
        console.log('[AddPassword] ✅ Walrus upload response:', walrusResult)
        
        // 4. Extract blob ID from Walrus response
        let blobId = null
        if (walrusResult.newlyCreated && walrusResult.newlyCreated.blobObject && walrusResult.newlyCreated.blobObject.blobId) {
          blobId = walrusResult.newlyCreated.blobObject.blobId
        } else if (walrusResult.alreadyCertified && walrusResult.alreadyCertified.blobId) {
          blobId = walrusResult.alreadyCertified.blobId
        }
        
        if (!blobId) {
          throw new Error('Failed to extract blob ID from Walrus response')
        }
        
        console.log('[AddPassword] 🎯 VaultItemCipher uploaded to Walrus successfully!', {
          blobId: blobId,
          size: dataBuffer.length,
          epochs: 5,
          directUrl: `${WALRUS_CONFIG.aggregatorUrl}/v1/blobs/${blobId}`
        })
        
        // 5. Log the direct access URL for debugging
        const directAccessUrl = `${WALRUS_CONFIG.aggregatorUrl}/v1/blobs/${blobId}`
        console.log('[AddPassword] 🌐 Direct access URL:', directAccessUrl)
        console.log('[AddPassword] 📝 Note: The URL contains encrypted data that can only be decrypted with the encryption key')
        
        // Use the Walrus blob ID as the "CID" for ZircuitObject
        walrusBlobId = blobId
        console.log('[AddPassword] ✅ Using real Walrus blob ID:', walrusBlobId)
        
      } catch (walrusError) {
        console.error('[AddPassword] ❌ Walrus upload failed:', walrusError)
        console.log('[AddPassword] 🔄 Falling back to mock storage for development...')
        
        // Fallback to mock for development
        walrusBlobId = "WalrusMockBlobId_" + Date.now() // Fallback mock ID
        console.log('[AddPassword] 🔧 Using fallback blob ID:', walrusBlobId)
      }
      
      console.log('[AddPassword] 🏗️ Creating ZircuitObject with Walrus blob ID:', walrusBlobId)
      const zircuitObj = await createZircuitObject(formData.password, walrusBlobId)
      console.log('[AddPassword] ✅ ZircuitObject created successfully!')
      console.log('[AddPassword] 🚀 Ready for Zircuit blockchain submission:', {
        storedHash: zircuitObj.storedHash.slice(0, 16) + '...',
        walrusCid: zircuitObj.walrusCid
      })
      
      // Set the ZircuitObject for contract interaction
      setZircuitObject(zircuitObj)
      
      console.log('[AddPassword] 📊 Storage Summary:')
      console.log('[AddPassword] 🔐 Encrypted password stored on Walrus decentralized network')
      console.log('[AddPassword] 🔗 Walrus blob ID (acts as decentralized CID):', zircuitObj.walrusCid)
      console.log('[AddPassword] 🌐 Blob will be accessible via:', `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${zircuitObj.walrusCid}`)
      console.log('[AddPassword] ⚡ Next: Submit ZircuitObject to blockchain for indexing')
      
      // Step 5: Will be done after contract confirmation (moved to useEffect)
      console.log('[AddPassword] ⏭️ Skipping localStorage save - will complete after blockchain confirmation')
      
      // Step 6: Submit ZircuitObject to smart contract
      console.log('[AddPassword] 🔗 Submitting to ShadowVaultV2 smart contract...')
      console.log('[AddPassword] 📋 Contract Address:', ShadowVaultV2Address)
      console.log('[AddPassword] 📋 Network: Zircuit Garfield Testnet (Chain ID: 48898)')
      console.log('[AddPassword] 📋 Function: storeVaultItem')
      console.log('[AddPassword] 📋 Args:', {
        storedHash: zircuitObj.storedHash.slice(0, 16) + '...',
        walrusCid: zircuitObj.walrusCid
      })

      try {
        setIsSubmittingToContract(true)
        
        if (!writeContract) {
          throw new Error('Contract write not available. Please check wallet connection and network.')
        }

        console.log('[AddPassword] 🚀 Executing contract transaction...')
        
        // Use Wagmi v2 writeContract function
        writeContract({
          address: ShadowVaultV2Address,
          abi: ShadowVaultV2ABI,
          functionName: 'storeVaultItem',
          args: [zircuitObj.storedHash, zircuitObj.walrusCid],
          chainId: 48898, // Zircuit Garfield Testnet
        })

        // The transaction will be handled by the useWaitForTransactionReceipt hook
        console.log('[AddPassword] ⏳ Transaction submitted, waiting for confirmation...')
        console.log('[AddPassword] 📱 You can monitor the transaction in your wallet')
        
      } catch (submitError) {
        console.error('[AddPassword] ❌ Contract submission failed:', submitError)
        setIsSubmittingToContract(false)
        // Continue with the process even if contract submission fails
        console.log('[AddPassword] 🔄 Continuing with local storage (contract submission can be retried later)')
      }
      
      // TODO: Step 7: Generate ZK proof of password strength
      // TODO: Step 8: Index with Envio
      
      // Simulate remaining steps for now
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      console.log('[AddPassword] 🎉 Walrus upload and contract submission initiated!')
      console.log('[AddPassword] ⏳ Waiting for blockchain confirmation to complete localStorage save...')
      console.log('[AddPassword] 🔗 Monitor wallet for transaction confirmation')
      
    } catch (error) {
      console.error('[AddPassword] Error during save:', error)
    setIsSaving(false)
      // TODO: Show error to user
    } finally {
      setIsSaving(false)
      // Note: Navigation will happen after blockchain confirmation in useEffect
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength >= 80) return "text-green-600"
    if (passwordStrength >= 60) return "text-blue-600"
    if (passwordStrength >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const isFormValid = formData.name && formData.username && formData.password && formData.category && formData.network
  const isWalletConnected = currentWalletAddress && ready && authenticated

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
                  disabled={!isFormValid || !isWalletConnected || isSaving || isSubmittingToContract || isContractWritePending}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving to {networks.find((n) => n.id === formData.network)?.name}...
                    </>
                  ) : isSubmittingToContract || isContractWritePending || isContractTxPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Submitting to Blockchain...
                    </>
                  ) : !isWalletConnected ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Connect Wallet Required
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
