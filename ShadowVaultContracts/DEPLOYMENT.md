# ShadowVault Deployment Guide

## 🚀 Base Sepolia Deployment Instructions

### Prerequisites

1. **Get Base Sepolia ETH**
   - Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Get testnet ETH for your wallet

2. **Get BaseScan API Key**
   - Visit: https://basescan.org/apis
   - Register and get your API key

3. **Prepare Private Key**
   - Export your private key from MetaMask (64 characters, no 0x prefix)
   - ⚠️ **NEVER share or commit your private key**

### Step 1: Configure Environment

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Private key (64 characters, NO 0x prefix)
PRIVATE_KEY=your_64_character_private_key_here

# Base Sepolia RPC (optional, uses public RPC by default)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# BaseScan API key for verification
BASESCAN_API_KEY=your_basescan_api_key_here

# Enable gas reporting (optional)
REPORT_GAS=false
```

### Step 2: Deploy to Base Sepolia

```bash
# Deploy the contract
npm run deploy:baseSepolia
```

Expected output:
```
Starting ShadowVault deployment...
Deploying contracts with the account: 0x...
Account balance: X.X ETH
Deploying ShadowVault...
ShadowVault deployed to: 0x...
Contract owner: 0x...
```

### Step 3: Verify Contract

After successful deployment, verify on BaseScan:

```bash
# Replace with your actual contract address and deployer address
npm run verify:baseSepolia <CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>
```

Or use hardhat verify directly:

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>
```

### Step 4: Test Deployment

Interact with your deployed contract:

```bash
npm run interact:baseSepolia <CONTRACT_ADDRESS>
```

## 🔧 Deployment Troubleshooting

### Common Issues

1. **"private key too short"**
   - Ensure private key is exactly 64 characters
   - Remove "0x" prefix if present

2. **"insufficient funds"**
   - Get more Base Sepolia ETH from faucet
   - Check balance: minimum ~0.01 ETH needed

3. **"verification failed"**
   - Wait 1-2 minutes after deployment
   - Ensure BaseScan API key is correct
   - Check constructor arguments match deployment

4. **"network not configured"**
   - Verify `.env` file exists and is properly formatted
   - Check PRIVATE_KEY length (64 chars)

### Manual Verification

If automatic verification fails, verify manually on BaseScan:

1. Go to: https://sepolia.basescan.org/
2. Search for your contract address
3. Click "Contract" tab → "Verify and Publish"
4. Select:
   - Compiler: Solidity (Single file)
   - Version: 0.8.24
   - License: MIT
5. Paste the flattened contract code

## 📊 Gas Estimates

Typical deployment costs on Base Sepolia:
- **Contract Deployment**: ~0.003-0.005 ETH
- **Store Entry**: ~0.0001-0.0002 ETH
- **Update Entry**: ~0.0001-0.0002 ETH
- **Delete Entry**: ~0.00005-0.0001 ETH

## 🌐 Network Information

**Base Sepolia Testnet**
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## 🔗 After Deployment

1. **Save Contract Address**: Note down the deployed contract address
2. **Update Frontend**: Configure your frontend with the contract address
3. **Test Functions**: Use the interact script to test functionality
4. **Monitor**: Check transactions on BaseScan

## 📱 Integration

After successful deployment, integrate with your frontend:

```typescript
// Contract configuration
const SHADOWVAULT_ADDRESS = "0x..."; // Your deployed address
const SHADOWVAULT_ABI = [...]; // Generated ABI from artifacts
const CHAIN_ID = 84532; // Base Sepolia
```

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment configuration
3. Check network status: https://status.base.org
4. Review Hardhat documentation: https://hardhat.org/docs