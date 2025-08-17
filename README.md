# ShadowVault — Privacy-First Password Manager (Zircuit + Walrus + Privy + Nora)

## 1) Project Overview

**One-liner:** A Next.js web application that stores credentials as encrypted data, anchors tamper-proof commitments on-chain, and proves correctness with zero-knowledge proofs — without ever exposing plaintext secrets.

**Why it matters:** Traditional managers require trust in centralized services. ShadowVault proves integrity and recency of your encrypted vault using **on-chain commitments**, **Noir-generated ZK proofs**, and decentralized storage via **Walrus**, keeping secrets private end-to-end.

**MVP Scope (hackathon):**
- Local encryption (HKDF + AES-256-GCM).
- Zero-knowledge proofs (Noir circuits) for encryption correctness + password policy compliance.
- On-chain anchoring of **Merkle roots** and Walrus CIDs on **Zircuit testnet**.
- Optional ciphertext backup to **Walrus** (per-item or bundle CID).
- Contracts authored, tested, and deployed entirely using **Nora Agent**.
- No plaintext usernames/passwords ever leave the device.

---

## 2) Architecture

```
Next.js Web App (React/TypeScript)
  ├─ Crypto: WebCrypto (HKDF KDF, AES-256-GCM) + Noir ZKPs
  ├─ Local Vault: IndexedDB + Export/Import (encrypted JSON/CSV)
  ├─ Backup: Walrus (ciphertext + ZK proofs only, returns CID)
  ├─ Identity/Wallet: Privy (Embedded Wallets)
  └─ RPC: Zircuit testnet

Smart Contracts (Zircuit, Nora-authored)
  ├─ VaultRegistry (events only; minimal storage)
  ├─ Events: VaultVersionAnchored, VaultItemCommitted, VaultItemRevoked
  └─ latestVersion(owner) view
```

**Key Patterns**
- **Commit–Reveal (without reveal):** Only salted hashes/Merkle roots + CIDs on-chain.
- **Verify loop:** Fetch ciphertext + proofs from Walrus → recompute Merkle root + validate ZKP → compare to root anchored on Zircuit.

---

## 3) Data & Crypto

**Encrypted Record (client-side; never on-chain):**
```ts
interface VaultItemCipher {
  v: number;                    // schema version
  site: string;                 // service name (plaintext optional)
  username: string;             // username (plaintext optional) 
  cipher: string;               // base64 AES-GCM ciphertext of password
  iv: string;                   // 12-byte IV (base64)
  proof: string;                 // Noir ZKP proving encryption correctness + policy
  meta: {
    url?: string;
    notes?: string;
    category: string;
    network: string;
    timestamp: string;
  }
}

// On-chain data (no sensitive content):
interface ZircuitObject {
  owner: string;                 // user address
  itemIdHash: string;            // keccak256(salt + domain + usernameHint)
  itemCommitment: string;        // keccak256(itemIdHash + walrusCid + encryptionKeyHash)
  walrusCid: string;             // Walrus CID of VaultItemCipher bundle
  timestamp: string;
}
```

**Keys**
- **Encryption Key:** Derived via HKDF(signature, salt, info). Signature comes from wallet signing a deterministic message.  
- **Salt:** SHA-256(userAddress + “vault-encryption-fixed”).  
- **Info:** “sv:hkdf:v1” for domain separation.  
- **IV:** Random 12-byte initialization vector.  

**Commitments (on-chain)**
- `itemIdHash = keccak256( salt + domain + usernameHint )`  
- `itemCommitment = keccak256( itemIdHash + walrusCid + encryptionKeyHash )`  
- `vaultRoot = merkleRoot( itemCommitments[] )`  

---

## 3.1 Zero-Knowledge Proofs in ShadowVault

ShadowVault uses **Noir circuits** to generate proofs of correct cryptographic operations without revealing secrets:  

- **Password strength:** Prove that a password meets policy (e.g., ≥12 chars, ≥3 character classes).  
- **Encryption correctness:** Prove ciphertext corresponds to committed plaintext under the derived DEK.  
- **Decryption integrity:** Prove decryption of a ciphertext yields a valid committed result.  

