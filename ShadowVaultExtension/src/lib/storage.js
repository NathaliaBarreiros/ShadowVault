/**
 * ShadowVault Storage Management
 * Handles secure data persistence using Chrome Storage API
 */

/* global chrome */

import { encryptVault, decryptVault } from './crypto.js';

// Storage keys
const STORAGE_KEYS = {
  VAULT_DATA: 'shadowvault_data',
  SETTINGS: 'shadowvault_settings', 
  SESSION: 'shadowvault_session',
  TRANSACTION_LOGS: 'shadowvault_logs',
  AUTH_STATE: 'shadowvault_auth'
};

// Default settings
const DEFAULT_SETTINGS = {
  autoLock: true,
  lockTimeout: 15, // minutes
  biometric: false,
  darkMode: true,
  notifications: true,
  autoFill: true,
  autoSave: true,
  passwordGeneration: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  }
};

// Default vault structure
const DEFAULT_VAULT = {
  version: '1.0.0',
  entries: [],
  folders: [],
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Get data from Chrome storage
 * @param {string|string[]} keys - Storage keys to retrieve
 * @returns {Promise<Object>} Storage data
 */
async function getStorageData(keys) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return await chrome.storage.local.get(keys);
    } else {
      // Fallback to localStorage for development
      console.warn('Chrome storage not available, using localStorage fallback');
      const result = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];
      
      keyArray.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            result[key] = JSON.parse(data);
          } catch {
            result[key] = data;
          }
        }
      });
      
      return result;
    }
  } catch (error) {
    console.error('Error getting storage data:', error);
    throw new Error('Failed to retrieve data from storage');
  }
}

/**
 * Set data in Chrome storage
 * @param {Object} data - Data to store
 * @returns {Promise<void>}
 */
async function setStorageData(data) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set(data);
    } else {
      // Fallback to localStorage for development
      console.warn('Chrome storage not available, using localStorage fallback');
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }
  } catch (error) {
    console.error('Error setting storage data:', error);
    throw new Error('Failed to store data');
  }
}

/**
 * Remove data from Chrome storage
 * @param {string|string[]} keys - Keys to remove
 * @returns {Promise<void>}
 */
async function removeStorageData(keys) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(keys);
    } else {
      // Fallback to localStorage for development
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('Error removing storage data:', error);
    throw new Error('Failed to remove data from storage');
  }
}

/**
 * Initialize vault with master password
 * @param {string} masterPassword - Master password for encryption
 * @returns {Promise<Object>} Initialized vault
 */
