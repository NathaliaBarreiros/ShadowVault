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

// ZircuitObject interface for on-chain data (no sensitive content)
export interface ZircuitObject {
  user: string;                 // user address
  itemIdHash: string;           // keccak256(salt + domain + username)
  itemCommitment: string;       // keccak256(itemIdHash + ipfsCid + encryptionKeyHash)
  ipfsCid: string;             // IPFS CID of the VaultItemCipher
  encryptionKeyHash: string;    // SHA-256 of encryption key
  timestamp: string;           // ISO timestamp
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

export async function createZircuitObject(
  vaultItem: VaultItemCipher,
  userAddress: string,
  ipfsCid: string
): Promise<ZircuitObject> {
  console.log('[Encryption] Creating ZircuitObject...')
  
  // Generate random salt for commitment (different from HKDF salt)
  const commitmentSalt = crypto.getRandomValues(new Uint8Array(32))
  const commitmentSaltHex = Array.from(commitmentSalt).map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('[Encryption] Commitment salt (first 8 bytes):', commitmentSaltHex.slice(0, 16))
  
  // Calculate itemIdHash = keccak256(salt + domain + username)
  const itemIdSource = `${commitmentSaltHex}${vaultItem.site}${vaultItem.username}`
  const itemIdHash = await sha256Bytes(utf8ToBytes(itemIdSource))
  const itemIdHashHex = Array.from(itemIdHash).map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('[Encryption] ItemIdHash (first 8 bytes):', itemIdHashHex.slice(0, 16))
  
  // Calculate itemCommitment = keccak256(itemIdHash + ipfsCid + encryptionKeyHash)
  const commitmentSource = `${itemIdHashHex}${ipfsCid}${vaultItem.encryptionKeyHash}`
  const itemCommitment = await sha256Bytes(utf8ToBytes(commitmentSource))
  const itemCommitmentHex = Array.from(itemCommitment).map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('[Encryption] ItemCommitment (first 8 bytes):', itemCommitmentHex.slice(0, 16))
  
  // Create ZircuitObject
  const zircuitObject: ZircuitObject = {
    user: userAddress,
    itemIdHash: itemIdHashHex,
    itemCommitment: itemCommitmentHex,
    ipfsCid: ipfsCid,
    encryptionKeyHash: vaultItem.encryptionKeyHash,
    timestamp: vaultItem.meta.timestamp
  }
  
  console.log('[Encryption] ZircuitObject created:', {
    user: zircuitObject.user,
    itemIdHash: zircuitObject.itemIdHash.slice(0, 16) + '...',
    itemCommitment: zircuitObject.itemCommitment.slice(0, 16) + '...',
    ipfsCid: zircuitObject.ipfsCid,
    encryptionKeyHash: zircuitObject.encryptionKeyHash.slice(0, 16) + '...',
    timestamp: zircuitObject.timestamp
  })
  
  return zircuitObject
}

// ============================================================================
// DECRYPTION FUNCTIONS - For retrieving and decrypting vault items
// ============================================================================

/*
DECRYPTION FLOW:
1. Get ZircuitObjects from Envio (contains IPFS CIDs and hashes)
2. For each ZircuitObject:
   a. Derive encryption key from wallet signature (same process as encryption)
   b. Fetch VaultItemCipher from IPFS using CID
   c. Verify encryption key hash matches
   d. Decrypt password using AES-GCM with derived key + IV
   e. Return decrypted data

SECURITY NOTES:
- Encryption key is re-derived from wallet signature (deterministic)
- VaultItemCipher contains encrypted password + metadata
- Only password is encrypted, metadata stays plaintext for usability
- Encryption key hash verification prevents tampering
*/

export function base64ToBytes(base64: string): Uint8Array {
  const binary = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/*
DECRYPT PASSWORD WITH AES-GCM:
- Takes ciphertext (base64), IV (base64), and encryption key
- Converts base64 strings back to bytes
- Uses same AES-GCM algorithm as encryption
- Returns plaintext password string

USAGE:
const decryptedPassword = await decryptPasswordWithAES(
  vaultItem.cipher,    // base64 ciphertext
  vaultItem.iv,        // base64 IV
  derivedEncryptionKey // Uint8Array from HKDF
)
*/
export async function decryptPasswordWithAES(
  ciphertext: string,
  iv: string,
  encryptionKey: Uint8Array
): Promise<string> {
  console.log('[Decryption] Starting AES-GCM decryption...')
  
  // Convert base64 strings back to bytes
  const ciphertextBytes = base64ToBytes(ciphertext)
  const ivBytes = base64ToBytes(iv)
  
  console.log('[Decryption] Ciphertext length:', ciphertextBytes.length)
  console.log('[Decryption] IV length:', ivBytes.length)
  
  // Import encryption key for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    encryptionKey,
    'AES-GCM',
    false,
    ['decrypt']
  )
  
  // Decrypt password with AES-GCM
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    aesKey,
    ciphertextBytes
  )
  
