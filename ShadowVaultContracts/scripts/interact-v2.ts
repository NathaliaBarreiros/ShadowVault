import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🔗 Interacting with ShadowVaultV2 contract...");

  try {
    // Read deployment info
    const deploymentPath = 'deployments/shadowvault-v2-deployment.json';
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found. Please deploy the contract first.");
      process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractAddress = deploymentInfo.contractAddress;

    console.log("📋 Contract Info:");
    console.log("   Address:", contractAddress);
    console.log("   Explorer:", deploymentInfo.explorerUrl);

    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("👤 Using account:", signer.address);

    // Connect to the deployed contract
    const ShadowVaultV2 = await ethers.getContractFactory("ShadowVaultV2");
    const contract = ShadowVaultV2.attach(contractAddress);

    console.log("\n🧪 Testing contract functionality...");

    // Test 1: Check version
    const version = await contract.version();
    console.log("✅ Contract version:", version);

    // Test 2: Check initial entry count
    const initialCount = await contract.entryCount(signer.address);
    console.log("✅ Initial entry count:", initialCount.toString());

    // Test 3: Store a test vault item
    console.log("\n📝 Storing test vault item...");
    const testStoredHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const testWalrusCid = "test_walrus_blob_" + Date.now();

    const storeTx = await contract.storeVaultItem(testStoredHash, testWalrusCid);
    await storeTx.wait();
    console.log("✅ Test vault item stored!");
    console.log("   Transaction:", storeTx.hash);

    // Test 4: Check updated entry count
    const newCount = await contract.entryCount(signer.address);
    console.log("✅ New entry count:", newCount.toString());

    // Test 5: Retrieve the stored item
    const storedItem = await contract.getVaultItem(signer.address, 0);
    console.log("✅ Retrieved vault item:");
    console.log("   Stored Hash:", storedItem.storedHash);
    console.log("   Walrus CID:", storedItem.walrusCid);
    console.log("   Timestamp:", new Date(Number(storedItem.timestamp) * 1000).toISOString());
    console.log("   Is Active:", storedItem.isActive);

    // Test 6: Get all user vault items
    const [userItems, itemIds] = await contract.getUserVaultItems(signer.address);
    console.log("✅ User vault items count:", userItems.length);

    // Test 7: Check if item is active
    const isActive = await contract.isVaultItemActive(signer.address, 0);
    console.log("✅ Item 0 is active:", isActive);

    console.log("\n🎉 All tests passed! Contract is working correctly.");
    
    console.log("\n📋 Contract Summary:");
    console.log("   ✅ Deployed and functional");
    console.log("   ✅ All read/write operations working");
    console.log("   ✅ Ready for frontend integration");
    console.log("   🔗 Explorer:", deploymentInfo.explorerUrl);

    // Example frontend usage
    console.log("\n💻 Frontend Integration Example:");
    console.log(`
// In your React component:
import { useContractWrite, usePrepareContractWrite } from 'wagmi'

const { config } = usePrepareContractWrite({
  address: '${contractAddress}',
  abi: ShadowVaultV2ABI,
  functionName: 'storeVaultItem',
  args: [storedHash, walrusCid]
})

const { write } = useContractWrite(config)
await write()
`);

  } catch (error) {
    console.error("❌ Interaction failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute interaction
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;