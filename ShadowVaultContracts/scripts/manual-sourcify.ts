import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

async function main() {
  console.log("🔍 Manual Sourcify verification for ShadowVaultV2...");

  try {
    // Read deployment info
    const deploymentPath = 'deployments/shadowvault-v2-deployment.json';
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found. Please deploy the contract first.");
      process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractAddress = deploymentInfo.contractAddress;
    const chainId = deploymentInfo.networkChainId;

    console.log("📋 Contract Info:");
    console.log("   Address:", contractAddress);
    console.log("   Chain ID:", chainId);
    console.log("   Network:", deploymentInfo.network);

    // Prepare files for Sourcify
    const contractPath = path.join(__dirname, "../contracts/ShadowVaultV2.sol");
    const artifactPath = path.join(__dirname, "../artifacts/contracts/ShadowVaultV2.sol/ShadowVaultV2.json");
    
    if (!fs.existsSync(contractPath)) {
      console.error("❌ Contract source file not found:", contractPath);
      process.exit(1);
    }

    if (!fs.existsSync(artifactPath)) {
      console.error("❌ Contract artifact not found. Please compile first: npm run build");
      process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Create metadata.json
    const metadata = {
      compiler: {
        version: "0.8.24+commit.e11b9ed9"
      },
      language: "Solidity",
      output: {
        abi: artifact.abi,
        devdoc: artifact.devdoc,
        userdoc: artifact.userdoc
      },
      settings: {
        compilationTarget: {
          "contracts/ShadowVaultV2.sol": "ShadowVaultV2"
        },
        evmVersion: "paris",
        libraries: {},
        metadata: {
          bytecodeHash: "ipfs"
        },
        optimizer: {
          enabled: true,
          runs: 200
        },
        remappings: []
      },
      sources: {
        "contracts/ShadowVaultV2.sol": {
          keccak256: "0x" + "TODO", // We'll calculate this
          urls: ["bzz-raw://TODO", "dweb:/ipfs/TODO"]
        },
        // Include OpenZeppelin imports
        "@openzeppelin/contracts/access/Ownable.sol": {
          keccak256: "0x" + "TODO",
          urls: ["bzz-raw://TODO", "dweb:/ipfs/TODO"]
        },
        "@openzeppelin/contracts/utils/ReentrancyGuard.sol": {
          keccak256: "0x" + "TODO", 
          urls: ["bzz-raw://TODO", "dweb:/ipfs/TODO"]
        },
        "@openzeppelin/contracts/utils/Pausable.sol": {
          keccak256: "0x" + "TODO",
          urls: ["bzz-raw://TODO", "dweb:/ipfs/TODO"]
        }
      },
      version: 1
    };

    console.log("\n📤 Preparing Sourcify submission...");
    console.log("📁 Contract source:", contractPath);
    console.log("📄 Artifact file:", artifactPath);

    // Alternative approach: Use Sourcify's REST API directly
    const sourcifyServerUrl = "https://sourcify.dev/server";
    
    console.log("\n🌐 Submitting to Sourcify server:", sourcifyServerUrl);
    console.log("⏳ This may take a moment...");

    // Create form data
    const formData = new FormData();
    formData.append('address', contractAddress);
    formData.append('chain', chainId);
    formData.append('files', fs.createReadStream(contractPath), 'ShadowVaultV2.sol');
    formData.append('files', JSON.stringify(artifact), 'metadata.json');

    try {
      const response = await fetch(`${sourcifyServerUrl}/`, {
        method: 'POST',
        body: formData
      });

      const result = await response.text();
      console.log("📡 Sourcify response:", result);

      if (response.ok) {
        console.log("✅ Contract submitted to Sourcify successfully!");
        
        // Update deployment info
        deploymentInfo.sourcifyVerified = true;
        deploymentInfo.sourcifyVerifiedAt = new Date().toISOString();
        deploymentInfo.sourcifyUrls = {
          repository: `https://repo.sourcify.dev/contracts/full_match/${chainId}/${contractAddress}/`,
          metadata: `https://repo.sourcify.dev/contracts/full_match/${chainId}/${contractAddress}/metadata.json`
        };
        
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("💾 Updated deployment info with Sourcify verification");

      } else {
        console.log("⚠️  Sourcify submission completed with warnings");
        console.log("📋 This might mean the contract is already verified");
      }

    } catch (fetchError) {
      console.error("❌ Network error submitting to Sourcify:", fetchError);
    }

    // Alternative: Generate files for manual upload
    console.log("\n📁 Generating files for manual Sourcify verification...");
    
    const sourcifyDir = "sourcify-verification";
    if (!fs.existsSync(sourcifyDir)) {
      fs.mkdirSync(sourcifyDir);
    }

    // Copy contract source
    fs.copyFileSync(contractPath, path.join(sourcifyDir, "ShadowVaultV2.sol"));
    
    // Save metadata
    fs.writeFileSync(
      path.join(sourcifyDir, "metadata.json"), 
      JSON.stringify(artifact, null, 2)
    );

    // Create instructions
    const instructions = `
# Manual Sourcify Verification Instructions

## Contract Details
- Address: ${contractAddress}
- Chain ID: ${chainId}
- Network: ${deploymentInfo.network}

## Files to Upload
1. ShadowVaultV2.sol (contract source)
2. metadata.json (compilation metadata)

## Steps:
1. Go to https://sourcify.dev/#/verifier
2. Select "Files" tab
3. Upload both files from this directory
4. Enter contract address: ${contractAddress}
5. Select chain ID: ${chainId}
6. Click "Verify"

## Alternative: Repository URL
Once verified, your contract will be available at:
${deploymentInfo.sourcifyUrls?.repository || `https://repo.sourcify.dev/contracts/full_match/${chainId}/${contractAddress}/`}
`;

    fs.writeFileSync(path.join(sourcifyDir, "INSTRUCTIONS.md"), instructions);

    console.log("✅ Manual verification files generated!");
    console.log("📁 Directory:", path.resolve(sourcifyDir));
    console.log("📋 Follow instructions in INSTRUCTIONS.md");

    console.log("\n🔗 Useful Links:");
    console.log("   Sourcify Verifier: https://sourcify.dev/#/verifier");
    console.log("   Contract Explorer:", deploymentInfo.explorerUrl);

  } catch (error) {
    console.error("❌ Manual Sourcify preparation failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute manual Sourcify verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;