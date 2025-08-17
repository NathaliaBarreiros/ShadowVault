#!/usr/bin/env ts-node

/**
 * Walrus Connectivity Test Script
 * Tests connection to Walrus testnet and basic functionality
 */

import { walrusClient, WALRUS_CONFIGS } from '../client';
import { walrusEncryption } from '../encryption';
import { vaultService } from '../vault-service';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: any;
}

class WalrusConnectivityTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Walrus Connectivity Tests\n');
    console.log(`📡 Testing against: ${WALRUS_CONFIGS.testnet.aggregatorUrl}`);
    console.log(`🌐 Network: ${WALRUS_CONFIGS.testnet.network}\n`);

    // Basic connectivity tests
    await this.testBasicConnectivity();
    await this.testStorageAndRetrieval();
    await this.testLargeDataStorage();
    await this.testBinaryDataStorage();

    // Encryption tests
    await this.testEncryptionFunctionality();
    await this.testEncryptionPerformance();

    // Vault service tests
    await this.testVaultServiceIntegration();
    await this.testConcurrentOperations();

    // Performance tests
    await this.testPerformanceMetrics();

    this.printResults();
  }

  private async runTest(
    name: string,
    testFn: () => Promise<any>,
    skipCondition: boolean = false
  ): Promise<TestResult> {
    if (skipCondition) {
      const result: TestResult = { name, status: 'SKIP', duration: 0 };
      this.results.push(result);
      return result;
    }

    const startTime = Date.now();
    
    try {
      const details = await testFn();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        name,
        status: 'PASS',
        duration,
        details,
      };
      
      this.results.push(result);
      console.log(`✅ ${name} (${duration}ms)`);
      if (details) {
        console.log(`   ${JSON.stringify(details, null, 2)}`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        name,
        status: 'FAIL',
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
      
      this.results.push(result);
      console.log(`❌ ${name} (${duration}ms)`);
      console.log(`   Error: ${result.error}`);
      
      return result;
    }
  }

  private async testBasicConnectivity(): Promise<void> {
    await this.runTest('Basic Connectivity Test', async () => {
      const testData = `Connectivity test ${Date.now()}`;
      const blob = await walrusClient.store(testData);
      
      return {
        blobId: blob.blobId,
        size: blob.size,
        epochs: blob.epochs,
      };
    });
  }

  private async testStorageAndRetrieval(): Promise<void> {
    await this.runTest('Storage and Retrieval Test', async () => {
      const testData = `Test data ${Date.now()} with special chars: 🔐🌍🚀`;
      
      // Store data
      const blob = await walrusClient.store(testData);
      
      // Retrieve data
      const retrievedData = await walrusClient.retrieveText(blob.blobId);
      
      if (retrievedData !== testData) {
        throw new Error('Retrieved data does not match stored data');
      }
      
      return {
        originalLength: testData.length,
        retrievedLength: retrievedData.length,
        blobId: blob.blobId,
        match: true,
      };
    });
  }

  private async testLargeDataStorage(): Promise<void> {
    await this.runTest('Large Data Storage Test', async () => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB
      
      const blob = await walrusClient.store(largeData);
      const retrievedData = await walrusClient.retrieveText(blob.blobId);
      
      if (retrievedData.length !== largeData.length) {
        throw new Error('Large data size mismatch');
      }
      
      return {
        dataSize: largeData.length,
        blobSize: blob.size,
        blobId: blob.blobId,
      };
    });
  }

  private async testBinaryDataStorage(): Promise<void> {
    await this.runTest('Binary Data Storage Test', async () => {
      const binaryData = new Uint8Array(1000);
      for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = i % 256;
      }
      
      const blob = await walrusClient.store(binaryData);
      const retrievedData = await walrusClient.retrieve(blob.blobId);
      
      if (retrievedData.length !== binaryData.length) {
        throw new Error('Binary data size mismatch');
      }
      
      // Check first few bytes
      for (let i = 0; i < Math.min(10, binaryData.length); i++) {
        if (retrievedData[i] !== binaryData[i]) {
          throw new Error(`Binary data mismatch at byte ${i}`);
        }
      }
      
      return {
        originalSize: binaryData.length,
        retrievedSize: retrievedData.length,
        blobId: blob.blobId,
      };
    });
  }

  private async testEncryptionFunctionality(): Promise<void> {
    await this.runTest('Encryption Functionality Test', async () => {
      const testEntry = {
        name: 'Test Service',
        username: 'test@example.com',
        password: 'test-password-123',
        category: 'work',
        network: 'zircuit',
        url: 'https://example.com',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const masterPassword = 'test-master-password-123!';
      
      // Encrypt
      const encrypted = await walrusEncryption.encryptVaultEntry(testEntry, masterPassword);
      
      // Decrypt
      const decrypted = await walrusEncryption.decryptVaultEntry(encrypted, masterPassword);
      
      // Verify
      if (JSON.stringify(decrypted) !== JSON.stringify(testEntry)) {
        throw new Error('Decrypted data does not match original');
      }
      
      return {
        originalSize: JSON.stringify(testEntry).length,
        encryptedSize: encrypted.ciphertext.length,
        decryptedMatch: true,
      };
    });
  }

  private async testEncryptionPerformance(): Promise<void> {
    await this.runTest('Encryption Performance Test', async () => {
      const testEntry = {
        name: 'Performance Test',
        username: 'perf@test.com',
        password: 'x'.repeat(1000), // Larger password for testing
        category: 'performance',
        network: 'zircuit',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const masterPassword = 'performance-test-password';
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const encrypted = await walrusEncryption.encryptVaultEntry(testEntry, masterPassword);
        const decrypted = await walrusEncryption.decryptVaultEntry(encrypted, masterPassword);
        
        const endTime = Date.now();
        times.push(endTime - startTime);
        
        // Verify correctness
        if (decrypted.password !== testEntry.password) {
          throw new Error(`Iteration ${i} failed verification`);
        }
      }
      
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      return {
        iterations,
        averageTime: avgTime,
        minTime,
        maxTime,
        timesMs: times,
      };
    });
  }

  private async testVaultServiceIntegration(): Promise<void> {
    await this.runTest('Vault Service Integration Test', async () => {
      const testEntry = {
        name: 'Integration Test Service',
        username: 'integration@test.com',
        password: 'integration-password-123',
        category: 'testing',
        network: 'zircuit',
        url: 'https://integration.test.com',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const masterPassword = 'integration-master-password';
      const userId = 'test-user-integration';
      
      // Store entry
      const storeResult = await vaultService.storeEntry(testEntry, masterPassword, userId);
      
      if (!storeResult.success) {
        throw new Error(`Store failed: ${storeResult.error}`);
      }
      
      // Retrieve entry
      const retrieveResult = await vaultService.retrieveEntry(storeResult.blobId!, masterPassword);
      
      if (!retrieveResult.success || !retrieveResult.entry) {
        throw new Error(`Retrieve failed: ${retrieveResult.error}`);
      }
      
      // Verify data matches
      if (retrieveResult.entry.name !== testEntry.name ||
          retrieveResult.entry.password !== testEntry.password) {
        throw new Error('Retrieved entry data does not match');
      }
      
      // Test list entries
      const allEntries = await vaultService.getAllEntries(userId, masterPassword);
      
      return {
        stored: true,
        retrieved: true,
        blobId: storeResult.blobId,
        entryId: storeResult.metadata?.entryId,
        totalEntries: allEntries.length,
      };
    });
  }

  private async testConcurrentOperations(): Promise<void> {
    await this.runTest('Concurrent Operations Test', async () => {
      const concurrentCount = 5;
      const masterPassword = 'concurrent-test-password';
      const userId = 'test-user-concurrent';
      
      const entries = Array.from({ length: concurrentCount }, (_, i) => ({
        name: `Concurrent Test ${i}`,
        username: `user${i}@test.com`,
        password: `password-${i}`,
        category: 'testing',
        network: 'zircuit',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      
      const startTime = Date.now();
      
      // Store all entries concurrently
      const storeResults = await Promise.all(
        entries.map(entry => vaultService.storeEntry(entry, masterPassword, userId))
      );
      
      const storeTime = Date.now() - startTime;
      
      // Verify all succeeded
      const failedStores = storeResults.filter(result => !result.success);
      if (failedStores.length > 0) {
        throw new Error(`${failedStores.length} stores failed`);
      }
      
      // Retrieve all entries concurrently
      const retrieveStartTime = Date.now();
      
      const retrieveResults = await Promise.all(
        storeResults.map(result => 
          vaultService.retrieveEntry(result.blobId!, masterPassword)
        )
      );
      
      const retrieveTime = Date.now() - retrieveStartTime;
      
      // Verify all succeeded
      const failedRetrieves = retrieveResults.filter(result => !result.success);
      if (failedRetrieves.length > 0) {
        throw new Error(`${failedRetrieves.length} retrieves failed`);
      }
      
      return {
        concurrentOperations: concurrentCount,
        storeTimeMs: storeTime,
        retrieveTimeMs: retrieveTime,
        avgStoreTime: storeTime / concurrentCount,
        avgRetrieveTime: retrieveTime / concurrentCount,
        successfulStores: storeResults.length,
        successfulRetrieves: retrieveResults.length,
      };
    });
  }

  private async testPerformanceMetrics(): Promise<void> {
    await this.runTest('Performance Metrics Test', async () => {
      const iterations = 5;
      const testSizes = [1024, 10240, 102400]; // 1KB, 10KB, 100KB
      const results: any = {};
      
      for (const size of testSizes) {
        const testData = 'x'.repeat(size);
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const blob = await walrusClient.store(testData);
          await walrusClient.retrieveText(blob.blobId);
          
          const endTime = Date.now();
          times.push(endTime - startTime);
        }
        
        const avgTime = times.reduce((a, b) => a + b) / times.length;
        
        results[`${size}B`] = {
          iterations,
          averageTimeMs: avgTime,
          throughputBytesPerSec: size / (avgTime / 1000),
          times,
        };
      }
      
      return results;
    });
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary\n');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📈 Total: ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   - ${result.name}: ${result.error}`);
        });
    }
    
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n⏱️  Total execution time: ${totalTime}ms`);
    
    const success = failed === 0;
    console.log(`\n${success ? '🎉' : '💥'} Overall: ${success ? 'SUCCESS' : 'FAILURE'}`);
    
    if (success) {
      console.log('\n✨ All tests passed! Walrus integration is working correctly.');
    } else {
      console.log('\n🔧 Some tests failed. Check the errors above and your Walrus configuration.');
    }
  }
}

// Main execution
async function main() {
  const tester = new WalrusConnectivityTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { WalrusConnectivityTester };