# ShadowVault — Privacy-First Password Manager (Zircuit + Envio + Nora)

## 1) Project Overview

**One-liner:** A Next.js web application that stores credentials as encrypted data, anchors tamper-proof commitments on-chain, and serves verifiable, queryable state via an indexer — without ever exposing plaintext secrets.

**Why it matters:** Traditional managers require trust in centralized services. ShadowVault proves integrity and recency of your encrypted vault using **on-chain commitments** and **Envio-indexed events**, keeping secrets private end-to-end.

**MVP Scope (hackathon):**
- Local encryption (HKDF + AES-256-GCM).
- On-chain anchoring of **Merkle roots** and content pointers on **Zircuit testnet**.
- Optional ciphertext backup to **IPFS** (per-item or bundle CID).
- Event indexing with **Envio**; UI queries Envio on demand.
- Contracts authored & deployed using **Nora Agent**.
- No plaintext usernames/passwords on-chain or in the indexer.

---

## 2) Architecture

```
Next.js Web App (React/TypeScript)
  ├─ Crypto: WebCrypto (HKDF KDF, AES-256-GCM)
  ├─ Local Vault: IndexedDB + Export/Import (encrypted JSON/CSV)
  ├─ Optional Backup: IPFS (ciphertext only, returns CID)
  ├─ Identity/Wallet: Privy (Embedded Wallets)
  └─ RPC: Zircuit testnet

Smart Contracts (Zircuit, Nora-authored)
  ├─ VaultRegistry (events only; minimal storage)
  ├─ Events: VaultVersionAnchored, VaultItemCommitted, VaultItemRevoked
  └─ latestVersion(owner) view

Indexing (Envio)
  ├─ Ingests contract events
  ├─ Derives queryable tables (users, versions, items)
  └─ HTTP/GraphQL API for UI + auditors (no secrets)
```

**Key Patterns**
- **Commit–Reveal (without reveal):** Only salted hashes/Merkle roots + CIDs on-chain.
- **Index-then-verify:** Query Envio → fetch ciphertext (IPFS) → recompute + compare local root.

---

## 3) Data & Crypto

**Encrypted Record (client-side; never on-chain/indexer):**
```ts
interface VaultItemCipher {
  v: number;                    // schema version
  site: string;                 // service name (plaintext)
  username: string;             // username (plaintext) 
  cipher: string;               // base64 AES-GCM ciphertext (password encriptado)
  iv: string;                   // 12-byte IV (base64)
  encryptionKeyHash: string;    // SHA-256 de la clave derivada (para verificación)
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
  user: string;                 // user address
  itemIdHash: string;           // keccak256(salt + domain + username)
  itemCommitment: string;       // keccak256(itemIdHash + ipfsCid + encryptionKeyHash)
  ipfsCid: string;             // IPFS CID of the VaultItemCipher
  encryptionKeyHash: string;    // SHA-256 of encryption key
  timestamp: string;           // ISO timestamp
}
```

**Keys**
- **Encryption Key:** HKDF(signature, salt, info) where signature comes from wallet signing a deterministic message.
- **Salt:** SHA-256(userAddress + 'vault-encryption-fixed').
- **Info:** 'sv:hkdf:v1' for domain separation.
- **IV:** Random 12-byte initialization vector for AES-GCM.

**Key Derivation Flow**
1. User signs message: "Generate encryption key for ShadowVault session"
2. Signature is hashed with SHA-256 to create IKM (Input Keying Material)
3. Salt is derived from user address + domain string
4. HKDF derives 256-bit encryption key using IKM, salt, and info
5. Key is used for AES-256-GCM encryption of password

**Commitments (on-chain)**
- `itemIdHash = keccak256( commitmentSalt + domain + username )`
- `itemCommitment = keccak256( itemIdHash + ipfsCid + encryptionKeyHash )`
- `vaultRoot = merkleRoot( itemCommitment[] )`

**Implementation Details**
- **Commitment Salt**: 32-byte random salt generated for each item
- **IPFS Upload**: VaultItemCipher uploaded to IPFS using ipfs-http-client or Pinata API
- **Smart Contract**: ZircuitObject submitted to VaultRegistry contract on Zircuit testnet

**Privacy levels**
1) Opaque labels; 2) Label-only (hashed username); 3) Local convenience (plaintext labels stay local).

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
- Keep state tiny: `latestVersion[owner]` mapping only.
- Everything else = **events** (perfect for **Envio**).

**Network**
- **Zircuit testnet** only (no cross-chain in MVP).

---

## 5) Envio Indexing

