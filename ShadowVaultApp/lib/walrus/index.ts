/**
 * Walrus Integration Library for ShadowVault
 * Export all Walrus-related functionality
 */

// Core client and configuration
export {
  WalrusClient,
  WALRUS_CONFIGS,
  walrusClient,
  type WalrusConfig,
  type WalrusBlob,
  type WalrusResponse,
  type StorageOptions,
} from './client';

// Encryption utilities
export {
  WalrusEncryption,
  walrusEncryption,
  type EncryptedData,
  type VaultEntry,
} from './encryption';

// High-level vault service
export {
  VaultService,
  vaultService,
  type VaultMetadata,
  type VaultIndex,
  type StorageResult,
  type RetrievalResult,
} from './vault-service';

// React hooks for easy integration
export { useVaultService } from './hooks';

// Utility functions
export * from './utils';