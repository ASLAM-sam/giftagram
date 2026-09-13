import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseCookies, ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookie, createAdminClearCookie } from '../utils/cookie';
import { passwordService } from '../services/passwordService';
import { sessionService } from '../services/sessionService';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { AdminUserRow, AdminProfile } from '../types/admin';

function isSecureRequest(request: Request, env: Env): boolean {
  try {
    const url = new URL(request.url);
    if (url.protocol === 'https:') return true;
  } catch {
    // Ignore URL parse error
  }
  return env.ENVIRONMENT === 'production';
}

/**
 * POST /api/admin/login
 * Validates admin credentials, creates D1 session, and sets HttpOnly cookie.
 */
export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const usernameRaw = body?.username;
  const passwordRaw = body?.password;

  if (!usernameRaw || typeof usernameRaw !== 'string' || !usernameRaw.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Username is required', 400);
  }

  const username = usernameRaw.trim().toLowerCase();
  if (username.length < 3 || username.length > 64) {
    return errorResponse('VALIDATION_ERROR', 'Username must be between 3 and 64 characters', 400);
  }

  if (!passwordRaw || typeof passwordRaw !== 'string' || !passwordRaw.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Password is required', 400);
  }

  const password = passwordRaw;

  try {
    // Lookup admin in D1
    const admin = await env.DB
      .prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1')
      .bind(username)
      .first<AdminUserRow>();

    if (!admin) {
      // Return generic error to prevent account enumeration
      return errorResponse('INVALID_CREDENTIALS', 'Invalid username or password', 401);
    }

    if (admin.active !== 1) {
      return errorResponse('ACCOUNT_DEACTIVATED', 'This administrative account has been deactivated.', 403);
    }

    // Verify password hash
    const isValidPassword = await passwordService.verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid username or password', 401);
    }

    // Extract request metadata
    const userAgent = request.headers.get('User-Agent') || undefined;
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || undefined;

    // Create D1 session
    const { token } = await sessionService.createSession(env.DB, admin.id, { userAgent, ip });

    // Build Set-Cookie header
    const isSecure = isSecureRequest(request, env);
    const cookieHeader = createAdminSessionCookie(token, isSecure);

    const userProfile: AdminProfile = {
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name,
      role: admin.role,
    };

    return jsonResponse(
      { user: userProfile },
      200,
      { 'Set-Cookie': cookieHeader }
    );
  } catch (err: any) {
    console.error('[handleAdminLogin] Error:', err?.message || err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to authenticate admin', 500);
  }
}

/**
 * POST /api/admin/logout
 * Revokes the current D1 session and expires the HttpOnly cookie.
 */
export async function handleAdminLogout(request: Request, env: Env): Promise<Response> {
  try {
    const cookies = parseCookies(request);
    const token = cookies[ADMIN_SESSION_COOKIE_NAME];

    if (token) {
      await sessionService.revokeSession(env.DB, token);
    }

    const isSecure = isSecureRequest(request, env);
    const clearCookieHeader = createAdminClearCookie(isSecure);

    return jsonResponse(
      { message: 'Logged out successfully' },
      200,
      { 'Set-Cookie': clearCookieHeader }
    );
  } catch (err: any) {
    console.error('[handleAdminLogout] Error:', err?.message || err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to complete logout', 500);
  }
}

/**
 * GET /api/admin/me
 * Protected endpoint returning authenticated admin profile.
 */
export async function handleAdminMe(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) {
    return auth.response;
  }

  const userProfile: AdminProfile = {
    id: auth.admin.id,
    username: auth.admin.username,
    fullName: auth.admin.full_name,
    role: auth.admin.role,
    createdAt: auth.admin.created_at,
  };

  return jsonResponse({ user: userProfile }, 200);
}
