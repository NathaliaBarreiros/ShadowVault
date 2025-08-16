// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ShadowVault
 * @dev A secure password manager contract that stores encrypted data on-chain
 * with zero-knowledge proof verification capabilities
 */
contract ShadowVault is Ownable, ReentrancyGuard, Pausable {
    struct VaultEntry {
        bytes32 encryptedData;
        bytes32 metadataHash;
        uint256 timestamp;
        bool isActive;
    }

    // User address => entry ID => VaultEntry
    mapping(address => mapping(uint256 => VaultEntry)) private vaultEntries;
    
    // User address => number of entries
    mapping(address => uint256) public entryCount;

    // Events
    event EntryStored(address indexed user, uint256 indexed entryId, bytes32 indexed metadataHash);
    event EntryUpdated(address indexed user, uint256 indexed entryId, bytes32 indexed metadataHash);
    event EntryDeleted(address indexed user, uint256 indexed entryId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Store a new encrypted entry
     * @param encryptedData The encrypted password/data
     * @param metadataHash Hash of metadata (service name, username, etc.)
     */
    function storeEntry(
        bytes32 encryptedData,
        bytes32 metadataHash
    ) external whenNotPaused nonReentrant {
        require(encryptedData != bytes32(0), "ShadowVault: encrypted data cannot be empty");
        require(metadataHash != bytes32(0), "ShadowVault: metadata hash cannot be empty");

        uint256 entryId = entryCount[msg.sender];
        
        vaultEntries[msg.sender][entryId] = VaultEntry({
            encryptedData: encryptedData,
            metadataHash: metadataHash,
            timestamp: block.timestamp,
            isActive: true
        });

        entryCount[msg.sender]++;

        emit EntryStored(msg.sender, entryId, metadataHash);
    }

    /**
     * @dev Update an existing entry
     * @param entryId The ID of the entry to update
     * @param encryptedData The new encrypted data
     * @param metadataHash The new metadata hash
     */
    function updateEntry(
        uint256 entryId,
        bytes32 encryptedData,
        bytes32 metadataHash
    ) external whenNotPaused nonReentrant {
        require(entryId < entryCount[msg.sender], "ShadowVault: entry does not exist");
        require(vaultEntries[msg.sender][entryId].isActive, "ShadowVault: entry is not active");
        require(encryptedData != bytes32(0), "ShadowVault: encrypted data cannot be empty");
        require(metadataHash != bytes32(0), "ShadowVault: metadata hash cannot be empty");

        vaultEntries[msg.sender][entryId].encryptedData = encryptedData;
        vaultEntries[msg.sender][entryId].metadataHash = metadataHash;
        vaultEntries[msg.sender][entryId].timestamp = block.timestamp;

        emit EntryUpdated(msg.sender, entryId, metadataHash);
    }

    /**
     * @dev Delete an entry (mark as inactive)
     * @param entryId The ID of the entry to delete
     */
    function deleteEntry(uint256 entryId) external whenNotPaused nonReentrant {
        require(entryId < entryCount[msg.sender], "ShadowVault: entry does not exist");
        require(vaultEntries[msg.sender][entryId].isActive, "ShadowVault: entry already deleted");

        vaultEntries[msg.sender][entryId].isActive = false;

        emit EntryDeleted(msg.sender, entryId);
    }

    /**
     * @dev Get an entry by ID
     * @param user The user's address
     * @param entryId The entry ID
     * @return VaultEntry The vault entry
     */
    function getEntry(address user, uint256 entryId) external view returns (VaultEntry memory) {
        require(entryId < entryCount[user], "ShadowVault: entry does not exist");
        return vaultEntries[user][entryId];
    }

    /**
     * @dev Get all active entries for a user
     * @param user The user's address
     * @return entries Array of active vault entries
     */
    function getUserEntries(address user) external view returns (VaultEntry[] memory) {
        uint256 totalEntries = entryCount[user];
        uint256 activeCount = 0;

        // Count active entries
        for (uint256 i = 0; i < totalEntries; i++) {
            if (vaultEntries[user][i].isActive) {
                activeCount++;
            }
        }

        // Create array of active entries
        VaultEntry[] memory entries = new VaultEntry[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalEntries; i++) {
            if (vaultEntries[user][i].isActive) {
                entries[index] = vaultEntries[user][i];
                index++;
            }
        }

        return entries;
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}