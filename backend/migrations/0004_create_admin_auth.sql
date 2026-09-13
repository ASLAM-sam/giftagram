-- ============================================================
-- GIFTAGRAM CLOUDFLARE D1 DATABASE SCHEMA
-- Migration: 0004_create_admin_auth.sql
-- Description: Creates admin_users (username-based) and admin_sessions tables
-- ============================================================

-- 1. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username
ON admin_users(username);

CREATE INDEX IF NOT EXISTS idx_admin_users_active
ON admin_users(active);

-- 2. ADMIN SESSIONS (Opaque tokens stored as SHA-256 hashes)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id)
        REFERENCES admin_users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash
ON admin_sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id
ON admin_sessions(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
ON admin_sessions(expires_at);