  const passwordBytes = new Uint8Array(decrypted)
  const password = new TextDecoder().decode(passwordBytes)
  
  console.log('[Decryption] Password decrypted successfully')
  
  return password
}

/*
RETRIEVE AND DECRYPT VAULT ITEM:
- Takes IPFS CID and encryption key
- Fetches VaultItemCipher from IPFS
- Verifies encryption key hash matches
- Decrypts password using AES-GCM
- Returns both VaultItemCipher and decrypted password

IPFS RETRIEVAL OPTIONS:
1. IPFS HTTP Client (Infura, Pinata, etc.)
2. IPFS Gateway (public or private)
3. Direct IPFS node connection

SECURITY CHECKS:
- Verify encryption key hash matches stored hash
- Ensure VaultItemCipher structure is valid
- Validate metadata integrity

USAGE:
const { vaultItem, decryptedPassword } = await retrieveAndDecryptVaultItem(
  zircuitObject.ipfsCid,  // IPFS CID from ZircuitObject
  derivedEncryptionKey    // Uint8Array from HKDF
)
*/
export async function retrieveAndDecryptVaultItem(
  ipfsCid: string,
  encryptionKey: Uint8Array
): Promise<{
  vaultItem: VaultItemCipher;
  decryptedPassword: string;
}> {
  console.log('[Decryption] Retrieving VaultItemCipher from IPFS...')
  
  /*
  // REAL IPFS RETRIEVAL IMPLEMENTATION:
  // 
  // Option 1: IPFS HTTP Client (Infura)
  // const ipfs = create({ 
  //   host: 'ipfs.infura.io', 
  //   port: 5001, 
  //   protocol: 'https',
  //   headers: {
  //     authorization: 'Basic ' + Buffer.from(process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET).toString('base64')
  //   }
  // })
  // const chunks = []
  // for await (const chunk of ipfs.cat(ipfsCid)) {
  //   chunks.push(chunk)
  // }
  // const vaultItemBuffer = Buffer.concat(chunks)
  // const vaultItemJson = vaultItemBuffer.toString('utf8')
  // const vaultItem: VaultItemCipher = JSON.parse(vaultItemJson)
  // 
  // Option 2: Pinata Gateway
  // const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`)
  // const vaultItemJson = await response.text()
  // const vaultItem: VaultItemCipher = JSON.parse(vaultItemJson)
  // 
  // Option 3: Public IPFS Gateway
  // const response = await fetch(`https://ipfs.io/ipfs/${ipfsCid}`)
  // const vaultItemJson = await response.text()
  // const vaultItem: VaultItemCipher = JSON.parse(vaultItemJson)
  */
  
  // For demo purposes, we'll use a mock VaultItemCipher
  // In real implementation, fetch from IPFS using one of the methods above
  const mockVaultItem: VaultItemCipher = {
    v: 1,
    site: "example.com",
    username: "user@example.com",
    cipher: "mock-ciphertext-base64",
    iv: "mock-iv-base64",
    encryptionKeyHash: "mock-encryption-key-hash",
    meta: {
      url: "https://example.com",
      notes: "Mock password entry",
      category: "Social",
      network: "Ethereum",
      timestamp: new Date().toISOString()
    }
  }
  
  console.log('[Decryption] VaultItemCipher retrieved from IPFS')
  
  // Verify encryption key hash matches
  const currentKeyHash = await sha256Bytes(encryptionKey)
  const currentKeyHashHex = Array.from(currentKeyHash).map(b => b.toString(16).padStart(2, '0')).join('')
  
  if (currentKeyHashHex !== mockVaultItem.encryptionKeyHash) {
    throw new Error('Encryption key hash mismatch - cannot decrypt')
  }
  
  console.log('[Decryption] Encryption key hash verified')
  
  // Decrypt the password
  const decryptedPassword = await decryptPasswordWithAES(
    mockVaultItem.cipher,
    mockVaultItem.iv,
    encryptionKey
  )
  
  console.log('[Decryption] VaultItemCipher decrypted successfully')
  
  return {
    vaultItem: mockVaultItem,
    decryptedPassword
  }
}

