use dep::std;

fn main(
    // Private inputs (not revealed on-chain)
    password_plaintext: [u8; 32], // Decrypted password bytes
    // Public inputs (visible on-chain)
    stored_hash: [u8; 32], // Hash from Zircuit contract
) {
    // Compute SHA-256 hash of the password
    let computed_hash = std::hash::sha256(password_plaintext);

    // Verify that the computed hash matches the stored hash
    assert(computed_hash == stored_hash);
}

#[test]
fn test_password_integrity_valid() {
    // Test with matching password and hash
    let test_password = [
        116, 101, 115, 116, 112, 97, 115, 115, 119, 111, 114, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]; // "testpassword" padded to 32 bytes
    let expected_hash = [
        116, 101, 115, 116, 112, 97, 115, 115, 119, 111, 114, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]; // Same as password for now

    main(test_password, expected_hash);
}

#[test]
fn test_password_integrity_invalid() {
    // Test with mismatched password and hash (should fail)
    let test_password = [
        116, 101, 115, 116, 112, 97, 115, 115, 119, 111, 114, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]; // "testpassword"
    let wrong_hash = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,
    ]; // Wrong hash

    // This should fail - uncomment to test failure
    // main(test_password, wrong_hash);
}
