import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  const contractAddress = process.argv[2];

  if (!contractAddress) {
    console.error("❌ Please provide contract address as argument");
    console.log("Usage: npx hardhat run scripts/interact.ts --network zircuitGarfieldTestnet <contract_address>");
    process.exit(1);
  }

  console.log("Interacting with ShadowVault contract...");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Explorer URL: https://explorer.garfield-testnet.zircuit.com/address/${contractAddress}`);

  // Get the contract instance
  const [signer] = await ethers.getSigners();
  const ShadowVault = await ethers.getContractFactory("ShadowVault");
  const shadowVault = ShadowVault.attach(contractAddress);

  console.log(`Connected as: ${signer.address}`);

  try {
    // Check contract owner
    const owner = await shadowVault.owner();
    console.log(`Contract Owner: ${owner}`);

    // Check if contract is paused
    const isPaused = await shadowVault.paused();
    console.log(`Contract Paused: ${isPaused}`);

    // Get entry count for the current user
    const entryCount = await shadowVault.entryCount(signer.address);
    console.log(`User Entry Count: ${entryCount.toString()}`);

    // Example: Store a test entry (uncomment to test)
    /*
    console.log("Storing test entry...");
    const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("encrypted_password_data"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("example.com:john@example.com"));
    
    const tx = await shadowVault.storeEntry(encryptedData, metadataHash);
    await tx.wait();
    console.log("✅ Test entry stored successfully!");
    
    // Get updated entry count
    const newEntryCount = await shadowVault.entryCount(signer.address);
    console.log(`Updated Entry Count: ${newEntryCount.toString()}`);
    
    // Retrieve the stored entry
    const storedEntry = await shadowVault.getEntry(signer.address, 0);
    console.log(`Stored Entry - Active: ${storedEntry.isActive}`);
    console.log(`Stored Entry - Encrypted Data: ${storedEntry.encryptedData}`);
    console.log(`Stored Entry - Metadata Hash: ${storedEntry.metadataHash}`);
    */

    console.log("✅ Contract interaction completed successfully!");

  } catch (error: any) {
    console.error("❌ Interaction failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction script failed:", error);
    process.exit(1);
  });