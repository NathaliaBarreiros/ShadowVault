# ShadowVault — Web3 Password Manager with Zero-Knowledge Verification  

ShadowVault is a **Web3-native password manager** that removes the need for centralized custody and enables users to **prove password security compliance without ever revealing their secrets**.  

Unlike traditional password managers (LastPass, 1Password) that centralize encrypted vaults and risk offline brute-force attacks if compromised, ShadowVault ensures:  

- **Decentralized custody** — credentials are encrypted client-side and only ciphertext is stored on-chain.  
- **Zero-Knowledge verification** — users can generate proofs that their passwords meet security policies without exposing them.  
- **Cross-chain consistency** — verified proofs are linked across chains using Hyperlane, bridging storage (Base) and verification (Zircuit).  

⚡ **Hackathon Status**: This repository contains the MVP implementation for ETH Global. Technical direction, architecture, and features will evolve after the event.  

---

## 1. Project Overview  

**Tagline:**  
*A decentralized, ZK-verified password manager for the Web3 era.*  

**Mission:**  
ShadowVault provides a trustless way to store and verify credentials. By combining local encryption, zero-knowledge proofs, and cross-chain verification, it removes single points of failure and ensures password policies are enforced transparently.  

**Current Status:**  
- Initial MVP targeting hackathon demo.  
- Core flow: credential encryption → proof generation → proof verification → credential retrieval.  
- Room for future refinements: entropy scoring, breach dataset integration, IPFS/Arweave sync, DAO governance.  

---
## 2. Problem & Motivation

### 2.1 What’s broken with traditional password managers
Most mainstream password managers (e.g., LastPass, 1Password) centralize custody of users’ encrypted vaults. Even with “zero-knowledge” marketing, several structural issues remain:

- **Single point of failure:** Central servers are high-value targets. Breaches can expose entire encrypted vaults for offline cracking.
- **Offline brute-force risk:** If a master key or KDF parameters are weak, leaked ciphertext can be attacked indefinitely without rate limits.
- **Opaque security guarantees:** Users can’t **prove** they follow strong password policies without revealing password content to a third party.
- **Vendor trust assumptions:** Users must trust providers to implement crypto correctly, handle incident response, and avoid metadata leakage.
- **Limited verifiability:** There’s no public, tamper-evident record that a credential met a policy at a specific point in time.

### 2.2 Real-world constraints we care about
ShadowVault is designed around constraints that matter in practice:

- **No plaintext anywhere:** Secrets should never leave the client unencrypted.
- **Provability without disclosure:** Third parties should be able to verify compliance with password policies **without** learning the password.
- **Tamper evidence:** Proofs and state transitions should be publicly verifiable and time-anchored.
- **Composable primitives:** The system should interoperate with wallets, contracts, and cross-chain messaging.
- **MVP practicality:** Optimize for a working demo with clear UX and credible security posture, not perfect theoretical coverage.

### 2.3 Threat model (MVP scope)
We explicitly address the following threats in the MVP:

- **Server compromise:** Storage/database exposure must not reveal plaintext or useful decryption material.
- **Network interception:** Intermediaries observing traffic must not obtain secrets or proof witnesses.
- **Offline cracking of stored data:** Leaked ciphertext should resist bulk cracking (robust KDF + modern AEAD).
- **Dishonest attestations:** A user should not be able to claim policy compliance unless it actually holds.

Out of MVP scope (roadmap candidates):

- **Compromised client device:** If the device is fully compromised at the time of entry, secrets can be exfiltrated.
- **Sophisticated phishing/session hijack:** Additional mitigations (FIDO2, passkeys, anti-export UI) considered post-MVP.
- **Advanced side channels:** Timing/cache/EM attacks are not addressed in the MVP.

### 2.4 Why Web3 for a password manager?
A decentralized approach solves multiple pain points:

- **Custody separation:** Only ciphertext is stored on-chain (Base). There is no central vault provider to breach.
- **Public verifiability:** On-chain verification (Zircuit) produces a durable, tamper-evident record of compliance.
- **Extensibility:** Credentials and proofs become composable building blocks for future protocols (e.g., gated access, automated policy checks).
- **Credible neutrality:** Verification rules and results are transparent; anyone can audit the same contracts.

### 2.5 Why Zero-Knowledge proofs (ZKPs)?
ZKPs are the missing link between **privacy** and **assurance**:

- **Prove policy compliance without revealing the password:** e.g., “length ≥ 12 and ≥ 3 character classes” holds true.
- **Minimize trust surface:** Verifiers rely on math and open contracts, not on the data holder’s honesty.
- **Auditability with privacy:** Public inputs and events reveal *that* a policy was satisfied—not *how*.

**ShadowVault ZK policy (MVP):**
- Minimum length: **12** characters  
- At least **3 of 4** character classes: upper / lower / digit / symbol  
- Poseidon-based commitment binds a specific secret to the proof instance

*(Roadmap: entropy scoring, breached-password set membership checks via hashed datasets, adaptive policies.)*

### 2.6 Why cross-chain (Base ↔ Zircuit via Hyperlane)?
- **Separation of concerns:**  
  - **Base**: efficient storage and indexing of ciphertext envelopes in SQL.  
  - **Zircuit**: specialized environment for verifying ZK proofs and recording commitments.
- **Consistency guarantees:** Hyperlane links the storage row (on Base) with the verified commitment (on Zircuit), ensuring the ciphertext and the proof refer to the same underlying secret.
- **Future flexibility:** Decoupled layers allow upgrades or migrations without rewriting the entire stack.

### 2.7 Design principles
- **Local-first security:** Argon2id for key derivation; AES-256-GCM for encryption; per-entry DEKs wrapped under a KEK.
- **Minimal disclosure:** Only commitments and necessary public inputs leave the client.
- **Deterministic verification:** On-chain verifier contracts (auto-generated from Noir) remove ambiguity.
- **Operational simplicity (MVP):** Clear UX flows, predictable error handling, and measured scope.

### 2.8 Goals & non-goals (MVP)
**Goals**
- Demonstrate end-to-end flow: encrypt → prove → verify → retrieve/decrypt.
- Ship a testable, comprehensible demo for judges and developers.
- Establish clean interfaces (envelope JSON, SQL schema, contract methods) for future expansion.

