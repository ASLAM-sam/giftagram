# Giftagram Cloudflare Workers API & D1 Backend

High-performance, edge-native backend for the Giftagram luxury bakery and floral gifting e-commerce platform.

## Architecture

```
React / Vite Frontend
       │
       ▼ (HTTPS / JSON)
Cloudflare Worker API (`giftagram-backend`)
       │
  ┌────┼──────────────┐
  ▼    ▼              ▼
Cloudflare D1    Razorpay API    Cloudflare Secrets
(Database)       (50% Deposit)   (Encrypted Keys)
```

## API Endpoints Reference

### 1. Health & Infrastructure

#### `GET /api/health`
Returns service health status and D1 database connectivity.

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "giftagram-api",
    "status": "healthy",
    "environment": "development",
    "database": "connected",
    "timestamp": "2026-09-13T16:45:00.000Z"
  }
}
```

---

### 2. Products & Catalog

#### `GET /api/products`
Retrieves all active products. Supports filtering by category, featured status, or keyword search.

**Query Parameters:**
- `category` (optional): `cakes` | `bouquets`
- `featured` (optional): `true` | `false`
- `search` (optional): search term (e.g. `chocolate`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cake-belgium",
      "slug": "chocolate-belgium",
      "name": "Chocolate Belgium",
      "category": "cakes",
      "description": "Rich Belgian chocolate ganache layered with moist cocoa sponge.",
      "shortDescription": "Rich Belgian chocolate ganache layered with moist cocoa sponge.",
      "price": 499,
      "weight": "500g",
      "images": ["/assets/cakes/chocolate-belgium.webp"],
      "featured": true,
      "tags": ["cakes", "chocolate"],
      "flavorCategory": "chocolate"
    }
  ]
}
```

#### `GET /api/products/:slug`
Retrieves full details for a single product by URL slug.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cake-royal-chocolate",
    "slug": "royal-chocolate",
    "name": "Royal Chocolate",
    "category": "cakes",
    "price": 799,
    "weight": "500g",
    "images": ["/assets/cakes/royal-chocolate.webp"],
    "featured": true
  }
}
```
**Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product \"...\" was not found or is no longer available."
  }
}
```

#### `GET /api/categories`
Returns active categories and future coming-soon categories.

---

### 3. Orders

#### `POST /api/orders`
Creates an order with server-side authoritative price recalculation. Frontend prices are ignored to prevent tampering.

**Request Body:**
```json
{
  "customer": {
    "name": "Alisha Sharma",
    "phone": "8141376677",
    "email": "alisha@example.com"
  },
  "pickupDate": "2026-09-18",
  "pickupTime": "14:00",
  "specialInstructions": "Please include candles",
  "items": [
    {
      "productId": "cake-royal-chocolate",
      "quantity": 1,
      "cakeCustomization": {
        "fullName": "Alisha Sharma",
        "phone": "8141376677",
        "pickupDate": "2026-09-18",
        "pickupTime": "14:00",
        "designRequirements": "Vintage Lambeth piped border",
        "colors": "Blush and cream",
        "lettering": "Happy 25th",
        "additionalNotes": "Fragile",
        "depositAcknowledged": true
      }
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ord_a1b2c3d4",
    "orderNumber": "GFT-20260913-7X9K",
    "subtotal": 799,
    "depositAmount": 399.50,
    "depositAmountPaise": 39950,
    "remainingAmount": 399.50,
    "status": "payment_pending",
    "createdAt": "2026-09-13T16:45:00.000Z"
  }
}
```

#### `POST /api/orders/lookup`
Tracks order status for customers using Order Number + Phone.

**Request Body:**
```json
{
  "orderNumber": "GFT-20260913-7X9K",
  "phone": "8141376677"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderNumber": "GFT-20260913-7X9K",
    "status": "deposit_paid",
    "customerName": "Alisha Sharma",
    "pickupDate": "2026-09-18",
    "pickupTime": "14:00",
    "subtotal": 799,
    "depositAmount": 399.50,
    "remainingAmount": 399.50,
    "items": [
      {
        "productName": "Royal Chocolate",
        "quantity": 1,
        "unitPrice": 799,
        "lineTotal": 799
      }
    ]
  }
}
```

---

### 4. Payments (Razorpay)

#### `POST /api/payments/create-order`
Generates a Razorpay Order ID for the 50% deposit amount. Handled server-side to protect secrets.

**Request:**
```json
{
  "orderId": "ord_a1b2c3d4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keyId": "rzp_test_placeholder",
    "razorpayOrderId": "order_MNOP123456",
    "amount": 39950,
    "currency": "INR",
    "orderNumber": "GFT-20260913-7X9K"
  }
}
```

#### `POST /api/payments/verify`
Mandatory HMAC-SHA256 signature verification. Transitions order from `payment_pending` to `deposit_paid`.

**Request:**
```json
{
  "orderId": "ord_a1b2c3d4",
  "razorpayOrderId": "order_MNOP123456",
  "razorpayPaymentId": "pay_QRST789012",
  "razorpaySignature": "2f4b008d3a..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "orderNumber": "GFT-20260913-7X9K"
  }
}
```

#### `POST /api/payments/webhook`
Handles asynchronous webhook callbacks from Razorpay (`payment.captured`, `order.paid`).

---

## Local Development & Testing

```bash
# Run local D1 migrations
npm run migrate:local

# Run unit tests
npm test

# Run integration tests against local worker
npm run test:integration

# Start local Cloudflare Worker on port 8787
npm run dev
```

## Secrets Management
Set sensitive production credentials using Cloudflare Wrangler:
```bash
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
```
