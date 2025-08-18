// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Verifier.sol";

contract PasswordIntegrityVerifier {
    HonkVerifier public verifier;

    event IntegrityVerified(
        address indexed user,
        bytes32 indexed storedHash,
        bool verified,
        uint256 timestamp
    );

    constructor() {
        verifier = new HonkVerifier();
    }

    function verifyPasswordIntegrity(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (bool) {
        try verifier.verify(proof, publicInputs) {
            emit IntegrityVerified(
                msg.sender,
                publicInputs[0], // stored_hash
                true,
                block.timestamp
            );
            return true;
        } catch {
            emit IntegrityVerified(
                msg.sender,
                publicInputs[0],
                false,
                block.timestamp
            );
            return false;
        }
    }

    function verifyIntegrityProof(
        bytes calldata proof,
        bytes32 storedHash
    ) external view returns (bool) {
        bytes32[] memory publicInputs = new bytes32[](1);
        publicInputs[0] = storedHash;

        return verifier.verify(proof, publicInputs);
    }
}
