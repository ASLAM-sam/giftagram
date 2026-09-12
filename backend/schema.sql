-- Cloudflare D1 Schema for Giftagram

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cakes' | 'bouquets'
    price INTEGER NOT NULL,
    weight TEXT,
    short_description TEXT,
    description TEXT,
    images TEXT, -- JSON array of image URLs
    featured BOOLEAN DEFAULT 0,
    flavor_category TEXT,
    stem_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, -- e.g. GFT-2026-XXXX
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    special_instructions TEXT,
    subtotal REAL NOT NULL,
    deposit_required REAL NOT NULL, -- 50% non-refundable deposit
    balance_due REAL NOT NULL,
    payment_status TEXT DEFAULT 'deposit_pending', -- 'deposit_pending' | 'deposit_paid' | 'completed'
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    cake_design_notes TEXT,
    cake_colors TEXT,
    cake_lettering TEXT,
    agreed_to_deposit BOOLEAN DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
