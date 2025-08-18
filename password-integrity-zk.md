# Password Integrity ZK Verification Implementation

## Overview

This document outlines the implementation of **Circuit 2: Password Integrity Verification** using Zero-Knowledge proofs with Noir. This circuit verifies that a decrypted password matches the original stored hash without revealing the plaintext password on-chain.

## Current Data Flow (Already Working)

Based on the console output, we already have:

### From Walrus:
- **Cipher**: `6/tIx9233r4jfxDLataBcmXDHcZvsC+LDtQ4p2Drt+zqpR5BvWx0yg==`
- **IV**: `GXsKJKn/910035qm`
- **Encryption Key**: `eC7GCyt3iR0h+vvzpiLI5rWcdca4IWMBZVxrL9ehGBs=`
- **Stored Hash**: `176196dfd264fcd798d339993aeb8783dfe625e3e72d7cdeb379369f513683d`

### From Zircuit:
- **Contract Address**: `0x577dc63554BF7531f75AF602896209fFe87d51E8`
- **Network Chain ID**: `48898`
- **Stored Hash**: `176196dfd264fcd798d339993aeb8783dfe625e3e72d7cdeb379369f513683d0`

## Implementation Plan

### 1. Noir Circuit (Circuit 2: Password Integrity)

**File**: `noir-circuits/password_integrity/src/main.nr`

```noir
use dep::std;

fn main(
    // Private inputs (not revealed on-chain)
    password_plaintext: [u8; 32],  // Decrypted password bytes
    
    // Public inputs (visible on-chain)
    stored_hash: [u8; 32],         // Hash from Zircuit contract
) {
    // 1. Compute hash of the decrypted password
    let computed_hash = std::hash::sha256(password_plaintext);
    
    // 2. Verify the computed hash matches the stored hash
    assert(computed_hash == stored_hash);
}
```

**Purpose**: 
- Takes the decrypted password as private input
- Takes the stored hash from Zircuit as public input
- Computes SHA-256 of the password
- Verifies the computed hash matches the stored hash
- If they match: proof is valid (password decrypted correctly)
- If they don't match: proof fails (integrity compromised)

### 2. JavaScript Implementation with NoirJS

**File**: `ShadowVaultApp/lib/password-integrity-zk.ts`

```typescript
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';

export class PasswordIntegrityZK {
  private noir: Noir;
  private backend: BarretenbergBackend;

  constructor() {
    this.backend = new BarretenbergBackend();
    this.noir = new Noir(this.backend);
  }

  async initialize() {
    // Load the compiled circuit
    const circuit = await import('../noir-circuits/password_integrity/target/password_integrity.json');
    await this.noir.init(circuit);
  }

  async generateIntegrityProof(
    decryptedPassword: string,
    storedHash: string
  ) {
    // Convert password to bytes (32 bytes, pad with zeros if needed)
    const passwordBytes = this.stringToBytes32(decryptedPassword);
    
    // Convert stored hash from hex string to bytes
    const storedHashBytes = this.hexToBytes(storedHash);

    const inputs = {
      password_plaintext: passwordBytes,
      stored_hash: storedHashBytes,
    };

    try {
      // Generate the proof
      const proof = await this.noir.generateProof(inputs);
      
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs,
        success: true
      };
    } catch (error) {
      console.error('ZK Proof generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyProof(proof: any, publicInputs: any) {
    try {
      const isValid = await this.noir.verifyProof(proof, publicInputs);
      return isValid;
    } catch (error) {
      console.error('ZK Proof verification failed:', error);
      return false;
    }
  }

  private stringToBytes32(str: string): number[] {
    const bytes = new Array(32).fill(0);
    const encoder = new TextEncoder();
    const strBytes = encoder.encode(str);
    
    for (let i = 0; i < Math.min(strBytes.length, 32); i++) {
      bytes[i] = strBytes[i];
    }
    
    return bytes;
  }

  private hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }
}
```

### 3. Integration with Existing Vault Recovery Flow

**File**: `ShadowVaultApp/lib/vault-storage.ts` (modify existing)

