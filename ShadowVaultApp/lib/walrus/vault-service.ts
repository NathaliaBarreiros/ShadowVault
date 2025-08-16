/**
 * Vault Service for ShadowVault
 * Combines encryption and Walrus storage for secure password management
 */

import { walrusClient, WalrusClient, WalrusBlob } from './client';
import { walrusEncryption, WalrusEncryption, VaultEntry, EncryptedData } from './encryption';

export interface VaultMetadata {
  entryId: string;
  blobId: string;
  name: string;
  category: string;
  url?: string;
  createdAt: number;
  updatedAt: number;
  size: number;
}

export interface VaultIndex {
  version: string;
  userId: string;
  entries: VaultMetadata[];
  createdAt: number;
  updatedAt: number;
}

export interface StorageResult {
  success: boolean;
  blobId?: string;
  error?: string;
  metadata?: VaultMetadata;
}

export interface RetrievalResult {
  success: boolean;
  entry?: VaultEntry;
  error?: string;
}

export class VaultService {
  private walrusClient: WalrusClient;
  private encryption: WalrusEncryption;

  constructor(walrusClient?: WalrusClient, encryption?: WalrusEncryption) {
    this.walrusClient = walrusClient || walrusClient;
    this.encryption = encryption || walrusEncryption;
  }

