# 🔒 ShadowVault Chrome Extension - Installation Guide

## 📦 **Extension Ready for Installation**

The ShadowVault Chrome Extension has been successfully compiled and is ready for installation. This guide will walk you through the installation process and first-time setup.

## 🎯 **What You're Installing**

**ShadowVault** is a privacy-first password manager Chrome extension with:
- **🔐 Military-Grade Encryption**: AES-256-GCM + PBKDF2 (100,000 iterations)
- **🌐 Web3 Integration**: Privy authentication + Wagmi + Zircuit Garfield Testnet
- **🚀 Auto-Fill Capabilities**: Secure credential injection and form detection
- **📱 Modern UI**: React-based interface with dark/light theme support
- **🔒 Zero-Knowledge Architecture**: Master password never leaves your device

## 📋 **System Requirements**

- **Browser**: Chrome 88+ or any Chromium-based browser (Edge, Brave, Opera)
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: ~50MB for extension files

## 🚀 **Installation Steps**

### **Step 1: Enable Developer Mode**

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** toggle in the top-right corner

### **Step 2: Load the Extension**

1. Click **"Load unpacked"** button
2. Navigate to and select the `build` folder:
   ```
   /Users/osx/Projects/ETHGlobal-NY/ShadowVault/ShadowVaultExtension/build/
   ```
3. Click **"Select Folder"** or **"Open"**

### **Step 3: Verify Installation**

✅ **Success Indicators:**
- ShadowVault appears in your extensions list
- Extension icon (🔒) appears in Chrome toolbar
- Status shows **"On"** with no error messages

🚨 **If you see errors:**
- Refresh the extensions page and try again
- Ensure you selected the `build` folder, not the root project folder
- Check that all files are present in the build directory

### **Step 4: Pin the Extension (Recommended)**

1. Click the **puzzle piece icon** (🧩) in Chrome toolbar
2. Find **"ShadowVault"** in the dropdown
3. Click the **pin icon** (📌) to pin it to your toolbar

## 🔧 **First-Time Setup**

### **Step 1: Create Your Master Password**

1. Click the ShadowVault icon in your toolbar
2. You'll see the unlock screen prompting for a master password
3. **Create a strong master password** (this encrypts your entire vault)
4. **⚠️ IMPORTANT**: Write down your master password securely - it cannot be recovered!

### **Step 2: Add Your First Password**

1. After unlocking, you'll see the home screen
2. Click **"Add"** tab or the **"➕"** button
3. Fill out the form:
   - **Title**: Descriptive name (e.g., "Gmail Account")
   - **URL**: Website URL (auto-detected if on a site)
   - **Username**: Your username or email
   - **Password**: Use the generator or enter your own
   - **Notes**: Optional additional information

4. Click **"Save Entry"**

### **Step 3: Test Auto-Fill**

1. Navigate to a login page
2. The extension should detect login forms automatically
3. Click the ShadowVault icon to see matching credentials
4. Select an entry to auto-fill the form

## 🌐 **Web3 Integration Setup (Optional)**

### **Privy Authentication**

1. Go to the **"Web3"** tab in the extension
2. Click **"Connect with Privy"**
3. Follow the authentication flow (email, SMS, or wallet)
4. Your Web3 connection status will be displayed

### **External Wallet Connection**

1. Ensure you have MetaMask or another Web3 wallet installed
2. In the Web3 tab, click **"Connect External Wallet"**
3. Select your preferred wallet connector
4. Approve the connection in your wallet

### **Zircuit Network Setup**

The extension is pre-configured for **Zircuit Garfield Testnet**:
- **Chain ID**: 48898
- **RPC URL**: https://garfield-testnet.zircuit.com
- **Explorer**: https://explorer.garfield-testnet.zircuit.com

## 📊 **Features Overview**

### **🏠 Home Tab**
- View all saved passwords
- Quick search and filtering
- Site-specific credential matching
- Recent activity overview

### **➕ Add Tab**
- Add new password entries
- Auto-detect current website
- Secure password generator
- Strength assessment

### **📈 Analytics Tab**
- Password security scoring
- Usage statistics
- Security recommendations
- Breach monitoring alerts

### **⚙️ Settings Tab**
- Auto-lock timeout configuration
- Security preferences
- Import/export options
- Theme and appearance settings

### **🌐 Web3 Tab**
- Privy authentication status
- Wallet connection management
- Transaction activity logs
- Blockchain network information

## 🔐 **Security Features**