**Entities**
- **User**: `{ address }`
- **VaultVersion**: `{ owner, version, vaultRoot, bundleCID, timestamp }`
- **VaultItem**: `{ owner, version, itemIdHash, itemCommitment, itemCipherCID, revoked? }`

**Queries (conceptual)**
- Latest version: `/vaultVersions?owner=0x..&sort=desc&limit=1`
- Items of a version: `/vaultItems?owner=0x..&version=N`
- Find item: `/vaultItems?itemIdHash=0x..`

> Actual endpoints depend on your Envio processor configuration.

---

## 6) End-to-End Flows

**Add / Update**
1) User logs in via **Privy** with embedded wallet.
2) User creates new password entry in web UI.
3) Client derives encryption key from wallet signature using HKDF.
4) Password is encrypted with AES-256-GCM using derived key + random IV.
5) **VaultItemCipher** is created with encrypted password and metadata.
6) **VaultItemCipher** is uploaded to **IPFS** → get CID.
7) **ZircuitObject** is created with commitments and hashes (no sensitive data).
8) **ZircuitObject** is submitted to smart contract → emits `VaultItemCommitted`.
9) **Envio** indexes; UI refreshes by querying Envio.

**Verify (auditor/self)**
1) Query Envio → get `vaultRoot` + `bundleCID`.
2) Fetch bundle from IPFS → recompute root.
3) Compare roots; check monotonic version timestamps.

**Export/Import**
- Export encrypted JSON/CSV (no keys).
- Import → validate → re-derive commitments → anchor as new version.

**Recovery (optional demo)**
- Encryption key can be re-derived from wallet signature at any time.

---

## 7) Security & Threat Model (MVP)

**Protects against**
- Server/indexer compromise (no plaintext off-device).
- On-chain scraping (only salted hashes + CIDs).
- Rollback (monotonic version anchors).

**Out of scope (MVP)**
- Device compromise, advanced phishing/side-channels, formal proofs.

---

## 8) Getting Started

### 8.1 Prerequisites
- Node.js 18+, npm/yarn
- Hardhat or Foundry (for local testing)
- **Nora Agent** access (author/deploy contracts)
- **Envio** account & processor config
- **Privy** app (client SDK)
- IPFS client (e.g., `ipfs-http-client` or Pinata key)
- Git

### 8.2 Environment
Create `.env` with:
```
ZIRCUIT_RPC_URL=...
WALLET_PRIVATE_KEY=...
PRIVY_APP_ID=...
IPFS_API_URL=...           # or PINATA_JWT=...
ENVIO_API_URL=...          # your Envio query endpoint
```
*(Never commit secrets.)*

### 8.3 Local Dev
```bash
# install deps
cd ShadowVaultApp
npm install

# run the web app
npm run dev
```

**Current Implementation Status**
- ✅ **Key Derivation**: HKDF with wallet signature
- ✅ **AES-GCM Encryption**: Password encryption with random IV
- ✅ **VaultItemCipher**: Complete encrypted structure
- ✅ **ZircuitObject**: On-chain data structure (no sensitive content)
- ✅ **IPFS Examples**: Upload examples with ipfs-http-client and Pinata API
- ✅ **Smart Contract Examples**: Wagmi integration examples
- 🔄 **Next Steps**: IPFS upload implementation, smart contract deployment

### 8.4 Deploy (Testnet)
- Author/spec contracts in Nora → generate Solidity + tests.  
- Deploy with Nora’s workflow or with Hardhat scripts to **Zircuit testnet**.  
- Publish ABIs for the extension & Envio processor mapping.

### 8.5 Configure Envio
- Map `VaultVersionAnchored`, `VaultItemCommitted`, `VaultItemRevoked` → entities.  
- Deploy processor; note `ENVIO_API_URL` for the UI.

### 8.6 Demo Script
- Create 3 mock credentials → encrypt & bundle to IPFS.  
- Anchor version; observe Nora tx on Zircuit.  
- Query Envio for latest version; fetch bundle; recompute root locally.  
- Export → wipe local → import → re-anchor.  
- Show that no plaintext exists on-chain or in Envio.

---

## 9) Roadmap (post-hackathon)
- Optional **Noir** circuits for password strength proofs or set-membership (breached lists).  
- Team/shared vaults with per-item re-encryption.  
- Threshold recovery; hardware key support.  
- WALRUS or other decentralized storage backends.  
- Formal audits; mobile builds.

---

## 10) License
MIT — see `LICENSE`.

---

## 11) Acknowledgements
- **Nora Agent** (contracts from spec)  
- **Envio** (indexing & query)  
- **Zircuit** (L2 for fast, cheap verification)  
- **Privy** (identity/wallet)  
- **IPFS** (ciphertext backups)
