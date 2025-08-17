// ShadowVault Seal Hooks - React hooks for seal management
// Parallel to password vault but for document sealing

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { sealVaultService } from './service';
import { 
  SealEntry, 
  SealFormData, 
  SealCreationResult,
  SealDecryptionResult,
  SealUIState,
  FileUploadState,
  SealSearchState
} from './types';

/**
 * Main hook for seal vault operations
 */
export function useSealVault() {
  const { address } = useAccount();
  const [state, setState] = useState<SealUIState>({
    loading: false,
    error: null,
    seals: [],
    selectedSeal: undefined
  });

  // Load seals for the current user
  const loadSeals = useCallback(async () => {
    if (!address) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[useSealVault] 📋 Loading seals for user:', address);
      const seals = await sealVaultService.listSeals(address);
      
      setState(prev => ({
        ...prev,
        loading: false,
        seals,
        error: null
      }));

      console.log('[useSealVault] ✅ Seals loaded:', seals.length);
    } catch (error) {
      console.error('[useSealVault] ❌ Failed to load seals:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Failed to load seals: ${error}`
      }));
    }
  }, [address]);

  // Create a new seal
  const createSeal = useCallback(async (formData: SealFormData): Promise<SealCreationResult> => {
    if (!address) {
      return { success: false, error: 'No wallet address available' };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[useSealVault] 🔐 Creating new seal...', formData.name);
      const result = await sealVaultService.createSeal(formData, address);

      if (result.success && result.sealEntry) {
        // Add new seal to the list
        setState(prev => ({
          ...prev,
          loading: false,
          seals: [...prev.seals, result.sealEntry!],
          error: null
        }));

        console.log('[useSealVault] ✅ Seal created successfully:', result.sealEntry.id);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Unknown error'
        }));
      }

      return result;
    } catch (error) {
      console.error('[useSealVault] ❌ Failed to create seal:', error);
      const errorResult = { success: false, error: `Seal creation failed: ${error}` };
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorResult.error
      }));

      return errorResult;
    }
  }, [address]);

  // Retrieve and decrypt a seal
  const retrieveSeal = useCallback(async (seal: SealEntry): Promise<SealDecryptionResult> => {
    if (!address) {
      return { success: false, error: 'No wallet address available' };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[useSealVault] 📖 Retrieving seal...', seal.id);
      const result = await sealVaultService.retrieveSeal(seal, address);

      if (result.success) {
        // Update access count and last accessed
        setState(prev => ({
          ...prev,
          loading: false,
          seals: prev.seals.map(s => 
            s.id === seal.id 
              ? { 
                  ...s, 
                  accessCount: s.accessCount + 1,
                  lastAccessed: new Date().toISOString()
                }
              : s
          ),
          error: null
        }));

        console.log('[useSealVault] ✅ Seal retrieved successfully');
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Unknown error'
        }));
      }

      return result;
    } catch (error) {
      console.error('[useSealVault] ❌ Failed to retrieve seal:', error);
      const errorResult = { success: false, error: `Seal retrieval failed: ${error}` };
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorResult.error
      }));

      return errorResult;
    }
  }, [address]);

  // Select a seal for detailed view
  const selectSeal = useCallback((seal: SealEntry | undefined) => {
    setState(prev => ({ ...prev, selectedSeal: seal }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load seals when address changes
  useEffect(() => {
    if (address) {
      loadSeals();
    } else {
      setState({
        loading: false,
        error: null,
        seals: [],
        selectedSeal: undefined
      });
    }
  }, [address, loadSeals]);

  return {
    ...state,
    createSeal,
    retrieveSeal,
    selectSeal,
    loadSeals,
    clearError
  };
}

/**
 * Hook for file upload functionality
 */
export function useFileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    uploading: false,
    progress: 0
  });

  const selectFile = useCallback((file: File) => {
    console.log('[useFileUpload] 📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setUploadState({
      file,
      preview,
      uploading: false,
      progress: 0,
      error: undefined
    });
  }, []);

  const clearFile = useCallback(() => {
    if (uploadState.preview) {
      URL.revokeObjectURL(uploadState.preview);
    }
    
    setUploadState({
      file: null,
      preview: undefined,
      uploading: false,
      progress: 0,
      error: undefined
    });
  }, [uploadState.preview]);

  const simulateUpload = useCallback(async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({ ...prev, uploading: true, progress: 0 }));

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadState(prev => ({ ...prev, progress: i }));
    }

    setUploadState(prev => ({ ...prev, uploading: false, progress: 100 }));
  }, [uploadState.file]);

  return {
    ...uploadState,
    selectFile,
    clearFile,
    simulateUpload
  };
}

/**
 * Hook for seal search and filtering
 */
export function useSealSearch(seals: SealEntry[]) {
  const [searchState, setSearchState] = useState<SealSearchState>({
    query: '',
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const filteredSeals = useCallback(() => {
    let filtered = [...seals];

    // Apply text search
    if (searchState.query) {
      const query = searchState.query.toLowerCase();
      filtered = filtered.filter(seal =>
        seal.name.toLowerCase().includes(query) ||
        seal.description?.toLowerCase().includes(query) ||
        seal.originalFilename.toLowerCase().includes(query) ||
        seal.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (searchState.filters.type) {
      filtered = filtered.filter(seal => seal.type === searchState.filters.type);
    }

    if (searchState.filters.category) {
      filtered = filtered.filter(seal => seal.metadata.category === searchState.filters.category);
    }

    if (searchState.filters.status) {
      filtered = filtered.filter(seal => seal.status === searchState.filters.status);
    }

    if (searchState.filters.tags?.length) {
      filtered = filtered.filter(seal =>
        searchState.filters.tags!.some(tag =>
          seal.metadata.tags.includes(tag)
        )
      );
    }

    if (searchState.filters.dateRange) {
      const { start, end } = searchState.filters.dateRange;
      filtered = filtered.filter(seal => {
        const createdAt = new Date(seal.metadata.createdAt);
        return createdAt >= start && createdAt <= end;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (searchState.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'createdAt':
          aValue = new Date(a.metadata.createdAt);
          bValue = new Date(b.metadata.createdAt);
          break;
        case 'lastAccessed':
          aValue = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
          bValue = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
          break;
        case 'size':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return searchState.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return searchState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [seals, searchState]);

  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  const setFilters = useCallback((filters: Partial<SealSearchState['filters']>) => {
    setSearchState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters }
    }));
  }, []);

  const setSorting = useCallback((sortBy: SealSearchState['sortBy'], sortOrder: SealSearchState['sortOrder']) => {
    setSearchState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      filters: {}
    }));
  }, []);

  return {
    searchState,
    filteredSeals: filteredSeals(),
    setQuery,
    setFilters,
    setSorting,
    clearFilters
  };
}

/**
 * Hook for seal service status
 */
export function useSealStatus() {
  const [status, setStatus] = useState({
    initialized: false,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await sealVaultService.initialize();
        const serviceStatus = sealVaultService.getStatus();
        
        setStatus({
          initialized: serviceStatus.initialized,
          loading: false,
          error: null
        });
      } catch (error) {
        setStatus({
          initialized: false,
          loading: false,
          error: `Service initialization failed: ${error}`
        });
      }
    };

    checkStatus();
  }, []);

  return status;
}