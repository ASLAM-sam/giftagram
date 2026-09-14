/**
 * Cookie parsing and serialization utilities for Cloudflare Workers
 */

export const ADMIN_SESSION_COOKIE_NAME = 'giftagram_admin_session';

export interface CookieSerializeOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  path?: string;
  domain?: string;
}

/**
 * Parses the `Cookie` header from a Request into a key-value record
 */
export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie');
  if (!cookieHeader) {
    return {};
  }

  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = decodeURIComponent(trimmed.substring(0, eqIdx).trim());
    let val = trimmed.substring(eqIdx + 1).trim();

    // Strip surrounding quotes if present
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }

    cookies[key] = decodeURIComponent(val);
  }

  return cookies;
}

/**
 * Serializes a cookie name, value, and options into a Set-Cookie string
 */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {}
): string {
  const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  const path = options.path || '/';
  parts.push(`Path=${path}`);

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  } else {
    parts.push('SameSite=Lax');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }

  return parts.join('; ');
}

/**
 * Creates the Set-Cookie header string for an admin login session
 */
export function createAdminSessionCookie(
  token: string,
  isSecure: boolean,
  maxAgeSeconds = 604800
): string {
  return serializeCookie(ADMIN_SESSION_COOKIE_NAME, token, {
    maxAge: maxAgeSeconds,
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'None' : 'Lax',
    path: '/',
  });
}

/**
 * Creates the Set-Cookie header string for clearing an admin session (logout)
 */
export function createAdminClearCookie(isSecure: boolean): string {
  return serializeCookie(ADMIN_SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'None' : 'Lax',
    path: '/',
  });
}
