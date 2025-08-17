// ShadowVault Seal Service - High-level service for document sealing
// Integrates Seal encryption with Walrus storage and UI state management

import { ShadowVaultSealClient, createSealClient } from './client';
import { 
  SealEntry, 
  SealFormData, 
  SealCreationResult,
  SealDecryptionResult,
  WalrusBlob,
  SuiSealObject,
  SealMetadata,
  EncryptedSealData,
  SealIndex
} from './types';

export class SealVaultService {
  private sealClient: ShadowVaultSealClient | null = null;
  private walrusConfig = {
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space'
  };

  /**
   * Initialize the seal service
   */
  async initialize(): Promise<void> {
    console.log('[SealService] 🚀 Initializing SealVaultService...');
    try {
      this.sealClient = await createSealClient();
      console.log('[SealService] ✅ SealVaultService initialized successfully');
    } catch (error) {
      console.error('[SealService] ❌ Failed to initialize SealVaultService:', error);
      throw error;
    }
  }

  /**
   * Create a new sealed document
   */
  async createSeal(
    formData: SealFormData,
    userAddress: string
  ): Promise<SealCreationResult> {
    if (!this.sealClient) {
      await this.initialize();
    }

    if (!formData.file) {
      return { success: false, error: 'No file provided' };
    }

    console.log('[SealService] 📋 Creating new seal...', {
      name: formData.name,
      type: formData.type,
      filename: formData.file.name,
      fileSize: formData.file.size,
      threshold: formData.threshold,
      userAddress
    });

    try {
      // Step 1: Read file data
      console.log('[SealService] 📁 Reading file data...');
      const fileBuffer = await formData.file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      
      console.log('[SealService] ✅ File data read:', {
        originalSize: formData.file.size,
        processedSize: fileData.length,
        mimeType: formData.file.type
      });

      // Step 2: Create session key for user
      console.log('[SealService] 🔑 Creating session key...');
      const sessionKey = await this.sealClient!.createSessionKey(userAddress);
      
      // Step 3: Encrypt data with Seal IBE
      console.log('[SealService] 🔐 Encrypting file with Seal IBE...');
      const encryptedData = await this.sealClient!.encryptData(
        fileData,
        formData.accessPolicy || 'default_package',
        userAddress,
        formData.threshold
      );

      console.log('[SealService] ✅ File encrypted with IBE:', {
        keyReference: encryptedData.key,
        threshold: encryptedData.threshold,
        servers: encryptedData.servers.length
      });

      // Step 4: Store encrypted data in Walrus
      console.log('[SealService] 🌐 Uploading to Walrus...');
      const walrusBlob = await this.storeInWalrus(encryptedData.encryptedObject);

      // Step 5: Create Sui object for access control
      console.log('[SealService] ⛓️ Creating Sui access control object...');
      const suiObject = await this.createSuiObject(
        formData.accessPolicy || 'default_package',
        encryptedData.key,
        walrusBlob.blobId,
        formData.threshold
      );

      // Step 6: Create metadata
      const metadata: SealMetadata = {
        size: formData.file.size,
        mimeType: formData.file.type,
        category: formData.type,
        tags: formData.tags,
        createdAt: new Date().toISOString(),
        expiresAt: formData.expiresAt,
        description: formData.description
      };

      // Step 7: Create complete SealEntry
      const sealEntry: SealEntry = {
        id: `seal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        originalFilename: formData.file.name,
        fileSize: formData.file.size,
        mimeType: formData.file.type,
        encryptedData,
        walrusBlob,
        suiObject,
        metadata,
        owner: userAddress,
        network: formData.network,
        status: 'sealed',
        accessCount: 0
      };

      console.log('[SealService] ✅ Seal created successfully!', {
        sealId: sealEntry.id,
        blobId: walrusBlob.blobId,
        suiObjectId: suiObject.objectId,
        directUrl: walrusBlob.url
      });

      // Save seal to localStorage
      await this.saveSealToStorage(sealEntry);

      return {
        success: true,
        sealEntry,
        blobId: walrusBlob.blobId,
        suiObjectId: suiObject.objectId
      };

    } catch (error) {
      console.error('[SealService] ❌ Seal creation failed:', error);
      return {
        success: false,
        error: `Seal creation failed: ${error}`
      };
    }
  }

  /**
   * Retrieve and decrypt a sealed document
   */
  async retrieveSeal(
    sealEntry: SealEntry,
    userAddress: string
  ): Promise<SealDecryptionResult> {
    if (!this.sealClient) {
      await this.initialize();
    }

    console.log('[SealService] 📖 Retrieving seal...', {
      sealId: sealEntry.id,
      name: sealEntry.name,
      blobId: sealEntry.walrusBlob.blobId,
      userAddress
    });

    try {
      // Step 1: Validate access rights
      console.log('[SealService] 🔍 Validating access rights...');
      const hasAccess = await this.sealClient!.validateAccess(
        sealEntry.suiObject.packageId,
        userAddress
      );

      if (!hasAccess) {
        return {
          success: false,
          error: 'Access denied: You do not have permission to decrypt this seal'
        };
      }

      // Step 2: Create session key
      console.log('[SealService] 🔑 Creating session key for decryption...');
      await this.sealClient!.createSessionKey(userAddress);

      // Step 3: Retrieve encrypted data from Walrus
      console.log('[SealService] 🌐 Retrieving from Walrus...', {
        url: sealEntry.walrusBlob.url
      });
      const encryptedData = await this.retrieveFromWalrus(sealEntry.walrusBlob.blobId);

      // Step 4: Decrypt with Seal
      console.log('[SealService] 🔓 Decrypting with Seal IBE...');
      const decryptedData = await this.sealClient!.decryptData(
        sealEntry.encryptedData,
        sealEntry.suiObject.packageId
      );

      console.log('[SealService] ✅ Seal retrieved and decrypted successfully:', {
        originalSize: sealEntry.fileSize,
        decryptedSize: decryptedData.length,
        filename: sealEntry.originalFilename,
        mimeType: sealEntry.mimeType
      });

      return {
        success: true,
        data: decryptedData,
        filename: sealEntry.originalFilename,
        mimeType: sealEntry.mimeType
      };

    } catch (error) {
      console.error('[SealService] ❌ Seal retrieval failed:', error);
      return {
        success: false,
        error: `Seal retrieval failed: ${error}`
      };
    }
  }

  /**
   * Store encrypted data in Walrus
   */
  private async storeInWalrus(encryptedData: string): Promise<WalrusBlob> {
    console.log('[SealService] 🌐 Storing in Walrus...', {
      dataSize: encryptedData.length,
      publisherUrl: this.walrusConfig.publisherUrl
    });

    try {
      const dataBuffer = Buffer.from(encryptedData, 'utf8');
      
      const response = await fetch(`${this.walrusConfig.publisherUrl}/v1/blobs?epochs=10`, {
        method: 'PUT',
        body: dataBuffer,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      let blobId = null;

      if (result.newlyCreated?.blobObject?.blobId) {
        blobId = result.newlyCreated.blobObject.blobId;
      } else if (result.alreadyCertified?.blobId) {
        blobId = result.alreadyCertified.blobId;
      }

      if (!blobId) {
        throw new Error('Failed to extract blob ID from Walrus response');
      }

      const walrusBlob: WalrusBlob = {
        blobId,
        url: `${this.walrusConfig.aggregatorUrl}/v1/blobs/${blobId}`,
        size: dataBuffer.length,
        epochs: 10
      };

      console.log('[SealService] ✅ Stored in Walrus:', {
        blobId: walrusBlob.blobId,
        url: walrusBlob.url,
        size: walrusBlob.size
      });

      return walrusBlob;

    } catch (error) {
      console.error('[SealService] ❌ Walrus storage failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve encrypted data from Walrus
   */
  private async retrieveFromWalrus(blobId: string): Promise<string> {
    console.log('[SealService] 🌐 Retrieving from Walrus...', { blobId });

    try {
      const url = `${this.walrusConfig.aggregatorUrl}/v1/blobs/${blobId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Walrus retrieval failed: ${response.status} ${response.statusText}`);
      }

      const encryptedData = await response.text();
      
      console.log('[SealService] ✅ Retrieved from Walrus:', {
        blobId,
        dataSize: encryptedData.length
      });

      return encryptedData;

    } catch (error) {
      console.error('[SealService] ❌ Walrus retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Create Sui object for access control
   */
  private async createSuiObject(
    packageId: string,
    encryptionKey: string,
    walrusBlobId: string,
    threshold: number
  ): Promise<SuiSealObject> {
    console.log('[SealService] ⛓️ Creating Sui access control object...', {
      packageId,
      walrusBlobId,
      threshold
    });

    // In production, this would interact with Sui blockchain
    // For development, we'll create a mock object
    const suiObject: SuiSealObject = {
      packageId: packageId || 'default_package',
      objectId: `sui_object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accessFunction: 'seal_approve',
      threshold
    };

    console.log('[SealService] ✅ Sui object created:', {
      objectId: suiObject.objectId,
      packageId: suiObject.packageId,
      accessFunction: suiObject.accessFunction
    });

    return suiObject;
  }

  /**
   * List all seals for a user
   */
  async listSeals(userAddress: string): Promise<SealEntry[]> {
    console.log('[SealService] 📋 Listing seals for user:', userAddress);
    
    try {
      // Retrieve seals from localStorage (user-specific)
      const sealIndex = this.getSealIndex(userAddress);
      const seals: SealEntry[] = [];

      console.log('[SealService] 📊 Found seal index with', sealIndex.entries.length, 'entries');

      // Load each seal from localStorage
      for (const metadata of sealIndex.entries) {
        try {
          const sealData = localStorage.getItem(`shadowvault_seal_${userAddress}_${metadata.entryId}`);
          if (sealData) {
            const seal: SealEntry = JSON.parse(sealData);
            seals.push(seal);
          } else {
            console.warn('[SealService] ⚠️ Seal data not found for ID:', metadata.entryId);
          }
        } catch (error) {
          console.error('[SealService] ❌ Failed to load seal:', metadata.entryId, error);
        }
      }

      console.log('[SealService] ✅ Loaded', seals.length, 'seals from storage');
      
      // Sort by creation date (newest first)
      seals.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());
      
      return seals;

    } catch (error) {
      console.error('[SealService] ❌ Failed to list seals:', error);
      return [];
    }
  }

  /**
   * Get or create seal index for user
   */
  private getSealIndex(userAddress: string): SealIndex {
    const indexKey = `shadowvault_seal_index_${userAddress}`;
    const existingIndex = localStorage.getItem(indexKey);
    
    if (existingIndex) {
      try {
        return JSON.parse(existingIndex);
      } catch (error) {
        console.error('[SealService] ❌ Failed to parse seal index:', error);
      }
    }

    // Create new index
    const newIndex: SealIndex = {
      version: '1.0.0',
      userId: userAddress,
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    localStorage.setItem(indexKey, JSON.stringify(newIndex));
    console.log('[SealService] ✨ Created new seal index for user:', userAddress);
    
    return newIndex;
  }

  /**
   * Save seal to localStorage and update index
   */
  private async saveSealToStorage(seal: SealEntry): Promise<void> {
    try {
      // Save seal data
      const sealKey = `shadowvault_seal_${seal.owner}_${seal.id}`;
      localStorage.setItem(sealKey, JSON.stringify(seal));

      // Update index
      const sealIndex = this.getSealIndex(seal.owner);
      
      // Check if entry already exists
      const existingIndex = sealIndex.entries.findIndex(entry => entry.entryId === seal.id);
      
      const metadata: SealMetadata & { entryId: string } = {
        entryId: seal.id,
        size: seal.fileSize,
        mimeType: seal.mimeType,
        category: seal.type,
        tags: seal.metadata.tags,
        createdAt: seal.metadata.createdAt,
        description: seal.description,
        expiresAt: seal.metadata.expiresAt
      };

      if (existingIndex >= 0) {
        sealIndex.entries[existingIndex] = metadata;
      } else {
        sealIndex.entries.push(metadata);
      }

      sealIndex.updatedAt = Date.now();

      // Save updated index
      const indexKey = `shadowvault_seal_index_${seal.owner}`;
      localStorage.setItem(indexKey, JSON.stringify(sealIndex));

      console.log('[SealService] 💾 Seal saved to storage:', seal.id);
      
    } catch (error) {
      console.error('[SealService] ❌ Failed to save seal to storage:', error);
      throw error;
    }
  }

  /**
   * Delete seal from storage
   */
  private async deleteSealFromStorage(sealId: string, userAddress: string): Promise<void> {
    try {
      // Remove seal data
      const sealKey = `shadowvault_seal_${userAddress}_${sealId}`;
      localStorage.removeItem(sealKey);

      // Update index
      const sealIndex = this.getSealIndex(userAddress);
      sealIndex.entries = sealIndex.entries.filter(entry => entry.entryId !== sealId);
      sealIndex.updatedAt = Date.now();

      // Save updated index
      const indexKey = `shadowvault_seal_index_${userAddress}`;
      localStorage.setItem(indexKey, JSON.stringify(sealIndex));

      console.log('[SealService] 🗑️ Seal deleted from storage:', sealId);
      
    } catch (error) {
      console.error('[SealService] ❌ Failed to delete seal from storage:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: !!this.sealClient,
      sealClientStatus: this.sealClient?.getStatus(),
      walrusConfig: this.walrusConfig
    };
  }
}

// Export singleton instance
export const sealVaultService = new SealVaultService();