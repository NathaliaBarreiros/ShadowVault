// Contract Integration for Password Strength Verification
// This module handles interactions with the deployed smart contract on Zircuit testnet

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, encodePacked } from 'viem';

// Contract ABI - Generated from the deployed contract
const PASSWORD_VERIFIER_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
        "internalType": "bytes32",
        "name": "proofHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PasswordStrengthVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "itemIdHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "itemCommitment",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "itemCipherCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "passwordStrengthVerified",
        "type": "bool"
      }
    ],
    "name": "VaultItemCommitted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "itemIdHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "itemCommitment",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "itemCipherCID",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32[]",
        "name": "publicInputs",
        "type": "bytes32[]"
      }
    ],
    "name": "commitVaultItem",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "getUserProofCount",
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
        "internalType": "bytes32",
        "name": "proofHash",
        "type": "bytes32"
      }
    ],
    "name": "isProofVerified",
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
    "inputs": [
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32[]",
        "name": "publicInputs",
        "type": "bytes32[]"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "verifyPasswordStrength",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32[]",
        "name": "publicInputs",
        "type": "bytes32[]"
      }
    ],
    "name": "verifyProof",
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
    "name": "verifier",
    "outputs": [
      {
        "internalType": "contract Verifier",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address (deployed on Zircuit testnet)
const PASSWORD_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_PASSWORD_VERIFIER_ADDRESS || "0x994C855086A8aeDB4828053C24fD6cBd386E9349";

/**
 * Hook to verify password strength on-chain
 */
export function useVerifyPasswordStrength() {
  const { data, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const verifyPasswordStrength = (args: any) => {
    console.log("🔍 ===== CONTRACT CALL DEBUGGING =====");
    console.log("🔍 verifyPasswordStrength called with args:", args);
    console.log("🔍 args type:", typeof args);
    console.log("🔍 args keys:", Object.keys(args || {}));
    
    if (args.proof) {
      console.log("🔍 args.proof type:", typeof args.proof);
      console.log("🔍 args.proof length:", args.proof?.length);
      console.log("🔍 args.proof constructor:", args.proof?.constructor?.name);
    }
    
    if (args.publicInputs) {
      console.log("🔍 args.publicInputs type:", typeof args.publicInputs);
      console.log("🔍 args.publicInputs length:", args.publicInputs?.length);
      console.log("🔍 args.publicInputs isArray:", Array.isArray(args.publicInputs));
      console.log("🔍 args.publicInputs[0]:", args.publicInputs?.[0]);
      console.log("🔍 args.publicInputs[0] type:", typeof args.publicInputs?.[0]);
    }
    
    if (args.user) {
      console.log("🔍 args.user:", args.user);
      console.log("🔍 args.user type:", typeof args.user);
    }
    
    console.log("🔍 ===== END CONTRACT CALL DEBUGGING =====");
    
    try {
      console.log("🔍 About to call writeContract with:", {
        address: PASSWORD_VERIFIER_ADDRESS,
        functionName: 'verifyPasswordStrength',
        args: [args.proof, args.publicInputs, args.user]
      });
      
      writeContract({
        address: PASSWORD_VERIFIER_ADDRESS as `0x${string}`,
        abi: PASSWORD_VERIFIER_ABI,
        functionName: 'verifyPasswordStrength',
        args: [args.proof, args.publicInputs, args.user]
      });
      
      console.log("🔍 writeContract called successfully");
    } catch (error) {
      console.error("🔍 Error in writeContract call:", error);
      throw error;
    }
  };

  return {
    verifyPasswordStrength,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash: data
  };
}

/**
 * Hook to commit vault item with password verification
 */
export function useCommitVaultItem() {
  const { data, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
  });

  const commitVaultItem = (args: any) => {
    writeContract({
      address: PASSWORD_VERIFIER_ADDRESS as `0x${string}`,
      abi: PASSWORD_VERIFIER_ABI,
      functionName: 'commitVaultItem',
      args: [args.itemIdHash, args.itemCommitment, args.itemCipherCID, args.proof, args.publicInputs]
    });
  };

  return {
    commitVaultItem,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash: data
  };
}

/**
 * Hook to check if a proof has been verified
 */
export function useIsProofVerified(proofHash: string) {
  const { data, isLoading, error } = useReadContract({
    address: PASSWORD_VERIFIER_ADDRESS as `0x${string}`,
    abi: PASSWORD_VERIFIER_ABI,
    functionName: 'isProofVerified',
    args: [proofHash as `0x${string}`],
  });

  return {
    isVerified: data,
    isLoading,
    error
  };
}

/**
 * Hook to get user proof count
 */
export function useUserProofCount(userAddress: string) {
  const { data, isLoading, error } = useReadContract({
    address: PASSWORD_VERIFIER_ADDRESS as `0x${string}`,
    abi: PASSWORD_VERIFIER_ABI,
    functionName: 'getUserProofCount',
    args: [userAddress as `0x${string}`],
  });

  return {
    proofCount: data,
    isLoading,
    error
  };
}

/**
 * Utility function to prepare proof data for on-chain verification
 */
export function prepareProofForVerification(proof: any) {
  console.log("🔍 ===== DEBUGGING PROOF STRUCTURE =====");
  console.log("🔍 Full proof object:", proof);
  console.log("🔍 proof type:", typeof proof);
  console.log("🔍 proof keys:", Object.keys(proof || {}));
  
  if (proof) {
    console.log("🔍 proof.noirProof:", proof.noirProof);
    console.log("🔍 proof.noirProof type:", typeof proof.noirProof);
    if (proof.noirProof) {
      console.log("🔍 proof.noirProof keys:", Object.keys(proof.noirProof));
      console.log("🔍 proof.noirProof length:", proof.noirProof.length);
    }
    
    console.log("🔍 proof.publicInputs:", proof.publicInputs);
    console.log("🔍 proof.publicInputs type:", typeof proof.publicInputs);
    if (proof.publicInputs) {
      console.log("🔍 proof.publicInputs length:", proof.publicInputs.length);
      console.log("🔍 proof.publicInputs isArray:", Array.isArray(proof.publicInputs));
    }
    
    console.log("🔍 proof.strength:", proof.strength);
    console.log("🔍 proof.circuitHash:", proof.circuitHash);
    console.log("🔍 proof.timestamp:", proof.timestamp);
  }
  console.log("🔍 ===== END DEBUGGING =====");
  
  // Check if proof has the expected structure
  if (!proof || !proof.noirProof) {
    throw new Error("Invalid proof structure: missing noirProof");
  }
  
  // Convert proof to bytes format expected by the contract
  // Try different possible structures
  let proofBytes;
  if (proof.noirProof.proof) {
    proofBytes = proof.noirProof.proof;
  } else if (proof.noirProof.proofBytes) {
    proofBytes = proof.noirProof.proofBytes;
  } else if (typeof proof.noirProof === 'object' && proof.noirProof.length) {
    proofBytes = proof.noirProof;
  } else {
    proofBytes = proof.noirProof;
  }
  
  // Convert Uint8Array to hex string for contract compatibility
  if (proofBytes instanceof Uint8Array) {
    proofBytes = '0x' + Array.from(proofBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Check if publicInputs exists and is an array
  if (!proof.publicInputs || !Array.isArray(proof.publicInputs)) {
    throw new Error("Invalid proof structure: missing or invalid publicInputs");
  }
  
  // Convert public inputs to bytes32 array
  const publicInputs = proof.publicInputs.map((input: any) => {
    // Handle different input formats
    let hexString: string;
    
    if (typeof input === 'string') {
      // If it's already a hex string, use it directly
      if (input.startsWith('0x')) {
        hexString = input;
      } else {
        // If it's a string without 0x, add it
        hexString = `0x${input}`;
      }
    } else {
      // If it's a number or other type, convert to hex
      hexString = `0x${input.toString(16).padStart(64, '0')}`;
    }
    
    // Ensure it's exactly 66 characters (0x + 64 hex chars)
    if (hexString.length < 66) {
      hexString = hexString + '0'.repeat(66 - hexString.length);
    } else if (hexString.length > 66) {
      hexString = hexString.substring(0, 66);
    }
    
    return hexString as `0x${string}`;
  });

  console.log("✅ Proof prepared successfully:", {
    proofBytesLength: proofBytes?.length || 'undefined',
    publicInputsCount: publicInputs.length,
    publicInputs: publicInputs
  });

  return {
    proof: proofBytes,
    publicInputs
  };
}

/**
 * Utility function to create item commitment hash
 */
export function createItemCommitment(
  itemIdHash: string,
  ipfsCid: string,
  encryptionKeyHash: string
): string {
  // Create commitment: keccak256(itemIdHash + ipfsCid + encryptionKeyHash)
  const commitment = encodePacked(
    ['bytes32', 'string', 'bytes32'],
    [
      itemIdHash as `0x${string}`,
      ipfsCid,
      encryptionKeyHash as `0x${string}`
    ]
  );
  
  return commitment;
}

/**
 * Utility function to create item ID hash
 */
export function createItemIdHash(
  salt: string,
  domain: string,
  username: string
): string {
  // Create item ID hash: keccak256(salt + domain + username)
  const itemIdHash = encodePacked(
    ['bytes32', 'string', 'string'],
    [
      salt as `0x${string}`,
      domain,
      username
    ]
  );
  
  return itemIdHash;
}
