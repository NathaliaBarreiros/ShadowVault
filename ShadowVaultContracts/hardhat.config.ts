import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import { config } from "dotenv";

config();

const hardhatConfig: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    zircuitGarfieldTestnet: {
      url: process.env.ZIRCUIT_RPC_URL || "https://garfield-testnet.zircuit.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 
        ? [process.env.PRIVATE_KEY] 
        : [],
      chainId: 48898,
    },
  },
  etherscan: {
    apiKey: {
      zircuitGarfieldTestnet: "abc", // Zircuit doesn't require API key for verification
    },
    customChains: [
      {
        network: "zircuitGarfieldTestnet",
        chainId: 48898,
        urls: {
          apiURL: "https://explorer.garfield-testnet.zircuit.com/api",
          browserURL: "https://explorer.garfield-testnet.zircuit.com/",
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default hardhatConfig;