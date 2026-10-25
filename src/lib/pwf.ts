import { createHash } from "crypto";

// A short fingerprint of a stored password hash. A sign-in cookie carries it, and
// when the password is changed or reset the fingerprint no longer matches, so
// every older cookie stops working. The password itself is never in the cookie.
export function passwordFingerprint(hash: string): string {
  return createHash("sha256").update(hash).digest("hex").slice(0, 16);
}
