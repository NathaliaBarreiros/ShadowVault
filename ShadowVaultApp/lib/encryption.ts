// ShadowVault encryption constants
const VAULT_ENCRYPTION_DOMAIN = 'vault-encryption-fixed'
const HKDF_INFO = 'sv:hkdf:v1'

// VaultItemCipher interface for encrypted password storage
export interface VaultItemCipher {
  v: number;                    // schema version
  site: string;                 // service name (plaintext)
  username: string;             // username (plaintext) 
  cipher: string;               // base64 AES-GCM ciphertext (password encriptado)
  iv: string;                   // 12-byte IV (base64)
  encryptionKeyHash: string;    // SHA-256 de la clave derivada (para verificación)
  meta: {
    url?: string;
    notes?: string;
    category: string;
    network: string;
    timestamp: string;
  }
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) throw new Error('Invalid hex string length')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  }
  return out
}

export function utf8ToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input)
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64')
}

export async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}

export async function deriveEncryptionKeyFromPrivyPrivateKey(
  privKeyHex: string,
  userAddress: string,
): Promise<{ rawKey: Uint8Array; base64Key: string }> {
  const ikm = hexToBytes(privKeyHex)
  const saltSource = utf8ToBytes(`${userAddress}${VAULT_ENCRYPTION_DOMAIN}`)
  const salt = await sha256Bytes(saltSource)
  const info = utf8ToBytes(HKDF_INFO)

  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])

  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt, info, hash: 'SHA-256' },
    ikmKey,
    256,
  )
  const rawKey = new Uint8Array(bits)
  return { rawKey, base64Key: bytesToBase64(rawKey) }
}

export function maskHexPreview(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length <= 12) return `0x${clean}`
  return `0x${clean.slice(0, 8)}...${clean.slice(-6)}`
}

export async function deriveEncryptionKeyFromSignature(
  signatureHex: string,
  userAddress: string,
): Promise<{ rawKey: Uint8Array; base64Key: string }> {
  console.log('[Encryption] Starting key derivation...')
  console.log('[Encryption] Signature hex length:', signatureHex.length)
  
  const sigBytes = hexToBytes(signatureHex)
  console.log('[Encryption] Signature bytes length:', sigBytes.length)
  
  const ikm = await sha256Bytes(sigBytes)
  console.log('[Encryption] IKM (SHA-256 of signature, first 8 bytes):', Array.from(ikm.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  const saltSource = utf8ToBytes(`${userAddress}${VAULT_ENCRYPTION_DOMAIN}`)
  const salt = await sha256Bytes(saltSource)
  console.log('[Encryption] Salt source:', `${userAddress}${VAULT_ENCRYPTION_DOMAIN}`)
  console.log('[Encryption] Salt (first 8 bytes):', Array.from(salt.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  const info = utf8ToBytes(HKDF_INFO)
  console.log('[Encryption] Info:', HKDF_INFO)

  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt, info, hash: 'SHA-256' },
    ikmKey,
    256,
  )
  const rawKey = new Uint8Array(bits)
  console.log('[Encryption] Final key derived, length:', rawKey.length)
  
  return { rawKey, base64Key: bytesToBase64(rawKey) }
}

export async function encryptPasswordWithAES(
  password: string,
  encryptionKey: Uint8Array
): Promise<{ cipher: string; iv: string }> {
  console.log('[Encryption] Starting AES-GCM encryption...')
  
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  console.log('[Encryption] Generated IV (first 8 bytes):', Array.from(iv.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  // Convert password to bytes
  const passwordBytes = utf8ToBytes(password)
  console.log('[Encryption] Password bytes length:', passwordBytes.length)
  
  // Import encryption key for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    encryptionKey,
    'AES-GCM',
    false,
    ['encrypt']
  )
  
  // Encrypt password with AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    passwordBytes
  )
  
  const ciphertext = new Uint8Array(encrypted)
  console.log('[Encryption] Ciphertext length:', ciphertext.length)
  
  return {
    cipher: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv)
  }
}

export async function createVaultItemCipher(
  payload: {
    site: string;
    username: string;
    password: string;
    url?: string;
    notes?: string;
    category: string;
    network: string;
  },
  encryptionKey: Uint8Array
): Promise<VaultItemCipher> {
  console.log('[Encryption] Creating VaultItemCipher...')
  
  // Encrypt the password
  const { cipher, iv } = await encryptPasswordWithAES(payload.password, encryptionKey)
  
  // Generate hash of encryption key for verification
  const encryptionKeyHash = await sha256Bytes(encryptionKey)
  const encryptionKeyHashHex = Array.from(encryptionKeyHash).map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('[Encryption] Encryption key hash:', encryptionKeyHashHex)
  
  // Create VaultItemCipher
  const vaultItem: VaultItemCipher = {
    v: 1, // schema version
    site: payload.site,
    username: payload.username,
    cipher: cipher,
    iv: iv,
    encryptionKeyHash: encryptionKeyHashHex,
    meta: {
      url: payload.url,
      notes: payload.notes,
      category: payload.category,
      network: payload.network,
      timestamp: new Date().toISOString()
    }
  }
  
  console.log('[Encryption] VaultItemCipher created:', {
    v: vaultItem.v,
    site: vaultItem.site,
    username: vaultItem.username,
    cipherLength: vaultItem.cipher.length,
    ivLength: vaultItem.iv.length,
    meta: vaultItem.meta
  })
  
  return vaultItem
}


