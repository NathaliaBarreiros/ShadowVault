/**
 * ShadowVault Encryption/Decryption Library
 * Uses Web Crypto API for secure client-side encryption
 */

// Encryption configuration
const CONFIG = {
  keyDerivation: {
    name: 'PBKDF2',
    iterations: 100000, // High iteration count for security
    hash: 'SHA-256',
    saltLength: 32
  },
  encryption: {
    name: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    tagLength: 128
  }
};

/**
 * Generate a random salt for key derivation
 * @returns {Uint8Array} Random salt
 */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(CONFIG.keyDerivation.saltLength));
}

/**
 * Generate a random initialization vector
 * @returns {Uint8Array} Random IV
 */
export function generateIV() {
  return crypto.getRandomValues(new Uint8Array(CONFIG.encryption.ivLength));
}

/**
 * Derive encryption key from master password
 * @param {string} masterPassword - User's master password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
export async function deriveKey(masterPassword, salt) {
  try {
    // Convert password to buffer
    const passwordBuffer = new TextEncoder().encode(masterPassword);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive the actual encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: CONFIG.keyDerivation.name,
        salt: salt,
        iterations: CONFIG.keyDerivation.iterations,
        hash: CONFIG.keyDerivation.hash
      },
      keyMaterial,
      {
        name: CONFIG.encryption.name,
        length: CONFIG.encryption.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Clear password from memory
    passwordBuffer.fill(0);
    
    return key;
  } catch (error) {
    console.error('Error deriving key:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - Data to encrypt
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<Object>} Encrypted data with metadata
 */
export async function encryptData(data, key) {
  try {
    // Generate random IV
    const iv = generateIV();
    
    // Convert data to buffer
    const dataBuffer = new TextEncoder().encode(data);
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: CONFIG.encryption.name,
        iv: iv,
        tagLength: CONFIG.encryption.tagLength
      },
      key,
      dataBuffer
    );
    
    return {
      data: new Uint8Array(encrypted),
      iv: iv,
      algorithm: CONFIG.encryption.name,
      keyDerivation: CONFIG.keyDerivation.name
    };
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {Object} encryptedData - Encrypted data with metadata
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(encryptedData, key) {
  try {
    const { data, iv } = encryptedData;
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: CONFIG.encryption.name,
        iv: iv,
        tagLength: CONFIG.encryption.tagLength
      },
      key,
      data
    );
    
    // Convert back to string
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

/**
 * Encrypt vault data with master password
 * @param {Object} vaultData - Vault data to encrypt
 * @param {string} masterPassword - Master password
 * @returns {Promise<Object>} Encrypted vault with metadata
 */
