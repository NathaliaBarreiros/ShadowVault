import { ethers } from "hardhat";
import { config } from "dotenv";

// Load environment variables
config();

async function main() {
  console.log("🚀 Deploying PasswordStrengthVerifier to Zircuit testnet...");
  
  // Check if required environment variables are set
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY environment variable is required");
  }
  
  if (!process.env.ZIRCUIT_RPC_URL) {
    throw new Error("❌ ZIRCUIT_RPC_URL environment variable is required");
  }
  
  console.log("✅ Environment variables loaded successfully");
  console.log("🔗 RPC URL:", process.env.ZIRCUIT_RPC_URL);
  console.log("👤 Wallet address:", ethers.computeAddress(`0x${process.env.PRIVATE_KEY}`));

  // Get the contract factory
  const PasswordStrengthVerifier = await ethers.getContractFactory("PasswordStrengthVerifier");
  
  console.log("📦 Contract factory created");

  // Deploy the contract
  const passwordVerifier = await PasswordStrengthVerifier.deploy();
  
  console.log("⏳ Waiting for deployment to be mined...");
  await passwordVerifier.waitForDeployment();

  const address = await passwordVerifier.getAddress();
  console.log("✅ PasswordStrengthVerifier deployed to:", address);
  console.log("🔗 Zircuit Explorer: https://explorer.zircuit.com/address/" + address);
  
  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const verifierAddress = await passwordVerifier.verifier();
  console.log("✅ Auto-generated Verifier deployed at:", verifierAddress);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract addresses:");
  console.log("   - PasswordStrengthVerifier:", address);
  console.log("   - Verifier (auto-generated):", verifierAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "zircuitTestnet",
    timestamp: new Date().toISOString(),
    contracts: {
      passwordStrengthVerifier: address,
      verifier: verifierAddress
    }
  };
  
  console.log("\n📄 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
