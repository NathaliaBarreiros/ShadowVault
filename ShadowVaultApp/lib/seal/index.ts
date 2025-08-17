// ShadowVault Seal Library - Main exports
// Parallel document sealing system using Identity-Based Encryption

// Client and Service
export { ShadowVaultSealClient, createSealClient, DEFAULT_SEAL_CONFIG } from './client';
export { SealVaultService, sealVaultService } from './service';

// React Hooks
export { 
  useSealVault,
  useFileUpload,
  useSealSearch,
  useSealStatus
} from './hooks';

// Types and Interfaces
export type {
  SealEntry,
  SealFormData,
  SealCreationResult,
  SealDecryptionResult,
  SealConfig,
  SealServer,
  SealMetadata,
  WalrusBlob,
  SuiSealObject,
  EncryptedSealData,
  AccessPolicy,
  SessionKeyData,
  SealUIState,
  FileUploadState,
  SealFilter,
  SealSearchState,
  NetworkConfig
} from './types';

// Re-export commonly used constants
export const SEAL_DOCUMENT_TYPES = [
  'document',
  'contract', 
  'certificate',
  'image',
  'other'
] as const;

export const SEAL_CATEGORIES = [
  'legal',
  'medical',
  'financial',
  'personal',
  'business',
  'education',
  'other'
] as const;

export const SEAL_NETWORKS = [
  'zircuit',
  'optimism',
  'polygon'
] as const;