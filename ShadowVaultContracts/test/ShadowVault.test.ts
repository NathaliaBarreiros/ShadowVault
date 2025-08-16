import { expect } from "chai";
import { ethers } from "hardhat";
import { ShadowVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ShadowVault", function () {
  let shadowVault: ShadowVault;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ShadowVault = await ethers.getContractFactory("ShadowVault");
    shadowVault = await ShadowVault.deploy(owner.address);
    await shadowVault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await shadowVault.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await shadowVault.paused()).to.equal(false);
    });
  });

  describe("Entry Management", function () {
    const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("encrypted_password"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("example.com:user@example.com"));

    it("Should store an entry successfully", async function () {
      await expect(shadowVault.connect(user1).storeEntry(encryptedData, metadataHash))
        .to.emit(shadowVault, "EntryStored")
        .withArgs(user1.address, 0, metadataHash);

      expect(await shadowVault.entryCount(user1.address)).to.equal(1);
    });

    it("Should reject empty encrypted data", async function () {
      const emptyData = ethers.ZeroHash;
      await expect(
        shadowVault.connect(user1).storeEntry(emptyData, metadataHash)
      ).to.be.revertedWith("ShadowVault: encrypted data cannot be empty");
    });

    it("Should reject empty metadata hash", async function () {
      const emptyHash = ethers.ZeroHash;
      await expect(
        shadowVault.connect(user1).storeEntry(encryptedData, emptyHash)
      ).to.be.revertedWith("ShadowVault: metadata hash cannot be empty");
    });

    it("Should update an existing entry", async function () {
      // Store initial entry
      await shadowVault.connect(user1).storeEntry(encryptedData, metadataHash);

      // Update the entry
      const newEncryptedData = ethers.keccak256(ethers.toUtf8Bytes("new_encrypted_password"));
      const newMetadataHash = ethers.keccak256(ethers.toUtf8Bytes("newsite.com:user@example.com"));

      await expect(shadowVault.connect(user1).updateEntry(0, newEncryptedData, newMetadataHash))
        .to.emit(shadowVault, "EntryUpdated")
        .withArgs(user1.address, 0, newMetadataHash);

      const entry = await shadowVault.getEntry(user1.address, 0);
      expect(entry.encryptedData).to.equal(newEncryptedData);
      expect(entry.metadataHash).to.equal(newMetadataHash);
    });

    it("Should delete an entry", async function () {
      // Store initial entry
      await shadowVault.connect(user1).storeEntry(encryptedData, metadataHash);

      // Delete the entry
      await expect(shadowVault.connect(user1).deleteEntry(0))
        .to.emit(shadowVault, "EntryDeleted")
        .withArgs(user1.address, 0);

      const entry = await shadowVault.getEntry(user1.address, 0);
      expect(entry.isActive).to.equal(false);
    });

    it("Should get user entries correctly", async function () {
      // Store multiple entries
      await shadowVault.connect(user1).storeEntry(encryptedData, metadataHash);
      await shadowVault.connect(user1).storeEntry(
        ethers.keccak256(ethers.toUtf8Bytes("encrypted_password_2")),
        ethers.keccak256(ethers.toUtf8Bytes("example2.com:user@example.com"))
      );

      // Delete one entry
      await shadowVault.connect(user1).deleteEntry(0);

      // Get active entries
      const entries = await shadowVault.getUserEntries(user1.address);
      expect(entries.length).to.equal(1);
      expect(entries[0].isActive).to.equal(true);
    });

    it("Should handle multiple users independently", async function () {
      // User1 stores an entry
      await shadowVault.connect(user1).storeEntry(encryptedData, metadataHash);

      // User2 stores an entry
      await shadowVault.connect(user2).storeEntry(
        ethers.keccak256(ethers.toUtf8Bytes("encrypted_password_user2")),
        ethers.keccak256(ethers.toUtf8Bytes("example.com:user2@example.com"))
      );

      expect(await shadowVault.entryCount(user1.address)).to.equal(1);
      expect(await shadowVault.entryCount(user2.address)).to.equal(1);

      const user1Entries = await shadowVault.getUserEntries(user1.address);
      const user2Entries = await shadowVault.getUserEntries(user2.address);

      expect(user1Entries.length).to.equal(1);
      expect(user2Entries.length).to.equal(1);
      expect(user1Entries[0].encryptedData).to.not.equal(user2Entries[0].encryptedData);
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to pause", async function () {
      await expect(shadowVault.connect(user1).pause())
        .to.be.revertedWithCustomError(shadowVault, "OwnableUnauthorizedAccount");

      await shadowVault.connect(owner).pause();
      expect(await shadowVault.paused()).to.equal(true);
    });

    it("Should allow only owner to unpause", async function () {
      await shadowVault.connect(owner).pause();

      await expect(shadowVault.connect(user1).unpause())
        .to.be.revertedWithCustomError(shadowVault, "OwnableUnauthorizedAccount");

      await shadowVault.connect(owner).unpause();
      expect(await shadowVault.paused()).to.equal(false);
    });

    it("Should prevent operations when paused", async function () {
      const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("encrypted_password"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("example.com:user@example.com"));

      await shadowVault.connect(owner).pause();

      await expect(
        shadowVault.connect(user1).storeEntry(encryptedData, metadataHash)
      ).to.be.revertedWithCustomError(shadowVault, "EnforcedPause");
    });
  });

  describe("Edge Cases", function () {
    it("Should revert when trying to update non-existent entry", async function () {
      const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("encrypted_password"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("example.com:user@example.com"));

      await expect(
        shadowVault.connect(user1).updateEntry(0, encryptedData, metadataHash)
      ).to.be.revertedWith("ShadowVault: entry does not exist");
    });

    it("Should revert when trying to delete non-existent entry", async function () {
      await expect(
        shadowVault.connect(user1).deleteEntry(0)
      ).to.be.revertedWith("ShadowVault: entry does not exist");
    });

    it("Should revert when trying to update deleted entry", async function () {
      const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("encrypted_password"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("example.com:user@example.com"));

      // Store and delete entry
      await shadowVault.connect(user1).storeEntry(encryptedData, metadataHash);
      await shadowVault.connect(user1).deleteEntry(0);

      // Try to update deleted entry
      await expect(
        shadowVault.connect(user1).updateEntry(0, encryptedData, metadataHash)
      ).to.be.revertedWith("ShadowVault: entry is not active");
    });

    it("Should revert when trying to delete already deleted entry", async function () {
      const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("encrypted_password"));
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("example.com:user@example.com"));

      // Store and delete entry
      await shadowVault.connect(user1).storeEntry(encryptedData, metadataHash);
      await shadowVault.connect(user1).deleteEntry(0);

      // Try to delete again
      await expect(
        shadowVault.connect(user1).deleteEntry(0)
      ).to.be.revertedWith("ShadowVault: entry already deleted");
    });
  });
});