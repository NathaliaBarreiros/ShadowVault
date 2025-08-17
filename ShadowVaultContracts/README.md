# ShadowVault Smart Contracts

A secure, privacy-first password manager smart contract system built for Zircuit Garfield Testnet with OpenZeppelin standards and Walrus decentralized storage integration.

## 🚀 Live Deployment

### ShadowVaultV2 Contract
- **Contract Address**: `0x577dc63554BF7531f75AF602896209fFe87d51E8`
- **Network**: Zircuit Garfield Testnet
- **Chain ID**: 48898
- **Explorer**: [View on Zircuit Explorer](https://explorer.garfield-testnet.zircuit.com/address/0x577dc63554BF7531f75AF602896209fFe87d51E8)
- **Deployment Tx**: [0x80077...](https://explorer.garfield-testnet.zircuit.com/tx/0x80077613a7943f4833743104f0884d14575624cd0d9bd146c5479760ed9df5a3)

### What This Contract Does

ShadowVaultV2 is a secure password management contract that stores encrypted password data with Walrus decentralized storage integration. Key features:

- **Secure Storage**: Stores password hashes and Walrus CIDs (Content IDs) for encrypted data
- **User Isolation**: Each user can only access their own vault items
- **Walrus Integration**: Uses Walrus decentralized storage for off-chain encrypted data
- **OpenZeppelin Security**: Built with industry-standard security practices (Ownable, ReentrancyGuard, Pausable)
- **Gas Optimized**: Efficient storage structure for cost-effective operations

#### Core Functions
- `storeVaultItem(string storedHash, string walrusCid)` - Store new encrypted password entry
- `updateVaultItem(uint256 entryId, string storedHash, string walrusCid)` - Update existing entry
- `deleteVaultItem(uint256 entryId)` - Mark entry as deleted (soft delete)
- `getVaultItem(address user, uint256 entryId)` - Retrieve specific entry
- `getUserVaultItems(address user)` - Get all active entries for a user

#### Data Structure
```solidity
struct VaultItem {
    string storedHash;      // Hash of the password
    string walrusCid;       // Walrus blob ID (CID)
    uint256 timestamp;      // Creation/update timestamp
    bool isActive;          // Active status
}
```

## 🚀 Features

- **Secure Storage**: Encrypted password data stored on-chain
- **Zero-Knowledge Privacy**: Only encrypted hashes stored, never plaintext
- **OpenZeppelin Standards**: Built with industry-standard security practices
- **Access Control**: Owner-based administrative functions
- **Pausable Operations**: Emergency pause functionality
- **Reentrancy Protection**: Built-in protection against reentrancy attacks
- **Gas Optimized**: Efficient storage and operations

## 📦 Contract Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Application"
        UI[User Interface]
        Auth[Privy Authentication]
        Wallet[Wagmi Wallet]
    end
    
    subgraph "Zircuit Garfield Testnet"
        Contract[ShadowVaultV2 Contract]
        Blockchain[Zircuit Blockchain]
    end
    
    subgraph "Walrus Decentralized Storage"
        WalrusNode[Walrus Storage Nodes]
        EncryptedData[Encrypted Password Data]
    end
    
    subgraph "Data Flow"
        Hash[Password Hash]
        CID[Walrus CID]
    end
    
    UI --> Auth
    Auth --> Wallet
    Wallet --> Contract
    Contract --> Blockchain
    
    UI --> EncryptedData
    EncryptedData --> WalrusNode
    WalrusNode --> CID
    
    Hash --> Contract
    CID --> Contract
    
    Contract --> Hash
    Contract --> CID
    
    style Contract fill:#e1f5fe
    style WalrusNode fill:#f3e5f5
    style Blockchain fill:#e8f5e8
```

### ShadowVaultV2 Contract Components

```mermaid
graph LR
    subgraph "OpenZeppelin Modules"
        Ownable[Ownable]
        ReentrancyGuard[ReentrancyGuard]
        Pausable[Pausable]
    end
    
    subgraph "Core Contract"
        ShadowVaultV2[ShadowVaultV2]
        VaultItem[VaultItem Struct]
        Storage[User Storage Mapping]
    end
    
    subgraph "Functions"
        Store[storeVaultItem]
        Update[updateVaultItem]
        Delete[deleteVaultItem]
        Get[getVaultItem]
        GetAll[getUserVaultItems]
    end
    
    subgraph "Events"
        StoredEvent[VaultItemStored]
        UpdatedEvent[VaultItemUpdated]
        DeletedEvent[VaultItemDeleted]
    end
    
    Ownable --> ShadowVaultV2
    ReentrancyGuard --> ShadowVaultV2
    Pausable --> ShadowVaultV2
    
    ShadowVaultV2 --> VaultItem
    ShadowVaultV2 --> Storage
    
    ShadowVaultV2 --> Store
    ShadowVaultV2 --> Update
    ShadowVaultV2 --> Delete
    ShadowVaultV2 --> Get
    ShadowVaultV2 --> GetAll
    
    Store --> StoredEvent
    Update --> UpdatedEvent
    Delete --> DeletedEvent
    
    style ShadowVaultV2 fill:#e1f5fe
    style VaultItem fill:#f3e5f5
    style Storage fill:#e8f5e8
```

### Data Structure

```mermaid
erDiagram
    VaultItem {
        string storedHash
        string walrusCid
        uint256 timestamp
        bool isActive
    }
    
    UserStorage {
        address user
        uint256 entryCount
        mapping vaultItems
    }
    
    Contract {
        address owner
        bool paused
        mapping userVaultItems
    }
    
    UserStorage ||--o{ VaultItem : contains
    Contract ||--o{ UserStorage : manages
```

### Main contract implementing secure password storage with the following features:

- **Entry Management**: Store, update, and delete encrypted password entries with Walrus CIDs
- **User Isolation**: Each user's data is completely isolated
- **Walrus Integration**: Off-chain encrypted data storage with on-chain CID references
- **Access Control**: Owner-only administrative functions
- **Security Features**: Pausable, ReentrancyGuard, and proper validation

## 🔄 Workflow Sequential Diagrams

### Store Vault Item Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend App
    participant Wallet as Wallet (Wagmi)
    participant Contract as ShadowVaultV2
    participant Walrus as Walrus Storage
    participant Blockchain as Zircuit Network
    
    User->>Frontend: Enter password details
    Frontend->>Frontend: Encrypt password data
    Frontend->>Walrus: Upload encrypted data
    Walrus-->>Frontend: Return Walrus CID
    
    Frontend->>Frontend: Generate password hash
    Frontend->>Wallet: Request transaction signature
    Wallet->>User: Confirm transaction
    User-->>Wallet: Approve transaction
    
    Wallet->>Contract: storeVaultItem(hash, walrusCid)
    Contract->>Contract: Validate inputs
    Contract->>Contract: Check not paused
    Contract->>Contract: Apply ReentrancyGuard
    
    Contract->>Blockchain: Store vault item
    Contract->>Contract: Increment user entry count
    Contract->>Contract: Emit VaultItemStored event
    
    Blockchain-->>Contract: Transaction confirmed
    Contract-->>Wallet: Transaction receipt
    Wallet-->>Frontend: Success response
    Frontend-->>User: Confirmation message
```

### Retrieve Vault Item Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend App
    participant Contract as ShadowVaultV2
    participant Walrus as Walrus Storage
    participant Blockchain as Zircuit Network
    
    User->>Frontend: Request vault items
    Frontend->>Contract: getUserVaultItems(userAddress)
    Contract->>Blockchain: Query user storage
    Blockchain-->>Contract: Return vault items array
    
    loop For each vault item
        Contract-->>Frontend: VaultItem{hash, walrusCid, timestamp, isActive}
        Frontend->>Walrus: Fetch encrypted data by CID
        Walrus-->>Frontend: Return encrypted password data
        Frontend->>Frontend: Decrypt password data
    end
    
    Frontend-->>User: Display decrypted vault items
```

### Update Vault Item Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend App
    participant Wallet as Wallet (Wagmi)
    participant Contract as ShadowVaultV2
    participant Walrus as Walrus Storage
    participant Blockchain as Zircuit Network
    
    User->>Frontend: Modify existing password
    Frontend->>Frontend: Encrypt updated password data
    Frontend->>Walrus: Upload new encrypted data
    Walrus-->>Frontend: Return new Walrus CID
    
    Frontend->>Frontend: Generate new password hash
    Frontend->>Wallet: Request update transaction
    Wallet->>User: Confirm transaction
    User-->>Wallet: Approve transaction
    
    Wallet->>Contract: updateVaultItem(entryId, newHash, newWalrusCid)
    Contract->>Contract: Validate ownership
    Contract->>Contract: Check entry exists & active
    Contract->>Contract: Apply security checks
    
    Contract->>Blockchain: Update vault item
    Contract->>Contract: Update timestamp
    Contract->>Contract: Emit VaultItemUpdated event
    
    Blockchain-->>Contract: Transaction confirmed
    Contract-->>Wallet: Transaction receipt
    Wallet-->>Frontend: Success response
    Frontend-->>User: Update confirmation
```

### Delete Vault Item Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend App
    participant Wallet as Wallet (Wagmi)
    participant Contract as ShadowVaultV2
    participant Blockchain as Zircuit Network
    
    User->>Frontend: Request to delete vault item
    Frontend->>Frontend: Confirm deletion intent
    Frontend->>Wallet: Request delete transaction
    Wallet->>User: Confirm transaction
    User-->>Wallet: Approve transaction
    
    Wallet->>Contract: deleteVaultItem(entryId)
    Contract->>Contract: Validate ownership
    Contract->>Contract: Check entry exists & active
    Contract->>Contract: Apply security checks
    
    Contract->>Blockchain: Mark item as inactive (soft delete)
    Contract->>Contract: Emit VaultItemDeleted event
    
    Blockchain-->>Contract: Transaction confirmed
    Contract-->>Wallet: Transaction receipt
    Wallet-->>Frontend: Success response
    Frontend-->>User: Deletion confirmation
    
    Note over Contract: Data remains on-chain but marked inactive
    Note over Frontend: Frontend filters out inactive items
```

### Emergency Pause Workflow (Owner Only)

```mermaid
sequenceDiagram
    participant Owner as Contract Owner
    participant Frontend as Admin Frontend
    participant Wallet as Owner Wallet
    participant Contract as ShadowVaultV2
    participant Blockchain as Zircuit Network
    participant Users as All Users
    
    Owner->>Frontend: Detect security issue
    Frontend->>Wallet: Request pause transaction
    Wallet->>Owner: Confirm emergency pause
    Owner-->>Wallet: Approve transaction
    
    Wallet->>Contract: pause()
    Contract->>Contract: Check onlyOwner modifier
    Contract->>Contract: Set paused = true
    Contract->>Contract: Emit Paused event
    
    Blockchain-->>Contract: Transaction confirmed
    Contract-->>Wallet: Pause successful
    Wallet-->>Frontend: Pause confirmation
    Frontend-->>Owner: System paused notification
    
    Note over Contract: All state-changing functions blocked
    Note over Users: Users cannot store/update/delete items
    
    rect rgb(255, 200, 200)
        Users->>Contract: Try to call storeVaultItem()
        Contract-->>Users: Transaction reverted (paused)
    end
    
    Owner->>Frontend: Issue resolved, unpause system
    Frontend->>Wallet: Request unpause transaction
    Wallet->>Contract: unpause()
    Contract->>Contract: Set paused = false
    Contract->>Contract: Emit Unpaused event
    
    Note over Contract: Normal operations resumed
    Note over Users: Users can interact normally again
```

## 🛠 Prerequisites

- Node.js >= 16.x
- npm or yarn
- Hardhat
- Zircuit Garfield testnet access
- Testnet ETH (can use Sepolia faucets as Zircuit uses Sepolia ETH)

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

# Zircuit RPC URL (optional, defaults to public RPC)
ZIRCUIT_RPC_URL=https://garfield-testnet.zircuit.com

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
# Deploy to Zircuit Garfield Testnet
npm run deploy:zircuit

# Verify contract with Sourcify (manual process)
npm run sourcify:manual

# Interact with deployed contract
npm run interact:zircuit <contract_address>
```

## 📋 Deployment Process

1. **Prepare Environment**
   ```bash
   # Ensure you have testnet ETH (use Sepolia faucets)
   # Configure .env file with PRIVATE_KEY
   ```

2. **Deploy Contract**
   ```bash
   npm run deploy:zircuit
   ```

3. **Verify with Sourcify**
   ```bash
   npm run sourcify:manual
   # Follow instructions in sourcify-verification/INSTRUCTIONS.md
   ```

4. **Test Deployment**
   ```bash
   npm run interact:zircuit <contract_address>
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

#### `storeVaultItem(string calldata storedHash, string calldata walrusCid)`
Store a new encrypted password entry with Walrus CID.

#### `updateVaultItem(uint256 entryId, string calldata storedHash, string calldata walrusCid)`
Update an existing vault item.

#### `deleteVaultItem(uint256 entryId)`
Mark a vault item as deleted (soft delete).

#### `getVaultItem(address user, uint256 entryId)`
Retrieve a specific vault item.

#### `getUserVaultItems(address user)`
Get all active vault items for a user.

### Administrative Functions

#### `pause()` / `unpause()`
Owner-only functions to pause/unpause contract operations.

## 🌐 Network Configuration

### Zircuit Garfield Testnet

- **Chain ID**: 48898
- **RPC URL**: https://garfield-testnet.zircuit.com
- **Explorer**: https://explorer.garfield-testnet.zircuit.com
- **Faucet**: Use Sepolia faucets (Zircuit uses Sepolia ETH)
- **Features**: ZK-optimized, EIP-7702 compatible, Pectra opcodes

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
- [Zircuit Documentation](https://docs.zircuit.com/)
- [Zircuit Explorer](https://explorer.garfield-testnet.zircuit.com)
- [Walrus Documentation](https://docs.walrus.sui.io/)

## 🆘 Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check private key is correct (no 0x prefix)
   - Ensure sufficient testnet ETH (use Sepolia faucets)
   - Verify network configuration

2. **Verification Fails**
   - Use Sourcify manual verification process
   - Ensure contract source files are available
   - Check contract address and chain ID

3. **Tests Fail**
   - Run `npm run clean` and rebuild
   - Check Node.js version compatibility
   - Ensure all dependencies are installed

### Getting Help

- Check existing GitHub issues
- Review Hardhat documentation
- Check Zircuit Discord community
- Use Sourcify for contract verification