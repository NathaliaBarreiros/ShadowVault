/**
 * React hooks for Walrus vault operations
 * Provides easy-to-use hooks for vault management in React components
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { vaultService, VaultService, VaultEntry, VaultMetadata, StorageResult, RetrievalResult } from './vault-service';
import { useAuth } from '@/components/providers/AuthProvider';

export interface UseVaultOptions {
  vaultService?: VaultService;
  autoLoad?: boolean;
}

export interface VaultState {
  entries: VaultMetadata[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface VaultActions {
  storeEntry: (entry: VaultEntry, masterPassword: string) => Promise<StorageResult>;
  retrieveEntry: (blobId: string, masterPassword: string) => Promise<RetrievalResult>;
  updateEntry: (entryId: string, updates: Partial<VaultEntry>, masterPassword: string) => Promise<StorageResult>;
  deleteEntry: (entryId: string, masterPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshEntries: (masterPassword: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Main hook for vault operations
 */
export function useVaultService(options: UseVaultOptions = {}): VaultState & VaultActions {
  const { user } = useAuth();
  const service = options.vaultService || vaultService;
  
  const [state, setState] = useState<VaultState>({
    entries: [],
    loading: false,
    error: null,
    initialized: false,
  });

  const userId = user?.id || 'anonymous';

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const setEntries = useCallback((entries: VaultMetadata[]) => {
    setState(prev => ({ ...prev, entries, initialized: true, loading: false, error: null }));
  }, []);

  /**
   * Store a new vault entry
   */
  const storeEntry = useCallback(async (entry: VaultEntry, masterPassword: string): Promise<StorageResult> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const result = await service.storeEntry(entry, masterPassword, userId);
      
      if (result.success && result.metadata) {
        // Add new entry to local state
        setState(prev => ({
          ...prev,
          entries: [...prev.entries, result.metadata!],
          loading: false,
        }));
      } else {
        setError(result.error || 'Failed to store entry');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [service, userId, setLoading, setError]);

  /**
   * Retrieve a vault entry
   */
  const retrieveEntry = useCallback(async (blobId: string, masterPassword: string): Promise<RetrievalResult> => {
    setLoading(true);
    try {
      const result = await service.retrieveEntry(blobId, masterPassword);
      setLoading(false);
      
      if (!result.success) {
        setError(result.error || 'Failed to retrieve entry');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [service, setLoading, setError]);

  /**
   * Update an existing vault entry
   */
  const updateEntry = useCallback(async (
    entryId: string,
    updates: Partial<VaultEntry>,
    masterPassword: string
  ): Promise<StorageResult> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const result = await service.updateEntry(entryId, updates, masterPassword, userId);
      
      if (result.success && result.metadata) {
        // Update entry in local state
        setState(prev => ({
          ...prev,
          entries: prev.entries.map(entry => 
            entry.entryId === entryId ? result.metadata! : entry
          ),
          loading: false,
        }));
      } else {
        setError(result.error || 'Failed to update entry');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [service, userId, setLoading, setError]);

  /**
   * Delete a vault entry
   */
  const deleteEntry = useCallback(async (
    entryId: string,
    masterPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const result = await service.deleteEntry(entryId, userId, masterPassword);
      
      if (result.success) {
        // Remove entry from local state
        setState(prev => ({
          ...prev,
          entries: prev.entries.filter(entry => entry.entryId !== entryId),
          loading: false,
        }));
      } else {
        setError(result.error || 'Failed to delete entry');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [service, userId, setLoading, setError]);

  /**
   * Refresh all vault entries
   */
  const refreshEntries = useCallback(async (masterPassword: string) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const entries = await service.getAllEntries(userId, masterPassword);
      setEntries(entries);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh entries');
    }
  }, [service, userId, setLoading, setError, setEntries]);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Auto-load entries if requested and user is available
  useEffect(() => {
    if (options.autoLoad && userId && userId !== 'anonymous' && !state.initialized) {
      // Note: Auto-load requires master password, so this would need to be implemented
      // based on your authentication flow
    }
  }, [options.autoLoad, userId, state.initialized]);

  return {
    // State
    entries: state.entries,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    // Actions
    storeEntry,
    retrieveEntry,
    updateEntry,
    deleteEntry,
    refreshEntries,
    clearError,
  };
}

/**
 * Hook for checking Walrus connectivity
 */
export function useWalrusStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error: string | null;
  }>({
    connected: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        // Try to store a small test blob
        const testData = 'test';
        const blob = await vaultService['walrusClient'].store(testData);
        
        if (mounted) {
          setStatus({
            connected: true,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setStatus({
            connected: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          });
        }
      }
    };

    checkStatus();

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}

/**
 * Hook for vault statistics
 */
export function useVaultStats(entries: VaultMetadata[]) {
  return {
    totalEntries: entries.length,
    categoryCounts: entries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalSize: entries.reduce((acc, entry) => acc + entry.size, 0),
    lastUpdated: entries.length > 0 
      ? Math.max(...entries.map(e => e.updatedAt))
      : null,
  };
}