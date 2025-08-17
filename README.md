# ShadowVault — Privacy-First Password Manager (Zircuit + Envio + Nora)

## 1) Project Overview

**One-liner:** A Next.js web application that stores credentials as encrypted data, anchors tamper-proof commitments on-chain, and serves verifiable, queryable state via an indexer — without ever exposing plaintext secrets.

**Why it matters:** Traditional managers require trust in centralized services. ShadowVault proves integrity and recency of your encrypted vault using **on-chain commitments** and **Envio-indexed events**, keeping secrets private end-to-end.

**MVP Scope (hackathon):**
- Local encryption (HKDF + AES-256-GCM).
- On-chain anchoring of **Merkle roots** and content pointers on **Zircuit testnet**.
- Optional ciphertext backup to **Walrus** (per-item or bundle CID).
- Event indexing with **Envio**; UI queries Envio on demand.
- Contracts authored & deployed using **Nora Agent**.
- No plaintext usernames/passwords on-chain or in the indexer.

---

## 2) Architecture

```
Next.js Web App (React/TypeScript)
  ├─ Crypto: WebCrypto (HKDF KDF, AES-256-GCM)
  ├─ Local Vault: IndexedDB + Export/Import (encrypted JSON/CSV)
  ├─ Optional Backup: Walrus (ciphertext only, returns CID)
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
- **Index-then-verify:** Query Envio → fetch ciphertext (Walrus) → recompute + compare local root.

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
  itemCommitment: string;       // keccak256(itemIdHash + walrusCid + encryptionKeyHash)
  walrusCid: string;             // Walrus CID of the VaultItemCipher
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
- `itemCommitment = keccak256( itemIdHash + walrusCid + encryptionKeyHash )`
- `vaultRoot = merkleRoot( itemCommitment[] )`

**Implementation Details**
- **Commitment Salt**: 32-byte random salt generated for each item
- **Walrus Upload**: VaultItemCipher uploaded to Walrus using walrus-http-client or Pinata API
- **Smart Contract**: ZircuitObject submitted to VaultRegistry contract on Zircuit testnet

**Privacy levels**
1) Opaque labels; 2) Label-only (hashed username); 3) Local convenience (plaintext labels stay local).

---

## 3.1 Zero-Knowledge Proofs in ShadowVault

A key differentiator of ShadowVault is its use of **Zero-Knowledge Proofs (ZKPs)** to prove correct cryptographic operations without revealing secrets.

- **Password generation policies:** Users can prove that a generated or chosen password meets complexity rules (e.g., ≥12 chars, ≥3 character classes) without exposing the password itself.
- **Encryption correctness:** The extension can prove that a ciphertext corresponds to a committed plaintext under a given key, without revealing the plaintext or key.
- **Decryption integrity:** Similarly, users can prove that decryption of a ciphertext yields a valid result consistent with prior commitments, without revealing the actual decrypted value.

This ensures that password strength and encryption/decryption correctness are **publicly verifiable on-chain** (via Zircuit) while the underlying secrets remain completely private.

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

### Role and Value Proposition

Envio serves as a high-performance indexing layer that reads events from the `ShadowVault` smart contract and transforms them into a queryable GraphQL API. Its role is critical for both performance and security:

-   **Performance:** It provides a fast, off-chain API for fetching lists of vault entries. This avoids costly and slow direct contract calls (e.g., iterating through arrays in storage), leading to a snappy user experience.
-   **Cost-Effectiveness:** Reading data from the Envio API is free for the end-user, whereas querying data directly from the blockchain can incur gas fees or RPC provider costs.
-   **Preservation of Privacy:** The indexer is configured to only handle non-sensitive metadata emitted in events. No encrypted passwords or private user data ever pass through or are stored by Envio, aligning with the project's privacy-first principles.


---

## 6) End-to-End Flows

**Add / Update**
1) User edits/creates item → encrypt locally.  
2) Compute `itemIdHash`, `itemCommitment`.  
3) Push ciphertext(s) to **Walrus decentralized nodes** → get CID(s).  
4) Anchor via contract → emits `VaultVersionAnchored` (+ optional per-item events).  
5) **Envio** indexes; UI refreshes by querying Envio.

**Verify (auditor/self)**
1) Query Envio → get `vaultRoot` + `bundleCID`.  
2) Fetch bundle from Walrus → recompute root.  
3) Compare roots; check monotonic version timestamps.

**Export/Import**
- Export encrypted JSON/CSV (no keys).  
- Import → validate → re-derive commitments → anchor as new version.

**Recovery (optional demo)**
- Wrap MK with Lit PKP or Privy-gated capsule; unwrap locally to restore DEK.

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
- Walrus client (e.g., `walrus-http-client` or Pinata key)
- Git

### 8.2 Environment
Create `.env` with:
```
ZIRCUIT_RPC_URL=...
WALLET_PRIVATE_KEY=...
PRIVY_APP_ID=...
Walrus_API_URL=...           # or WALRUS_KEY=...
ENVIO_API_URL=...          # your Envio query endpoint
```
*(Never commit secrets.)*

### 8.3 Local Dev
```bash
# install deps
npm install

# compile & test contracts (Hardhat or Foundry)
npx hardhat compile
npx hardhat test

# run extension dev server (example)
npm run dev:ext
```

### 8.4 Deploy (Testnet)
- Author/spec contracts in Nora → generate Solidity + tests.  
- Deploy with Nora’s workflow or with Hardhat scripts to **Zircuit testnet**.  
- Publish ABIs for the extension & Envio processor mapping.

### 8.5 Configure Envio
- Map `VaultVersionAnchored`, `VaultItemCommitted`, `VaultItemRevoked` → entities.  
- Deploy processor; note `ENVIO_API_URL` for the UI.

### 8.6 Demo Script
- Create 3 mock credentials → encrypt & bundle to Walrus.  
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
- **Walrus** (ciphertext backups)
