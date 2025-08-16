const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envFilePath = path.join(__dirname, '.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("--- ShadowVault Contracts Environment Setup ---");
console.log("This script will create a '.env' file to securely store your private key for deployment.");

// Check if the .env file already exists
if (fs.existsSync(envFilePath)) {
  console.log("\nAn '.env' file already exists. Overwriting it.");
}

rl.question('\nPlease enter the private key for your deployment wallet: ', (privateKey) => {
  if (!privateKey || privateKey.length !== 64 && !privateKey.startsWith('0x')) {
    console.error('\n❌ Error: Invalid private key format. Please provide a 64-character hex string.');
    rl.close();
    process.exit(1);
  }

  // Ensure the key starts with 0x for consistency, but the config handles both cases.
  const keyToWrite = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  const envContent = `PRIVATE_KEY=${keyToWrite}`;

  fs.writeFileSync(envFilePath, envContent);

  console.log("\n✅ Success! '.env' file created in 'ShadowVaultContracts'.");
  console.log("You are now ready to deploy the contracts.");
  
  rl.close();
});
