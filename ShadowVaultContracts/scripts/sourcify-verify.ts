import { run } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🔍 Verifying ShadowVaultV2 contract using Sourcify...");

  try {
    // Read deployment info
    const deploymentPath = 'deployments/shadowvault-v2-deployment.json';
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found. Please deploy the contract first.");
      process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractAddress = deploymentInfo.contractAddress;
    const deployerAddress = deploymentInfo.deployerAddress;

    console.log("📋 Contract Info:");
    console.log("   Address:", contractAddress);
    console.log("   Deployer:", deployerAddress);
    console.log("   Network:", deploymentInfo.network);
    console.log("   Chain ID:", deploymentInfo.networkChainId);

    // Verify using Sourcify
    console.log("\n⏳ Starting Sourcify verification process...");
    console.log("🌐 Sourcify is a decentralized contract verification service");
    console.log("📋 This will upload source code and metadata to IPFS");
    
    await run("sourcify", {
      address: contractAddress,
      // Sourcify will automatically use the network from the context
    });

    console.log("✅ Contract verified successfully with Sourcify!");
    
    // Sourcify URLs
    console.log("\n🔗 Sourcify Verification URLs:");
    console.log(`   Repository: https://repo.sourcify.dev/contracts/full_match/${deploymentInfo.networkChainId}/${contractAddress}/`);
    console.log(`   Metadata: https://repo.sourcify.dev/contracts/full_match/${deploymentInfo.networkChainId}/${contractAddress}/metadata.json`);
    console.log(`   Source: https://repo.sourcify.dev/contracts/full_match/${deploymentInfo.networkChainId}/${contractAddress}/sources/contracts/ShadowVaultV2.sol`);

    // Update deployment info with Sourcify verification
    deploymentInfo.sourcifyVerified = true;
    deploymentInfo.sourcifyVerifiedAt = new Date().toISOString();
    deploymentInfo.sourcifyUrls = {
      repository: `https://repo.sourcify.dev/contracts/full_match/${deploymentInfo.networkChainId}/${contractAddress}/`,
      metadata: `https://repo.sourcify.dev/contracts/full_match/${deploymentInfo.networkChainId}/${contractAddress}/metadata.json`,
      source: `https://repo.sourcify.dev/contracts/full_match/${deploymentInfo.networkChainId}/${contractAddress}/sources/contracts/ShadowVaultV2.sol`
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Updated deployment info with Sourcify verification status");

    console.log("\n🎉 Sourcify verification completed!");
    console.log("📋 Benefits of Sourcify verification:");
    console.log("   ✅ Decentralized source code storage on IPFS");
    console.log("   ✅ Immutable verification proof");
    console.log("   ✅ Cross-platform compatibility");
    console.log("   ✅ Enhanced trust and transparency");

  } catch (error: any) {
    if (error.message.includes("already verified") || error.message.includes("Already exists")) {
      console.log("✅ Contract is already verified on Sourcify!");
      
      // Still update deployment info if not already marked
      const deploymentInfo = JSON.parse(fs.readFileSync('deployments/shadowvault-v2-deployment.json', 'utf8'));
      if (!deploymentInfo.sourcifyVerified) {
        deploymentInfo.sourcifyVerified = true;
        deploymentInfo.sourcifyVerifiedAt = new Date().toISOString();
        fs.writeFileSync('deployments/shadowvault-v2-deployment.json', JSON.stringify(deploymentInfo, null, 2));
      }
    } else {
      console.error("❌ Sourcify verification failed:");
      console.error(error.message);
      
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Ensure the contract is deployed and confirmed on-chain");
      console.log("2. Check that all dependencies are installed (npm install)");
      console.log("3. Verify that hardhat.config.ts has sourcify enabled");
      console.log("4. Try again in a few minutes - network issues can cause failures");
      console.log("5. Make sure the source code matches exactly what was deployed");
    }
  }
}

// Execute Sourcify verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;