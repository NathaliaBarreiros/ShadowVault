#!/usr/bin/env node

/**
 * Simple Walrus Storage Proof of Concept
 * Tests save and retrieve functionality with REAL Walrus testnet
 */

const crypto = require('crypto');
const https = require('https');

// Real Walrus testnet configuration
const WALRUS_CONFIG = {
  aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
  publisherUrl: 'https://publisher.walrus-testnet.walrus.space', 
  network: 'testnet'
};

// Mock Web Crypto API for Node.js
global.crypto = {
  subtle: crypto.webcrypto.subtle,
  getRandomValues: (array) => crypto.randomFillSync(array),
};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

console.log('🔐 Walrus Storage - Simple Test');
console.log('==============================\n');

// Test data
const vaultEntry = {
  name: 'Test Account',
  username: 'test@example.com',
  password: 'secure-password-123',
  category: 'work',
  network: 'zircuit',
  url: 'https://example.com',
  createdAt: Date.now(),
};

const masterPassword = 'my-master-password-123!';

console.log('📋 Test Entry:');
console.log(`   Name: ${vaultEntry.name}`);
console.log(`   Username: ${vaultEntry.username}`);
console.log(`   Password: ${vaultEntry.password}\n`);

// Step 1: Encrypt data
async function encryptData(data, password) {
  console.log('🔄 Step 1: Encrypting data...');
  
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  
  // Derive key
  const key = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      ),
      256
    ),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  // Encrypt
  const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBuffer
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);

  const result = {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    authTag: Buffer.from(authTag).toString('hex'),
  };

  console.log(`   ✅ Encrypted ${dataBuffer.length} bytes`);
  return result;
}

// Step 2: Real Walrus storage
async function walrusStore(encryptedData) {
  console.log('🔄 Step 2: Storing in Walrus testnet...');
  
  const dataString = JSON.stringify(encryptedData);
  const dataBuffer = Buffer.from(dataString, 'utf8');
  
  try {
    // Use correct Walrus API endpoint with epochs parameter
    const response = await httpRequestToPublisher('PUT', '/v1/blobs?epochs=5', dataBuffer);
    
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`Storage failed: ${response.statusCode} ${response.data}`);
    }
    
    const responseData = JSON.parse(response.data);
    
    let blobId, size;
    if (responseData.newlyCreated) {
      blobId = responseData.newlyCreated.blobObject.blobId;
      size = responseData.newlyCreated.blobObject.size;
    } else if (responseData.alreadyCertified) {
      blobId = responseData.alreadyCertified.blobId;
      size = dataBuffer.length;
    } else {
      throw new Error('Invalid response format');
    }
    
    console.log(`   ✅ Stored with blob ID: ${blobId}`);
    console.log(`   📏 Size: ${size} bytes`);
    console.log(`   📅 Storage epochs: 5`);
    
    return { blobId, size };
    
  } catch (error) {
    throw new Error(`Walrus storage failed: ${error.message}`);
  }
}

// Step 3: Real Walrus retrieval
async function walrusRetrieve(blobId) {
  console.log('🔄 Step 3: Retrieving from Walrus testnet...');
  
  try {
    // Use correct Walrus API endpoint for retrieval
    const response = await httpRequest('GET', `/v1/blobs/${blobId}`);
    
    if (response.statusCode === 404) {
      throw new Error(`Blob not found: ${blobId}`);
    }
    
    if (response.statusCode !== 200) {
      throw new Error(`Retrieval failed: ${response.statusCode} ${response.data}`);
    }
    
    // For blob retrieval, response.data should be the raw data
    const data = JSON.parse(response.data);
    console.log(`   ✅ Retrieved blob: ${blobId}`);
    console.log(`   📦 Data size: ${response.data.length} bytes`);
    return data;
    
  } catch (error) {
    throw new Error(`Walrus retrieval failed: ${error.message}`);
  }
}

