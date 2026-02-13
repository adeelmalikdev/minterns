/**
 * Check if a password has been exposed in known data breaches
 * using the Have I Been Pwned Passwords API (k-anonymity model).
 * Only the first 5 chars of the SHA-1 hash are sent — the full password never leaves the client.
 */
export async function checkLeakedPassword(password: string): Promise<{ leaked: boolean; count: number }> {
  try {
    // Hash the password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!response.ok) {
      // If the API is unavailable, fail open (don't block the user)
      console.warn("HIBP API unavailable, skipping leak check");
      return { leaked: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        if (count > 0) {
          return { leaked: true, count };
        }
      }
    }

    return { leaked: false, count: 0 };
  } catch {
    // Fail open on network errors
    console.warn("Password leak check failed, skipping");
    return { leaked: false, count: 0 };
  }
}
