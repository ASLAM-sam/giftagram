import { generateId } from '../utils/ids';
import { AdminUserRow } from '../types/admin';

export const SESSION_LIFETIME_SECONDS = 604800; // 7 days in seconds

/**
 * Computes SHA-256 hash of a string using WebCrypto
 */
export async function hashSessionToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a 32-byte cryptographically secure random token (64 hex characters)
 */
export function generateRawSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const sessionService = {
  /**
   * Creates a new D1-backed session.
   * Generates a 32-byte raw token, but only stores SHA-256(rawToken) in D1.
   */
  async createSession(
    db: D1Database,
    adminId: string,
    metadata?: { userAgent?: string; ip?: string }
  ): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = generateRawSessionToken();
    const tokenHash = await hashSessionToken(rawToken);
    const sessionId = generateId('sess');

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000);
    const expiresAtIso = expiresAt.toISOString();

    await db
      .prepare(
        `INSERT INTO admin_sessions (id, admin_id, token_hash, user_agent, ip_address, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        sessionId,
        adminId,
        tokenHash,
        metadata?.userAgent || null,
        metadata?.ip || null,
        expiresAtIso
      )
      .run();

    return {
      token: rawToken,
      expiresAt,
    };
  },

  /**
   * Validates an incoming session token by hashing it and looking up in D1.
   * Requires that expires_at > CURRENT_TIMESTAMP and admin user active == 1.
   */
  async validateSession(db: D1Database, rawToken: string): Promise<AdminUserRow | null> {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
      return null;
    }

    const tokenHash = await hashSessionToken(rawToken);

    // Look up session with active admin user
    // Note: SQLite CURRENT_TIMESTAMP is 'YYYY-MM-DD HH:MM:SS' UTC, ISO is comparable or strftime
    const result = await db
      .prepare(
        `SELECT 
           u.id,
           u.username,
           u.password_hash,
           u.full_name,
           u.role,
           u.active,
           u.created_at,
           u.updated_at
         FROM admin_sessions s
         JOIN admin_users u ON s.admin_id = u.id
         WHERE s.token_hash = ?
           AND datetime(s.expires_at) > datetime('now')
           AND u.active = 1
         LIMIT 1`
      )
      .bind(tokenHash)
      .first<AdminUserRow>();

    if (!result) {
      return null;
    }

    // Touch last_active_at non-blockingly
    try {
      await db
        .prepare(`UPDATE admin_sessions SET last_active_at = CURRENT_TIMESTAMP WHERE token_hash = ?`)
        .bind(tokenHash)
        .run();
    } catch {
      // Ignore update error if any
    }

    return result;
  },

  /**
   * Revokes a single session by token hash (e.g. on logout)
   */
  async revokeSession(db: D1Database, rawToken: string): Promise<void> {
    if (!rawToken || typeof rawToken !== 'string') return;
    const tokenHash = await hashSessionToken(rawToken);
    await db.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).bind(tokenHash).run();
  },

  /**
   * Revokes all active sessions for a specific admin user (e.g. on password change or deactivation)
   */
  async revokeAllAdminSessions(db: D1Database, adminId: string): Promise<void> {
    await db.prepare(`DELETE FROM admin_sessions WHERE admin_id = ?`).bind(adminId).run();
  },
};