### **Encryption Standards**
- **AES-256-GCM**: Industry-standard symmetric encryption
- **PBKDF2**: Key derivation with 100,000 iterations
- **Secure Random**: Cryptographically secure password generation
- **Memory Protection**: Sensitive data cleared after use

### **Auto-Lock Protection**
- Configurable auto-lock timeout (1-60 minutes)
- Locks automatically when browser closes
- Manual lock option available
- Session invalidation on timeout

### **Privacy Features**
- **Zero-Knowledge**: Master password never transmitted
- **Local Storage**: All data encrypted locally
- **No Telemetry**: No user data collection
- **Open Source**: Transparent and auditable code

## 🛠️ **Troubleshooting**

### **Extension Won't Load**

**Problem**: Extension fails to install
**Solutions**:
1. Ensure you're using Chrome 88+
2. Check that Developer mode is enabled
3. Verify the build folder contains all necessary files
4. Try refreshing the extensions page

### **Popup Won't Open**

**Problem**: Clicking extension icon does nothing
**Solutions**:
1. Check for JavaScript errors in console (F12)
2. Disable other password manager extensions temporarily
3. Restart Chrome and try again
4. Reinstall the extension

### **Auto-Fill Not Working**

**Problem**: Forms not being detected or filled
**Solutions**:
1. Ensure the website URL matches saved entries
2. Check that content script permissions are granted
3. Try manually refreshing the page
4. Verify forms use standard HTML input types

### **Web3 Connection Issues**

**Problem**: Privy or wallet connections fail
**Solutions**:
1. Check internet connection
2. Ensure popup blockers aren't interfering
3. Try clearing browser cache and cookies
4. Verify wallet extension is installed and unlocked

### **Performance Issues**

**Problem**: Extension is slow or unresponsive
**Solutions**:
1. Close unused browser tabs
2. Check available system RAM
3. Restart Chrome browser
4. Reduce number of stored passwords if very large

## 📚 **Advanced Configuration**

### **Custom RPC Endpoints**

For advanced users wanting to use custom blockchain networks:

1. Contact development team for custom builds
2. Modify `src/providers/PrivyProvider.js`
3. Add new chain configurations
4. Rebuild extension: `npm run build`

### **Import Existing Passwords**

Currently supports manual entry. Future versions will include:
- CSV import from other password managers
- Browser bookmark import
- Encrypted backup file import

### **Development Mode**

For developers wanting to modify the extension:

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
cd ShadowVaultExtension
npm install

# Start development mode
npm start

# Build for production
npm run build
```

## 🔄 **Updates and Maintenance**

### **Checking for Updates**

1. Visit the extensions page: `chrome://extensions/`
2. Click **"Update"** to check for new versions
3. Enable **"Automatic updates"** for seamless upgrades

### **Backup Your Data**

**⚠️ CRITICAL**: Always backup your vault data:

1. Go to Settings tab
2. Click **"Export Vault"**
3. Save the encrypted backup file securely
4. Store your master password separately

### **Uninstallation**

**Before uninstalling**:
1. Export your vault data
2. Note down your master password
3. Consider migrating to another password manager

**To uninstall**:
1. Go to `chrome://extensions/`
2. Find ShadowVault
3. Click **"Remove"**
4. Confirm removal

## 🆘 **Support and Help**

### **Getting Help**

- **Documentation**: Check the project README and PLAN.md files
- **Issues**: Report bugs through the project's issue tracker
- **Community**: Join discussions in project forums

### **Security Concerns**

If you discover a security vulnerability:
1. **DO NOT** post publicly
2. Contact the development team privately
3. Provide detailed reproduction steps
4. Allow time for responsible disclosure

### **Feature Requests**

Have an idea for improvement?
1. Check existing feature requests
2. Submit detailed proposals
3. Consider contributing code
4. Participate in community discussions

## ✅ **Post-Installation Checklist**

After successful installation:

- [ ] Extension loads without errors
- [ ] Master password created and tested
- [ ] First password entry added successfully
- [ ] Auto-fill works on a test site
- [ ] Web3 connection tested (if using)
- [ ] Auto-lock timeout configured
- [ ] Extension pinned to toolbar
- [ ] Backup plan established

## 🎉 **You're Ready!**

Congratulations! ShadowVault is now installed and ready to secure your digital life. The extension provides military-grade password security with modern Web3 capabilities, all while maintaining your privacy and control.

**Remember**: Your master password is the key to everything. Keep it secure, unique, and never share it with anyone.

---

**Version**: 1.0.0  
**Last Updated**: 2025-08-17  
**Platform**: Chrome Extension  
**License**: MIT (check project license)

**🔐 Stay Secure. Stay Private. Stay in Control.**