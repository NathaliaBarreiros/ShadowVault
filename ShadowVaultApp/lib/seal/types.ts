// ShadowVault Seal Types and Interfaces
// Parallel to password vault but for document sealing

export interface SealServer {
  objectId: string;
  weight: number;
  url: string;
  status: 'active' | 'inactive';
}

export interface SealMetadata {
  size: number;
  mimeType: string;
  category: 'document' | 'contract' | 'certificate' | 'image' | 'other';
  tags: string[];
  createdAt: string;
  expiresAt?: string;
  description?: string;
}

export interface WalrusBlob {
  blobId: string;
  url: string;
  size: number;
  epochs: number;
}

export interface SuiSealObject {
  packageId: string;
  objectId: string;
  accessFunction: string;
  threshold: number;
}

export interface EncryptedSealData {
  encryptedObject: string;   // IBE encrypted content
  key: string;              // Encryption key reference
  servers: SealServer[];    // Key server configurations
  threshold: number;        // t-of-n threshold for decryption
}

export interface SealEntry {
  id: string;
  name: string;
  type: 'document' | 'contract' | 'certificate' | 'image' | 'other';
  description?: string;
  
  // File information
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  
  // Seal encryption data
  encryptedData: EncryptedSealData;
  
  // Storage references
  walrusBlob: WalrusBlob;
  suiObject: SuiSealObject;
  
  // Metadata
  metadata: SealMetadata;
  
  // User information
  owner: string;           // Wallet address
  network: string;         // Storage network (zircuit, base, etc.)
  
  // Status
  status: 'sealed' | 'accessible' | 'expired' | 'error';
  lastAccessed?: string;
  accessCount: number;
}

export interface SealFormData {
  name: string;
  description: string;
  type: 'document' | 'contract' | 'certificate' | 'image' | 'other';
  category: string;
  tags: string[];
  file: File | null;
  threshold: number;
  accessPolicy: string;
  expiresAt?: string;
  network: string;
}

export interface SealCreationResult {
  success: boolean;
  sealEntry?: SealEntry;
  error?: string;
  blobId?: string;
  suiObjectId?: string;
}

export interface SealDecryptionResult {
  success: boolean;
  data?: Uint8Array;
  filename?: string;
  mimeType?: string;
  error?: string;
}

// Configuration for Seal SDK
export interface SealConfig {
  servers: SealServer[];
  defaultThreshold: number;
  suiNetwork: 'mainnet' | 'testnet' | 'devnet';
  walrusConfig: {
    publisherUrl: string;
    aggregatorUrl: string;
  };
}

// Access control related types
export interface AccessPolicy {
  packageId: string;
  functionName: string;
  description: string;
  requirements: string[];
}

export interface SessionKeyData {
  keyId: string;
  publicKey: string;
  expiresAt: number;
  userId: string;
}

// UI State types
export interface SealUIState {
  loading: boolean;
  error: string | null;
  seals: SealEntry[];
  selectedSeal?: SealEntry;
  uploadProgress?: number;
}

// File upload types
export interface FileUploadState {
  file: File | null;
  preview?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

// Search and filter types
export interface SealFilter {
  type?: SealEntry['type'];
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: SealEntry['status'];
}

export interface SealSearchState {
  query: string;
  filters: SealFilter;
  sortBy: 'name' | 'createdAt' | 'lastAccessed' | 'size';
  sortOrder: 'asc' | 'desc';
}

// Network configuration
export interface NetworkConfig {
  id: string;
  name: string;
  speed: string;
  cost: string;
  color: string;
  sealSupported: boolean;
}

// Storage and persistence types
export interface SealIndex {
  version: string;
  userId: string;
  entries: Array<SealMetadata & { entryId: string }>;
  createdAt: number;
  updatedAt: number;
}