```typescript
import { PasswordIntegrityZK } from './password-integrity-zk';

export class VaultStorage {
  private integrityZK: PasswordIntegrityZK;

  constructor() {
    this.integrityZK = new PasswordIntegrityZK();
  }

  async recoverPasswordWithIntegrityVerification(
    vaultEntry: any, // Entry from Walrus
    zircuitData: any // Data from Zircuit
  ) {
    try {
      // 1. Initialize ZK system
      await this.integrityZK.initialize();

      // 2. Decrypt password (existing functionality)
      const decryptedPassword = await this.decryptPassword(
        vaultEntry.cipher,
        vaultEntry.iv,
        vaultEntry.encryptionKey
      );

      // 3. Generate ZK integrity proof
      const integrityResult = await this.integrityZK.generateIntegrityProof(
        decryptedPassword,
        zircuitData.storedHash
      );

      if (!integrityResult.success) {
        throw new Error(`Integrity verification failed: ${integrityResult.error}`);
      }

      // 4. Verify the proof locally (optional, for extra security)
      const isProofValid = await this.integrityZK.verifyProof(
        integrityResult.proof,
        integrityResult.publicInputs
      );

      if (!isProofValid) {
        throw new Error('ZK proof verification failed');
      }

      // 5. Return the decrypted password with integrity confirmation
      return {
        password: decryptedPassword,
        integrityVerified: true,
        proof: integrityResult.proof,
        publicInputs: integrityResult.publicInputs
      };

    } catch (error) {
      console.error('Password recovery with integrity verification failed:', error);
      throw error;
    }
  }

  // ... existing methods ...
}
```

### 4. UI Integration

**File**: `ShadowVaultApp/app/vault/page.tsx` (modify existing)

```typescript
// Add to existing vault page
const handlePasswordRecoveryWithIntegrity = async (entry: any) => {
  try {
    setLoading(true);
    
    // Get Zircuit data (already implemented)
    const zircuitData = await getZircuitData(entry.id);
    
    // Recover password with integrity verification
    const result = await vaultStorage.recoverPasswordWithIntegrityVerification(
      entry,
      zircuitData
    );

    if (result.integrityVerified) {
      // Show password with integrity badge
      setRecoveredPassword(result.password);
      setIntegrityStatus('verified');
      toast.success('Password recovered and integrity verified!');
    } else {
      setIntegrityStatus('failed');
      toast.error('Password integrity verification failed');
    }

  } catch (error) {
    console.error('Recovery failed:', error);
    toast.error('Password recovery failed');
  } finally {
    setLoading(false);
  }
};
```

### 5. Smart Contract Integration (Optional)

**File**: `ShadowVaultContracts/contracts/PasswordIntegrityVerifier.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@noir-lang/contracts/verifier.sol";

contract PasswordIntegrityVerifier {
    Verifier public verifier;
    
    event IntegrityVerified(
        address indexed user,
        bytes32 indexed storedHash,
        bool verified
    );

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
    }

    function verifyPasswordIntegrity(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (bool) {
        try verifier.verify(proof, publicInputs) {
            emit IntegrityVerified(
                msg.sender,
                publicInputs[0], // stored_hash
                true
            );
            return true;
        } catch {
            emit IntegrityVerified(
                msg.sender,
                publicInputs[0],
                false
            );
            return false;
        }
    }
}
```

## Implementation Steps

### Phase 1: Circuit Development
1. Create `noir-circuits/password_integrity/` directory
2. Write `src/main.nr` circuit
3. Configure `Nargo.toml`
4. Compile circuit: `nargo compile`
5. Generate verifier: `nargo codegen-verifier`

### Phase 2: JavaScript Integration
1. Create `password-integrity-zk.ts` class
2. Integrate with existing `vault-storage.ts`
3. Add UI components for integrity verification
4. Test with existing Walrus/Zircuit data

### Phase 3: Smart Contract (Optional)
1. Deploy verifier contract to Zircuit
2. Deploy `PasswordIntegrityVerifier.sol`
3. Integrate on-chain verification

### Phase 4: Testing & Validation
1. Test with existing password entries
2. Verify proof generation and verification
3. Test error cases (tampered data)
4. Performance testing

## Key Benefits

1. **Privacy**: Password never leaves client device
2. **Integrity**: Mathematical proof that decryption was correct
3. **Trustless**: No reliance on centralized servers
4. **Auditable**: Proofs can be verified by anyone
5. **Efficient**: Low gas costs in Zircuit zk-rollup

## Troubleshooting Previous Issues

Based on the previous password strength verifier issues:

1. **Circuit Compilation**: Ensure proper Noir version compatibility
2. **Verifier Generation**: Use correct `nargo codegen-verifier` command
3. **Contract Deployment**: Verify correct network and contract addresses
4. **Proof Generation**: Handle large inputs properly (32-byte arrays)
5. **Error Handling**: Implement proper error catching and user feedback

## Next Steps

1. Start with Phase 1 (Circuit Development)
2. Test circuit compilation and verification
3. Integrate with existing JavaScript codebase
4. Test with real Walrus/Zircuit data
5. Deploy and test on-chain verification (optional)