  /**
   * Store a vault entry securely
   */
  async storeEntry(entry: VaultEntry, masterPassword: string, userId: string): Promise<StorageResult> {
    try {
      // Generate unique entry ID
      const entryId = this.generateEntryId();
      
      // Add timestamps
      const entryWithMetadata: VaultEntry = {
        ...entry,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Encrypt the entry
      const encryptedData = await this.encryption.encryptVaultEntry(entryWithMetadata, masterPassword);

      // Convert to JSON and store in Walrus
      const dataToStore = JSON.stringify(encryptedData);
      const blob = await this.walrusClient.store(dataToStore, {
        epochs: 10, // Store for 10 epochs
        deletable: true,
      });

      // Create metadata for the index
      const metadata: VaultMetadata = {
        entryId,
        blobId: blob.blobId,
        name: entry.name,
        category: entry.category,
        url: entry.url,
        createdAt: entryWithMetadata.createdAt,
        updatedAt: entryWithMetadata.updatedAt,
        size: blob.size,
      };

      // Update the vault index
      await this.updateVaultIndex(userId, metadata, 'add', masterPassword);

      return {
        success: true,
        blobId: blob.blobId,
        metadata,
      };
    } catch (error) {
      console.error('Store entry error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve a vault entry
   */
  async retrieveEntry(blobId: string, masterPassword: string): Promise<RetrievalResult> {
    try {
      // Retrieve encrypted data from Walrus
      const encryptedDataJson = await this.walrusClient.retrieveText(blobId);
      const encryptedData: EncryptedData = JSON.parse(encryptedDataJson);

      // Decrypt the entry
      const entry = await this.encryption.decryptVaultEntry(encryptedData, masterPassword);

      return {
        success: true,
        entry,
      };
    } catch (error) {
      console.error('Retrieve entry error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update an existing vault entry
   */
  async updateEntry(
    entryId: string,
    updatedEntry: Partial<VaultEntry>,
    masterPassword: string,
    userId: string
  ): Promise<StorageResult> {
    try {
      // Get current index
      const index = await this.getVaultIndex(userId, masterPassword);
      const metadata = index.entries.find(e => e.entryId === entryId);
      
      if (!metadata) {
        throw new Error('Entry not found');
      }

      // Retrieve and decrypt current entry
      const currentResult = await this.retrieveEntry(metadata.blobId, masterPassword);
      if (!currentResult.success || !currentResult.entry) {
        throw new Error('Failed to retrieve current entry');
      }

      // Merge with updates
      const updatedEntryData: VaultEntry = {
        ...currentResult.entry,
        ...updatedEntry,
        updatedAt: Date.now(),
      };

      // Encrypt and store updated entry
      const encryptedData = await this.encryption.encryptVaultEntry(updatedEntryData, masterPassword);
      const dataToStore = JSON.stringify(encryptedData);
      const blob = await this.walrusClient.store(dataToStore, {
        epochs: 10,
        deletable: true,
      });

      // Update metadata
      const updatedMetadata: VaultMetadata = {
        ...metadata,
        name: updatedEntryData.name,
        category: updatedEntryData.category,
        url: updatedEntryData.url,
        updatedAt: updatedEntryData.updatedAt,
        blobId: blob.blobId,
        size: blob.size,
      };

      // Update the vault index
      await this.updateVaultIndex(userId, updatedMetadata, 'update', masterPassword);

      return {
        success: true,
        blobId: blob.blobId,
        metadata: updatedMetadata,
      };
    } catch (error) {
      console.error('Update entry error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a vault entry
   */
  async deleteEntry(entryId: string, userId: string, masterPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the vault index to mark entry as deleted
      await this.updateVaultIndex(userId, { entryId } as VaultMetadata, 'delete', masterPassword);

      return { success: true };
    } catch (error) {
      console.error('Delete entry error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all vault entries for a user
   */
  async getAllEntries(userId: string, masterPassword: string): Promise<VaultMetadata[]> {
    try {
      const index = await this.getVaultIndex(userId, masterPassword);
      return index.entries;
    } catch (error) {
      console.error('Get all entries error:', error);
      return [];
    }
  }

  /**
   * Get vault index
   */
  private async getVaultIndex(userId: string, masterPassword: string): Promise<VaultIndex> {
    try {
      const indexBlobId = await this.getIndexBlobId(userId);
      
      if (!indexBlobId) {
        // Create new index if it doesn't exist
        return this.createNewIndex(userId);
      }

      // Retrieve and decrypt index
      const encryptedIndexJson = await this.walrusClient.retrieveText(indexBlobId);
      const encryptedIndex: EncryptedData = JSON.parse(encryptedIndexJson);
      
      // Decrypt index using master password
      const indexJson = await this.decryptIndex(encryptedIndex, masterPassword);
      return JSON.parse(indexJson) as VaultIndex;
    } catch (error) {
      console.error('Get vault index error:', error);
      // Return empty index if there's an error
      return this.createNewIndex(userId);
    }
  }

  /**
   * Update vault index
   */
  private async updateVaultIndex(
    userId: string,
    metadata: VaultMetadata,
    operation: 'add' | 'update' | 'delete',
    masterPassword: string
  ): Promise<void> {
    const index = await this.getVaultIndex(userId, masterPassword);

    switch (operation) {
      case 'add':
        index.entries.push(metadata);
        break;
      case 'update':
        const updateIndex = index.entries.findIndex(e => e.entryId === metadata.entryId);
        if (updateIndex !== -1) {
          index.entries[updateIndex] = metadata;
        }
        break;
      case 'delete':
        index.entries = index.entries.filter(e => e.entryId !== metadata.entryId);
        break;
    }

    index.updatedAt = Date.now();

    // Encrypt and store updated index
    const indexJson = JSON.stringify(index);
    const encryptedIndex = await this.encryptIndex(indexJson, masterPassword);
    const dataToStore = JSON.stringify(encryptedIndex);
    
    const blob = await this.walrusClient.store(dataToStore, {
      epochs: 10,
      deletable: true,
    });

    // Store the mapping from userId to index blob ID
    await this.storeIndexMapping(userId, blob.blobId);
  }

  /**
   * Create a new vault index
   */
  private createNewIndex(userId: string): VaultIndex {
    return {
      version: '1.0.0',
      userId,
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Generate a unique entry ID
   */
  private generateEntryId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Encrypt index data
   */
  private async encryptIndex(indexJson: string, masterPassword: string): Promise<EncryptedData> {
    // Create a dummy vault entry to reuse encryption logic
    const dummyEntry: VaultEntry = {
      name: 'index',
      username: 'index',
      password: indexJson,
      category: 'system',
      network: 'system',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const encrypted = await this.encryption.encryptVaultEntry(dummyEntry, masterPassword);
    
    // Return just the encrypted password field which contains our index
    return {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      authTag: encrypted.authTag,
    };
  }

  /**
   * Decrypt index data
   */
  private async decryptIndex(encryptedIndex: EncryptedData, masterPassword: string): Promise<string> {
    const decrypted = await this.encryption.decryptVaultEntry(encryptedIndex, masterPassword);
    return decrypted.password; // The index JSON was stored in the password field
  }

  /**
   * Store user ID to index blob ID mapping
   */
  private async storeIndexMapping(userId: string, blobId: string): Promise<void> {
    // For now, store in localStorage. In production, this could be stored on-chain
    // or in a more persistent decentralized storage solution
    if (typeof window !== 'undefined') {
      localStorage.setItem(`shadowvault_index_${userId}`, blobId);
    }
  }

  /**
   * Get index blob ID for user
   */
  private async getIndexBlobId(userId: string): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`shadowvault_index_${userId}`);
    }
    return null;
  }
}

// Export a default vault service instance
export const vaultService = new VaultService();