#!/bin/bash

# ShadowVault Deployment Script Example
# This script demonstrates how to deploy and verify the ShadowVault contract

set -e  # Exit on any error

echo "🚀 ShadowVault Deployment to Base Sepolia"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please create .env file with:"
    echo "   PRIVATE_KEY=your_64_character_private_key"
    echo "   BASESCAN_API_KEY=your_basescan_api_key"
    echo ""
    echo "🔗 Get Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    echo "🔗 Get BaseScan API Key: https://basescan.org/apis"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ] || [ ${#PRIVATE_KEY} -ne 64 ]; then
    echo "❌ PRIVATE_KEY not set or invalid length (should be 64 characters)"
    exit 1
fi

if [ -z "$BASESCAN_API_KEY" ]; then
    echo "⚠️  BASESCAN_API_KEY not set - verification will be skipped"
fi

echo "✅ Environment configured"
echo ""

# Compile contracts
echo "🔨 Compiling contracts..."
npm run build

# Deploy to Base Sepolia
echo ""
echo "🚀 Deploying to Base Sepolia..."
DEPLOYMENT_OUTPUT=$(npm run deploy:baseSepolia 2>&1)
echo "$DEPLOYMENT_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOYMENT_OUTPUT" | grep -o "0x[a-fA-F0-9]\{40\}" | head -1)
DEPLOYER_ADDRESS=$(echo "$DEPLOYMENT_OUTPUT" | grep "Deployer:" | grep -o "0x[a-fA-F0-9]\{40\}")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Failed to extract contract address from deployment output"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo "📍 Contract Address: $CONTRACT_ADDRESS"
echo "👤 Deployer Address: $DEPLOYER_ADDRESS"

# Verify contract if API key is provided
if [ -n "$BASESCAN_API_KEY" ]; then
    echo ""
    echo "🔍 Verifying contract on BaseScan..."
    echo "⏳ Waiting 30 seconds for block confirmation..."
    sleep 30
    
    if npm run verify:baseSepolia "$CONTRACT_ADDRESS" "$DEPLOYER_ADDRESS"; then
        echo "✅ Contract verified successfully!"
        echo "🔗 View on BaseScan: https://sepolia.basescan.org/address/$CONTRACT_ADDRESS"
    else
        echo "⚠️  Automatic verification failed. You can verify manually:"
        echo "   npx hardhat verify --network baseSepolia $CONTRACT_ADDRESS $DEPLOYER_ADDRESS"
    fi
else
    echo "⚠️  Skipping verification (no API key provided)"
fi

# Test contract interaction
echo ""
echo "🧪 Testing contract interaction..."
if npm run interact:baseSepolia "$CONTRACT_ADDRESS"; then
    echo "✅ Contract interaction test passed!"
else
    echo "⚠️  Contract interaction test failed"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "📍 Contract Address: $CONTRACT_ADDRESS"
echo "🔗 BaseScan: https://sepolia.basescan.org/address/$CONTRACT_ADDRESS"
echo "🌐 Network: Base Sepolia (Chain ID: 84532)"
echo ""
echo "📝 Next Steps:"
echo "1. Update your frontend with the contract address"
echo "2. Test the contract functions"
echo "3. Share the contract address with your team"