/* global chrome */

// Content script for ShadowVault extension
console.log('ShadowVault content script loaded on:', window.location.hostname);

// Track form fields for auto-fill detection
let detectedForms = [];
let web3Provider = null;

// Initialize content script
function initializeShadowVault() {
  detectLoginForms();
  detectWeb3Provider();
  setupFormListeners();
  injectAutoFillButtons();
}

// Detect login/registration forms on the page
function detectLoginForms() {
  const forms = document.querySelectorAll('form');
  const passwordFields = document.querySelectorAll('input[type="password"]');
  const emailFields = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
  const usernameFields = document.querySelectorAll('input[type="text"][name*="user"], input[type="text"][name*="login"], input[id*="user"], input[id*="login"]');
  
  if (passwordFields.length > 0 || emailFields.length > 0 || usernameFields.length > 0) {
    console.log('ShadowVault: Login form detected');
    
    // Notify background script about auto-fill opportunity
    chrome.runtime.sendMessage({
      type: 'AUTO_FILL_DETECTED',
      data: {
        url: window.location.href,
        hostname: window.location.hostname,
        formCount: forms.length,
        passwordFields: passwordFields.length,
        emailFields: emailFields.length,
        usernameFields: usernameFields.length
      }
    }).catch(error => console.error('Error sending auto-fill message:', error));
    
    detectedForms = Array.from(forms);
  }
}

// Detect Web3 providers (MetaMask, etc.)
function detectWeb3Provider() {
  // Check for Ethereum provider
  if (window.ethereum) {
    web3Provider = window.ethereum;
    console.log('ShadowVault: Web3 provider detected');
    
    // Listen for Web3 events
    setupWeb3Listeners();
  }
  
  // Also check for provider injection after page load
  setTimeout(() => {
    if (window.ethereum && !web3Provider) {
      web3Provider = window.ethereum;
      setupWeb3Listeners();
    }
  }, 1000);
}

// Setup Web3 event listeners
function setupWeb3Listeners() {
  if (!web3Provider) return;
  
  // Listen for account changes
  web3Provider.on('accountsChanged', (accounts) => {
    console.log('ShadowVault: Web3 accounts changed');
    notifyWeb3Activity('accountsChanged', { accounts });
  });
  
  // Listen for network changes
  web3Provider.on('chainChanged', (chainId) => {
    console.log('ShadowVault: Web3 chain changed');
    notifyWeb3Activity('chainChanged', { chainId });
  });
  
  // Intercept Web3 requests
  const originalRequest = web3Provider.request;
  web3Provider.request = function(args) {
    console.log('ShadowVault: Web3 request intercepted:', args.method);
    
    // Notify for sensitive operations
    if (['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign'].includes(args.method)) {
      notifyWeb3Activity('sensitiveOperation', { method: args.method, params: args.params });
    }
    
    return originalRequest.apply(this, arguments);
  };
}

// Notify background script about Web3 activity
function notifyWeb3Activity(type, data) {
  chrome.runtime.sendMessage({
    type: 'WEB3_TRANSACTION_DETECTED',
    data: {
      activityType: type,
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString(),
      ...data
    }
  }).catch(error => console.error('Error sending Web3 activity:', error));
}

// Setup form field listeners
function setupFormListeners() {
  // Listen for password field interactions
  document.addEventListener('focusin', (event) => {
    if (event.target.type === 'password' || 
        event.target.type === 'email' || 
        (event.target.type === 'text' && (
          event.target.name?.toLowerCase().includes('user') ||
          event.target.name?.toLowerCase().includes('login') ||
          event.target.id?.toLowerCase().includes('user') ||
          event.target.id?.toLowerCase().includes('login')
        ))) {
      
      showShadowVaultHint(event.target);
    }
  });
  
  // Listen for form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.tagName === 'FORM') {
      analyzeCapturedCredentials(form);
    }
  });
}

// Show ShadowVault hint near form fields
function showShadowVaultHint(field) {
  // Remove any existing hints
  const existingHints = document.querySelectorAll('.shadowvault-hint');
  existingHints.forEach(hint => hint.remove());
  
  // Create hint element
  const hint = document.createElement('div');
  hint.className = 'shadowvault-hint';
  hint.innerHTML = `
    <div style="
      position: absolute;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      cursor: pointer;
      user-select: none;
      margin-top: 4px;
    ">
      🔒 ShadowVault available - Click to auto-fill
    </div>
  `;
  
  // Position hint below the field
  const rect = field.getBoundingClientRect();
  hint.style.position = 'fixed';
  hint.style.left = rect.left + 'px';
  hint.style.top = (rect.bottom + 4) + 'px';
  hint.style.zIndex = '10000';
  
  // Add click handler to open extension
  hint.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_VAULT_FOR_AUTOFILL', field: field.name || field.id });
    hint.remove();
  });
  
  // Add to page
  document.body.appendChild(hint);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (hint.parentNode) {
      hint.remove();
    }
  }, 5000);
}