**Non-Goals**
- Production-grade phishing resistance, device attestation, or hardware enclave support.
- Full enterprise admin features, sharing workflows, or team policies.
- Mainnet deployment or handling real PII (mock data only for the hackathon).

### 2.9 Who benefits (initial personas)
- **Security-conscious users:** Want stronger guarantees than “trust us, it’s encrypted.”
- **Developers & protocols:** Need a verifiable signal that a credential meets policy without handling secrets.
- **Auditors/Integrators:** Prefer open, on-chain verification over proprietary attestations.

---
## 3. Core Features (MVP)

ShadowVault’s MVP delivers the foundational flow of a decentralized, ZK-verified password manager:  
**local credential encryption → zero-knowledge proof generation → on-chain verification → cross-chain consistency → local decryption.**

---

### 3.1 Credential Ingestion & Local Encryption

#### Objective
Securely ingest and encrypt credentials entirely on the client side, ensuring that no plaintext ever leaves the device.

#### Flow
1. User logs in via **Coinbase Development Platform (CDP)** with email + password.
2. Client derives a **Key Encryption Key (KEK)** from the password using **Argon2id** and a random salt.
3. For each new credential, the client generates a random **Data Encryption Key (DEK)**.
4. Credential payload (`username`, `password`, `domain`) is encrypted with **AES-256-GCM** using the DEK.
5. The DEK is wrapped under the KEK using **AES-KW**.
6. A **Poseidon hash commitment** of `(salt + password)` is created.
7. A **Ciphertext Envelope JSON** is assembled and stored in **Base SQL**.

#### Ciphertext Envelope Example
```json
{
  "v": 1,
  "scheme": "AES-256-GCM",
  "aad": "sv:cred:1",
  "dek_wrapped": "base64url(...)",
  "dek_wrap_algo": "AES-KW",
  "nonce": "base64url(12B)",
  "salt_kek": "base64url(16-32B)",
  "payload": {
    "username": "ciphertext",
    "password": "ciphertext",
    "domain": "ciphertext"
  },
  "commitment": "0xPoseidon(...)",
  "commit_salt_enc": "ciphertext"
}
```

#### Acceptance Criteria
- No plaintext secrets ever leave the client.
- DEK unwraps successfully with the correct KEK.
- Base SQL entry created with `(owner, envelope, commitment)`.

---

### 3.2 Zero-Knowledge Proof Generation (Noir)

#### Objective
Prove that a password complies with security policies without revealing the password itself.

#### Policy Requirements (MVP)
- Password length ≥ 12 characters
- Contains ≥ 3 of the 4 character classes: {uppercase, lowercase, digit, symbol}
- Commitment matches `(salt + password)`

#### Flow
1. Client prepares encrypted witness data and sends it, along with the password commitment, to the backend.
2. The backend runs the Noir circuit:
   - Checks length ≥ 12
   - Checks that ≥ 3 classes are present
   - Verifies the Poseidon hash matches the stored commitment
3. Backend returns a `{ proof, publicInputs }` package.

#### Acceptance Criteria
- Proofs verify locally before submission.
- Public inputs reveal no secret material.

#### Future Refinements
- Client-side proving (WebAssembly).
- Breached-password dataset checks via ZK set membership.
- Entropy-based scoring.

---

### 3.3 On-Chain Verification (Zircuit)

#### Objective
Provide tamper-evident verification and durable auditability that a given commitment satisfied the policy.

#### Contracts
- **Verifier.sol** — Noir auto-generated verifier contract.
- **VaultRegistry.sol** — stores `(user, commitment, baseRowId, baseChainId)` and emits events.

#### Flow
1. Submit `{ proof, publicInputs }` to **Verifier.sol**.
2. If valid, call `VaultRegistry.store(...)` with the user, commitment, and Base SQL row ID.
3. `PasswordStored(user, commitment, baseRowId)` event is emitted.

#### Acceptance Criteria
- Invalid proofs revert with no registry update.
- Events are indexable by user and commitment.

---

### 3.4 Cross-Chain Linkage (Hyperlane)

#### Objective
Maintain consistency between encrypted storage on Base and verified proofs on Zircuit.

#### Message Payload
```txt
{ commitment, baseRowId, zircuitTxHash }
```

#### Flow
1. After successful verification on Zircuit, Hyperlane relays `(commitment, baseRowId, zircuitTxHash)` across Base ↔ Zircuit.
2. Observers can link ciphertext (Base) with its verified proof (Zircuit).

#### Acceptance Criteria
- Replay protection ensures no duplicate or malicious message injection.
- Consistent mapping across Base and Zircuit layers.

#### Future Refinements
- Signed attestations for off-chain consumers.
- Retry/ack strategies for relay failures.

---

### 3.5 Credential Retrieval & Local Decryption

#### Objective
Allow users to securely retrieve and decrypt credentials locally without exposing them externally.

#### Flow
1. Client queries **Base SQL** for credentials tied to their address.
2. KEK is re-derived from the user’s password via Argon2id.
3. DEK is unwrapped from the ciphertext envelope using KEK.
4. Payload is decrypted with the DEK under **AES-256-GCM**.
5. Credentials are displayed in the UI only within the user’s device.

#### Acceptance Criteria
- Incorrect master password prevents DEK unwrap and decryption.
- No plaintext ever appears in logs, network traces, or persistent storage.

#### Future Refinements
- Tap-to-reveal UX patterns.
- Clipboard hygiene and auto-clear timers.

---

### 3.6 Observability & Events

#### On Zircuit
- Emits `PasswordStored(address user, bytes32 commitment, uint256 baseRowId)`.

#### On Base (Optional Helper Contract)
- Emits mapping events linking `rowId ↔ commitment` for easier discoverability.

#### Acceptance Criteria
- Verification history for a user’s commitments can be reconstructed by observers.

---

### 3.7 Error Handling & UX Safeguards

#### Example Error Cases
- **Incorrect master password:** “Unable to decrypt entries – incorrect password.”
- **Proof failure:** “Password does not meet policy requirements.”
- **Verification revert:** “Proof invalid – verification failed.”
- **Hyperlane relay pending:** “Verified on-chain, awaiting cross-chain confirmation.”

