// ShadowVaultV2 Contract Configuration
// Auto-generated from deployed contract
// Network: Zircuit Garfield Testnet
// Generated at: 2025-08-17T06:30:56.381Z

export const ShadowVaultV2Config = {
  "address": "0x577dc63554BF7531f75AF602896209fFe87d51E8",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "initialOwner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "VaultItemDeleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "string",
          "name": "storedHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "walrusCid",
          "type": "string"
        }
      ],
      "name": "VaultItemStored",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "string",
          "name": "storedHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "walrusCid",
          "type": "string"
        }
      ],
      "name": "VaultItemUpdated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "deleteVaultItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "entryCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserEntryCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserVaultItems",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "storedHash",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "walrusCid",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct ShadowVaultV2.VaultItem[]",
          "name": "items",
          "type": "tuple[]"
        },
        {
          "internalType": "uint256[]",
          "name": "itemIds",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getVaultItem",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "storedHash",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "walrusCid",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct ShadowVaultV2.VaultItem",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "isVaultItemActive",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "storedHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "walrusCid",
          "type": "string"
        }
      ],
      "name": "storeVaultItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "storedHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "walrusCid",
          "type": "string"
        }
      ],
      "name": "updateVaultItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "version",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    }
  ],
  "deployment": {
    "contractAddress": "0x577dc63554BF7531f75AF602896209fFe87d51E8",
    "deployerAddress": "0xee121da86e540f34956942d3678060c3AAc7D596",
    "networkChainId": "48898",
    "deploymentHash": "0x80077613a7943f4833743104f0884d14575624cd0d9bd146c5479760ed9df5a3",
    "contractName": "ShadowVaultV2",
    "deployedAt": "2025-08-17T06:29:31.921Z",
    "explorerUrl": "https://explorer.garfield-testnet.zircuit.com/address/0x577dc63554BF7531f75AF602896209fFe87d51E8",
    "network": "Zircuit Garfield Testnet"
  }
} as const;

export const ShadowVaultV2Address = "0x577dc63554BF7531f75AF602896209fFe87d51E8";
export const ShadowVaultV2ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      }
    ],
    "name": "VaultItemDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "storedHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "walrusCid",
        "type": "string"
      }
    ],
    "name": "VaultItemStored",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "storedHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "walrusCid",
        "type": "string"
      }
    ],
    "name": "VaultItemUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      }
    ],
    "name": "deleteVaultItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "entryCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserEntryCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserVaultItems",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "storedHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "walrusCid",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct ShadowVaultV2.VaultItem[]",
        "name": "items",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256[]",
        "name": "itemIds",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      }
    ],
    "name": "getVaultItem",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "storedHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "walrusCid",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct ShadowVaultV2.VaultItem",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      }
    ],
    "name": "isVaultItemActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "storedHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "walrusCid",
        "type": "string"
      }
    ],
    "name": "storeVaultItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "storedHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "walrusCid",
        "type": "string"
      }
    ],
    "name": "updateVaultItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
] as const;

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
