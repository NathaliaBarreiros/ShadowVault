// Advanced Password Strength Check
// Checks if password has at least 3 of 4 criteria: uppercase, lowercase, number, symbol, and minimum length

fn main(password: [u8; 24]) -> pub bool {
    let mut has_upper = false;
    let mut has_lower = false;
    let mut has_number = false;
    let mut has_symbol = false;
    let mut length_count = 0;

    for i in 0..24 {
        let c = password[i];

        // Count non-null characters for length
        if c != 0 {
            length_count = length_count + 1;
        }

        // Uppercase (A-Z = 65-90)
        if c >= 65 & c <= 90 {
            has_upper = true;
        }

        // Lowercase (a-z = 97-122)
        if c >= 97 & c <= 122 {
            has_lower = true;
        }

        // Numbers (0-9 = 48-57)
        if c >= 48 & c <= 57 {
            has_number = true;
        }

        // Symbols (simplified: ! and @)
        if c == 33 {
            has_symbol = true;
        }
        if c == 64 {
            has_symbol = true;
        }
    }

    // Count how many criteria are met
    let mut criteria_count = 0;
    if has_upper {
        criteria_count = criteria_count + 1;
    }
    if has_lower {
        criteria_count = criteria_count + 1;
    }
    if has_number {
        criteria_count = criteria_count + 1;
    }
    if has_symbol {
        criteria_count = criteria_count + 1;
    }

    // Must have at least 12 characters AND at least 3 of 4 criteria
    let length_ok = length_count >= 12;
    let criteria_ok = criteria_count >= 3;

    length_ok & criteria_ok
}

#[test]
fn test_strong_password() {
    let password = [
        75, 106, 56, 35, 109, 78, 50, 36, 112, 76, 57, 64, 120, 81, 55, 38, 118, 82, 52, 33, 0, 0,
        0, 0,
    ];
    let result = main(password);
    assert(result == true);
}

#[test]
fn test_weak_password() {
    let password =
        [112, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let result = main(password);
    assert(result == false);
}

#[test]
fn test_medium_password() {
    // "Password123" - has uppercase, lowercase, and numbers (3 criteria)
    let password =
        [80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let result = main(password);
    assert(result == false); // Only 11 chars, needs 12
}

#[test]
fn test_long_password() {
    // "Password123!" - 12 chars with uppercase, lowercase, numbers, and symbol (4 criteria)
    let password =
        [80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let result = main(password);
    assert(result == true);
}

#[test]
fn test_three_criteria() {
    // "Password123" - 12 chars with uppercase, lowercase, numbers (3 criteria, no symbols)
    let password =
        [80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let result = main(password);
    assert(result == true);
}