// Analyze captured credentials for saving
function analyzeCapturedCredentials(form) {
  const formData = new FormData(form);
  const credentials = {};
  
  // Extract common credential fields
  for (const [key, value] of formData.entries()) {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('email') || lowerKey.includes('username') || lowerKey.includes('user')) {
      credentials.username = value;
    }
    
    if (lowerKey.includes('password') && !lowerKey.includes('confirm')) {
      credentials.password = value;
    }
  }
  
  if (credentials.username || credentials.password) {
    console.log('ShadowVault: Credentials detected in form submission');
    
    // Show save prompt
    showSavePrompt(credentials);
  }
}

// Show prompt to save credentials
function showSavePrompt(credentials) {
  // Create save prompt overlay
  const overlay = document.createElement('div');
  overlay.id = 'shadowvault-save-prompt';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        max-width: 400px;
        width: 90%;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 24px; margin-right: 12px;">🔒</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 600;">ShadowVault</h3>
        </div>
        <p style="margin: 0 0 20px 0; color: #666;">
          Save these credentials to your secure vault?
        </p>
        <div style="margin-bottom: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
          <div><strong>Site:</strong> ${window.location.hostname}</div>
          <div><strong>Username:</strong> ${credentials.username || 'Not detected'}</div>
          <div><strong>Password:</strong> ${'•'.repeat(8)}</div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="shadowvault-save-cancel" style="
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
          ">Cancel</button>
          <button id="shadowvault-save-confirm" style="
            padding: 8px 16px;
            border: none;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 6px;
            cursor: pointer;
          ">Save to Vault</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Handle button clicks
  document.getElementById('shadowvault-save-cancel').addEventListener('click', () => {
    overlay.remove();
  });
  
  document.getElementById('shadowvault-save-confirm').addEventListener('click', () => {
    // Send credentials to extension for saving
    chrome.runtime.sendMessage({
      type: 'SAVE_CREDENTIALS',
      data: {
        url: window.location.href,
        hostname: window.location.hostname,
        title: document.title,
        credentials: credentials,
        timestamp: new Date().toISOString()
      }
    });
    
    overlay.remove();
    
    // Show success message
    showNotification('Credentials saved to ShadowVault! 🔒');
  });
}

// Inject auto-fill buttons near detected forms
function injectAutoFillButtons() {
  detectedForms.forEach(form => {
    const passwordField = form.querySelector('input[type="password"]');
    if (passwordField && !form.querySelector('.shadowvault-autofill-btn')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'shadowvault-autofill-btn';
      button.innerHTML = '🔒 ShadowVault';
      button.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        z-index: 1000;
        margin-left: 8px;
      `;
      
      passwordField.parentNode.appendChild(button);
      
      button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_VAULT_FOR_AUTOFILL' });
      });
    }
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Fade in
  requestAnimationFrame(() => {
    notification.style.opacity = 1;
  });
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = 0;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// Listen for messages from extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'FILL_CREDENTIALS':
      fillCredentials(message.data);
      sendResponse({ success: true });
      break;
      
    case 'GET_PAGE_FORMS':
      sendResponse({ 
        success: true, 
        forms: detectedForms.length,
        hasWeb3: !!web3Provider 
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true;
});

// Fill credentials into form fields
function fillCredentials(credentials) {
  // Find username field
  const usernameSelectors = [
    'input[type="email"]',
    'input[name*="email"]',
    'input[id*="email"]',
    'input[name*="user"]',
    'input[id*="user"]',
    'input[name*="login"]',
    'input[id*="login"]'
  ];
  
  let usernameField = null;
  for (const selector of usernameSelectors) {
    usernameField = document.querySelector(selector);
    if (usernameField) break;
  }
  
  // Find password field
  const passwordField = document.querySelector('input[type="password"]');
  
  // Fill fields
  if (usernameField && credentials.username) {
    usernameField.value = credentials.username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  if (passwordField && credentials.password) {
    passwordField.value = credentials.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  showNotification('Credentials auto-filled by ShadowVault! 🔒');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeShadowVault);
} else {
  initializeShadowVault();
}

// Re-scan for forms when page content changes
const observer = new MutationObserver(() => {
  detectLoginForms();
  injectAutoFillButtons();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('ShadowVault content script initialized');