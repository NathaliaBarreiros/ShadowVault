// Noir Integration for Password Strength Verification
// This file handles the integration between the frontend and the Noir circuit

import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';

export interface PasswordStrengthResult {
  isStrong: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  length: number;
  criteriaCount: number;
}

/**
 * Verifies password strength using the same criteria as the Noir circuit
 * This function replicates the circuit logic for local verification
 */
export function verifyPasswordStrength(password: string): PasswordStrengthResult {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+]/.test(password);
  const length = password.length;
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSymbols]
    .filter(Boolean).length;
  
  const isStrong = length >= 12 && criteriaCount >= 3;
  
  return {
    isStrong,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSymbols,
    length,
    criteriaCount
  };
}

/**
 * Converts a password string to byte array for the Noir circuit
 */
export function passwordToBytes(password: string): number[] {
  const bytes = new Array(24).fill(0);
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  for (let i = 0; i < Math.min(passwordBytes.length, 24); i++) {
    bytes[i] = passwordBytes[i];
  }
  
  return bytes;
}

/**
 * Loads the compiled Noir circuit and initializes Noir with Barretenberg backend
 */
async function initializeNoir(): Promise<{ noir: Noir; backend: UltraHonkBackend }> {
  try {
    // Load the compiled circuit JSON
    const circuitResponse = await fetch('/circuits/password_strength.json');
    const circuitJson = await circuitResponse.json();
    
    // Initialize Noir with the circuit
    const noir = new Noir(circuitJson);
    
    // Initialize Barretenberg backend with the circuit bytecode
    const backend = new UltraHonkBackend(circuitJson.bytecode);
    
    return { noir, backend };
  } catch (error) {
    console.error('Error initializing Noir with Barretenberg:', error);
    throw new Error('Failed to initialize Noir proving system');
  }
}

/**
 * Generates a real ZK proof of password strength using Noir + Barretenberg
 */
export async function generateZKProof(password: string): Promise<any> {
  try {
    // 1. Verify password strength locally first
    const strength = verifyPasswordStrength(password);
    
    if (!strength.isStrong) {
      throw new Error('Password does not meet strength criteria for ZK proof');
    }
    
    // 2. Initialize Noir with Barretenberg backend
    const { noir, backend } = await initializeNoir();
    
    // 3. Prepare the input for the circuit
    const passwordBytes = passwordToBytes(password);
    
    // 4. Execute the circuit to generate witness
    console.log('🔐 Executing Noir circuit to generate witness...');
    const { witness } = await noir.execute({ password: passwordBytes });
    console.log('✅ Witness generated successfully');
    
    // 5. Generate the real ZK proof using Barretenberg backend
    console.log('🔐 Generating real ZK proof with Barretenberg backend...');
    const proof = await backend.generateProof(witness);
    console.log('✅ Real ZK proof generated successfully');
    
    // 6. Create the complete proof object
    const proofResult = {
      password: passwordBytes,
      strength: strength,
      timestamp: new Date().toISOString(),
      circuitHash: 'noir-circuit-hash-' + Date.now(),
      noirProof: proof,
      publicInputs: proof.publicInputs,
      witness: witness
    };
    
    console.log('🔐 Real ZK Proof generated with Noir + Barretenberg:', {
      criteriaCount: strength.criteriaCount,
      length: strength.length,
      circuitHash: proofResult.circuitHash,
      publicInputs: proofResult.publicInputs,
      proofGenerated: !!proof,
      witnessGenerated: !!witness
    });
    
    return proofResult;
  } catch (error) {
    console.error('❌ Error generating real Noir ZK proof:', error);
    throw error;
  }
}

/**
 * Verifies a real ZK proof of password strength using Noir + Barretenberg
 */
export async function verifyZKProof(proof: any): Promise<boolean> {
  try {
    if (!proof || !proof.strength || !proof.noirProof) {
      return false;
    }
    
    // 1. Initialize Barretenberg backend for verification
    const circuitResponse = await fetch('/circuits/password_strength.json');
    const circuitJson = await circuitResponse.json();
    const backend = new UltraHonkBackend(circuitJson.bytecode);
    
    // 2. Verify the proof using the real Barretenberg verification system
    console.log('🔍 Verifying real ZK proof with Barretenberg backend...');
    const isValid = await backend.verifyProof(proof.noirProof);
    console.log('✅ Proof verification completed');
    
    console.log('🔍 Real Noir ZK Proof verification result:', {
      isValid,
      criteriaCount: proof.strength.criteriaCount,
      length: proof.strength.length,
      publicInputs: proof.publicInputs,
      proofVerified: isValid
    });
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying real Noir ZK proof:', error);
    return false;
  }
}

/**
 * Complete function to generate and verify ZK proof with real Noir + Barretenberg
 */
export async function generateAndVerifyZKProof(password: string): Promise<{
  proof: any;
  isValid: boolean;
  strength: PasswordStrengthResult;
}> {
  try {
    // 1. Verify strength locally
    const strength = verifyPasswordStrength(password);
    
    if (!strength.isStrong) {
      throw new Error(`Password too weak: ${strength.criteriaCount}/4 criteria, ${strength.length} chars`);
    }
    
    // 2. Generate ZK proof with real Noir + Barretenberg
    const proof = await generateZKProof(password);
    
    // 3. Verify ZK proof with real Noir + Barretenberg
    const isValid = await verifyZKProof(proof);
    
    return { proof, isValid, strength };
    
  } catch (error) {
    console.error('❌ Error in real Noir ZK proof generation/verification:', error);
    throw error;
  }
}
