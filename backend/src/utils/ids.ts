/**
 * ID and Order Number Generators
 */

/**
 * Generates an unpredictable standard UUID v4 for primary keys
 */
export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid.replace(/-/g, '')}` : uuid;
}

/**
 * Generates a human-friendly boutique order reference:
 * Format: GFT-YYYYMMDD-XXXX (e.g. GFT-20260913-7A39)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  // 4 random alphanumeric characters (base36)
  const randomBytes = new Uint8Array(2);
  crypto.getRandomValues(randomBytes);
  const randomSuffix = ((randomBytes[0] << 8) | randomBytes[1])
    .toString(36)
    .toUpperCase()
    .padStart(4, '0')
    .slice(-4);

  return `GFT-${datePart}-${randomSuffix}`;
}
