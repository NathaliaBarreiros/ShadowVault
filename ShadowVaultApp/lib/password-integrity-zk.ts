import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';

export interface IntegrityProofResult {
  success: boolean;
  proof?: any;
  publicInputs?: any;
  error?: string;
}

export class PasswordIntegrityZK {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private isInitialized: boolean = false;

  constructor() {
    console.log('🔧 PasswordIntegrityZK constructor called');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔧 Initializing PasswordIntegrityZK...');
      
      // Step 1: Load the circuit dynamically
      console.log('📁 Step 1: Loading circuit JSON from file system...');
      console.log('📂 Attempting to load: ./password_integrity.json');
      
      const circuitModule = await import('./password_integrity_final.json');
      const circuit = circuitModule.default || circuitModule;
      
      console.log('✅ Circuit JSON loaded successfully');
      console.log('📊 Circuit info:', {
        hasDefault: !!circuitModule.default,
        hasCircuit: !!circuit,
        circuitKeys: Object.keys(circuit || {}).slice(0, 5)
      });
      
      // Step 2: Initialize Noir and Backend
      console.log('🔧 Step 2: Initializing Noir instance...');
      this.noir = new Noir(circuit as any); // Type cast to avoid compatibility issues
      console.log('✅ Noir instance created');
      
      console.log('🔧 Step 3: Initializing UltraHonkBackend...');
      console.log('📄 Bytecode length:', circuit.bytecode?.length || 'undefined');
      this.backend = new UltraHonkBackend(circuit.bytecode);
      console.log('✅ UltraHonkBackend created');
      
      this.isInitialized = true;
      console.log('✅ PasswordIntegrityZK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PasswordIntegrityZK:', error);
      throw new Error(`Failed to initialize ZK system: ${error}`);
    }
  }

  async generateIntegrityProof(
    decryptedPassword: string,
    storedHash: string
  ): Promise<IntegrityProofResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔐 Generating integrity proof for password...');
      console.log('📝 Decrypted password:', decryptedPassword);
      console.log('🏷️ Stored hash:', storedHash);

      // Convert password to bytes (32 bytes, pad with zeros if needed)
      const passwordBytes = this.stringToBytes32(decryptedPassword);
      
      // Convert stored hash from hex string to bytes for the circuit
      const storedHashBytes = this.hexToBytes(storedHash);

      console.log('🔢 Password bytes:', passwordBytes);
      console.log('🔢 Stored hash bytes:', storedHashBytes);

      const inputs = {
        password_plaintext: passwordBytes,
        stored_hash: storedHashBytes,
      };

      console.log('📥 Circuit inputs:', inputs);

      // Following the tutorial pattern: execute to get witness, then generate proof
      console.log('🔧 Step 4: Executing circuit to generate witness...');
      if (!this.noir) throw new Error('Noir not initialized');
      
      console.log('📊 Circuit execution inputs:', {
        passwordLength: inputs.password_plaintext.length,
        hashLength: inputs.stored_hash.length
      });
      
      console.log('🔧 Step 4.1: About to call noir.execute...');
      console.log('📋 Input arrays are identical:', JSON.stringify(inputs.password_plaintext) === JSON.stringify(inputs.stored_hash));
      
      let witness;
      try {
        const result = await this.noir.execute(inputs);
        witness = result.witness;
        console.log('✅ Witness generated successfully! 🎉');
        console.log('📈 Witness length:', witness.length);
      } catch (executeError) {
        console.error('❌ Circuit execution failed:', executeError);
        throw new Error(`Circuit execution failed: ${executeError}`);
      }

      console.log('🔧 Step 5: Generating ZK proof from witness...');
      if (!this.backend) throw new Error('Backend not initialized');
      
      console.log('🔧 Step 5.1: About to call backend.generateProof...');
      let proof;
      try {
        proof = await this.backend.generateProof(witness);
        console.log('✅ ZK Proof generated successfully! 🎉🎉🎉');
      } catch (proofError) {
        console.error('❌ Proof generation failed:', proofError);
        throw new Error(`Proof generation failed: ${proofError}`);
      }
      console.log('🔍 Proof details:', {
        proofSize: proof.proof.length,
        publicInputsCount: proof.publicInputs?.length || 0
      });

      return {
        success: true,
        proof: proof.proof,
        publicInputs: proof.publicInputs || []
      };
    } catch (error) {
      console.error('❌ ZK Proof generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async verifyProof(proof: any, publicInputs?: any): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔍 Verifying proof...');
      console.log('📊 Proof length:', proof?.length || 0);
      
      // Following the tutorial pattern: verifyProof with the proof object
      if (!this.backend) throw new Error('Backend not initialized');
      const isValid = await this.backend.verifyProof(proof);
      
      console.log('✅ Proof verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('❌ ZK Proof verification failed:', error);
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
    // Remove '0x' prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = [];
    
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    
    // Pad to 32 bytes if needed
    while (bytes.length < 32) {
      bytes.push(0);
    }
    
    return bytes.slice(0, 32);
  }

  // Utility method to test the circuit with sample data
  async testCircuit(): Promise<boolean> {
    try {
      console.log('🧪 Testing circuit with sample data...');
      
      const testPassword = "testpassword";
      const testPasswordBytes = this.stringToBytes32(testPassword);
      
      // For the test, we'll use the password bytes as the "stored hash"
      // since our circuit currently does assert(password_plaintext == stored_hash)
      const testHash = Array.from(testPasswordBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('🔑 Test password:', testPassword);
      console.log('🏷️ Test hash (from password bytes):', testHash);
      
      const result = await this.generateIntegrityProof(testPassword, testHash);
      
      if (result.success) {
        console.log('✅ Circuit test passed');
        
        // Also test verification
        const verifyResult = await this.verifyProof(result.proof, result.publicInputs);
        if (verifyResult) {
          console.log('✅ Proof verification test passed');
          return true;
        } else {
          console.log('❌ Proof verification test failed');
          return false;
        }
      } else {
        console.log('❌ Circuit test failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Circuit test error:', error);
      return false;
    }
  }
}