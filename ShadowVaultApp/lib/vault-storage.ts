/**
 * Local Storage Service for Vault Data
 * Manages password entries in browser localStorage with encryption
 */

import { PasswordIntegrityZK, IntegrityProofResult } from './password-integrity-zk';
import { decryptPasswordWithAES, base64ToBytes } from './encryption';

export interface VaultEntry {
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
  createdAt: string
  updatedAt: string
  // Walrus storage metadata
  walrusMetadata?: {
    blobId: string
    ipfsCid?: string
    storageEpoch?: number
    encryptionKey?: string
    uploadedAt: string
    // Smart contract parameters
    blockchainTxHash?: string
    contractAddress?: string
    networkChainId?: number
    storedHash?: string
    walrusCid?: string
    // VaultItemCipher data (for Walrus button functionality)
    vaultItemCipher?: {
      v: number
      site: string
      username: string
      cipher: string
      iv: string
      encryptionKey: string // base64 encryption key
      meta: any
    }
  }
}

export interface VaultStorageStats {
  totalEntries: number
  totalSize: number
  lastSync: string
  categories: Record<string, number>
  networks: Record<string, number>
}

const STORAGE_KEY = 'shadowvault_entries'
const STATS_KEY = 'shadowvault_stats'

export class VaultStorageService {
  /**
   * Get all vault entries from localStorage
   */
  static getEntries(): VaultEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      
      const entries = JSON.parse(stored) as VaultEntry[]
      console.log('[VaultStorage] Retrieved', entries.length, 'entries from localStorage')
      return entries
    } catch (error) {
      console.error('[VaultStorage] Error reading from localStorage:', error)
      return []
    }
  }

  /**
   * Save vault entries to localStorage
   */
  static saveEntries(entries: VaultEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
      this.updateStats(entries)
      console.log('[VaultStorage] Saved', entries.length, 'entries to localStorage')
    } catch (error) {
      console.error('[VaultStorage] Error saving to localStorage:', error)
      throw new Error('Failed to save vault entries')
    }
  }

  /**
   * Add a new vault entry
   */
  static addEntry(entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>): VaultEntry {
    const newEntry: VaultEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: 'Just created'
    }

    const entries = this.getEntries()
    entries.unshift(newEntry) // Add to beginning
    this.saveEntries(entries)

    console.log('[VaultStorage] Added new entry:', newEntry.name)
    return newEntry
  }

  /**
   * Update an existing vault entry
   */
  static updateEntry(id: string, updates: Partial<VaultEntry>): VaultEntry | null {
    const entries = this.getEntries()
    const index = entries.findIndex(entry => entry.id === id)
    
    if (index === -1) {
      console.warn('[VaultStorage] Entry not found for update:', id)
      return null
    }

    const updatedEntry = {
      ...entries[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    entries[index] = updatedEntry
    this.saveEntries(entries)

    console.log('[VaultStorage] Updated entry:', updatedEntry.name)
    return updatedEntry
  }

  /**
   * Delete a vault entry
   */
  static deleteEntry(id: string): boolean {
    const entries = this.getEntries()
    const filteredEntries = entries.filter(entry => entry.id !== id)
    
    if (filteredEntries.length === entries.length) {
      console.warn('[VaultStorage] Entry not found for deletion:', id)
      return false
    }

    this.saveEntries(filteredEntries)
    console.log('[VaultStorage] Deleted entry:', id)
    return true
  }

  /**
   * Update last accessed time for an entry
   */
  static updateLastAccessed(id: string): void {
    this.updateEntry(id, {
      lastAccessed: this.formatTimeAgo(new Date())
    })
  }

  /**
   * Toggle favorite status
   */
  static toggleFavorite(id: string): VaultEntry | null {
    const entries = this.getEntries()
    const entry = entries.find(e => e.id === id)
    
    if (!entry) return null

    return this.updateEntry(id, {
      isFavorite: !entry.isFavorite
    })
  }

  /**
   * Update Walrus metadata for an entry
   */
  static updateWalrusMetadata(id: string, metadata: VaultEntry['walrusMetadata']): VaultEntry | null {
    if (!metadata) return null;
    
    return this.updateEntry(id, {
      walrusMetadata: {
        ...metadata,
        uploadedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Get storage statistics
   */
  static getStats(): VaultStorageStats {
    try {
      const stored = localStorage.getItem(STATS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('[VaultStorage] Error reading stats:', error)
    }

    // Return default stats if none found
    return {
      totalEntries: 0,
      totalSize: 0,
      lastSync: new Date().toISOString(),
      categories: {},
      networks: {}
    }
  }

  /**
   * Clear all vault data (useful for testing)
   */
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STATS_KEY)
    console.log('[VaultStorage] Cleared all vault data from localStorage')
  }

  /**
   * Export vault data as JSON
   */
  static exportData(): string {
    const entries = this.getEntries()
    const stats = this.getStats()
    
    return JSON.stringify({
      entries,
      stats,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2)
  }

  /**
   * Import vault data from JSON
   */
  static importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.entries && Array.isArray(data.entries)) {
        this.saveEntries(data.entries)
        console.log('[VaultStorage] Imported', data.entries.length, 'entries')
      } else {
        throw new Error('Invalid import format')
      }
    } catch (error) {
      console.error('[VaultStorage] Error importing data:', error)
      throw new Error('Failed to import vault data')
    }
  }

  /**
   * Search entries by query
   */
  static searchEntries(query: string): VaultEntry[] {
    const entries = this.getEntries()
    const searchTerm = query.toLowerCase()
    
    return entries.filter(entry =>
      entry.name.toLowerCase().includes(searchTerm) ||
      entry.username.toLowerCase().includes(searchTerm) ||
      entry.url.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Filter entries by category
   */
  static filterByCategory(category: VaultEntry['category']): VaultEntry[] {
    return this.getEntries().filter(entry => entry.category === category)
  }

  /**
   * Filter entries by network
   */
  static filterByNetwork(network: VaultEntry['network']): VaultEntry[] {
    return this.getEntries().filter(entry => entry.network === network)
  }

  /**
   * Get entries that need password updates
   */
  static getEntriesNeedingUpdate(): VaultEntry[] {
    return this.getEntries().filter(entry => entry.needsUpdate)
  }

  /**
   * Get favorite entries
   */
  static getFavoriteEntries(): VaultEntry[] {
    return this.getEntries().filter(entry => entry.isFavorite)
  }

  /**
   * Recover password with ZK integrity verification
   * This method decrypts the password and verifies its integrity using ZK proofs
   */
  static async recoverPasswordWithIntegrityVerification(
    vaultEntry: VaultEntry,
    zircuitData: {
      storedHash: string;
      contractAddress: string;
      networkChainId: number;
    }
  ): Promise<{
    password: string;
    integrityVerified: boolean;
    proof?: any;
    publicInputs?: any;
    error?: string;
  }> {
    try {
      console.log('🔐 Starting password recovery with integrity verification...');
      console.log('📄 Vault entry:', vaultEntry);
      console.log('⛓️ Zircuit data:', zircuitData);

      // Initialize ZK system
      const integrityZK = new PasswordIntegrityZK();
      await integrityZK.initialize();

      // Decrypt password from Walrus cipher data
      let decryptedPassword: string;
      
      if (vaultEntry.walrusMetadata?.vaultItemCipher) {
        // Use real Walrus cipher data if available
        const { cipher, iv, encryptionKey } = vaultEntry.walrusMetadata.vaultItemCipher;
        
        if (!cipher || !iv || !encryptionKey) {
          console.log('⚠️ Incomplete Walrus cipher data, falling back to stored password');
          decryptedPassword = vaultEntry.password;
        } else {

          console.log('🔓 Decrypting password using Walrus cipher data...');
          console.log('🔐 Cipher length:', cipher.length);
          console.log('🔑 IV length:', iv.length);
          console.log('🗝️ Encryption key length:', encryptionKey.length);

          // Convert base64 encryption key to Uint8Array
          const keyBytes = base64ToBytes(encryptionKey);
          
          // Decrypt using AES-GCM
          decryptedPassword = await decryptPasswordWithAES(cipher, iv, keyBytes);
          
          console.log('✅ Password decrypted successfully from Walrus data');
        }
      } else {
        // Fallback to stored password (for testing)
        console.log('⚠️ No Walrus cipher data found, using stored password as fallback');
        decryptedPassword = vaultEntry.password;
      }

      console.log('🔓 Decrypted password:', decryptedPassword);

      // 🧪 DEBUGGING: Compare hashes to verify they should match
      console.log('🔍 === HASH COMPARISON DEBUG ===');
      
      // Compute hash of decrypted password
      const passwordBytes = new TextEncoder().encode(decryptedPassword);
      const computedHashBuffer = await crypto.subtle.digest('SHA-256', passwordBytes);
      const computedHashArray = new Uint8Array(computedHashBuffer);
      const computedHashHex = Array.from(computedHashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('🔐 Password used:', decryptedPassword);
      console.log('🧮 Computed hash from password:', computedHashHex);
      console.log('🏷️ Stored hash from Zircuit:', zircuitData.storedHash);
      console.log('🎯 Hashes match:', computedHashHex === zircuitData.storedHash);
      
      if (computedHashHex === zircuitData.storedHash) {
        console.log('✅ Hash verification: Password integrity confirmed before ZK proof');
      } else {
        console.log('❌ Hash verification: Password integrity mismatch - ZK proof will fail');
        console.log('📏 Computed hash length:', computedHashHex.length);
        console.log('📏 Stored hash length:', zircuitData.storedHash.length);
      }
      console.log('🔍 === END HASH COMPARISON ===');

      // Generate ZK integrity proof
      const integrityResult = await integrityZK.generateIntegrityProof(
        decryptedPassword,
        zircuitData.storedHash
      );

      if (!integrityResult.success) {
        throw new Error(`Integrity verification failed: ${integrityResult.error}`);
      }

      // Verify the proof locally (optional, for extra security)
      const isProofValid = await integrityZK.verifyProof(
        integrityResult.proof,
        integrityResult.publicInputs
      );

      if (!isProofValid) {
        throw new Error('ZK proof verification failed');
      }

      // Update last accessed time
      this.updateLastAccessed(vaultEntry.id);

      console.log('✅ Password recovery with integrity verification completed successfully');

      // Return the decrypted password with integrity confirmation
      return {
        password: decryptedPassword,
        integrityVerified: true,
        proof: integrityResult.proof,
        publicInputs: integrityResult.publicInputs
      };

    } catch (error) {
      console.error('❌ Password recovery with integrity verification failed:', error);
      return {
        password: '',
        integrityVerified: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test the ZK integrity verification system
   */
  static async testIntegritySystem(): Promise<boolean> {
    try {
      console.log('🧪 Testing ZK integrity verification system...');
      
      const integrityZK = new PasswordIntegrityZK();
      const testResult = await integrityZK.testCircuit();
      
      if (testResult) {
        console.log('✅ ZK integrity system test passed');
        return true;
      } else {
        console.log('❌ ZK integrity system test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ ZK integrity system test error:', error);
      return false;
    }
  }

  // Private helper methods

  private static generateId(): string {
    return `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMins = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  private static updateStats(entries: VaultEntry[]): void {
    const categories: Record<string, number> = {}
    const networks: Record<string, number> = {}
    let totalSize = 0

    entries.forEach(entry => {
      // Count by category
      categories[entry.category] = (categories[entry.category] || 0) + 1
      
      // Count by network
      networks[entry.network] = (networks[entry.network] || 0) + 1
      
      // Estimate size (rough calculation)
      totalSize += JSON.stringify(entry).length
    })

    const stats: VaultStorageStats = {
      totalEntries: entries.length,
      totalSize,
      lastSync: new Date().toISOString(),
      categories,
      networks
    }

    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }
}

// Helper function to compute SHA-256 hash
async function computePasswordHash(password: string): Promise<string> {
  const passwordBytes = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBytes);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize with some sample data if storage is empty
export async function initializeSampleData(): Promise<void> {
  const existing = VaultStorageService.getEntries()
  
  if (existing.length === 0) {
    console.log('[VaultStorage] Initializing with sample data...')
    
    // Calculate the correct hash for "OldPassword456"
    const gitHubPasswordHash = await computePasswordHash("OldPassword456");
    console.log('[VaultStorage] Computed GitHub password hash:', gitHubPasswordHash);
    
    const sampleEntries = [
      {
        name: "Netflix",
        username: "john.doe@email.com",
        password: "SecurePass123!",
        url: "netflix.com",
        network: "ethereum" as const,
        aiStrength: 92,
        lastAccessed: "2 minutes ago",
        category: "entertainment" as const,
        isFavorite: true,
        needsUpdate: false,
      },
      {
        name: "GitHub",
        username: "johndoe",
        password: "OldPassword456",
        url: "github.com",
        network: "zircuit" as const,
        aiStrength: 45,
        lastAccessed: "15 minutes ago",
        category: "work" as const,
        isFavorite: false,
        needsUpdate: true,
        walrusMetadata: {
          blobId: "test-blob-github",
          ipfsCid: "QmTestGitHub",
          storageEpoch: Date.now(),
          encryptionKey: "dGVzdC1lbmNyeXB0aW9uLWtleQ==", // base64 encoded test key
          uploadedAt: new Date().toISOString(),
          blockchainTxHash: "0xtest123",
          contractAddress: "0x577dc63554BF7531f75AF602896209fFe87d51E8",
          networkChainId: 48898,
          // Hash of "OldPassword456" -> computed dynamically above
          storedHash: gitHubPasswordHash,
          walrusCid: "QmTestGitHubWalrus",
          vaultItemCipher: {
            v: 1,
            site: "GitHub",
            username: "johndoe",
            cipher: "dGVzdC1jaXBoZXItZGF0YQ==", // mock cipher - base64 encoded "test-cipher-data"
            iv: "dGVzdC1pdg==", // mock IV - base64 encoded "test-iv"
            encryptionKey: "dGVzdC1lbmNyeXB0aW9uLWtleQ==", // same as above
            meta: {
              url: "github.com",
              notes: "Test GitHub account",
              category: "work",
              network: "zircuit",
              timestamp: new Date().toISOString()
            }
          }
        }
      },
      {
        name: "LinkedIn",
        username: "john.doe@email.com",
        password: "NewSecure789#",
        url: "linkedin.com",
        network: "zircuit" as const,
        aiStrength: 96,
        lastAccessed: "1 hour ago",
        category: "work" as const,
        isFavorite: true,
        needsUpdate: false,
      }
    ]

    sampleEntries.forEach(entry => {
      VaultStorageService.addEntry(entry)
    })

    console.log('[VaultStorage] Sample data initialized')
  }
}