// Step 4: Decrypt data
async function decryptData(encryptedData, password) {
  console.log('🔄 Step 4: Decrypting data...');
  
  const salt = new Uint8Array(Buffer.from(encryptedData.salt, 'hex'));
  const iv = new Uint8Array(Buffer.from(encryptedData.iv, 'hex'));
  const authTag = new Uint8Array(Buffer.from(encryptedData.authTag, 'hex'));
  const ciphertext = new Uint8Array(Buffer.from(encryptedData.ciphertext, 'base64'));

  // Combine ciphertext and auth tag
  const encryptedWithTag = new Uint8Array(ciphertext.length + authTag.length);
  encryptedWithTag.set(ciphertext);
  encryptedWithTag.set(authTag, ciphertext.length);

  // Re-derive key
  const key = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      ),
      256
    ),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedWithTag
  );

  const decryptedText = new TextDecoder().decode(decrypted);
  const result = JSON.parse(decryptedText);
  
  console.log(`   ✅ Decrypted successfully`);
  return result;
}

// HTTP request helper for aggregator (retrieval)
function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, WALRUS_CONFIG.aggregatorUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {},
    };

    if (data) {
      options.headers['Content-Type'] = 'application/octet-stream';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// HTTP request helper for publisher (storage)
function httpRequestToPublisher(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, WALRUS_CONFIG.publisherUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {},
    };

    if (data) {
      options.headers['Content-Type'] = 'application/octet-stream';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// Run the complete test
async function runTest() {
  console.log(`🌐 Testing with Walrus testnet: ${WALRUS_CONFIG.aggregatorUrl}\n`);
  
  try {
    // 1. Encrypt
    const encrypted = await encryptData(vaultEntry, masterPassword);
    
    // 2. Store in real Walrus testnet
    const storage = await walrusStore(encrypted);
    
    // 3. Retrieve from real Walrus testnet
    const retrieved = await walrusRetrieve(storage.blobId);
    
    // 4. Decrypt
    const decrypted = await decryptData(retrieved, masterPassword);
    
    console.log('\n📊 Results:');
    console.log('===========');
    console.log('✅ Encryption: SUCCESS');
    console.log('✅ Storage: SUCCESS');
    console.log('✅ Retrieval: SUCCESS');
    console.log('✅ Decryption: SUCCESS');
    
    // Verify data integrity
    const dataMatches = decrypted.name === vaultEntry.name && 
                       decrypted.password === vaultEntry.password;
    
    console.log(`✅ Data Integrity: ${dataMatches ? 'VERIFIED' : 'FAILED'}`);
    
    console.log('\n📋 Retrieved Entry:');
    console.log(`   Name: ${decrypted.name}`);
    console.log(`   Username: ${decrypted.username}`);
    console.log(`   Password: ${decrypted.password}`);
    
    if (dataMatches) {
      console.log('\n🎉 Real Walrus testnet test completed successfully!');
      console.log('\n💡 This proves that:');
      console.log('   • Vault entries are encrypted securely');
      console.log('   • Data can be stored in REAL Walrus network');
      console.log('   • Data can be retrieved from REAL Walrus network');
      console.log('   • Decryption restores original data perfectly');
      console.log('   • Ready for production ShadowVault integration!');
      console.log(`\n🔗 Blob stored on Walrus with ID: ${storage.blobId}`);
      console.log(`\n🌐 Direct access URL: ${WALRUS_CONFIG.aggregatorUrl}/v1/blobs/${storage.blobId}`);
      console.log('\n📝 Note: The URL contains encrypted data that can only be decrypted');
      console.log('   with the master password used during encryption.');
    } else {
      console.log('\n❌ Test failed - data integrity check failed');
    }
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    console.log('\n💡 This could be due to:');
    console.log('   • Network connectivity issues');
    console.log('   • Walrus testnet service unavailable');
    console.log('   • API endpoint changes');
    console.log('\n🔧 Try again later or check Walrus testnet status');
  }
}

// Run the test
runTest();