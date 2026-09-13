import { Env } from '../env';
import { parseCookies, ADMIN_SESSION_COOKIE_NAME } from '../utils/cookie';
import { sessionService } from '../services/sessionService';
import { errorResponse } from '../utils/response';
import { AdminUserRow } from '../types/admin';

export type AuthResult =
  | { success: true; admin: AdminUserRow }
  | { success: false; response: Response };

/**
 * Authentication middleware for protected admin endpoints.
 * Validates the HttpOnly giftagram_admin_session cookie against D1.
 */
export async function requireAdminAuth(request: Request, env: Env): Promise<AuthResult> {
  const cookies = parseCookies(request);
  const token = cookies[ADMIN_SESSION_COOKIE_NAME];

  if (!token) {
    return {
      success: false,
      response: errorResponse('UNAUTHORIZED', 'Authentication required. Please log in.', 401),
    };
  }

  try {
    const admin = await sessionService.validateSession(env.DB, token);

    if (!admin) {
      return {
        success: false,
        response: errorResponse('UNAUTHORIZED', 'Invalid or expired session. Please log in again.', 401),
      };
    }

    if (admin.active !== 1) {
      return {
        success: false,
        response: errorResponse('FORBIDDEN', 'This administrative account has been deactivated.', 403),
      };
    }

    return {
      success: true,
      admin,
    };
  } catch (err: any) {
    console.error('[requireAdminAuth] Session validation error:', err?.message || err);
    return {
      success: false,
      response: errorResponse('INTERNAL_SERVER_ERROR', 'Failed to authenticate session', 500),
    };
  }
}