#### UX Guarantees
- Errors are deterministic, human-readable, and do not leak sensitive data.
- Clear retry guidance is provided where appropriate.

---

### 3.8 Security Notes (MVP Posture)

- No plaintext passwords, usernames, or domains are stored or transmitted.
- All sensitive material is encrypted with **AES-256-GCM**.
- Commitments use **Poseidon** hashing for ZK compatibility.
- KEKs and DEKs are cleared from memory after a session ends.
- Sensitive material is never logged.

---

### Summary of Section 3
Section 3 defines the MVP scope of ShadowVault. It ensures **local-first encryption and security**, **zero-knowledge assurance of password policy compliance**, **public verifiability of proofs**, and **cross-chain consistency** — all while keeping sensitive credentials private. Future iterations will extend these capabilities with stronger password policies, entropy scoring, breached-password detection, and enhanced governance mechanisms.

---
## 4. System Architecture

The ShadowVault MVP is organized into five primary layers: **frontend**, **backend**, **storage**, **verification**, and **bridge**. Each layer is modular, ensuring minimal trust requirements and clear separation of responsibilities.

---

### 4.1 Frontend (React + Coinbase CDP SDK)

- **Authentication:**  
  - Users log in via **Coinbase CDP SDK** using email + password.  
- **Key Management:**  
  - Derives Key Encryption Key (KEK) from password using Argon2id.  
  - Generates per-entry Data Encryption Keys (DEKs).  
- **Encryption/Decryption:**  
  - Encrypts credential payloads locally with AES-256-GCM.  
  - Wraps DEKs under KEK using AES-KW.  
  - Decrypts payloads locally on retrieval.  
- **Proof Integration:**  
  - Sends encrypted witness data to backend for Noir proof generation.  
  - Receives proof artifacts and prepares verification requests.  
- **UI/UX:**  
  - Create, retrieve, and decrypt credentials.  
  - Display credential entries only within the device (never leaves client in plaintext).  

---

### 4.2 Backend (Node.js + Hardhat)

- **Proof Service:**  
  - Runs Noir circuits to generate zero-knowledge proofs of password policy compliance.  
- **Storage Service:**  
  - Handles Base SQL inserts/updates for ciphertext envelopes.  
- **On-Chain Integration:**  
  - Submits proofs and public inputs to Verifier.sol on Zircuit.  
  - Calls VaultRegistry.sol to record commitments and emit events.  
- **Bridge Integration:**  
  - Dispatches Hyperlane messages linking Base row IDs to Zircuit verification records.  

---

### 4.3 Storage Layer (Base SQL)

- **Schema:**  
  - `sv_credentials` table with columns:  
    - `row_id` (primary key)  
    - `owner` (address of user)  
    - `envelope` (JSONB ciphertext envelope)  
    - `commitment` (binary commitment hash)  
    - `created_at` / `updated_at` timestamps  
- **Role:**  
  - Stores ciphertext envelopes tied to user addresses.  
  - Provides queryable interface for credential retrieval.  
- **Optional:**  
  - BaseHelper.sol contract emits events linking row IDs and commitments for discoverability.  

---

### 4.4 Verification Layer (Zircuit)

- **Verifier.sol (Noir-generated):**  
  - Validates submitted proofs and public inputs.  
  - Returns true/false depending on proof validity.  
- **VaultRegistry.sol:**  
  - Stores `(user, commitment, baseRowId, baseChainId)` after proof validation.  
  - Emits `PasswordStored` event for auditability.  
- **Properties:**  
  - Provides tamper-evident, immutable proof verification.  
  - Ensures public transparency of credential compliance without revealing secrets.  

---

### 4.5 Bridge Layer (Hyperlane)

- **Role:**  
  - Maintains consistency between storage (Base) and verification (Zircuit).  
- **Message Payload:**  
  ```txt
  { commitment, baseRowId, zircuitTxHash }
  ```
- **Flow:**  
  1. After proof verification on Zircuit, Hyperlane relays mapping data back to Base.  
  2. Links ciphertext records with verified proofs across chains.  
- **Protections:**  
  - Replay protection for cross-chain messages.  
  - Ensures one-to-one consistency between storage and verification states.  

---

### 4.6 High-Level Architecture Diagram (Placeholder)

```
[ User Device ]
   |  (encrypt, decrypt, prove)
   v
[ Frontend (React + CDP SDK) ]
   |  (witness -> proof req, SQL ops)
   v
[ Backend (Node.js + Hardhat) ]
   |-----> [ Base SQL (ciphertext storage) ]
   |-----> [ Zircuit (proof verification) ]
   |-----> [ Hyperlane (cross-chain linkage) ]
```

---

### 4.7 Design Principles

- **Local-first security:** All encryption/decryption performed client-side.  
- **Minimal disclosure:** Only commitments and necessary public inputs leave the client.  
- **Composable modules:** Frontend, backend, storage, verification, and bridge layers interact via clean APIs.  
- **Auditability:** Public events and commitments allow external verification of compliance.  
- **Upgradability:** Versioned envelopes, circuits, and events to support future policy changes.  

---
## 5. Data Models

ShadowVault defines clear data structures and schemas to ensure consistent handling of encrypted credentials, commitments, and proof records across its architecture. The MVP focuses on simplicity and clarity while leaving room for extensibility.

---

### 5.1 Ciphertext Envelope (Client-Side JSON Format)

Each credential is wrapped in a **ciphertext envelope** before being transmitted or stored. This ensures all sensitive fields remain encrypted and verifiable.

```json
{
  "v": 1,
  "scheme": "AES-256-GCM",
  "aad": "sv:cred:1",
  "dek_wrapped": "base64url(...)",
  "dek_wrap_algo": "AES-KW",
  "nonce": "base64url(12B)",
  "salt_kek": "base64url(16-32B)",
  "payload": {
    "username": "ciphertext",
    "password": "ciphertext",
    "domain": "ciphertext"
  },
  "commitment": "0xPoseidon(...)",
  "commit_salt_enc": "ciphertext"
}
```

