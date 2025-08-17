import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import { config } from "dotenv";

config();

const hardhatConfig: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 
        ? [process.env.PRIVATE_KEY] 
        : [],
      chainId: 84532,
    },
    zircuitTestnet: {
      url: process.env.ZIRCUIT_RPC_URL || "https://rpc.zircuit.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 
        ? [process.env.PRIVATE_KEY] 
        : [],
      chainId: 48898,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
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