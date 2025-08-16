# ShadowVault Smart Contracts

A secure, privacy-first password manager smart contract system built for Base Sepolia with OpenZeppelin standards.

## 🚀 Features

- **Secure Storage**: Encrypted password data stored on-chain
- **Zero-Knowledge Privacy**: Only encrypted hashes stored, never plaintext
- **OpenZeppelin Standards**: Built with industry-standard security practices
- **Access Control**: Owner-based administrative functions
- **Pausable Operations**: Emergency pause functionality
- **Reentrancy Protection**: Built-in protection against reentrancy attacks
- **Gas Optimized**: Efficient storage and operations

## 📦 Contract Architecture

### ShadowVault.sol

Main contract implementing secure password storage with the following features:

- **Entry Management**: Store, update, and delete encrypted password entries
- **User Isolation**: Each user's data is completely isolated
- **Metadata Hashing**: Service names and usernames stored as hashes
- **Access Control**: Owner-only administrative functions
- **Security Features**: Pausable, ReentrancyGuard, and proper validation

## 🛠 Prerequisites

- Node.js >= 16.x
- npm or yarn
- Hardhat
- Base Sepolia testnet access
- BaseScan API key (for verification)

## 🔧 Installation

```bash
# Clone the repository and navigate to contracts
cd ShadowVaultContracts

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## ⚙️ Configuration

Edit `.env` file with your credentials:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC URL (optional, defaults to public RPC)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# BaseScan API key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here

# Enable gas reporting
REPORT_GAS=false
```

## 🔨 Development Commands

### Build & Test

```bash
# Compile contracts
npm run build

# Run tests
npm run test

# Run tests with gas reporting
npm run gas-report

# Generate coverage report
npm run coverage

# Clean artifacts
npm run clean
```

### Deployment

```bash
# Deploy to Base Sepolia
npm run deploy:baseSepolia

# Verify contract (after deployment)
npm run verify:baseSepolia <contract_address> <owner_address>

# Interact with deployed contract
npm run interact:baseSepolia <contract_address>
```

## 📋 Deployment Process

1. **Prepare Environment**
   ```bash
   # Ensure you have Base Sepolia ETH
   # Get BaseScan API key from https://basescan.org/apis
   # Configure .env file
   ```

2. **Deploy Contract**
   ```bash
   npm run deploy:baseSepolia
   ```

3. **Verify on BaseScan**
   ```bash
   npm run verify:baseSepolia <contract_address> <deployer_address>
   ```

4. **Test Deployment**
   ```bash
   npm run interact:baseSepolia <contract_address>
   ```

## 🔐 Security Features

### OpenZeppelin Integration

- **Ownable**: Administrative access control
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency pause functionality

### Data Protection

- **Encrypted Storage**: Only encrypted data stored on-chain
- **Hash-based Metadata**: Service names and usernames as hashes
- **User Isolation**: Complete separation of user data
- **Input Validation**: Comprehensive validation of all inputs

### Access Control

- **Owner Functions**: pause/unpause operations
- **User Functions**: CRUD operations on own data only
- **No Cross-User Access**: Users cannot access others' data

## 📊 Gas Optimization

The contract is optimized for gas efficiency:

- Efficient storage layout
- Batch operations where possible
- Minimal external calls
- Optimized loops and data structures

## 🧪 Testing

Comprehensive test suite covering:

- **Deployment**: Correct initialization
- **Entry Management**: CRUD operations
- **Access Control**: Owner and user permissions
- **Security**: Pause functionality and input validation
- **Edge Cases**: Error conditions and boundary cases

```bash
npm run test
```

## 📖 API Reference

### Core Functions

#### `storeEntry(bytes32 encryptedData, bytes32 metadataHash)`
Store a new encrypted password entry.

#### `updateEntry(uint256 entryId, bytes32 encryptedData, bytes32 metadataHash)`
Update an existing entry.

#### `deleteEntry(uint256 entryId)`
Mark an entry as deleted (soft delete).

#### `getEntry(address user, uint256 entryId)`
Retrieve a specific entry.

#### `getUserEntries(address user)`
Get all active entries for a user.

### Administrative Functions

#### `pause()` / `unpause()`
Owner-only functions to pause/unpause contract operations.

## 🌐 Network Configuration

### Base Sepolia Testnet

- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Base Documentation](https://docs.base.org)
- [BaseScan](https://sepolia.basescan.org)

## 🆘 Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check private key is correct (no 0x prefix)
   - Ensure sufficient Base Sepolia ETH
   - Verify network configuration

2. **Verification Fails**
   - Ensure BaseScan API key is correct
   - Wait a few minutes after deployment
   - Check constructor arguments match deployment

3. **Tests Fail**
   - Run `npm run clean` and rebuild
   - Check Node.js version compatibility
   - Ensure all dependencies are installed

### Getting Help

- Check existing GitHub issues
- Review Hardhat documentation
- Join the Base Discord community