**Fields**
- `v`: Schema version for compatibility.  
- `scheme`: Symmetric encryption scheme (AES-256-GCM).  
- `aad`: Associated Authenticated Data for domain separation.  
- `dek_wrapped`: Data Encryption Key wrapped under KEK.  
- `dek_wrap_algo`: Key wrapping algorithm used (AES-KW).  
- `nonce`: Initialization vector for AES-GCM (12 bytes).  
- `salt_kek`: Salt used for KEK derivation via Argon2id.  
- `payload`: Object containing encrypted fields: username, password, domain.  
- `commitment`: Poseidon hash binding the password to the proof.  
- `commit_salt_enc`: Encrypted salt used in commitment calculation.  

---

### 5.2 Base SQL Schema

Ciphertext envelopes are stored in a SQL table on **Base** for persistence and queryability.

```sql
CREATE TABLE sv_credentials (
  row_id SERIAL PRIMARY KEY,
  owner VARCHAR(66) NOT NULL,
  envelope JSONB NOT NULL,
  commitment BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Schema Notes**
- `row_id`: Unique identifier for each credential entry.  
- `owner`: Ethereum-compatible address of the user.  
- `envelope`: JSONB object containing the ciphertext envelope.  
- `commitment`: Poseidon hash commitment stored for ZK verification.  
- `created_at` / `updated_at`: Timestamps for audit and replay prevention.  

---

### 5.3 On-Chain State (Zircuit)

Two primary contracts manage proof verification and recordkeeping:

1. **Verifier.sol (Noir-generated)**  
   - Function: `verify(proof, publicInputs) -> bool`  
   - Validates Noir proof correctness against public inputs.

2. **VaultRegistry.sol**  
   - Function: `store(address user, bytes32 commitment, uint256 baseRowId, uint256 baseChainId)`  
   - Records successful proof-verification tuples on-chain.  
   - Emits event:  
     ```solidity
     event PasswordStored(address indexed user, bytes32 commitment, uint256 baseRowId);
     ```

**Stored State**
- `user`: Address linked to credential.  
- `commitment`: Commitment proven under ZK policy.  
- `baseRowId`: Row ID in Base SQL for mapping ciphertext to proof.  
- `baseChainId`: Identifier for Base chain, ensuring cross-chain traceability.  

---

### 5.4 Optional Helper Contract (BaseHelper.sol)

Provides additional indexing features for discoverability and transparency.

- Emits events linking `rowId ↔ commitment` pairs.  
- Facilitates external indexers and explorers in reconstructing state without querying SQL directly.  

---

### 5.5 Data Integrity Properties

- **End-to-End Encryption:** No plaintext fields stored at rest or transmitted.  
- **Deterministic Commitments:** Poseidon ensures consistent hash outputs for identical `(password, salt)` pairs.  
- **Tamper Resistance:** AES-GCM authentication tags guarantee ciphertext integrity.  
- **Cross-Layer Mapping:** `row_id` ↔ `commitment` linkage guarantees consistency between Base SQL and Zircuit verification.  
- **Extensibility:** Envelopes and contracts are versioned, enabling future upgrades without breaking existing state.  

---
## 6. Smart Contracts

The ShadowVault MVP leverages a minimal set of smart contracts to provide **zero-knowledge verification, credential registry, and optional discoverability features**. These contracts are designed for clarity, modularity, and upgradeability, while ensuring security in a hackathon-ready environment.

---

### 6.1 Verifier.sol

**Purpose:**  
Auto-generated contract from the Noir circuit compilation. It provides the on-chain functionality to verify that submitted proofs are valid with respect to public inputs.

**Key Functions**
```solidity
function verify(bytes proof, bytes32[] publicInputs) external view returns (bool);
```
- **Inputs:**  
  - `proof`: ZK proof generated by Noir circuits.  
  - `publicInputs`: Array of public values required for verification (e.g., commitment, policy parameters).  
- **Returns:** Boolean indicating proof validity.  

**Notes**
- Verifier.sol is deterministic and generated directly from the Noir circuit.  
- Used as a library contract — cannot alter state, only validate proofs.  
- Ensures zero-knowledge proofs can be validated by anyone without access to private inputs.  

---

### 6.2 VaultRegistry.sol

**Purpose:**  
Stores verified credential commitments and links them to Base SQL entries. It ensures that any credential stored in Base has a corresponding proof verified on Zircuit.

**Key Functions**
```solidity
function store(
    address user,
    bytes32 commitment,
    uint256 baseRowId,
    uint256 baseChainId
) external;
```

**Events**
```solidity
event PasswordStored(address indexed user, bytes32 indexed commitment, uint256 baseRowId);
```

**Flow**
1. Caller submits `{user, commitment, baseRowId, baseChainId}` after successful proof validation.  
2. Contract records mapping `(user → commitment → baseRowId)`.  
3. Emits `PasswordStored` for public observability.  

**Properties**
- Links off-chain storage (Base SQL) with on-chain verification results.  
- Immutable record ensures no credential can be claimed compliant without passing proof validation.  
- Public events make state discoverable to indexers, explorers, and auditors.  

**Security Considerations**
- Only callable after proof validation. Integration with Verifier.sol ensures that invalid proofs cannot populate the registry.  
- Indexed parameters (`user`, `commitment`) optimize searchability.  
- Upgrade path: contract is designed to be versioned if future credential policies change.  

---

### 6.3 BaseHelper.sol (Optional)

**Purpose:**  
Provides additional event indexing for easier discoverability of Base SQL entries. It is not required for core functionality but improves transparency and developer tooling.

**Events**
```solidity
event BaseMapping(uint256 indexed rowId, bytes32 indexed commitment);
```

**Use Cases**
- External indexers can reconstruct mappings of commitments to Base rows without direct SQL queries.  
- Helpful for off-chain audit tools, dashboards, or explorers that monitor password policy compliance across accounts.  

**Properties**
- Lightweight contract with no critical path dependency.  
- Optional deployment depending on integration and time constraints.  

---

### 6.4 ZK Policy Parameters

The initial Noir circuit enforces the following rules (hardcoded in MVP, configurable in future versions):

- **Minimum Length:** 12 characters.  
- **Character Class Requirement:** At least 3 of 4 (uppercase, lowercase, digit, symbol).  
- **Entropy Proxy:** Diversity of character classes serves as a lightweight proxy for entropy.  
- **Optional Extension:** Future circuits may include set-membership checks against breach datasets.  

**Design Considerations**
- Parameters are intentionally minimal to demonstrate feasibility in hackathon timeframe.  
- Future upgrades will make these parameters configurable through governance or DAO mechanisms.  
- Circuits are versioned to allow seamless migration to stricter policies without invalidating historical proofs.  

---

### 6.5 Security Principles for Contracts

- **Immutability of Proof Verification:** Proofs cannot be altered or faked once submitted.  
- **Replay Protection:** Commitments are unique per credential + salt, preventing duplicate claims.  
- **Minimal Attack Surface:** Verifier.sol only validates proofs; VaultRegistry.sol stores minimal state.  
- **Auditability:** All relevant state transitions emit events, allowing public monitoring.  
- **Upgrade Path:** Contracts are modular and versioned for future extensibility.  

---

### 6.6 Contract Deployment Plan (MVP)

- **Step 1:** Deploy Noir-generated `Verifier.sol` on Zircuit.  
- **Step 2:** Deploy `VaultRegistry.sol` and link it to Verifier.sol.  
- **Step 3:** (Optional) Deploy `BaseHelper.sol` for enhanced event indexing.  
- **Step 4:** Configure backend to call Verifier.sol → VaultRegistry.sol flow after generating valid proofs.  
- **Step 5:** Confirm events are emitted and indexed for demo observers.  

---

### Summary of Section 6

Section 6 describes the smart contract layer of ShadowVault. It consists of **Verifier.sol** (proof validation), **VaultRegistry.sol** (commitment registry and event logging), and optionally **BaseHelper.sol** (discoverability). Together, these contracts ensure that credential compliance is verifiable, tamper-evident, and publicly auditable while keeping user secrets private.  

---
## 7. ZK Policy Parameters

ShadowVault’s zero-knowledge circuits enforce **credential compliance policies** without revealing the underlying password. These policies are intentionally minimal in the MVP to balance **security guarantees** and **feasible proving performance**, but are designed for future extensibility.

---

### 7.1 MVP Policy Parameters

The Noir circuit enforces the following rules:

- **Minimum Password Length:** 12 characters.  
- **Character Class Requirement:** At least 3 of the following 4 categories:  
  - Uppercase letters (A–Z)  
  - Lowercase letters (a–z)  
  - Digits (0–9)  
  - Symbols (e.g., !, @, #, $, %, &, *)  
- **Commitment Binding:** Password must hash to the Poseidon commitment `(password + commit_salt)`.  

**Why These Parameters?**
- Enforce a baseline security posture equivalent to modern enterprise password policies.  
- Provide **verifiability** of compliance without exposing the actual password.  
- Lightweight enough to ensure proof generation remains performant (< 1s target).  

---

### 7.2 Entropy Proxy via Character Classes

- The diversity of character classes provides a **simple proxy for entropy**.  
- Example:  
  - Password with only lowercase letters = weak.  
  - Password with lowercase + uppercase + digits = stronger.  
- This allows a balance between **proof efficiency** and **practical security**.  

---

### 7.3 Optional Extensions (Future Roadmap)

#### Breach Dataset Integration
- Use **hashed dataset membership checks** to prove that a password is *not* in a list of known compromised credentials (e.g., Have I Been Pwned datasets).  
- Achieved via **Zero-Knowledge Set Membership Proofs**.  

#### Adaptive Policy Parameters
- DAO or governance-driven updates to password length, complexity, or entropy requirements.  
- On-chain registry of active `policy_version` identifiers.  

#### Entropy Scoring Gadgets
- Circuits that estimate Shannon entropy of password strings.  
- Enables fine-grained strength metrics beyond class diversity.  

#### Password Rotation & Expiry Policies
- Proofs that a new password differs from previous commitments.  
- Facilitates compliance with organizational policies on credential lifecycles.  

---

### 7.4 Circuit Variables (Simplified Mapping)

- **Private Inputs (Witnesses):**  
  - `password` (user’s secret)  
  - `commit_salt` (random salt)  

- **Public Inputs:**  
  - `commitment` (Poseidon hash)  
  - `min_len` (policy parameter)  
  - `min_classes` (policy parameter)  
  - `policy_version` (identifier for versioning)  

- **Constraints:**  
  - `len(password) >= min_len`  
  - `class_count(password) >= min_classes`  
  - `Poseidon(password || commit_salt) == commitment`  

---

### 7.5 Policy Versioning

- Each circuit release is tagged with a **policy version identifier**.  
- Contracts (VaultRegistry.sol) store both `commitment` and `policy_version`.  
- This allows:  
  - Seamless upgrades to stricter policies.  
  - Historical proofs to remain valid under the policy in effect at their time of generation.  

---

### 7.6 Performance Considerations

- **Proving Time:** Target < 1 second for password proof generation.  
- **Verification Cost:** Noir circuits compiled for Zircuit provide efficient verification gas costs.  
- **Trade-Offs:** More complex policies (entropy, breach checks) will increase proving time; deferred to post-MVP roadmap.  

---

### Summary of Section 7

Section 7 defines the **ZK policy parameters** that ShadowVault enforces. The MVP requires passwords to be at least 12 characters long and include at least 3 of 4 character classes. Proofs are bound to Poseidon commitments for tamper resistance. Future iterations will expand policy parameters to include entropy scoring, breached-password detection, governance-driven updates, and rotation/expiry policies — ensuring a balance between **usability**, **security**, and **performance**.

---
## 8. Development & Deployment

The ShadowVault MVP is designed to be delivered within a **36-hour hackathon sprint**, while laying the foundation for future extensibility. Section 8 details the step-by-step build plan, deployment flow, and post-hackathon roadmap.

---

### 8.1 36-Hour Build Plan

The build plan is divided into phases to maximize productivity, parallelization, and integration. Each developer role is clearly scoped.

#### H0–H4 — Setup
- Initialize **Hardhat repo** and configure Solidity environment.  
- Define **Base SQL schema** (`sv_credentials`).  
- Implement **Coinbase CDP authentication skeleton** in frontend.  
- Scaffold **Noir circuit skeleton** for password policy enforcement.  

#### H4–H12 — Core Development
- **Noir Circuit & Verifier.sol (Nathalia):**  
  - Implement circuit enforcing password policy rules.  
  - Compile Noir circuit to Solidity verifier contract.  
- **VaultRegistry.sol Deployment (Ryan):**  
  - Deploy credential registry contract.  
  - Configure event emission (`PasswordStored`).  
- **Frontend Crypto Flow (Julio):**  
  - Implement Argon2id key derivation.  
  - Add AES-256-GCM encrypt/decrypt pipeline.  
  - Integrate ciphertext envelope builder.  

#### H12–H20 — Integration
- **Backend Proof Service:**  
  - Expose API to receive witness data, run Noir proof, and return `{ proof, publicInputs }`.  
- **Base SQL Integration:**  
  - Insert and query ciphertext envelopes.  
- **On-Chain Submission:**  
  - Submit proofs to Verifier.sol and store commitments via VaultRegistry.sol.  

#### H20–H28 — Enhancements
- **Hyperlane Messaging:**  
  - Implement cross-chain linkage of `(commitment, baseRowId, zircuitTxHash)`.  
- **Optional BaseHelper.sol:**  
  - Emit events mapping Base row IDs to commitments for observability.  

#### H28–H36 — QA & Demo Prep
- Test flow with 3–5 credential vectors.  
- Prepare **demo script** showcasing:  
  - Add credential → encrypt → prove → verify → retrieve → decrypt.  
- Final deployment on Base testnet and Zircuit testnet.  
- Record demo walkthrough video.  

---

### 8.2 Deployment Workflow

1. **Circuits & Contracts**  
   - Compile Noir circuit → generate `Verifier.sol`.  
   - Deploy `Verifier.sol` to Zircuit.  
   - Deploy `VaultRegistry.sol` to Zircuit and link with Verifier.  
   - (Optional) Deploy `BaseHelper.sol` for mapping events.  

2. **Backend Setup**  
   - Node.js service hosting Noir proof generation.  
   - Hardhat integration for contract calls.  
   - SQL integration with Base.  

3. **Frontend Setup**  
   - React app with Coinbase CDP login.  
   - Local encryption pipeline (Argon2id + AES-256-GCM).  
   - UI for credential ingestion, retrieval, and decryption.  
   - Proof request submission & on-chain verification UX.  

4. **Cross-Chain Integration**  
   - Hyperlane configured to relay `(commitment, baseRowId, zircuitTxHash)` between Base and Zircuit.  
   - Observers can confirm consistency across both networks.  

5. **Demo Environment**  
   - Hosted frontend (Vercel/Netlify).  
   - Backend proof service deployed with public API.  
   - Contracts deployed on Zircuit testnet.  
   - Base SQL provisioned on testnet.  

---

### 8.3 Post-Hackathon Roadmap

ShadowVault’s MVP will evolve into a production-grade protocol with the following roadmap:

#### Security & Policy Enhancements
- Integrate breach dataset set-membership proofs.  
- Implement entropy scoring gadgets for stronger strength validation.  
- Support adaptive, governance-driven policies.  

#### Storage & Sync
- Multi-device synchronization via **IPFS/Arweave**.  
- Encrypted backup/recovery flows.  
- Event-driven indexing for wallets and identity platforms.  

#### UX Improvements
- Mobile-first UI with passkey/FIDO2 support.  
- Tap-to-reveal and clipboard hygiene for secure retrieval.  
- Improved error handling with self-healing retries.  

#### Ecosystem Expansion
- Credential proofs integrated with **dApps** requiring policy compliance.  
- DAO-based governance of policy updates and circuit versioning.  
- SDK for developers to embed ShadowVault compliance in their own applications.  

---

### Summary of Section 8

Section 8 defines the **development and deployment lifecycle** of ShadowVault. The hackathon build plan ensures a working MVP in 36 hours, while the deployment workflow highlights integration across Base, Zircuit, Hyperlane, and the client stack. The post-hackathon roadmap demonstrates how ShadowVault can evolve into a full-featured Web3 password management and verification protocol — combining strong security, extensibility, and composability.

---
## 9. Risk Management

The ShadowVault MVP anticipates a number of risks that may arise during development, deployment, and usage. Section 9 outlines these risks, categorized by layer, and provides mitigation strategies to ensure the system remains reliable and trustworthy.

---

### 9.1 Storage Risks

**Risk: SQL Availability**  
- If Base SQL becomes unavailable, users may be unable to retrieve ciphertext envelopes.  

**Mitigation:**  
- Implement a **local IndexedDB cache** in the frontend to store recently used envelopes.  
- Ensure cached envelopes are encrypted and wiped on logout.  
- Consider IPFS/Arweave integration post-MVP for redundancy.  

**Risk: Data Corruption or Tampering**  
- A malicious actor or storage failure could alter ciphertext envelopes.  

**Mitigation:**  
- AES-GCM authentication tags provide integrity guarantees.  
- Commitments (Poseidon hash) ensure ciphertext is verifiably bound to a password.  
- Events on Zircuit provide tamper-evident records of valid entries.  

---

### 9.2 Proof Generation Risks

**Risk: Proof Latency**  
- Noir circuits could take too long to generate proofs, harming UX.  

**Mitigation:**  
- Optimize circuits to reduce constraints and target **< 1 second proving time**.  
- Use backend proving for demo performance; add client-side proving post-MVP.  
- Precompile proving keys and cache to reduce startup overhead.  

**Risk: Invalid Proofs from Client Manipulation**  
- A malicious client could attempt to bypass policy checks.  

**Mitigation:**  
- Verifier.sol contract guarantees that only valid proofs are accepted.  
- VaultRegistry.sol only stores state if verification succeeds.  
- Any invalid attempt reverts without changing on-chain state.  

---

### 9.3 Cross-Chain Messaging Risks

**Risk: Hyperlane Message Replay or Loss**  
- Replay of old messages or failure to deliver could desync Base and Zircuit.  

**Mitigation:**  
- Hyperlane replay protection ensures duplicate messages are discarded.  
- Observers can reconstruct state via commitments + events on Zircuit.  
- Future refinements may include signed attestations and retry logic.  

**Risk: Cross-Chain Delay**  
- Latency in Hyperlane relay could leave Base SQL and Zircuit temporarily inconsistent.  

**Mitigation:**  
- UI communicates “Verified on-chain, cross-chain link pending” states.  
- Retry logic ensures eventual consistency.  

---

### 9.4 User Experience Risks

**Risk: Poor Error Feedback**  
- Users may not understand why encryption, decryption, or proof generation failed.  

**Mitigation:**  
- Provide deterministic, human-readable error messages:  
  - “Incorrect password – unable to decrypt.”  
  - “Password does not meet policy requirements.”  
  - “Verification failed – please retry.”  
- Ensure no sensitive data is ever leaked in error strings.  

**Risk: UX Complexity**  
- Users may find ZK proofs confusing or slow.  

**Mitigation:**  
- Abstract away cryptography with clean UI/UX.  
- Clear success/failure indicators and demo scripts for hackathon.  
- Focus on smooth onboarding and demo readiness.  

---

### 9.5 Privacy Risks

**Risk: Information Leakage**  
- Metadata or public inputs could leak information about passwords.  

**Mitigation:**  
- Only commitments and minimal public inputs are transmitted.  
- Poseidon commitments reveal no details about the underlying password.  
- Encrypted witness data ensures backend cannot access secrets directly.  

**Risk: Breach of Sensitive Data**  
- Exposure of KEK/DEK in memory or logs.  

**Mitigation:**  
- KEKs and DEKs wiped from memory after use.  
- No sensitive keys logged by frontend or backend.  
- Security review of memory handling post-MVP.  

---

### 9.6 Governance & Upgrade Risks

**Risk: Policy Stagnation**  
- Hardcoded password policies may become outdated or insufficient.  

**Mitigation:**  
- Version circuits and policies (`policy_version`).  
- Enable upgradeable governance (DAO or multisig) for post-MVP evolution.  

**Risk: Contract Inflexibility**  
- MVP contracts may be too rigid for future policies.  

**Mitigation:**  
- Modular design: Verifier.sol, VaultRegistry.sol, and optional BaseHelper.sol are versioned.  
- Deploy new contract instances alongside older versions; maintain backward compatibility.  

---

### 9.7 Hackathon-Specific Risks

**Risk: Time Constraints**  
- 36 hours may not be sufficient to implement full roadmap.  

**Mitigation:**  
- Focus on **MVP scope only**: encryption, proof, verification, and retrieval.  
- Document extensions as roadmap items.  

**Risk: Demo Failure**  
- Demo may fail due to network or integration errors.  

**Mitigation:**  
- Prepare **scripted demo** with pre-seeded credentials.  
- Record backup video walkthrough of system flow.  

---

### Summary of Section 9

Section 9 identifies risks across storage, proof generation, cross-chain messaging, UX, privacy, governance, and hackathon execution. Each risk is paired with mitigation strategies to ensure ShadowVault remains **secure, reliable, and demonstrable** under tight constraints, while also providing a path toward production readiness.

---

## 10. Getting Started

This section provides step-by-step instructions for developers, auditors, and hackathon judges to **set up, run, and interact with the ShadowVault MVP**. The focus is on rapid onboarding while ensuring clarity around dependencies and workflows.

---

### 10.1 Prerequisites

Before running ShadowVault, ensure the following dependencies are installed:

- **Node.js v18+** (runtime for frontend and backend)  
- **npm or yarn** (package manager)  
- **Hardhat** (Ethereum development framework)  
- **Noir** (ZK circuit compiler and proof system)  
- **PostgreSQL** (for Base SQL storage simulation or testnet integration)  
- **Coinbase CDP SDK** (for authentication)  
- **Git** (version control)  

**Recommended Tools**
- VS Code (with Solidity and Noir extensions)  
- Docker (for containerized backend services, optional)  
- Metamask or Coinbase Wallet (for testnet interaction)  

---

### 10.2 Repository Setup

1. Clone the repository:  
   ```bash
   git clone https://github.com/<your-org>/shadowvault.git
   cd shadowvault
   ```

2. Install dependencies:  
   ```bash
   npm install
   ```

3. Configure environment variables:  
   Create a `.env` file in the project root with the following keys:  
   ```bash
   DATABASE_URL=postgres://user:password@localhost:5432/shadowvault
   CDP_API_KEY=<your-cdp-api-key>
   BASE_CHAIN_ID=<base-testnet-chain-id>
   ZIRCUIT_CHAIN_ID=<zircuit-testnet-chain-id>
   HYPERLANE_CONFIG=<path-to-hyperlane-config>
   ```

---

### 10.3 Running Locally

**Start the SQL Database (PostgreSQL)**  
```bash
createdb shadowvault
psql -d shadowvault -f schema.sql
```

**Run the Backend Proof Service**  
```bash
cd backend
npm run dev
```

**Run the Frontend (React App)**  
```bash
cd frontend
npm start
```

**Compile & Deploy Contracts**  
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network zircuitTestnet
```

