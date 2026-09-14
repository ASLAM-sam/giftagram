-- ============================================================
-- GIFTAGRAM CLOUDFLARE D1 DATABASE SCHEMA
-- Migration: 0006_add_delivery_address.sql
-- Description: Adds delivery address and fulfillment snapshot columns to orders table
-- ============================================================

ALTER TABLE orders ADD COLUMN fulfillment_type TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN address_line1 TEXT;
ALTER TABLE orders ADD COLUMN address_line2 TEXT;
ALTER TABLE orders ADD COLUMN locality TEXT;
ALTER TABLE orders ADD COLUMN city TEXT;
ALTER TABLE orders ADD COLUMN state TEXT;
ALTER TABLE orders ADD COLUMN pincode TEXT;
ALTER TABLE orders ADD COLUMN delivery_date TEXT;
ALTER TABLE orders ADD COLUMN delivery_time TEXT;
