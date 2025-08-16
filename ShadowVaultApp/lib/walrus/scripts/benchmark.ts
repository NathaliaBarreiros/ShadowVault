#!/usr/bin/env ts-node

/**
 * Walrus Performance Benchmark Script
 * Comprehensive performance testing for Walrus integration
 */

import { walrusClient } from '../client';
import { walrusEncryption } from '../encryption';
import { vaultService } from '../vault-service';
import { formatBytes } from '../utils';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput?: number;
  details?: any;
}

class WalrusBenchmark {
  private results: BenchmarkResult[] = [];

  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Starting Walrus Performance Benchmarks\n');

    // Storage performance tests
    await this.benchmarkStoragePerformance();
    await this.benchmarkStorageSizes();
    await this.benchmarkConcurrentStorage();

    // Encryption performance tests
    await this.benchmarkEncryptionPerformance();
    await this.benchmarkEncryptionSizes();

    // Vault service performance tests
    await this.benchmarkVaultOperations();
    await this.benchmarkVaultConcurrency();

    // Memory and resource usage
    await this.benchmarkMemoryUsage();

    this.printResults();
  }

  private async runBenchmark(
    name: string,
    iterations: number,
    testFn: () => Promise<any>,
    throughputData?: { bytes: number }
  ): Promise<BenchmarkResult> {
    console.log(`🧪 Running ${name} (${iterations} iterations)...`);
    
    const times: number[] = [];
    let details: any = null;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const result = await testFn();
        if (i === 0) details = result; // Keep first result as sample
      } catch (error) {
        console.error(`   Iteration ${i + 1} failed:`, error);
        throw error;
      }
      
      const endTime = performance.now();
      times.push(endTime - startTime);
      
      // Progress indicator for long benchmarks
      if (iterations > 10 && (i + 1) % Math.ceil(iterations / 10) === 0) {
        process.stdout.write(`${Math.round(((i + 1) / iterations) * 100)}% `);
      }
    }
    
    if (iterations > 10) console.log(); // New line after progress

    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      details,
    };

    if (throughputData) {
      result.throughput = throughputData.bytes / (averageTime / 1000); // bytes per second
    }

    this.results.push(result);
    
    console.log(`✅ ${name}:`);
    console.log(`   Average: ${averageTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    if (result.throughput) {
      console.log(`   Throughput: ${formatBytes(result.throughput)}/s`);
    }
    console.log();

    return result;
  }

  private async benchmarkStoragePerformance(): Promise<void> {
    const testData = 'x'.repeat(1024); // 1KB test data
    
    await this.runBenchmark(
      'Basic Storage Performance',
      20,
      async () => {
        const blob = await walrusClient.store(testData);
        return { blobId: blob.blobId, size: blob.size };
      },
      { bytes: testData.length }
    );

    await this.runBenchmark(
      'Basic Retrieval Performance',
      20,
      async () => {
        // First store data to get a blob ID
        const blob = await walrusClient.store(testData);
        const retrieved = await walrusClient.retrieveText(blob.blobId);
        return { size: retrieved.length };
      },
      { bytes: testData.length }
    );
  }

  private async benchmarkStorageSizes(): Promise<void> {
    const sizes = [
      { name: '1KB', size: 1024 },
      { name: '10KB', size: 10 * 1024 },
      { name: '100KB', size: 100 * 1024 },
      { name: '1MB', size: 1024 * 1024 },
    ];

    for (const { name, size } of sizes) {
      const testData = 'x'.repeat(size);
      
      await this.runBenchmark(
        `Storage Performance - ${name}`,
        5,
        async () => {
          const blob = await walrusClient.store(testData);
          return { blobId: blob.blobId, size: blob.size };
        },
        { bytes: size }
      );
    }
  }

  private async benchmarkConcurrentStorage(): Promise<void> {
    const concurrencyLevels = [1, 5, 10, 20];
    const testData = 'x'.repeat(10 * 1024); // 10KB per operation

    for (const concurrency of concurrencyLevels) {
      await this.runBenchmark(
        `Concurrent Storage - ${concurrency} operations`,
        3,
        async () => {
          const operations = Array.from({ length: concurrency }, (_, i) => 
            walrusClient.store(`${testData}-${i}`)
          );
          
          const results = await Promise.all(operations);
          return {
            successfulOperations: results.length,
            totalBytes: testData.length * concurrency,
          };
        },
        { bytes: testData.length * concurrency }
      );
    }
  }

  private async benchmarkEncryptionPerformance(): Promise<void> {
    const testEntry = {
      name: 'Benchmark Service',
      username: 'benchmark@test.com',
      password: 'x'.repeat(100), // 100 char password
      category: 'testing',
      network: 'zircuit',
      notes: 'x'.repeat(500), // 500 char notes
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const masterPassword = 'benchmark-master-password-123!';
    const entrySize = JSON.stringify(testEntry).length;

    await this.runBenchmark(
      'Encryption Performance',
      50,
      async () => {
        const encrypted = await walrusEncryption.encryptVaultEntry(testEntry, masterPassword);
        return { 
          originalSize: entrySize,
          encryptedSize: encrypted.ciphertext.length,
        };
      }
    );

    // Benchmark decryption separately
    const encrypted = await walrusEncryption.encryptVaultEntry(testEntry, masterPassword);
    
    await this.runBenchmark(
      'Decryption Performance',
      50,
      async () => {
        const decrypted = await walrusEncryption.decryptVaultEntry(encrypted, masterPassword);
        return { 
          decryptedSize: JSON.stringify(decrypted).length,
        };
      }
    );
  }

  private async benchmarkEncryptionSizes(): Promise<void> {
    const masterPassword = 'benchmark-master-password';
    const baseSizes = [
      { name: 'Small Entry', passwordLength: 20, notesLength: 100 },
      { name: 'Medium Entry', passwordLength: 50, notesLength: 500 },
      { name: 'Large Entry', passwordLength: 100, notesLength: 2000 },
      { name: 'Extra Large Entry', passwordLength: 500, notesLength: 10000 },
    ];

    for (const { name, passwordLength, notesLength } of baseSizes) {
      const testEntry = {
        name: `${name} Service`,
        username: 'size-test@example.com',
        password: 'x'.repeat(passwordLength),
        category: 'testing',
        network: 'zircuit',
        notes: 'x'.repeat(notesLength),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const entrySize = JSON.stringify(testEntry).length;

      await this.runBenchmark(
        `Encryption Performance - ${name}`,
        10,
        async () => {
          const encrypted = await walrusEncryption.encryptVaultEntry(testEntry, masterPassword);
          const decrypted = await walrusEncryption.decryptVaultEntry(encrypted, masterPassword);
          
          return {
            originalSize: entrySize,
            encryptedSize: encrypted.ciphertext.length,
            compressionRatio: entrySize / encrypted.ciphertext.length,
            roundTripSuccess: JSON.stringify(decrypted) === JSON.stringify(testEntry),
          };
        },
        { bytes: entrySize }
      );
    }
  }

  private async benchmarkVaultOperations(): Promise<void> {
    const testEntry = {
      name: 'Vault Benchmark Service',
      username: 'vault-bench@test.com',
      password: 'vault-benchmark-password-123',
      category: 'testing',
      network: 'zircuit',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const masterPassword = 'vault-benchmark-master-password';
    const userId = 'vault-benchmark-user';

    await this.runBenchmark(
      'Vault Store Operation',
      10,
      async () => {
        const result = await vaultService.storeEntry(testEntry, masterPassword, userId);
        if (!result.success) {
          throw new Error(`Store failed: ${result.error}`);
        }
        return {
          blobId: result.blobId,
          entryId: result.metadata?.entryId,
          size: result.metadata?.size,
        };
      }
    );

    // Store an entry for retrieval benchmark
    const storeResult = await vaultService.storeEntry(testEntry, masterPassword, userId);
    if (!storeResult.success) {
      throw new Error('Failed to store entry for retrieval benchmark');
    }

    await this.runBenchmark(
      'Vault Retrieve Operation',
      10,
      async () => {
        const result = await vaultService.retrieveEntry(storeResult.blobId!, masterPassword);
        if (!result.success) {
          throw new Error(`Retrieve failed: ${result.error}`);
        }
        return {
          entryName: result.entry?.name,
          entrySize: JSON.stringify(result.entry).length,
        };
      }
    );
  }

  private async benchmarkVaultConcurrency(): Promise<void> {
    const concurrencyLevels = [1, 3, 5, 10];
    const masterPassword = 'concurrent-vault-benchmark';

    for (const concurrency of concurrencyLevels) {
      const userId = `vault-concurrent-${concurrency}`;
      
      await this.runBenchmark(
        `Vault Concurrent Operations - ${concurrency}`,
        3,
        async () => {
          const entries = Array.from({ length: concurrency }, (_, i) => ({
            name: `Concurrent Service ${i}`,
            username: `user${i}@test.com`,
            password: `password-${i}`,
            category: 'testing',
            network: 'zircuit',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));

          const storePromises = entries.map(entry => 
            vaultService.storeEntry(entry, masterPassword, userId)
          );

          const storeResults = await Promise.all(storePromises);
          
          const successfulStores = storeResults.filter(r => r.success);
          
          if (successfulStores.length !== concurrency) {
            throw new Error(`Only ${successfulStores.length}/${concurrency} stores succeeded`);
          }

          return {
            concurrentOperations: concurrency,
            successfulStores: successfulStores.length,
            totalSize: storeResults.reduce((sum, r) => sum + (r.metadata?.size || 0), 0),
          };
        }
      );
    }
  }

  private async benchmarkMemoryUsage(): Promise<void> {
    const initialMemory = process.memoryUsage();
    
    await this.runBenchmark(
      'Memory Usage - Large Operations',
      5,
      async () => {
        const largeEntry = {
          name: 'Memory Test Service',
          username: 'memory@test.com',
          password: 'x'.repeat(10000), // 10KB password
          category: 'testing',
          network: 'zircuit',
          notes: 'x'.repeat(100000), // 100KB notes
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const masterPassword = 'memory-test-password';
        const userId = 'memory-test-user';

        // Perform memory-intensive operations
        const encrypted = await walrusEncryption.encryptVaultEntry(largeEntry, masterPassword);
        const decrypted = await walrusEncryption.decryptVaultEntry(encrypted, masterPassword);
        const storeResult = await vaultService.storeEntry(largeEntry, masterPassword, userId);
        
        const currentMemory = process.memoryUsage();
        
        return {
          entrySize: JSON.stringify(largeEntry).length,
          encryptedSize: encrypted.ciphertext.length,
          memoryUsed: {
            heapUsed: currentMemory.heapUsed - initialMemory.heapUsed,
            heapTotal: currentMemory.heapTotal - initialMemory.heapTotal,
            external: currentMemory.external - initialMemory.external,
          },
          success: storeResult.success,
        };
      }
    );

    // Memory cleanup test
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    
    console.log('📊 Memory Usage Summary:');
    console.log(`   Initial Heap Used: ${formatBytes(initialMemory.heapUsed)}`);
    console.log(`   Final Heap Used: ${formatBytes(finalMemory.heapUsed)}`);
    console.log(`   Memory Delta: ${formatBytes(finalMemory.heapUsed - initialMemory.heapUsed)}`);
    console.log();
  }

  private printResults(): void {
    console.log('\n📊 Benchmark Results Summary\n');
    console.log('=' .repeat(80));
    
    // Group results by category
    const categories = {
      'Storage': this.results.filter(r => r.name.includes('Storage')),
      'Encryption': this.results.filter(r => r.name.includes('Encryption') || r.name.includes('Decryption')),
      'Vault': this.results.filter(r => r.name.includes('Vault')),
      'Concurrent': this.results.filter(r => r.name.includes('Concurrent')),
      'Memory': this.results.filter(r => r.name.includes('Memory')),
    };

    for (const [category, results] of Object.entries(categories)) {
      if (results.length === 0) continue;
      
      console.log(`\n${category} Performance:`);
      console.log('-'.repeat(40));
      
      for (const result of results) {
        console.log(`${result.name}:`);
        console.log(`  Average: ${result.averageTime.toFixed(2)}ms`);
        console.log(`  Range: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms`);
        
        if (result.throughput) {
          console.log(`  Throughput: ${formatBytes(result.throughput)}/s`);
        }
        
        console.log();
      }
    }

    // Performance insights
    console.log('\n💡 Performance Insights:');
    console.log('-'.repeat(40));

    const storageResults = categories['Storage'];
    const encryptionResults = categories['Encryption'];
    
    if (storageResults.length > 0) {
      const avgStorageTime = storageResults.reduce((sum, r) => sum + r.averageTime, 0) / storageResults.length;
      console.log(`📦 Average storage operation: ${avgStorageTime.toFixed(2)}ms`);
    }

    if (encryptionResults.length > 0) {
      const avgEncryptionTime = encryptionResults.reduce((sum, r) => sum + r.averageTime, 0) / encryptionResults.length;
      console.log(`🔐 Average encryption operation: ${avgEncryptionTime.toFixed(2)}ms`);
    }

    const totalOperations = this.results.reduce((sum, r) => sum + r.iterations, 0);
    const totalTime = this.results.reduce((sum, r) => sum + r.totalTime, 0);
    
    console.log(`⏱️  Total operations: ${totalOperations}`);
    console.log(`🚀 Total execution time: ${totalTime.toFixed(2)}ms`);
    console.log(`📈 Operations per second: ${((totalOperations / totalTime) * 1000).toFixed(2)}`);

    // Recommendations
    console.log('\n🎯 Recommendations:');
    console.log('-'.repeat(40));

    const fastOperations = this.results.filter(r => r.averageTime < 100);
    const slowOperations = this.results.filter(r => r.averageTime > 1000);

    console.log(`✅ Fast operations (< 100ms): ${fastOperations.length}`);
    console.log(`⚠️  Slow operations (> 1s): ${slowOperations.length}`);

    if (slowOperations.length > 0) {
      console.log('\n   Consider optimizing:');
      slowOperations.forEach(op => {
        console.log(`   - ${op.name} (${op.averageTime.toFixed(2)}ms)`);
      });
    }

    console.log('\n🎉 Benchmark completed successfully!');
  }
}

// Main execution
async function main() {
  const benchmark = new WalrusBenchmark();
  
  try {
    await benchmark.runAllBenchmarks();
  } catch (error) {
    console.error('\n💥 Benchmark execution failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { WalrusBenchmark };