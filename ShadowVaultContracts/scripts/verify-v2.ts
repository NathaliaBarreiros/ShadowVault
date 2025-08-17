import { run } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🔍 Verifying ShadowVaultV2 contract on Zircuit Explorer...");

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

    // Verify the contract
    console.log("\n⏳ Starting verification process...");
    
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [deployerAddress], // Initial owner = deployer
      network: "zircuitGarfieldTestnet"
    });

    console.log("✅ Contract verified successfully!");
    console.log("🔗 Verified contract:", `https://explorer.garfield-testnet.zircuit.com/address/${contractAddress}`);

    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verifiedAt = new Date().toISOString();
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Updated deployment info with verification status");

  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:");
      console.error(error.message);
      
      // Common troubleshooting tips
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Make sure the contract is deployed and confirmed");
      console.log("2. Check that constructor arguments match deployment");
      console.log("3. Verify network configuration in hardhat.config.ts");
      console.log("4. Some explorers need time before verification works");
    }
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;