---

### 10.4 Demo Walkthrough

To showcase ShadowVault, follow the MVP credential lifecycle:

1. **Login:**  
   User logs in with Coinbase CDP (email + password).  

2. **Ingest Credential:**  
   - Password is encrypted locally.  
   - Commitment is generated with Poseidon hash.  
   - Ciphertext envelope is stored in Base SQL.  

3. **Generate Proof:**  
   - Client sends encrypted witness data.  
   - Backend generates Noir proof and returns `{ proof, publicInputs }`.  

4. **Verify On-Chain:**  
   - Proof submitted to Verifier.sol on Zircuit.  
   - VaultRegistry.sol stores commitment and emits `PasswordStored`.  

5. **Cross-Chain Linking:**  
   - Hyperlane relays `(commitment, baseRowId, zircuitTxHash)` between Base and Zircuit.  

6. **Retrieve & Decrypt:**  
   - User queries Base SQL for ciphertext envelopes.  
   - Local KEK unwraps DEK, decrypts payload.  
   - Credential is revealed only on the user’s device.  

---

### 10.5 Testing

Run the automated test suite:

```bash
npm test
```

Tests include:  
- Encryption/Decryption flow.  
- Proof generation and verification.  
- Contract interactions (Verifier + VaultRegistry).  
- SQL storage and retrieval.  

