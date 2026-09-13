import { timingSafeEqual } from '../utils/crypto';

const PBKDF2_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const DEFAULT_ITERATIONS = 100000;
const SALT_BYTES = 16;
const KEY_LENGTH_BITS = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export const passwordService = {
  /**
   * Hashes a plaintext password using native WebCrypto PBKDF2-SHA256
   * Format: pbkdf2$sha256$100000$<salt_hex>$<hash_hex>
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Generate 16 cryptographically random bytes for salt
    const saltBytes = new Uint8Array(SALT_BYTES);
    crypto.getRandomValues(saltBytes);

    const encoder = new TextEncoder();
    const passKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: PBKDF2_ALGORITHM },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: PBKDF2_ALGORITHM,
        salt: saltBytes,
        iterations: DEFAULT_ITERATIONS,
        hash: HASH_ALGORITHM,
      },
      passKey,
      KEY_LENGTH_BITS
    );

    const saltHex = bytesToHex(saltBytes);
    const hashHex = bytesToHex(new Uint8Array(derivedBits));

    return `pbkdf2$sha256$${DEFAULT_ITERATIONS}$${saltHex}$${hashHex}`;
  },

  /**
   * Verifies a candidate password against a stored modular hash string.
   * Gracefully returns false on malformed hashes or mismatch.
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
      return false;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 5) {
      return false;
    }

    const [scheme, algorithm, iterationsStr, saltHex, originalHashHex] = parts;

    if (scheme !== 'pbkdf2' || algorithm !== 'sha256') {
      return false;
    }

    const iterations = parseInt(iterationsStr, 10);
    if (isNaN(iterations) || iterations < 1000 || iterations > 1000000) {
      return false;
    }

    const saltBytes = hexToBytes(saltHex);
    if (!saltBytes || saltBytes.length < 8) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const passKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: PBKDF2_ALGORITHM },
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: PBKDF2_ALGORITHM,
          salt: saltBytes,
          iterations,
          hash: HASH_ALGORITHM,
        },
        passKey,
        KEY_LENGTH_BITS
      );

      const computedHashHex = bytesToHex(new Uint8Array(derivedBits));

      return timingSafeEqual(computedHashHex, originalHashHex);
    } catch {
      return false;
    }
  },
};
