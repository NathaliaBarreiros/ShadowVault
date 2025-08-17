// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ShadowVaultV2
 * @dev A secure password manager contract that stores Walrus CIDs and password hashes
 * Compatible with the frontend ZircuitObject format
 */
contract ShadowVaultV2 is Ownable, ReentrancyGuard, Pausable {
    struct VaultItem {
        string storedHash;      // Hash of the password (hex string)
        string walrusCid;       // Walrus blob ID (CID for decentralized storage)
        uint256 timestamp;      // When the entry was created
        bool isActive;          // Whether the entry is active
    }

    // User address => entry ID => VaultItem
    mapping(address => mapping(uint256 => VaultItem)) private vaultItems;
    
    // User address => number of entries
    mapping(address => uint256) public entryCount;

    // Events
    event VaultItemStored(
        address indexed user, 
        uint256 indexed entryId, 
        string indexed storedHash, 
        string walrusCid
    );
    event VaultItemUpdated(
        address indexed user, 
        uint256 indexed entryId, 
        string indexed storedHash, 
        string walrusCid
    );
    event VaultItemDeleted(address indexed user, uint256 indexed entryId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Store a new vault item with Walrus CID and password hash
     * @param storedHash Hash of the password (hex string)
     * @param walrusCid Walrus blob ID where encrypted data is stored
     */
    function storeVaultItem(
        string calldata storedHash,
        string calldata walrusCid
    ) external whenNotPaused nonReentrant {
        require(bytes(storedHash).length > 0, "ShadowVaultV2: stored hash cannot be empty");
        require(bytes(walrusCid).length > 0, "ShadowVaultV2: Walrus CID cannot be empty");

        uint256 entryId = entryCount[msg.sender];
        
        vaultItems[msg.sender][entryId] = VaultItem({
            storedHash: storedHash,
            walrusCid: walrusCid,
            timestamp: block.timestamp,
            isActive: true
        });

        entryCount[msg.sender]++;

        emit VaultItemStored(msg.sender, entryId, storedHash, walrusCid);
    }

    /**
     * @dev Update an existing vault item
     * @param entryId The ID of the entry to update
     * @param storedHash New hash of the password
     * @param walrusCid New Walrus blob ID
     */
    function updateVaultItem(
        uint256 entryId,
        string calldata storedHash,
        string calldata walrusCid
    ) external whenNotPaused nonReentrant {
        require(entryId < entryCount[msg.sender], "ShadowVaultV2: entry does not exist");
        require(vaultItems[msg.sender][entryId].isActive, "ShadowVaultV2: entry is not active");
        require(bytes(storedHash).length > 0, "ShadowVaultV2: stored hash cannot be empty");
        require(bytes(walrusCid).length > 0, "ShadowVaultV2: Walrus CID cannot be empty");

        vaultItems[msg.sender][entryId].storedHash = storedHash;
        vaultItems[msg.sender][entryId].walrusCid = walrusCid;
        vaultItems[msg.sender][entryId].timestamp = block.timestamp;

        emit VaultItemUpdated(msg.sender, entryId, storedHash, walrusCid);
    }

    /**
     * @dev Delete a vault item (mark as inactive)
     * @param entryId The ID of the entry to delete
     */
    function deleteVaultItem(uint256 entryId) external whenNotPaused nonReentrant {
        require(entryId < entryCount[msg.sender], "ShadowVaultV2: entry does not exist");
        require(vaultItems[msg.sender][entryId].isActive, "ShadowVaultV2: entry already deleted");

        vaultItems[msg.sender][entryId].isActive = false;

        emit VaultItemDeleted(msg.sender, entryId);
    }

    /**
     * @dev Get a vault item by ID
     * @param user The user's address
     * @param entryId The entry ID
     * @return The vault item data
     */
    function getVaultItem(
        address user, 
        uint256 entryId
    ) external view returns (VaultItem memory) {
        require(entryId < entryCount[user], "ShadowVaultV2: entry does not exist");
        return vaultItems[user][entryId];
    }

    /**
     * @dev Get all active vault items for a user
     * @param user The user's address
     * @return items Array of active vault items
     * @return itemIds Array of corresponding entry IDs
     */
    function getUserVaultItems(address user) external view returns (
        VaultItem[] memory items, 
        uint256[] memory itemIds
    ) {
        uint256 userEntryCount = entryCount[user];
        uint256 activeCount = 0;

        // First pass: count active items
        for (uint256 i = 0; i < userEntryCount; i++) {
            if (vaultItems[user][i].isActive) {
                activeCount++;
            }
        }

        // Second pass: populate arrays
        items = new VaultItem[](activeCount);
        itemIds = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < userEntryCount; i++) {
            if (vaultItems[user][i].isActive) {
                items[index] = vaultItems[user][i];
                itemIds[index] = i;
                index++;
            }
        }

        return (items, itemIds);
    }

    /**
     * @dev Get the number of entries for a user
     * @param user The user's address
     * @return The number of entries
     */
    function getUserEntryCount(address user) external view returns (uint256) {
        return entryCount[user];
    }

    /**
     * @dev Check if a vault item exists and is active
     * @param user The user's address
     * @param entryId The entry ID
     * @return Whether the item exists and is active
     */
    function isVaultItemActive(address user, uint256 entryId) external view returns (bool) {
        if (entryId >= entryCount[user]) {
            return false;
        }
        return vaultItems[user][entryId].isActive;
    }

    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }
}