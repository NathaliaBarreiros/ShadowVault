// src/EventHandlers.ts

import { VaultEntry } from "../generated/schema";
import {
  EntryStored,
  EntryUpdated,
  EntryDeleted,
} from "../generated/ShadowVault/ShadowVault";

export function handleEntryStored(event: EntryStored): void {
  let id =
    event.params.user.toHex() + "-" + event.params.entryId.toString();
  let vaultEntry = new VaultEntry(id);

  vaultEntry.user = event.params.user;
  vaultEntry.entryId = event.params.entryId;
  vaultEntry.metadataHash = event.params.metadataHash;
  vaultEntry.timestamp = event.block.timestamp;
  vaultEntry.isActive = true;

  vaultEntry.save();
}

export function handleEntryUpdated(event: EntryUpdated): void {
  let id =
    event.params.user.toHex() + "-" + event.params.entryId.toString();
  let vaultEntry = VaultEntry.load(id);

  if (vaultEntry == null) {
    // This should not happen if the entry was stored before being updated
    vaultEntry = new VaultEntry(id);
    vaultEntry.user = event.params.user;
    vaultEntry.entryId = event.params.entryId;
  }

  vaultEntry.metadataHash = event.params.metadataHash;
  vaultEntry.timestamp = event.block.timestamp;
  vaultEntry.isActive = true; // An update implies it's active

  vaultEntry.save();
}

export function handleEntryDeleted(event: EntryDeleted): void {
  let id =
    event.params.user.toHex() + "-" + event.params.entryId.toString();
  let vaultEntry = VaultEntry.load(id);

  if (vaultEntry != null) {
    vaultEntry.isActive = false;
    vaultEntry.save();
  }
}
