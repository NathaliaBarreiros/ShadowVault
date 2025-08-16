"use client"

import { useCallback, useState } from "react"
import { useAccount, useSignMessage } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deriveEncryptionKeyFromSignature } from "@/lib/encryption"

export default function EncryptionSetupPage() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [derived, setDerived] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [busy, setBusy] = useState<boolean>(false)

  const handleDerive = useCallback(async () => {
    setError("")
    setDerived("")
    try {
      if (!address) throw new Error("Connect/login first to derive key")
      setBusy(true)
      
      const message = `Generate encryption key for ShadowVault session`
      console.log('[EncryptionSetup] Message to sign:', message)
      console.log('[EncryptionSetup] User address:', address)
      
      const sig = await signMessageAsync({ message })
      console.log('[EncryptionSetup] Signature received:', sig)
      
      const { rawKey, base64Key } = await deriveEncryptionKeyFromSignature(sig, address)
      console.log('[EncryptionSetup] Raw key (first 8 bytes):', Array.from(rawKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('[EncryptionSetup] Derived key (base64):', base64Key)
      
      setDerived(base64Key)
    } catch (e: any) {
      setError(e?.message || 'Unknown error')
    } finally {
      setBusy(false)
    }
  }, [address, signMessageAsync])

  return (
    <div className="container mx-auto px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Encryption Key Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Derive your session encryption key using a deterministic wallet signature. This does not export your private key.
          </div>
          <div>
            <Button onClick={handleDerive} disabled={!address || busy}>
              {busy ? 'Deriving…' : 'Derive Encryption Key'}
            </Button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {derived && (
            <div className="text-sm break-all">
              <span className="font-medium">Derived Key (base64):</span> {derived}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