---

### 10.6 Deployment (Testnet)

**Deploy to Base Testnet**
```bash
npx hardhat run scripts/deployBase.js --network baseTestnet
```

**Deploy to Zircuit Testnet**
```bash
npx hardhat run scripts/deployZircuit.js --network zircuitTestnet
```

**Configure Hyperlane**
```bash
npx hyperlane relay --config hyperlane.json
```

---

### 10.7 Developer Notes

- **Environment Isolation:** Run separate `.env` configs for dev, test, and demo environments.  
- **Security:** Never log KEKs, DEKs, or plaintext credentials. Use dummy/mock data only.  
- **Proof Optimization:** Keep circuits minimal to achieve < 1s proving time.  
- **Demo Resilience:** Pre-seed credentials for live demo; have backup video demo ready.  

---

### Summary of Section 10

Section 10 provides a complete **onboarding guide** for ShadowVault: from prerequisites and setup to running locally, deploying on testnet, and executing the demo flow. It ensures hackathon judges, developers, and contributors can quickly interact with the MVP, verify its correctness, and understand its extensibility potential.

---

## 11. Roadmap (Post-Hackathon)

ShadowVault’s MVP demonstrates the feasibility of a **Web3-native, zero-knowledge password manager**. Post-hackathon, the project will evolve into a more robust and extensible system. Section 11 outlines the **short-term**, **medium-term**, and **long-term** roadmap, focusing on technical improvements, ecosystem integration, and governance.

