/**
 * Utility functions for Walrus integration
 */

import { VaultEntry } from './encryption';

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format timestamp to human readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate estimated storage cost
 */
export function estimateStorageCost(sizeBytes: number, epochs: number = 10): {
  storageCost: number;
  costPerMB: number;
} {
  // These are rough estimates - actual costs depend on network conditions
  const baseCostPerMB = 0.0001; // Example cost in SUI tokens
  const costPerMB = baseCostPerMB * epochs;
  const sizeMB = sizeBytes / (1024 * 1024);
  
  return {
    storageCost: sizeMB * costPerMB,
    costPerMB,
  };
}

/**
 * Validate vault entry data
 */
export function validateVaultEntry(entry: Partial<VaultEntry>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!entry.name || entry.name.trim().length === 0) {
    errors.push('Service name is required');
  }

  if (!entry.username || entry.username.trim().length === 0) {
    errors.push('Username/email is required');
  }

  if (!entry.password || entry.password.length === 0) {
    errors.push('Password is required');
  }

  if (!entry.category || entry.category.trim().length === 0) {
    errors.push('Category is required');
  }

  if (!entry.network || entry.network.trim().length === 0) {
    errors.push('Storage network is required');
  }

  // Validate URL format if provided
  if (entry.url && entry.url.trim().length > 0) {
    try {
      new URL(entry.url.startsWith('http') ? entry.url : `https://${entry.url}`);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  // Validate password strength
  if (entry.password && entry.password.length < 8) {
    errors.push('Password should be at least 8 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure blob ID hash for tracking
 */
export async function generateBlobHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Chunk large data for storage
 */
export function chunkData(data: string, chunkSize: number = 10 * 1024 * 1024): string[] {
  const chunks: string[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Combine chunked data
 */
export function combineChunks(chunks: string[]): string {
  return chunks.join('');
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else suggestions.push('Use at least 12 characters');

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else suggestions.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  else suggestions.push('Add special characters');

  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score += 10;
  else suggestions.push('Avoid repeating characters');

  score = Math.min(score, 100);

  let label: string;
  if (score >= 80) label = 'Very Strong';
  else if (score >= 60) label = 'Strong';
  else if (score >= 40) label = 'Medium';
  else if (score >= 20) label = 'Weak';
  else label = 'Very Weak';

  return { score, label, suggestions };
}

/**
 * Network configuration helpers
 */
export const NETWORK_CONFIGS = {
  zircuit: {
    name: 'Zircuit Garfield Testnet',
    chainId: 48898,
    rpcUrl: 'https://garfield-testnet.zircuit.com',
    explorerUrl: 'https://explorer.garfield-testnet.zircuit.com',
    color: 'bg-green-100 text-green-800',
    speed: 'Fastest',
    cost: 'Low',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    color: 'bg-red-100 text-red-800',
    speed: 'Fast',
    cost: 'Low',
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    color: 'bg-orange-100 text-orange-800',
    speed: 'Fast',
    cost: 'Medium',
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    color: 'bg-purple-100 text-purple-800',
    speed: 'Medium',
    cost: 'Very Low',
  },
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    explorerUrl: 'https://etherscan.io',
    color: 'bg-blue-100 text-blue-800',
    speed: 'Slow',
    cost: 'High',
  },
} as const;

export type NetworkKey = keyof typeof NETWORK_CONFIGS;