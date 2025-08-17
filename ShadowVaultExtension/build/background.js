/* global chrome */

// Background script for ShadowVault extension
console.log('ShadowVault background script loaded');

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('ShadowVault extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize default settings on first install
    chrome.storage.local.set({
      shadowVaultSettings: {
        autoLock: true,
        lockTimeout: 15, // minutes
        biometric: false,
        darkMode: true,
        notifications: true
      },
      vaultData: {
        encrypted: true,
        entries: [],
        lastSync: null
      }
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_VAULT_DATA':
      handleGetVaultData(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'SAVE_VAULT_DATA':
      handleSaveVaultData(message.data, sendResponse);
      return true;
      
    case 'AUTO_FILL_DETECTED':
      handleAutoFillDetected(message.data, sender, sendResponse);
      return true;
      
    case 'WEB3_TRANSACTION_DETECTED':
      handleWeb3Transaction(message.data, sender, sendResponse);
      return true;
      
    case 'LOCK_VAULT':
      handleLockVault(sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Get vault data from storage
async function handleGetVaultData(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['vaultData', 'shadowVaultSettings']);
    sendResponse({ 
      success: true, 
      data: result.vaultData || { encrypted: true, entries: [] },
      settings: result.shadowVaultSettings || {}
    });
  } catch (error) {
    console.error('Error getting vault data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Save vault data to storage
async function handleSaveVaultData(data, sendResponse) {
  try {
    await chrome.storage.local.set({ vaultData: data });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving vault data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle auto-fill detection from content script
async function handleAutoFillDetected(data, sender, sendResponse) {
  try {
    // Get current tab info
    const tab = await chrome.tabs.get(sender.tab.id);
    const url = new URL(tab.url);
    
    // Check if we have stored credentials for this domain
    const result = await chrome.storage.local.get('vaultData');
    const vaultData = result.vaultData || { entries: [] };
    
    const matchingEntries = vaultData.entries.filter(entry => 
      entry.url && entry.url.includes(url.hostname)
    );
    
    if (matchingEntries.length > 0) {
      // Show notification that auto-fill is available
      chrome.action.setBadgeText({
        text: matchingEntries.length.toString(),
        tabId: sender.tab.id
      });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
    
    sendResponse({ 
      success: true, 
      matches: matchingEntries.length,
      available: matchingEntries.length > 0
    });
  } catch (error) {
    console.error('Error handling auto-fill detection:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle Web3 transaction detection
async function handleWeb3Transaction(data, sender, sendResponse) {
  try {
    const tab = await chrome.tabs.get(sender.tab.id);
    
    // Log the Web3 transaction for security monitoring
    const transactionLog = {
      timestamp: new Date().toISOString(),
      url: tab.url,
      title: tab.title,
      transaction: data,
      tabId: sender.tab.id
    };
    
    // Store transaction log
    const result = await chrome.storage.local.get('transactionLogs');
    const logs = result.transactionLogs || [];
    logs.unshift(transactionLog);
    
    // Keep only last 100 transactions
    const limitedLogs = logs.slice(0, 100);
    await chrome.storage.local.set({ transactionLogs: limitedLogs });
    
    // Show notification badge for Web3 activity
    chrome.action.setBadgeText({
      text: '🔒',
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({ color: '#8B5CF6' });
    
    sendResponse({ success: true, logged: true });
  } catch (error) {
    console.error('Error handling Web3 transaction:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Lock the vault
async function handleLockVault(sendResponse) {
  try {
    await chrome.storage.local.set({ 
      vaultLocked: true,
      lockTimestamp: Date.now()
    });
    
    // Clear any sensitive data from memory
    sendResponse({ success: true, locked: true });
  } catch (error) {
    console.error('Error locking vault:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Auto-lock functionality
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['shadowVaultSettings', 'vaultLocked', 'lastActivity']);
    const settings = result.shadowVaultSettings || {};
    const lastActivity = result.lastActivity || Date.now();
    
    if (settings.autoLock && !result.vaultLocked) {
      const lockTimeout = (settings.lockTimeout || 15) * 60 * 1000; // Convert to milliseconds
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > lockTimeout) {
        await chrome.storage.local.set({ 
          vaultLocked: true,
          lockTimestamp: Date.now()
        });
        console.log('Vault auto-locked due to inactivity');
      }
    }
  } catch (error) {
    console.error('Error in auto-lock check:', error);
  }
}, 60000); // Check every minute

// Clear badge when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.action.setBadgeText({ text: '', tabId });
});

// Update last activity timestamp
chrome.tabs.onActivated.addListener(async () => {
  await chrome.storage.local.set({ lastActivity: Date.now() });
});

console.log('ShadowVault background script initialized');