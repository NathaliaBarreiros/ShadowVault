# Walrus Library Testing Guide

Comprehensive testing documentation for the ShadowVault Walrus integration library.

## Overview

The Walrus library includes multiple types of tests to ensure reliability, security, and performance:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test end-to-end functionality with real Walrus testnet
- **Performance Tests**: Benchmark operations and identify bottlenecks
- **Connectivity Tests**: Verify network connectivity and service availability

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Internet connection (for integration tests)

### Running All Tests

```bash
# Make script executable (first time only)
chmod +x scripts/run-tests.sh

# Run comprehensive test suite
./scripts/run-tests.sh
```

### Running Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests (requires network)
npm run test:integration

# Test with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Types

### Unit Tests

Test individual functions and components without external dependencies.

**Files tested:**
- `encryption.test.ts` - AES-GCM encryption, PBKDF2 key derivation
- `client.test.ts` - Walrus API client functionality  
- `vault-service.test.ts` - High-level vault operations
- `utils.test.ts` - Utility functions and helpers
- `hooks.test.tsx` - React hooks for vault operations

**Coverage targets:**
- Lines: 80%+
- Functions: 80%+
- Branches: 80%+
- Statements: 80%+

### Integration Tests

Test complete workflows with real Walrus testnet connectivity.

**Test scenarios:**
- Store and retrieve encrypted vault entries
- Update and delete vault entries
- Handle authentication errors
- Test large data storage
- Concurrent operations
- Error recovery

**Requirements:**
- Active internet connection
- Walrus testnet availability
- Set `RUN_INTEGRATION_TESTS=true` environment variable

### Performance Tests

Benchmark library performance and identify optimization opportunities.

**Metrics measured:**
- Storage/retrieval latency
- Encryption/decryption speed
- Memory usage
- Throughput rates
- Concurrent operation performance

**Test data sizes:**
- Small: 1KB entries
- Medium: 10KB entries  
- Large: 100KB entries
- Extra Large: 1MB+ entries

### Connectivity Tests

Verify connection to Walrus network and basic functionality.

**Tests performed:**
- Network connectivity
- Basic storage operations
- Data integrity verification
- Error handling
- Service availability

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80, 
      lines: 80,
      statements: 80,
    },
  },
};
```

### Environment Variables

```bash
# Enable integration tests
RUN_INTEGRATION_TESTS=true

# Enable debug logging
WALRUS_DEBUG=true

# Custom Walrus endpoint (optional)
WALRUS_AGGREGATOR_URL=https://custom.walrus.endpoint
```

## Running Tests

### Development Workflow

```bash
# Install dependencies
npm install

# Run tests in watch mode during development
npm run test:watch

# Check types
npm run type-check

# Run specific test file
npx jest encryption.test.ts

# Run tests matching pattern
npx jest --testNamePattern="encryption"
```

### CI/CD Pipeline

```bash
# Full test suite for CI/CD
npm run test:coverage
npm run type-check

# Integration tests (if network available)
RUN_INTEGRATION_TESTS=true npm run test:integration
```

### Production Testing

```bash
# Test against mainnet (use with caution)
WALRUS_NETWORK=mainnet npm run test:connectivity

# Performance benchmarking
npm run benchmark
```

## Test Data and Mocking

### Mock Data Helpers

```typescript
import { 
  createMockVaultEntry,
  createMockEncryptedData,
  createMockWalrusBlob 
} from './tests/setup';

const testEntry = createMockVaultEntry({
  name: 'Custom Service',
  category: 'work'
});
```

### Mocked Dependencies

- **Walrus Client**: Mocked for unit tests, real for integration
- **Crypto API**: Uses Node.js webcrypto in test environment
- **LocalStorage**: Mocked with jest functions
- **Fetch API**: Mocked for controlled network testing

## Performance Benchmarks

### Benchmark Categories

1. **Storage Performance**
   - Basic storage operations
   - Different data sizes
   - Concurrent operations

2. **Encryption Performance**  
   - AES-GCM encryption speed
   - Key derivation performance
   - Different entry sizes

3. **Vault Operations**
   - Store/retrieve/update/delete
   - Index management
   - Concurrent vault operations

4. **Memory Usage**
   - Memory consumption patterns
   - Garbage collection efficiency
   - Memory leaks detection

### Running Benchmarks

```bash
# Full benchmark suite
npm run benchmark

