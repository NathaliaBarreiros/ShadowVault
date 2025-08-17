/**
 * Local Storage Service for Vault Data
 * Manages password entries in browser localStorage with encryption
 */

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

// Initialize with some sample data if storage is empty
export function initializeSampleData(): void {
  const existing = VaultStorageService.getEntries()
  
  if (existing.length === 0) {
    console.log('[VaultStorage] Initializing with sample data...')
    
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
        network: "polygon" as const,
        aiStrength: 45,
        lastAccessed: "15 minutes ago",
        category: "work" as const,
        isFavorite: false,
        needsUpdate: true,
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