---

### 11.1 Short-Term Roadmap (0–3 Months)

**Objective:** Stabilize the MVP, improve developer experience, and prepare for early adopters.

- **Security Enhancements**  
  - Harden proof circuits for reliability.  
  - Formalize testing of Argon2id, AES-256-GCM, and Poseidon hash integration.  
  - Conduct lightweight code audits for smart contracts.  

- **Developer Tooling**  
  - Publish documentation site with API references and integration guides.  
  - Provide scripts for one-click contract deployment on testnets.  
  - Expand automated test suite for circuit verification and SQL interactions.  

- **UX Improvements**  
  - Refine UI for credential management (add/edit/delete).  
  - Add session timeout handling and buffer-clearing.  
  - Provide visual feedback for proof generation and verification steps.  

- **Community Building**  
  - Release MVP repo as open source (MIT or permissive license).  
  - Onboard contributors via GitHub issues and hackathons.  

---

### 11.2 Medium-Term Roadmap (3–12 Months)

**Objective:** Add advanced functionality and integrations to position ShadowVault as a usable Web3 security primitive.

- **Advanced ZK Features**  
  - Integrate **set-membership proofs** for breached-password detection.  
  - Develop **entropy scoring gadgets** for fine-grained password strength metrics.  
  - Support **password rotation proofs** (ensuring new commitments differ from old ones).  

