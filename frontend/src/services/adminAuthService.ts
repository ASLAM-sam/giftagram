import { ENV } from '../config/env';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  data?: {
    user: AdminUser;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Admin Authentication Service
 * 
 * Manages admin session communication with the Cloudflare Worker backend.
 * All requests use `credentials: "include"` because session tokens are stored
 * exclusively in HttpOnly cookies managed by the browser.
 * 
 * NEVER stores passwords or session tokens in localStorage or sessionStorage.
 */
export const adminAuthService = {
  /**
   * Authenticates admin with username and password.
   * On success, backend sets `giftagram_admin_session` HttpOnly cookie.
   */
  async login(usernameRaw: string, passwordRaw: string): Promise<AdminUser> {
    const username = usernameRaw.trim();
    const password = passwordRaw;

    if (!username || !password) {
      throw new Error('Please enter both your admin username and password.');
    }

    const response = await fetch(`${ENV.API_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      throw new Error('Unable to sign in right now. Please try again.');
    }

    if (response.ok && data?.success && data?.data?.user) {
      return data.data.user;
    }

    // Handle specific status codes
    if (response.status === 401) {
      throw new Error(data?.error?.message || 'Invalid username or password.');
    }

    if (response.status === 403) {
      throw new Error(data?.error?.message || 'This administrative account has been deactivated.');
    }

    if (response.status === 400) {
      throw new Error(data?.error?.message || 'Invalid username or password format.');
    }

    throw new Error(data?.error?.message || 'Unable to sign in right now. Please try again.');
  },

  /**
   * Validates existing HttpOnly session cookie and fetches authenticated profile.
   * Returns null if unauthenticated (401) or on network failure.
   */
  async getMe(): Promise<AdminUser | null> {
    try {
      const response = await fetch(`${ENV.API_URL}/api/admin/me`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        // Normal unauthenticated state
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data?.success && data?.data?.user) {
        return data.data.user;
      }

      return null;
    } catch (err) {
      console.warn('[adminAuthService] Session verification failed or server offline:', err);
      return null;
    }
  },

  /**
   * Revokes the active session on the backend and clears HttpOnly cookie.
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${ENV.API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[adminAuthService] Logout request error (session cleared locally):', err);
    }
  },
};
