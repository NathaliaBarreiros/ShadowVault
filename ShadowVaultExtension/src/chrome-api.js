/* global chrome */

// Chrome API utilities for ShadowVault extension

/**
 * Get the current active tab
 * @returns {Promise<chrome.tabs.Tab>} Current tab information
 */
export const getCurrentTab = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error('Error getting current tab:', error);
    throw error;
  }
};

/**
 * Get data from Chrome storage
 * @param {string|string[]} keys - Storage keys to retrieve
 * @returns {Promise<Object>} Storage data
 */
export const getStorageData = async (keys) => {
  try {
    return await chrome.storage.local.get(keys);
  } catch (error) {
    console.error('Error getting storage data:', error);
    throw error;
  }
};

/**
 * Set data in Chrome storage
 * @param {Object} data - Data to store
 * @returns {Promise<void>}
 */
export const setStorageData = async (data) => {
  try {
    await chrome.storage.local.set(data);
  } catch (error) {
    console.error('Error setting storage data:', error);
    throw error;
  }
};

/**
 * Remove data from Chrome storage
 * @param {string|string[]} keys - Keys to remove
 * @returns {Promise<void>}
 */
export const removeStorageData = async (keys) => {
  try {
    await chrome.storage.local.remove(keys);
  } catch (error) {
    console.error('Error removing storage data:', error);
    throw error;
  }
};

/**
 * Send message to background script
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} Response from background script
 */
export const sendMessageToBackground = async (message) => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.error('Error sending message to background:', error);
    throw error;
  }
};

/**
 * Send message to content script in active tab
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} Response from content script
 */
export const sendMessageToContentScript = async (message) => {
  try {
    const tab = await getCurrentTab();
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    console.error('Error sending message to content script:', error);
    throw error;
  }
};

/**
 * Get vault data from storage
 * @returns {Promise<Object>} Vault data
 */
export const getVaultData = async () => {
  try {
    const response = await sendMessageToBackground({ type: 'GET_VAULT_DATA' });
    if (response.success) {
      return {
        data: response.data,
        settings: response.settings
      };
    }
    throw new Error(response.error || 'Failed to get vault data');
  } catch (error) {
    console.error('Error getting vault data:', error);
    throw error;
  }
};

/**
 * Save vault data to storage
 * @param {Object} vaultData - Vault data to save
 * @returns {Promise<void>}
 */
export const saveVaultData = async (vaultData) => {
  try {
    const response = await sendMessageToBackground({ 
      type: 'SAVE_VAULT_DATA', 
      data: vaultData 
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to save vault data');
    }
  } catch (error) {
    console.error('Error saving vault data:', error);
    throw error;
  }
};

/**
 * Lock the vault
 * @returns {Promise<void>}
 */
export const lockVault = async () => {
  try {
    const response = await sendMessageToBackground({ type: 'LOCK_VAULT' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to lock vault');
    }
  } catch (error) {
    console.error('Error locking vault:', error);
    throw error;
  }
};

/**
 * Fill credentials in the current tab
 * @param {Object} credentials - Credentials to fill
 * @returns {Promise<void>}
 */
export const fillCredentials = async (credentials) => {
  try {
    const response = await sendMessageToContentScript({
      type: 'FILL_CREDENTIALS',
      data: credentials
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to fill credentials');
    }
  } catch (error) {
    console.error('Error filling credentials:', error);
    throw error;
  }
};

/**
 * Get page forms information from content script
 * @returns {Promise<Object>} Page forms data
 */
export const getPageForms = async () => {
  try {
    const response = await sendMessageToContentScript({ type: 'GET_PAGE_FORMS' });
    if (response.success) {
      return response;
    }
    throw new Error(response.error || 'Failed to get page forms');
  } catch (error) {
    console.error('Error getting page forms:', error);
    // Return default data if content script is not available
    return { forms: 0, hasWeb3: false };
  }
};

/**
 * Update activity timestamp (for auto-lock functionality)
 * @returns {Promise<void>}
 */
export const updateActivity = async () => {
  try {
    await setStorageData({ lastActivity: Date.now() });
  } catch (error) {
    console.error('Error updating activity:', error);
  }
};

/**
 * Check if vault is locked
 * @returns {Promise<boolean>} True if vault is locked
 */
export const isVaultLocked = async () => {
  try {
    const data = await getStorageData(['vaultLocked']);
    return !!data.vaultLocked;
  } catch (error) {
    console.error('Error checking vault lock status:', error);
    return true; // Default to locked if error
  }
};

/**
 * Get extension settings
 * @returns {Promise<Object>} Extension settings
 */
export const getSettings = async () => {
  try {
    const data = await getStorageData(['shadowVaultSettings']);
    return data.shadowVaultSettings || {
      autoLock: true,
      lockTimeout: 15,
      biometric: false,
      darkMode: true,
      notifications: true
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

/**
 * Save extension settings
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>}
 */
export const saveSettings = async (settings) => {
  try {
    await setStorageData({ shadowVaultSettings: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

/**
 * Get transaction logs
 * @returns {Promise<Array>} Transaction logs
 */
export const getTransactionLogs = async () => {
  try {
    const data = await getStorageData(['transactionLogs']);
    return data.transactionLogs || [];
  } catch (error) {
    console.error('Error getting transaction logs:', error);
    return [];
  }
};

/**
 * Clear transaction logs
 * @returns {Promise<void>}
 */
export const clearTransactionLogs = async () => {
  try {
    await removeStorageData(['transactionLogs']);
  } catch (error) {
    console.error('Error clearing transaction logs:', error);
    throw error;
  }
};

export default {
  getCurrentTab,
  getStorageData,
  setStorageData,
  removeStorageData,
  sendMessageToBackground,
  sendMessageToContentScript,
  getVaultData,
  saveVaultData,
  lockVault,
  fillCredentials,
  getPageForms,
  updateActivity,
  isVaultLocked,
  getSettings,
  saveSettings,
  getTransactionLogs,
  clearTransactionLogs
};