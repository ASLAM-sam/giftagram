/**
 * Admin Authentication & Session Types for Giftagram
 */

export interface AdminUserRow {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'editor';
  active: number;
  created_at: string;
  updated_at: string;
}

export interface AdminSessionRow {
  id: string;
  admin_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
  last_active_at: string;
}

/**
 * Public, safe admin profile returned to clients
 * (Never contains password_hash or token_hash)
 */
export interface AdminProfile {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

