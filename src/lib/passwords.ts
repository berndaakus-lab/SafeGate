// Lower-case letters and digits only (no shift key on a phone), and no
// look-alike characters (0/o, 1/l/i), so a password read from a message is typed
// correctly. Everyone must replace it at first sign-in. Uses the Web Crypto API,
// which works both in the browser and on the server.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomPassword(length = 8): string {
  const limit = 256 - (256 % ALPHABET.length); // reject values that would bias the pick
  let out = "";
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of bytes) {
      if (b < limit && out.length < length) out += ALPHABET[b % ALPHABET.length];
    }
  }
  return out;
}