export async function encryptVault(vaultData, masterPassword) {
  try {
    // Generate salt for this encryption
    const salt = generateSalt();
    
    // Derive key from master password
    const key = await deriveKey(masterPassword, salt);
    
    // Serialize and encrypt vault data
    const serializedData = JSON.stringify(vaultData);
    const encrypted = await encryptData(serializedData, key);
    
    return {
      version: '1.0.0',
      encrypted: true,
      salt: Array.from(salt), // Convert to array for JSON storage
      data: Array.from(encrypted.data),
      iv: Array.from(encrypted.iv),
      algorithm: encrypted.algorithm,
      keyDerivation: encrypted.keyDerivation,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error encrypting vault:', error);
    throw new Error('Failed to encrypt vault');
  }
}

/**
 * Decrypt vault data with master password
 * @param {Object} encryptedVault - Encrypted vault data
 * @param {string} masterPassword - Master password
 * @returns {Promise<Object>} Decrypted vault data
 */
export async function decryptVault(encryptedVault, masterPassword) {
  try {
    const { salt, data, iv } = encryptedVault;
    
    // Convert arrays back to Uint8Arrays
    const saltBuffer = new Uint8Array(salt);
    const dataBuffer = new Uint8Array(data);
    const ivBuffer = new Uint8Array(iv);
    
    // Derive key from master password
    const key = await deriveKey(masterPassword, saltBuffer);
    
    // Decrypt the data
    const decrypted = await decryptData({
      data: dataBuffer,
      iv: ivBuffer
    }, key);
    
    // Parse and return vault data
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting vault:', error);
    throw new Error('Failed to decrypt vault - incorrect password or corrupted data');
  }
}

/**
 * Hash master password for verification (without storing the actual password)
 * @param {string} masterPassword - Master password
 * @param {Uint8Array} salt - Salt for hashing
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(masterPassword, salt) {
  try {
    const passwordBuffer = new TextEncoder().encode(masterPassword);
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: CONFIG.keyDerivation.iterations,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    // Clear password from memory
    passwordBuffer.fill(0);
    
    // Convert to hex string
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Generate a secure random password
 * @param {Object} options - Password generation options
 * @returns {string} Generated password
 */
export function generateSecurePassword(options = {}) {
  const defaultOptions = {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  };
  
  const opts = { ...defaultOptions, ...options };
  
  let charset = '';
  if (opts.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.includeNumbers) charset += '0123456789';
  if (opts.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (opts.excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, '');
  }
  
  if (charset.length === 0) {
    throw new Error('No character types selected for password generation');
  }
  
  // Use crypto.getRandomValues for secure randomness
  const randomValues = new Uint32Array(opts.length);
  crypto.getRandomValues(randomValues);
  
  let password = '';
  for (let i = 0; i < opts.length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  // Ensure at least one character from each selected type
  const ensureTypes = [];
  if (opts.includeLowercase) ensureTypes.push('abcdefghijklmnopqrstuvwxyz');
  if (opts.includeUppercase) ensureTypes.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (opts.includeNumbers) ensureTypes.push('0123456789');
  if (opts.includeSymbols) ensureTypes.push('!@#$%^&*');
  
  // Replace random positions with required character types
  for (let i = 0; i < ensureTypes.length && i < opts.length; i++) {
    const typeCharset = ensureTypes[i];
    const randomPos = Math.floor(Math.random() * opts.length);
    const randomChar = typeCharset[Math.floor(Math.random() * typeCharset.length)];
    password = password.substring(0, randomPos) + randomChar + password.substring(randomPos + 1);
  }
  
  return password;
}

/**
 * Calculate password strength score
 * @param {string} password - Password to analyze
 * @returns {Object} Strength analysis
 */
export function calculatePasswordStrength(password) {
  let score = 0;
  const analysis = {
    length: password.length,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[^A-Za-z0-9]/.test(password),
    hasRepeating: /(.)\1{2,}/.test(password),
    hasSequential: false
  };
  
  // Length scoring
  if (analysis.length >= 8) score += 1;
  if (analysis.length >= 12) score += 1;
  if (analysis.length >= 16) score += 1;
  
  // Character variety scoring
  if (analysis.hasLowercase) score += 1;
  if (analysis.hasUppercase) score += 1;
  if (analysis.hasNumbers) score += 1;
  if (analysis.hasSymbols) score += 2;
  
  // Penalty for repeating characters
  if (analysis.hasRepeating) score -= 1;
  
  // Check for sequential characters
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop'];
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      if (password.toLowerCase().includes(seq.substring(i, i + 3))) {
        analysis.hasSequential = true;
        score -= 1;
        break;
      }
    }
  }
  
  // Normalize score to 0-100
  const maxScore = 9;
  const normalizedScore = Math.max(0, Math.min(100, (score / maxScore) * 100));
  
  let strength = 'Very Weak';
  let color = '#e74c3c';
  
  if (normalizedScore >= 80) {
    strength = 'Very Strong';
    color = '#27ae60';
  } else if (normalizedScore >= 60) {
    strength = 'Strong';
    color = '#2ecc71';
  } else if (normalizedScore >= 40) {
    strength = 'Medium';
    color = '#f39c12';
  } else if (normalizedScore >= 20) {
    strength = 'Weak';
    color = '#e67e22';
  }
  
  return {
    score: normalizedScore,
    strength,
    color,
    analysis
  };
}

/**
 * Secure memory cleanup utility
 * @param {ArrayBuffer|Uint8Array|string} data - Data to clear
 */
export function secureCleanup(data) {
  try {
    if (data instanceof ArrayBuffer) {
      new Uint8Array(data).fill(0);
    } else if (data instanceof Uint8Array) {
      data.fill(0);
    } else if (typeof data === 'string') {
      // JavaScript strings are immutable, but we can try to overwrite the reference
      data = null;
    }
  } catch (error) {
    console.warn('Could not securely clean up memory:', error);
  }
}

export default {
  generateSalt,
  generateIV,
  deriveKey,
  encryptData,
  decryptData,
  encryptVault,
  decryptVault,
  hashPassword,
  generateSecurePassword,
  calculatePasswordStrength,
  secureCleanup
};