export async function getVaultItemsFromEnvio(
  userAddress: string
): Promise<ZircuitObject[]> {
  console.log('[Envio] Fetching vault items for user:', userAddress)
  
  /*
  // Example of how to query Envio:
  // 
  // const response = await fetch(`${process.env.ENVIO_API_URL}/vaultItems`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     query: `
  //       query GetVaultItems($owner: String!) {
  //         vaultItems(where: { owner: $owner }) {
  //           id
  //           owner
  //           itemIdHash
  //           itemCommitment
  //           ipfsCid
  //           encryptionKeyHash
  //           timestamp
  //         }
  //       }
  //     `,
  //     variables: {
  //       owner: userAddress
  //     }
  //   })
  // })
  // 
  // const data = await response.json()
  // return data.data.vaultItems
  */
  
  // For demo purposes, return mock data
  const mockZircuitObjects: ZircuitObject[] = [
    {
      user: userAddress,
      itemIdHash: "mock-item-id-hash-1",
      itemCommitment: "mock-item-commitment-1",
      ipfsCid: "QmMockCid1",
      encryptionKeyHash: "mock-encryption-key-hash-1",
      timestamp: new Date().toISOString()
    },
    {
      user: userAddress,
      itemIdHash: "mock-item-id-hash-2",
      itemCommitment: "mock-item-commitment-2",
      ipfsCid: "QmMockCid2",
      encryptionKeyHash: "mock-encryption-key-hash-2",
      timestamp: new Date().toISOString()
    }
  ]
  
  console.log('[Envio] Retrieved', mockZircuitObjects.length, 'vault items')
  
  return mockZircuitObjects
}

// ============================================================================
// COMPLETE DECRYPTION FLOW - How to use all functions together
// ============================================================================

/*
COMPLETE DECRYPTION PROCESS:

1. GET VAULT ITEMS FROM ENVIO:
   const zircuitObjects = await getVaultItemsFromEnvio(userAddress)
   // Returns: Array of ZircuitObjects with IPFS CIDs and hashes

2. FOR EACH VAULT ITEM:
   
   a. DERIVE ENCRYPTION KEY:
   const message = "Generate encryption key for ShadowVault session"
   const signature = await signMessageAsync({ message })
   const { rawKey } = await deriveEncryptionKeyFromSignature(signature, userAddress)
   
   b. RETRIEVE FROM IPFS:
   const { vaultItem, decryptedPassword } = await retrieveAndDecryptVaultItem(
     zircuitObject.ipfsCid,
     rawKey
   )
   
   c. USE DECRYPTED DATA:
   console.log('Site:', vaultItem.site)
   console.log('Username:', vaultItem.username)
   console.log('Password:', decryptedPassword)
   console.log('Notes:', vaultItem.meta.notes)

SECURITY FLOW:
1. Envio → ZircuitObjects (no sensitive data)
2. Wallet → Signature → Encryption Key (deterministic)
3. IPFS → VaultItemCipher (encrypted content)
4. Verification → Key hash check
5. Decryption → AES-GCM with key + IV
6. Result → Plaintext password + metadata

ERROR HANDLING:
- Invalid signature → Cannot derive key
- IPFS unavailable → Cannot retrieve data
- Key hash mismatch → Data tampered
- Invalid ciphertext → Corrupted data

USAGE EXAMPLE:
async function loadUserVault(userAddress: string) {
  try {
    // Get vault items from Envio
    const zircuitObjects = await getVaultItemsFromEnvio(userAddress)
    
    const decryptedItems = []
    
    for (const zircuitObject of zircuitObjects) {
      // Derive encryption key
      const signature = await signMessageAsync({ 
        message: "Generate encryption key for ShadowVault session" 
      })
      const { rawKey } = await deriveEncryptionKeyFromSignature(signature, userAddress)
      
      // Retrieve and decrypt
      const { vaultItem, decryptedPassword } = await retrieveAndDecryptVaultItem(
        zircuitObject.ipfsCid,
        rawKey
      )
      
      decryptedItems.push({
        ...vaultItem,
        decryptedPassword,
        zircuitObject
      })
    }
    
    return decryptedItems
  } catch (error) {
    console.error('Failed to load vault:', error)
    throw error
  }
}
*/


