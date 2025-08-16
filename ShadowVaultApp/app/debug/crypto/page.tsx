"use client"

import { useCallback, useMemo, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { deriveEncryptionKeyFromPrivyPrivateKey, maskHexPreview } from "@/lib/encryption"

export default function DebugCryptoPage() {
  const debugEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_CRYPTO === 'true'
  const { user, authenticated, ready } = usePrivy()
  const { address } = useAccount()
  const [privKeyPreview, setPrivKeyPreview] = useState<string>("")
  const [derivedKeyB64, setDerivedKeyB64] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [busy, setBusy] = useState<boolean>(false)

  const canUse = useMemo(() => !!debugEnabled && !!authenticated && !!address && !!user, [debugEnabled, authenticated, address, user])

  const handleDerive = useCallback(async () => {
    setError("")
    setBusy(true)
    try {
      if (!debugEnabled) throw new Error("Debug not enabled. Set NEXT_PUBLIC_DEBUG_CRYPTO=true in .env.local")
      if (!ready) throw new Error("Privy not ready")
      if (!authenticated || !user) throw new Error("Not authenticated")
      if (!address) throw new Error("No wallet address detected")

      // Locate embedded wallet from Privy user object
      const embedded = user?.wallet?.address === address ? user.wallet : null
      if (!embedded) {
        throw new Error("Embedded wallet not found on Privy user. Ensure embedded wallets are enabled.")
      }

      // @ts-expect-error: Privy SDK may expose exportPrivateKey on wallet object at runtime
      if (typeof embedded.exportPrivateKey !== 'function') {
        throw new Error("exportPrivateKey API not available. Check Privy docs and SDK version.")
      }

      // Get private key (DEV ONLY). This may prompt a confirmation.
      // @ts-expect-error dynamic method
      const privKeyHex: string = await embedded.exportPrivateKey()
      console.log('[DEV] Embedded wallet private key:', privKeyHex)
      setPrivKeyPreview(maskHexPreview(privKeyHex))

      const { base64Key } = await deriveEncryptionKeyFromPrivyPrivateKey(privKeyHex, address)
      console.log('[DEV] Derived encryption key (base64):', base64Key)
      setDerivedKeyB64(base64Key)
    } catch (e: any) {
      setError(e?.message || 'Unknown error')
    } finally {
      setBusy(false)
    }
  }, [address, authenticated, debugEnabled, ready, user])

  return (
    <div className="container mx-auto px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Encryption Key Derivation (DEV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!debugEnabled && (
            <div className="text-sm text-red-600">Enable by setting NEXT_PUBLIC_DEBUG_CRYPTO=true</div>
          )}
          <div className="text-sm text-muted-foreground">
            This page is for development only. Do not use in production. It exports your embedded wallet private key to derive the session encryption key via HKDF.
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDerive} disabled={!canUse || busy}>
              {busy ? 'Working…' : 'Derive Encryption Key'}
            </Button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {privKeyPreview && (
            <div className="text-sm">
              <span className="font-medium">Private Key (preview):</span> {privKeyPreview}
            </div>
          )}
          {derivedKeyB64 && (
            <div className="text-sm break-all">
              <span className="font-medium">Derived Key (base64):</span> {derivedKeyB64}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


