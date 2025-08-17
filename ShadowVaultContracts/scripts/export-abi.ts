import fs from "fs";
import path from "path";

async function main() {
  console.log("📄 Exporting ShadowVaultV2 ABI for frontend integration...");

  try {
    // Read the compiled contract artifact
    const artifactPath = path.join(__dirname, "../artifacts/contracts/ShadowVaultV2.sol/ShadowVaultV2.json");
    
    if (!fs.existsSync(artifactPath)) {
      console.error("❌ Contract artifact not found. Please compile the contract first:");
      console.error("   npm run build");
      process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = artifact.abi;

    // Create the frontend lib directory if it doesn't exist
    const frontendLibPath = path.join(__dirname, "../../ShadowVaultApp/lib/contracts");
    if (!fs.existsSync(frontendLibPath)) {
      fs.mkdirSync(frontendLibPath, { recursive: true });
    }

    // Read deployment info
    const deploymentPath = path.join(__dirname, "../deployments/shadowvault-v2-deployment.json");
    let deploymentInfo = {};
    
    if (fs.existsSync(deploymentPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    // Create the contract configuration file
    const contractConfig = {
      address: (deploymentInfo as any).contractAddress || "CONTRACT_NOT_DEPLOYED",
      abi: abi,
      deployment: deploymentInfo
    };

    // Export as TypeScript module
    const tsContent = `// ShadowVaultV2 Contract Configuration
// Auto-generated from deployed contract
// Network: Zircuit Garfield Testnet
// Generated at: ${new Date().toISOString()}

export const ShadowVaultV2Config = ${JSON.stringify(contractConfig, null, 2)} as const;

export const ShadowVaultV2Address = "${(deploymentInfo as any).contractAddress || "CONTRACT_NOT_DEPLOYED"}";
export const ShadowVaultV2ABI = ${JSON.stringify(abi, null, 2)} as const;

// Type definitions for better TypeScript integration
export interface VaultItem {
  storedHash: string;
  walrusCid: string;
  timestamp: bigint;
  isActive: boolean;
}

export interface DeploymentInfo {
  contractAddress: string;
  deployerAddress: string;
  networkChainId: string;
  deploymentHash: string;
  contractName: string;
  deployedAt: string;
  explorerUrl: string;
  network: string;
}
`;

    const outputPath = path.join(frontendLibPath, "ShadowVaultV2.ts");
    fs.writeFileSync(outputPath, tsContent);

    console.log("✅ ABI exported successfully!");
    console.log("📁 File location:", outputPath);
    console.log("📋 Contract Address:", (deploymentInfo as any).contractAddress);
    console.log("🌐 Explorer:", (deploymentInfo as any).explorerUrl);

    // Also create a simple JSON export for other tools
    const jsonOutputPath = path.join(frontendLibPath, "ShadowVaultV2.json");
    fs.writeFileSync(jsonOutputPath, JSON.stringify(contractConfig, null, 2));
    console.log("📄 JSON config:", jsonOutputPath);

    console.log("\n📝 Frontend Usage:");
    console.log(`
import { ShadowVaultV2Address, ShadowVaultV2ABI } from '@/lib/contracts/ShadowVaultV2'
import { useContractWrite, usePrepareContractWrite } from 'wagmi'

// Store vault item
const { config } = usePrepareContractWrite({
  address: ShadowVaultV2Address,
  abi: ShadowVaultV2ABI,
  functionName: 'storeVaultItem',
  args: [storedHash, walrusCid]
})

const { write } = useContractWrite(config)
`);

  } catch (error) {
    console.error("❌ ABI export failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute export
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;