import { run } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  const contractAddress = process.argv[2];
  const ownerAddress = process.argv[3];

  if (!contractAddress) {
    console.error("❌ Please provide contract address as first argument");
    console.log("Usage: npx hardhat run scripts/verify.ts --network baseSepolia <contract_address> <owner_address>");
    process.exit(1);
  }

  if (!ownerAddress) {
    console.error("❌ Please provide owner address as second argument");
    console.log("Usage: npx hardhat run scripts/verify.ts --network baseSepolia <contract_address> <owner_address>");
    process.exit(1);
  }

  console.log("Starting contract verification...");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner Address: ${ownerAddress}`);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [ownerAddress],
    });

    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });