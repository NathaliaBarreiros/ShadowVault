/**
 * Encryption utilities for Walrus storage
 * Provides AES-GCM encryption for vault data before storing in Walrus
 */

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  authTag: string;
}

export interface VaultEntry {
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: string;
  network: string;
  createdAt: number;
  updatedAt: number;
}

export class WalrusEncryption {
  /**
   * Derive a key from a password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random salt
   */
  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generate a random IV
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Encrypt vault entry data
   */
  async encryptVaultEntry(entry: VaultEntry, masterPassword: string): Promise<EncryptedData> {
    try {
      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Derive encryption key
      const key = await this.deriveKey(masterPassword, salt);

      // Serialize and encrypt the entry
      const entryJson = JSON.stringify(entry);
      const encoder = new TextEncoder();
      const data = encoder.encode(entryJson);

      const result = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        data
      );

      // Extract ciphertext and auth tag
      const ciphertext = result.slice(0, -16);
      const authTag = result.slice(-16);

      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        authTag: this.arrayBufferToBase64(authTag),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Failed to encrypt vault entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt vault entry data
   */
  async decryptVaultEntry(encryptedData: EncryptedData, masterPassword: string): Promise<VaultEntry> {
    try {
      // Convert base64 strings back to ArrayBuffers
      const salt = new Uint8Array(this.base64ToArrayBuffer(encryptedData.salt));
      const iv = new Uint8Array(this.base64ToArrayBuffer(encryptedData.iv));
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const authTag = this.base64ToArrayBuffer(encryptedData.authTag);

      // Combine ciphertext and auth tag
      const encryptedBuffer = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
      encryptedBuffer.set(new Uint8Array(ciphertext));
      encryptedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength);

      // Derive decryption key
      const key = await this.deriveKey(masterPassword, salt);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encryptedBuffer
      );

      // Convert back to string and parse JSON
      const decoder = new TextDecoder();
      const entryJson = decoder.decode(decryptedBuffer);
      
      return JSON.parse(entryJson) as VaultEntry;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Failed to decrypt vault entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a secure random master password
   */
  generateMasterPassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    
    return password;
  }

  /**
   * Hash a master password for verification (non-reversible)
   */
  async hashMasterPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verify a master password against its hash
   */
  async verifyMasterPassword(password: string, hash: string): Promise<boolean> {
    try {
      const computedHash = await this.hashMasterPassword(password);
      return computedHash === hash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

// Export a default encryption instance
export const walrusEncryption = new WalrusEncryption();