# Custom benchmark script
ts-node scripts/benchmark.ts
```

### Benchmark Results

Example benchmark output:
```
🚀 Storage Performance:
   Average: 45.23ms
   Throughput: 2.1 MB/s

🔐 Encryption Performance:
   Average: 12.45ms
   Throughput: 8.7 MB/s
```

## Test Data Management

### Test Cleanup

Tests automatically clean up after themselves:
- Remove test entries from vault index
- Clear localStorage mocks
- Reset crypto key mocks

### Persistent Test Data

For integration tests, test data may persist in Walrus testnet:
- Use descriptive test names for identification
- Include cleanup in test teardown
- Monitor storage costs for test data

## Debugging Tests

### Debug Mode

```bash
# Enable debug output
WALRUS_DEBUG=true npm test

# Verbose Jest output  
npm test -- --verbose

# Run single test with debugging
node --inspect-brk node_modules/.bin/jest encryption.test.ts
```

### Common Issues

1. **Network Timeouts**
   ```bash
   # Increase timeout
   npm test -- --testTimeout=60000
   ```

2. **Crypto API Issues**
   ```bash
   # Ensure Node.js 18+ with webcrypto support
   node -v
   ```

3. **Mock Conflicts**
   ```bash
   # Clear all mocks
   jest.clearAllMocks()
   ```

## Performance Expectations

### Acceptable Performance Ranges

| Operation | Expected Time | Max Time |
|-----------|---------------|----------|
| Encryption | < 50ms | < 200ms |
| Decryption | < 50ms | < 200ms |
| Storage (1KB) | < 100ms | < 500ms |
| Storage (1MB) | < 2000ms | < 10000ms |
| Retrieval | < 100ms | < 1000ms |

### Memory Limits

- Heap usage should not exceed 100MB for normal operations
- No memory leaks during extended operation
- Garbage collection should free test data

## Security Testing

### Encryption Validation

- Verify ciphertext is not reversible without key
- Test authentication tag validation
- Ensure salt and IV uniqueness
- Validate key derivation security

### Data Integrity

- Tamper detection through authentication tags
- Corruption handling and error reporting
- Version compatibility and migration

## Continuous Integration

### GitHub Actions Example

```yaml
name: Walrus Library Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - run: npm run type-check
      
  integration:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: RUN_INTEGRATION_TESTS=true npm run test:integration
```

## Contributing

### Adding New Tests

1. Create test file with `.test.ts` or `.test.tsx` extension
2. Follow existing test patterns and structure
3. Include both positive and negative test cases
4. Add performance benchmarks for new operations
5. Update test documentation

### Test Review Checklist

- [ ] Unit tests cover all code paths
- [ ] Integration tests verify end-to-end functionality  
- [ ] Performance tests establish benchmarks
- [ ] Error handling is thoroughly tested
- [ ] Security aspects are validated
- [ ] Documentation is updated

## Troubleshooting

### Test Failures

1. **Unit Test Failures**
   - Check mock configurations
   - Verify test data setup
   - Review recent code changes

2. **Integration Test Failures**
   - Verify network connectivity
   - Check Walrus service status
   - Validate environment configuration

3. **Performance Test Failures**
   - Check system resources
   - Verify network conditions
   - Review performance expectations

### Getting Help

- Check test output and error messages
- Review logs with debug mode enabled
- Consult library documentation
- Create GitHub issue with reproduction steps

## Future Improvements

### Planned Enhancements

- [ ] Visual regression tests for UI components
- [ ] Property-based testing with fast-check
- [ ] Load testing with multiple concurrent users
- [ ] Cross-browser compatibility testing
- [ ] Security penetration testing
- [ ] Performance regression detection

### Test Infrastructure

- [ ] Dedicated test environment
- [ ] Automated test data management
- [ ] Test result dashboards
- [ ] Performance trend analysis
- [ ] Automated security scanning