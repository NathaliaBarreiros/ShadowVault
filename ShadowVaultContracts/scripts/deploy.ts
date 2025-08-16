import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("Starting ShadowVault deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  // Check if a deployer account is available
  if (!deployer) {
    console.error("❌ Deployment failed: No deployer account found.");
    console.error("Please ensure you have a PRIVATE_KEY set in your .env file in the 'ShadowVaultContracts' directory.");
    console.error("Example: PRIVATE_KEY=your_64_character_private_key_here");
    throw new Error("Deployer account not configured.");
  }

  console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy ShadowVault contract
  const ShadowVault = await ethers.getContractFactory("ShadowVault");
  console.log("Deploying ShadowVault...");

  const shadowVault = await ShadowVault.deploy(deployer.address);
  await shadowVault.waitForDeployment();

  const contractAddress = await shadowVault.getAddress();
  console.log("ShadowVault deployed to:", contractAddress);

  // Verify deployment
  console.log("Verifying contract deployment...");
  const owner = await shadowVault.owner();
  console.log("Contract owner:", owner);
  console.log("Deployer address:", deployer.address);
  console.log("Owner verification:", owner === deployer.address ? "✅ Correct" : "❌ Incorrect");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployer: deployer.address,
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log("=====================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${deploymentInfo.network.name} (Chain ID: ${deploymentInfo.network.chainId})`);
  console.log(`Block Number: ${deploymentInfo.blockNumber}`);
  console.log(`Timestamp: ${deploymentInfo.timestamp}`);

  console.log("\n🌐 Explorer URLs:");
  console.log("================");
  console.log(`Contract on Zircuit Explorer: https://explorer.garfield-testnet.zircuit.com/address/${contractAddress}`);
  console.log(`Deployer Account: https://explorer.garfield-testnet.zircuit.com/address/${deployer.address}`);

  console.log("\n🔗 Next Steps:");
  console.log("==============");
  console.log("1. Verify contract on Sourcify (recommended for Zircuit):");
  console.log(`   npx hardhat verify --network zircuitGarfieldTestnet ${contractAddress} ${deployer.address}`);
  console.log("2. View verified source code on Sourcify:");
  console.log(`   https://repo.sourcify.dev/contracts/full_match/48898/${contractAddress}/`);
  console.log("3. Update frontend configuration with contract address");
  console.log("4. Test contract functionality");

  return { shadowVault, deploymentInfo };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });