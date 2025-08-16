# ShadowVault — Privacy-First Password Manager (Zircuit + Envio + Nora)

> **This README reflects the latest architecture changes:**  
> - **No The Graph** (no Subgraph/Hypergraph/Token API)  
> - **Contracts authored & shipped with Nora Agent** (mynora.ai)  
> - **Indexing via Envio** (event-driven, query per request)  
> - **Zircuit testnet only** for on-chain anchoring & verification (no cross-chain/Hyperlane)  
> - **Client-side encryption** with optional **IPFS** backups (ciphertext only)  
> - **Privy** for wallet/identity in the browser extension

---

## 1) Project Overview

**One-liner:** A browser extension that stores credentials as encrypted data, anchors tamper-proof commitments on-chain, and serves verifiable, queryable state via an indexer — without ever exposing plaintext secrets.

**Why it matters:** Traditional managers require trust in centralized services. ShadowVault proves integrity and recency of your encrypted vault using **on-chain commitments** and **Envio-indexed events**, keeping secrets private end-to-end.

**MVP Scope (hackathon):**
- Local encryption (Argon2id + AES-256-GCM).
- On-chain anchoring of **Merkle roots** and content pointers on **Zircuit testnet**.
- Optional ciphertext backup to **IPFS** (per-item or bundle CID).
- Event indexing with **Envio**; UI queries Envio on demand.
- Contracts authored & deployed using **Nora Agent**.
- No plaintext usernames/passwords on-chain or in the indexer.

---

## 2) Architecture

```
Browser Extension (React/TypeScript, WebExtensions)
  ├─ Crypto: WebCrypto (Argon2id KDF, AES-256-GCM)
  ├─ Local Vault: IndexedDB + Export/Import (encrypted JSON/CSV)
  ├─ Optional Backup: IPFS (ciphertext only, returns CID)
  ├─ Identity/Wallet: Privy
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
  v: number;                 // schema version
  site: string;              // optional plaintext label
  username: string;          // optional plaintext label
  cipher: string;            // base64 AES-GCM ciphertext (e.g., password)
  iv: string;                // 12-byte IV (base64)
  tag?: string;              // if library separates tag
  dekWrap: string;           // DEK wrapped with Master Key
  meta?: Record<string, any> // timestamps, notes
}
```

**Keys**
- **DEK:** per-vault version random 32-byte key.
- **Master Key (MK):** Argon2id(passphrase); optionally wrapped to Lit PKP/Privy for recovery.
- **Salts/Nonces:** secure RNG; optionally seeded via Chainlink VRF for demoable randomness.

**Commitments (on-chain)**
- `itemIdHash = keccak256( salt_item || domain || username_hint )`
- `itemCommitment = keccak256( itemIdHash || cipher_cid || dek_commitment )`
- `vaultRoot = merkleRoot( itemCommitment[] )`

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
1) User edits/creates item → encrypt locally.  
2) Compute `itemIdHash`, `itemCommitment`.  
3) Push ciphertext(s) to **IPFS** → get CID(s).  
4) Anchor via contract → emits `VaultVersionAnchored` (+ optional per-item events).  
5) **Envio** indexes; UI refreshes by querying Envio.

**Verify (auditor/self)**
1) Query Envio → get `vaultRoot` + `bundleCID`.  
2) Fetch bundle from IPFS → recompute root.  
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
