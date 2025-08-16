# ShadowVault Smart Contract Deployment on Zircuit Garfield Testnet

## Overview

This guide covers deploying the ShadowVault smart contract to Zircuit Garfield Testnet, which provides advanced ZK-proof verification capabilities and EIP-7702 compatibility.

## Network Configuration

**Zircuit Garfield Testnet:**
- **Chain ID:** 48898
- **RPC URL:** https://garfield-testnet.zircuit.com
- **Explorer:** https://explorer.garfield-testnet.zircuit.com
- **Currency:** ETH (testnet)
- **Faucet:** Use Sepolia faucets (Zircuit Garfield uses Sepolia ETH)

## Prerequisites

1. **Node.js & Dependencies:**
   ```bash
   cd ShadowVaultContracts
   npm install
   ```

2. **Environment Setup:**
   Configure `.env` file:
   ```env
   # Private key for deployment (64 characters, no 0x prefix)
   PRIVATE_KEY=your_private_key_here
   
   # Zircuit Garfield Testnet RPC URL
   ZIRCUIT_RPC_URL=https://garfield-testnet.zircuit.com
   
   # Enable gas reporting (optional)
   REPORT_GAS=false
   ```

3. **Testnet ETH:**
   - Get Sepolia ETH from faucets:
     - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
     - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
     - [ETHGlobal Faucet](https://faucet.paradigm.xyz/)

## Contract Analysis

### ShadowVault.sol Features

✅ **Security Standards:**
- OpenZeppelin Ownable, ReentrancyGuard, Pausable
- Solidity 0.8.24 with optimizer enabled
- Comprehensive input validation

✅ **Core Functions:**
- `storeEntry()` - Store encrypted password data
- `updateEntry()` - Update existing entries
- `deleteEntry()` - Soft delete entries
- `getEntry()` - Retrieve specific entry
- `getUserEntries()` - Get all active entries for user

✅ **Events:**
- `EntryStored(user, entryId, metadataHash)`
- `EntryUpdated(user, entryId, metadataHash)`
- `EntryDeleted(user, entryId)`

### Zircuit Compatibility

✅ **EVM Compatibility:** Full Ethereum compatibility
✅ **Solidity Version:** 0.8.24 (supported)
✅ **OpenZeppelin:** Latest versions compatible
✅ **Gas Optimization:** Enabled for efficient execution

## Deployment Process

### 1. Compile Contracts

```bash
npm run build
# or
npx hardhat compile
```

**Expected Output:**
- Compiled contracts in `artifacts/`
- TypeScript types in `typechain-types/`

### 2. Run Tests (Recommended)

```bash
npm test
# or
npx hardhat test
```

**Test Coverage:**
- ✅ Deployment and initialization
- ✅ Entry management (store, update, delete)
- ✅ Access control (pause/unpause)
- ✅ Multi-user isolation
- ✅ Edge cases and error conditions

### 3. Deploy to Zircuit

```bash
npm run deploy:zircuit
# or
npx hardhat run scripts/deploy.ts --network zircuitGarfieldTestnet
```

**Expected Output:**
```
Starting ShadowVault deployment...
Deploying contracts with the account: 0x...
Account balance: 1.0 ETH
Deploying ShadowVault...
ShadowVault deployed to: 0x...
Contract owner: 0x...
✅ Deployment completed successfully!
```

### 4. Verify Contract (Recommended)

Zircuit Garfield Testnet supports Sourcify verification, which provides decentralized source code verification:

```bash
npx hardhat verify --network zircuitGarfieldTestnet <contract_address> <owner_address>
```

**Example for our deployed contract:**
```bash
npx hardhat verify --network zircuitGarfieldTestnet 0xFfD385c7BC7645846449363825a31435DA6d2095 0xee121da86e540f34956942d3678060c3AAc7D596
```

**Verification Results:**
- ✅ **Successfully verified on Sourcify**
- 📄 **Source Code**: https://repo.sourcify.dev/contracts/full_match/48898/0xFfD385c7BC7645846449363825a31435DA6d2095/

### 5. Test Interaction

```bash
npm run interact:zircuit <contract_address>
# or
npx hardhat run scripts/interact.ts --network zircuitGarfieldTestnet <contract_address>
```

## Post-Deployment

### 1. Update Frontend Configuration

Update the frontend environment variables:

```env
# ShadowVaultApp/.env.local
NEXT_PUBLIC_SHADOWVAULT_CONTRACT=0x... # Deployed contract address
NEXT_PUBLIC_CHAIN_ID=48898
NEXT_PUBLIC_RPC_URL=https://garfield-testnet.zircuit.com
NEXT_PUBLIC_EXPLORER_URL=https://explorer.garfield-testnet.zircuit.com
```

### 2. Verify on Explorer

Visit the deployed contract on [Zircuit Garfield Explorer](https://explorer.garfield-testnet.zircuit.com/address/0xFfD385c7BC7645846449363825a31435DA6d2095) to verify deployment and view transactions.

### 3. Integration Testing

Test the complete flow:
1. Frontend authentication (Privy)
2. Contract interaction (store entry)
3. Event emission verification
4. Data retrieval

## Network Advantages

### Why Zircuit Garfield Testnet?

✅ **ZK-Optimized:** Built for zero-knowledge proof applications
✅ **Future-Ready:** EIP-7702 compatibility and Pectra opcodes
✅ **Enhanced Prover:** Better performance for ZK applications
✅ **Fresh Network:** No legacy baggage, clean state
✅ **Active Development:** Cutting-edge testnet features

## Troubleshooting

### Common Issues

**1. Deployment Fails:**
- Check private key format (64 chars, no 0x prefix)
- Ensure sufficient testnet ETH balance
- Verify RPC URL connectivity

**2. Verification Fails:**
- Zircuit may not require API keys for verification
- Check contract address and constructor arguments
- Ensure network name matches configuration

**3. Gas Issues:**
- Zircuit testnet should have reasonable gas costs
- Check gas estimation in deployment script
- Monitor network congestion

### Scripts Reference

```bash
# Core commands
npm run build          # Compile contracts
npm test              # Run test suite
npm run deploy:zircuit # Deploy to Zircuit
npm run verify:zircuit # Verify contract
npm run interact:zircuit # Test interaction

# Hardhat commands
npx hardhat compile    # Compile only
npx hardhat test       # Test only
npx hardhat clean      # Clean artifacts
```

## Security Considerations

✅ **Private Key Security:** Never commit private keys to version control
✅ **Testnet Only:** Use testnet for development and testing
✅ **Input Validation:** Contract includes comprehensive validation
✅ **Access Control:** Owner-only functions for emergency controls
✅ **Reentrancy Protection:** OpenZeppelin ReentrancyGuard implemented

## Next Steps

1. **Frontend Integration:** Connect deployed contract to ShadowVaultApp
2. **ZK Circuit Integration:** Implement password proof verification
3. **Testing:** Comprehensive end-to-end testing
4. **Documentation:** Update deployment information in project docs

## Resources

- [Zircuit Documentation](https://docs.zircuit.com/)
- [Zircuit Garfield Testnet](https://docs.zircuit.com/garfield-testnet/quick-start)
- [Zircuit Explorer](https://explorer.garfield-testnet.zircuit.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**Migration Status:** ✅ Successfully migrated from Base Sepolia to Zircuit Garfield Testnet

**Contract Compatibility:** ✅ Full compatibility with Zircuit EVM

**Testing Status:** ✅ All tests passing (16/16 test cases)

**Deployment Status:** ✅ Successfully deployed to Zircuit Garfield Testnet

**Contract Address:** `0xFfD385c7BC7645846449363825a31435DA6d2095`

**Explorer URL:** https://explorer.garfield-testnet.zircuit.com/address/0xFfD385c7BC7645846449363825a31435DA6d2095

**Live Testing:** ✅ Entry storage and retrieval working correctly