export async function initializeVault(masterPassword) {
  try {
    // Create default vault
    const vault = {
      ...DEFAULT_VAULT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Encrypt and store vault
    const encryptedVault = await encryptVault(vault, masterPassword);
    await setStorageData({ [STORAGE_KEYS.VAULT_DATA]: encryptedVault });
    
    // Initialize settings
    await setStorageData({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
    
    // Set auth state
    await setStorageData({ 
      [STORAGE_KEYS.AUTH_STATE]: {
        isSetup: true,
        lastActivity: Date.now(),
        vaultLocked: false
      }
    });
    
    return vault;
  } catch (error) {
    console.error('Error initializing vault:', error);
    throw new Error('Failed to initialize vault');
  }
}

/**
 * Check if vault is already set up
 * @returns {Promise<boolean>} True if vault exists
 */
export async function isVaultSetup() {
  try {
    const authState = await getStorageData(STORAGE_KEYS.AUTH_STATE);
    return !!(authState[STORAGE_KEYS.AUTH_STATE]?.isSetup);
  } catch (error) {
    console.error('Error checking vault setup:', error);
    return false;
  }
}

/**
 * Load and decrypt vault data
 * @param {string} masterPassword - Master password for decryption
 * @returns {Promise<Object>} Decrypted vault data
 */
export async function loadVault(masterPassword) {
  try {
    const data = await getStorageData(STORAGE_KEYS.VAULT_DATA);
    const encryptedVault = data[STORAGE_KEYS.VAULT_DATA];
    
    if (!encryptedVault) {
      throw new Error('No vault data found');
    }
    
    if (!encryptedVault.encrypted) {
      // Legacy unencrypted data
      return encryptedVault;
    }
    
    // Decrypt vault
    const vault = await decryptVault(encryptedVault, masterPassword);
    
    // Update last activity
    await updateActivity();
    
    return vault;
  } catch (error) {
    console.error('Error loading vault:', error);
    throw error; // Re-throw to distinguish between wrong password and other errors
  }
}

/**
 * Save vault data with encryption
 * @param {Object} vaultData - Vault data to save
 * @param {string} masterPassword - Master password for encryption
 * @returns {Promise<void>}
 */
export async function saveVault(vaultData, masterPassword) {
  try {
    // Update timestamp
    const updatedVault = {
      ...vaultData,
      updatedAt: new Date().toISOString()
    };
    
    // Encrypt and store
    const encryptedVault = await encryptVault(updatedVault, masterPassword);
    await setStorageData({ [STORAGE_KEYS.VAULT_DATA]: encryptedVault });
    
    // Update activity
    await updateActivity();
    
  } catch (error) {
    console.error('Error saving vault:', error);
    throw new Error('Failed to save vault data');
  }
}

/**
 * Get vault settings
 * @returns {Promise<Object>} Vault settings
 */
export async function getSettings() {
  try {
    const data = await getStorageData(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...data[STORAGE_KEYS.SETTINGS] };
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save vault settings
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await setStorageData({ [STORAGE_KEYS.SETTINGS]: updatedSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Lock the vault
 * @returns {Promise<void>}
 */
export async function lockVault() {
  try {
    await setStorageData({
      [STORAGE_KEYS.AUTH_STATE]: {
        isSetup: true,
        vaultLocked: true,
        lockTimestamp: Date.now()
      }
    });
    
    // Clear session data
    await removeStorageData(STORAGE_KEYS.SESSION);
    
  } catch (error) {
    console.error('Error locking vault:', error);
    throw new Error('Failed to lock vault');
  }
}

/**
 * Unlock the vault
 * @returns {Promise<void>}
 */
export async function unlockVault() {
  try {
    await setStorageData({
      [STORAGE_KEYS.AUTH_STATE]: {
        isSetup: true,
        vaultLocked: false,
        lastActivity: Date.now()
      }
    });
  } catch (error) {
    console.error('Error unlocking vault:', error);
    throw new Error('Failed to unlock vault');
  }
}

/**
 * Check if vault is locked
 * @returns {Promise<boolean>} True if vault is locked
 */
export async function isVaultLocked() {
  try {
    const data = await getStorageData(STORAGE_KEYS.AUTH_STATE);
    const authState = data[STORAGE_KEYS.AUTH_STATE];
    
    if (!authState || !authState.isSetup) {
      return true; // Not setup = locked
    }
    
    return !!authState.vaultLocked;
  } catch (error) {
    console.error('Error checking vault lock status:', error);
    return true; // Default to locked on error
  }
}

/**
 * Update last activity timestamp
 * @returns {Promise<void>}
 */
export async function updateActivity() {
  try {
    const data = await getStorageData(STORAGE_KEYS.AUTH_STATE);
    const authState = data[STORAGE_KEYS.AUTH_STATE] || {};
    
    await setStorageData({
      [STORAGE_KEYS.AUTH_STATE]: {
        ...authState,
        lastActivity: Date.now()
      }
    });
  } catch (error) {
    console.error('Error updating activity:', error);
  }
}

/**
 * Check if auto-lock should trigger
 * @returns {Promise<boolean>} True if should auto-lock
 */
export async function shouldAutoLock() {
  try {
    const [authData, settingsData] = await Promise.all([
      getStorageData(STORAGE_KEYS.AUTH_STATE),
      getStorageData(STORAGE_KEYS.SETTINGS)
    ]);
    
    const authState = authData[STORAGE_KEYS.AUTH_STATE];
    const settings = settingsData[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
    
    if (!settings.autoLock || !authState || authState.vaultLocked) {
      return false;
    }
    
    const lastActivity = authState.lastActivity || 0;
    const lockTimeout = (settings.lockTimeout || 15) * 60 * 1000; // Convert to milliseconds
    const timeSinceActivity = Date.now() - lastActivity;
    
    return timeSinceActivity > lockTimeout;
  } catch (error) {
    console.error('Error checking auto-lock:', error);
    return false;
  }
}

/**
 * Add transaction log entry
 * @param {Object} logEntry - Transaction log entry
 * @returns {Promise<void>}
 */
export async function addTransactionLog(logEntry) {
  try {
    const data = await getStorageData(STORAGE_KEYS.TRANSACTION_LOGS);
    const logs = data[STORAGE_KEYS.TRANSACTION_LOGS] || [];
    
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    
    logs.unshift(newLog);
    
    // Keep only last 100 logs
    const limitedLogs = logs.slice(0, 100);
    
    await setStorageData({ [STORAGE_KEYS.TRANSACTION_LOGS]: limitedLogs });
  } catch (error) {
    console.error('Error adding transaction log:', error);
  }
}

/**
 * Get transaction logs
 * @returns {Promise<Array>} Transaction logs
 */
export async function getTransactionLogs() {
  try {
    const data = await getStorageData(STORAGE_KEYS.TRANSACTION_LOGS);
    return data[STORAGE_KEYS.TRANSACTION_LOGS] || [];
  } catch (error) {
    console.error('Error getting transaction logs:', error);
    return [];
  }
}

/**
 * Clear transaction logs
 * @returns {Promise<void>}
 */
export async function clearTransactionLogs() {
  try {
    await removeStorageData(STORAGE_KEYS.TRANSACTION_LOGS);
  } catch (error) {
    console.error('Error clearing transaction logs:', error);
    throw new Error('Failed to clear transaction logs');
  }
}

/**
 * Export vault data for backup
 * @param {string} masterPassword - Master password for decryption
 * @returns {Promise<Object>} Exportable vault data
 */
export async function exportVault(masterPassword) {
  try {
    const vault = await loadVault(masterPassword);
    const settings = await getSettings();
    const logs = await getTransactionLogs();
    
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      vault: vault,
      settings: settings,
      logs: logs.slice(0, 50) // Include only recent logs
    };
  } catch (error) {
    console.error('Error exporting vault:', error);
    throw new Error('Failed to export vault data');
  }
}

/**
 * Get storage usage statistics
 * @returns {Promise<Object>} Storage statistics
 */
export async function getStorageStats() {
  try {
    const allData = await getStorageData([
      STORAGE_KEYS.VAULT_DATA,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.TRANSACTION_LOGS,
      STORAGE_KEYS.AUTH_STATE
    ]);
    
    let totalSize = 0;
    const stats = {};
    
    Object.entries(allData).forEach(([key, value]) => {
      const size = new Blob([JSON.stringify(value)]).size;
      totalSize += size;
      stats[key] = {
        size: size,
        sizeFormatted: formatBytes(size)
      };
    });
    
    return {
      totalSize: totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      breakdown: stats
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalSize: 0, totalSizeFormatted: '0 B', breakdown: {} };
  }
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  initializeVault,
  isVaultSetup,
  loadVault,
  saveVault,
  getSettings,
  saveSettings,
  lockVault,
  unlockVault,
  isVaultLocked,
  updateActivity,
  shouldAutoLock,
  addTransactionLog,
  getTransactionLogs,
  clearTransactionLogs,
  exportVault,
  getStorageStats
};