- **Storage & Availability**  
  - Add **IPFS/Arweave support** for decentralized backup of ciphertext envelopes.  
  - Implement redundancy strategies for Base SQL downtime.  
  - Explore rollup-friendly storage approaches.  

- **Cross-Chain Expansion**  
  - Extend Hyperlane integration to additional L2s (Optimism, Arbitrum).  
  - Provide standardized APIs for credential verification across ecosystems.  

- **SDK Development**  
  - Create developer SDKs in **TypeScript, Rust, and Python**.  
  - Enable dApps to easily integrate ShadowVault credential proofs.  

- **Ecosystem Partnerships**  
  - Pilot integrations with dApps requiring strong password proofs.  
  - Explore use cases in DeFi onboarding, identity verification, and compliance tooling.  

---

### 11.3 Long-Term Roadmap (12–36 Months)

**Objective:** Transition ShadowVault from a hackathon MVP to a production-grade protocol with governance, adoption, and enterprise viability.

- **Governance & Policy Upgrades**  
  - Establish a **DAO** to govern password policy updates.  
  - Allow token-weighted votes to select `policy_version` in Verifier contracts.  
  - Implement on-chain circuit upgrade paths.  

- **Enterprise & Institutional Adoption**  
  - Build compliance modules for **enterprise password policies** (rotation, expiration).  
  - Partner with institutional identity providers for integrations.  
  - Explore commercialization as a SaaS security layer.  

- **Scalability Enhancements**  
  - Optimize proof generation for mobile and low-power devices.  
  - Integrate GPU/ASIC-based proving for enterprise workloads.  
  - Investigate recursive proofs for batch credential compliance.  

- **Ecosystem Integration**  
  - Position ShadowVault as a **primitive for identity systems**, allowing composability with DID (Decentralized Identity) frameworks.  
  - Develop wallet extensions that natively integrate ShadowVault credential verification.  

- **Research & Innovation**  
  - Experiment with homomorphic encryption for advanced policy enforcement.  
  - Explore multiparty proofs for shared/team credential management.  
  - Prototype interoperability with Web2 identity providers.  

---

### 11.4 Guiding Principles for Roadmap Execution

- **Security First:** Maintain uncompromising encryption and proof hygiene.  
- **User-Centric Design:** Balance cryptographic complexity with accessible UX.  
- **Open Source & Collaboration:** Encourage community contributions and ecosystem partnerships.  
- **Composable Infrastructure:** Ensure ShadowVault is modular and integrates seamlessly with other Web3 and security stacks.  
- **Progressive Decentralization:** Start centralized for speed, progressively decentralize for resilience and governance.  

---

### Summary of Section 11

Section 11 defines ShadowVault’s **strategic growth trajectory**. The short-term roadmap focuses on stabilization and developer tooling, the medium-term emphasizes advanced ZK features and integrations, and the long-term envisions ShadowVault as a production-grade protocol governed by a DAO and integrated into global Web3 identity and compliance systems. This staged approach ensures both **technical credibility** and **ecosystem adoption**.

---

## 12. License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 13. Acknowledgements

ShadowVault was developed as part of the **ETH Global Hackathon**.  
Special thanks to the teams behind **Noir**, **Zircuit**, **Base**, **Hyperlane**, and the broader **ZK community** for tools, guidance, and inspiration.
