-- ============================================================
-- GIFTAGRAM CLOUDFLARE D1 DATABASE SCHEMA
-- Migration: 0001_initial.sql
-- ============================================================

-- 1. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cakes', 'bouquets', 'cupcakes', etc.
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- in INR (e.g. 799)
    weight TEXT,            -- e.g. "500g"
    active INTEGER NOT NULL DEFAULT 1,
    featured INTEGER NOT NULL DEFAULT 0,
    flavor_category TEXT,   -- 'chocolate', 'fruit', 'premium'
    stem_count INTEGER,     -- for rose bouquets (10, 20, 50, 100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 2. PRODUCT IMAGES (Cloudflare R2 storage reference)
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    r2_key TEXT NOT NULL,   -- e.g. "cakes/royal-chocolate.webp"
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL, -- Human-friendly e.g. GFT-20260913-AB12
    customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'payment_pending', -- 'pending_payment', 'payment_pending', 'deposit_paid', 'confirmed', 'ready', 'completed', 'cancelled'
    subtotal REAL NOT NULL,
    deposit_amount REAL NOT NULL,      -- 50% non-refundable deposit
    remaining_amount REAL NOT NULL,    -- 50% payable on studio pickup
    currency TEXT DEFAULT 'INR',
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);

-- 5. ORDER ITEMS (Immutable price & product snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    unit_price_snapshot REAL NOT NULL,
    quantity INTEGER NOT NULL,
    line_total REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 6. CAKE CUSTOMIZATIONS (Mandatory for cake order items)
CREATE TABLE IF NOT EXISTS cake_customizations (
    id TEXT PRIMARY KEY,
    order_item_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    design_requirements TEXT NOT NULL,
    colors TEXT,
    lettering TEXT,
    additional_notes TEXT,
    deposit_acknowledged INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cake_customizations_item_id ON cake_customizations(order_item_id);

-- 7. PAYMENTS (Razorpay transactions)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT,    -- Razorpay order_id (e.g. order_OPc12...)
    provider_payment_id TEXT,  -- Razorpay payment_id (e.g. pay_OPc12...)
    amount INTEGER NOT NULL,   -- In paise (e.g. 39950 for ₹399.50)
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created', -- 'created', 'authorized', 'captured', 'failed'
    signature_verified INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider_order_id);

-- 8. ORDER EVENTS (Audit trail & webhook logs)
CREATE TABLE IF NOT EXISTS order_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
