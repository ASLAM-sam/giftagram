-- ============================================================
-- GIFTAGRAM CLOUDFLARE D1 DATABASE SCHEMA
-- Migration: 0003_add_cloudinary_fields.sql
-- Description: Non-destructive migration to add Cloudinary fields to product_images
-- ============================================================

ALTER TABLE product_images ADD COLUMN secure_url TEXT;
ALTER TABLE product_images ADD COLUMN public_id TEXT;
ALTER TABLE product_images ADD COLUMN folder TEXT;
ALTER TABLE product_images ADD COLUMN is_primary INTEGER DEFAULT 0;
