import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying PasswordStrengthVerifier to Zircuit testnet...");

  // Get the contract factory
  const PasswordStrengthVerifier = await ethers.getContractFactory("PasswordStrengthVerifier");
  
  // Deploy the contract
  const verifier = await PasswordStrengthVerifier.deploy();
  
  // Wait for deployment
  await verifier.waitForDeployment();
  
  const address = await verifier.getAddress();
  
  console.log("✅ PasswordStrengthVerifier deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("🌐 Network: Zircuit Testnet");
  
  // Verify the contract (optional)
  console.log("🔍 Verifying contract on Zircuit explorer...");
  
  // Wait a bit for the deployment to be indexed
  console.log("⏳ Waiting 30 seconds for deployment to be indexed...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("⚠️ Contract verification failed (this is normal for testnet):", error);
  }
  
  console.log("\n🎯 Next steps:");
  console.log("1. Update the contract address in your frontend");
  console.log("2. Test the ZK proof verification");
  console.log("3. Integrate with your vault system");
  
  return address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
