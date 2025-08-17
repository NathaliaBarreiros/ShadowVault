import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying ShadowVaultV2 to Zircuit Garfield Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Low balance! You may need more ETH for deployment.");
  }

  try {
    // Deploy ShadowVaultV2
    console.log("\n🏗️  Deploying ShadowVaultV2 contract...");
    const ShadowVaultV2 = await ethers.getContractFactory("ShadowVaultV2");
    const shadowVault = await ShadowVaultV2.deploy(deployer.address); // deployer as initial owner
    
    // Wait for deployment to be mined
    await shadowVault.waitForDeployment();
    const contractAddress = await shadowVault.getAddress();
    
    console.log("✅ ShadowVaultV2 deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    
    // Get deployment transaction
    const deploymentTx = shadowVault.deploymentTransaction();
    if (deploymentTx) {
      console.log("🔗 Deployment transaction:", deploymentTx.hash);
      console.log("⛽ Gas used:", deploymentTx.gasLimit.toString());
    }

    // Network information
    const network = await ethers.provider.getNetwork();
    console.log("\n🌐 Network Information:");
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Name:", network.name);
    
    // Explorer URLs for Zircuit Garfield Testnet
    if (network.chainId === 48898n) {
      console.log("\n🔍 Zircuit Explorer URLs:");
      console.log("   Contract:", `https://explorer.garfield-testnet.zircuit.com/address/${contractAddress}`);
      if (deploymentTx) {
        console.log("   Transaction:", `https://explorer.garfield-testnet.zircuit.com/tx/${deploymentTx.hash}`);
      }
    }

    // Test basic contract functionality
    console.log("\n🧪 Testing basic contract functionality...");
    
    // Test version
    const version = await shadowVault.version();
    console.log("   Contract version:", version);
    
    // Test entry count (should be 0)
    const entryCount = await shadowVault.entryCount(deployer.address);
    console.log("   Initial entry count:", entryCount.toString());
    
    // Test pause/unpause (only owner can do this)
    console.log("   Testing pause/unpause functionality...");
    await shadowVault.pause();
    console.log("   ✅ Contract paused successfully");
    await shadowVault.unpause();
    console.log("   ✅ Contract unpaused successfully");

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📝 Frontend Integration:");
    console.log("   Add this to your .env.local:");
    console.log(`   NEXT_PUBLIC_SHADOWVAULT_V2_ADDRESS=${contractAddress}`);
    console.log(`   NEXT_PUBLIC_ZIRCUIT_CHAIN_ID=48898`);
    
    // Save deployment info to file
    const deploymentInfo = {
      contractAddress,
      deployerAddress: deployer.address,
      networkChainId: network.chainId.toString(),
      deploymentHash: deploymentTx?.hash,
      contractName: "ShadowVaultV2",
      deployedAt: new Date().toISOString(),
      explorerUrl: `https://explorer.garfield-testnet.zircuit.com/address/${contractAddress}`,
      network: "Zircuit Garfield Testnet"
    };
    
    // Write to deployment file
    fs.writeFileSync(
      'deployments/shadowvault-v2-deployment.json', 
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("   💾 Deployment info saved to deployments/shadowvault-v2-deployment.json");
    
    // Return deployment info for other scripts
    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;