Proof objects are stored with ciphertext in Walrus and referenced in commitments. Verification checks both Merkle root match and ZKP validity against the on-chain anchor.

---

## 4) Smart Contracts (Nora)

**Interface (illustrative):**
```solidity
interface IShadowVaultRegistry {
  event VaultVersionAnchored(address indexed owner, uint256 indexed version, bytes32 vaultRoot, string bundleCID, uint256 timestamp);
  event VaultItemCommitted(address indexed owner, uint256 indexed version, bytes32 itemIdHash, bytes32 itemCommitment, string itemCipherCID);
  event VaultItemRevoked(address indexed owner, uint256 indexed version, bytes32 itemIdHash);
  function latestVersion(address owner) external view returns (uint256);
}
```

**Storage philosophy**
- Minimal on-chain storage: only `latestVersion[owner]`.  
- All other state = emitted events, optimized for Zircuit’s event logs.  
- Authorship/deployment handled fully via **Nora Agent**, which produced Solidity from specs, scaffolded unit tests, and deployed contracts.  
- Nora also supported front-end encryption scaffolding and key-handling utilities, accelerating build time.  

**Network**
- **Zircuit testnet** only (zk-friendly L2, fast finality).  

---

## 5) End-to-End Flows

**Add / Update**
1. User edits/creates item → encrypt locally with DEK.  
2. Generate Noir ZKP (strength + correctness).  
3. Push ciphertext + proof bundle to **Walrus** → get CID.  
4. Compute commitments and vaultRoot.  
5. Anchor via contract → emits `VaultVersionAnchored` (+ optional per-item events).  

**Verify (auditor/self)**  
1. Fetch vaultRoot + CID from contract event.  
2. Fetch bundle from Walrus.  
3. Recompute Merkle root + validate ZKP locally.  
4. Compare against anchored root.  

**Export/Import**
- Export encrypted JSON/CSV (no keys).  
- Import → re-derive commitments, validate proofs, anchor as new version.  

**Recovery (optional demo)**  
- Wrap MK with Lit PKP or Privy-gated capsule; unwrap locally to restore DEK.  

---

## 6) Security & Threat Model (MVP)

**Protects against**  
- Centralized server compromise (Walrus is decentralized).  
- On-chain scraping (only salted hashes + commitments).  
- Rollback attacks (monotonic version anchors + timestamps).  

**Out of scope (MVP)**  
- Device compromise or phishing.  
- Multi-user vaults.  
- Formal audits (post-hackathon).  

---

## 7) Getting Started

### Prerequisites
- Node.js 18+, npm/yarn  
- Hardhat or Foundry (for local testing)  
- **Nora Agent** account (for contract authoring/deployment)  
- **Privy** app (embedded wallet)  
- Walrus client (`walrus-http-client`)  
- Git  

### Environment
```bash
ZIRCUIT_RPC_URL=...
WALLET_PRIVATE_KEY=...
PRIVY_APP_ID=...
WALRUS_API_URL=...
```

### Local Dev
```bash
npm install
npx hardhat compile
npx hardhat test
npm run dev
```

### Deploy (Testnet)
- Author contracts in natural language → use **Nora** to generate Solidity + tests.  
- Deploy via Nora workflow or Hardhat scripts.  
- Publish ABIs for frontend.  

### Demo Script
- Create 3 mock credentials → encrypt + bundle to Walrus.  
- Anchor version → observe Nora tx on Zircuit.  
- Fetch bundle → recompute Merkle root + validate ZKP.  
- Export → wipe local → import → re-anchor.  
- Confirm no plaintext leaves device.  

---

## 8) Roadmap (post-hackathon)

- Multi-device recovery (threshold cryptography).  
- Team/shared vaults with per-item re-encryption.  
- Noir circuits for breach-set membership proofs.  
- Hardware key support.  
- Formal audits + mobile builds.  

---

## 9) License
MIT — see `LICENSE`.  

---

## 10) Acknowledgements
- **Nora Agent** (authored/deployed contracts + front-end encryption scaffolding)  
- **Zircuit** (L2 anchoring)  
- **Walrus** (decentralized ciphertext + proof storage)  
- **Privy** (wallet/identity)  
