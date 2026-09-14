-- ============================================================
-- GIFTAGRAM CLOUDFLARE D1 DATABASE SCHEMA
-- Migration: 0005_create_rate_limits.sql
-- Description: Creates persistent edge rate limiting table for sensitive endpoints
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at
ON rate_limits(reset_at);
