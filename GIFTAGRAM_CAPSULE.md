# GIFTAGRAM — PROJECT CONTEXT CAPSULE
> **Single Source of Truth (SSOT)** for the Giftagram Luxury Gifting & Artisanal Bakery Platform.  
> **Last Updated:** September 2026  
> **Repository:** `demogift` (`ASLAM-sam/giftagram`)

---

## 1. Executive Summary & Brand Overview

**Giftagram** is a production-ready, ultra-premium luxury bakery and floral gifting eCommerce platform designed for high-end celebrations, bespoke cake orders, and curated floral arrangements.

### Key Brand Differentiators:
- **Artisanal Cakes**: Handcrafted cakes (500g standard, custom weights) with bespoke customization (Lambeth piping, gold lustre, custom lettering).
- **Luxury Floral Bouquets**: Red rose arrangements (10, 20, 50, 100 stems), chocolate bouquets, and keepsake polaroid photo bouquets.
- **50% Mandatory Non-Refundable Deposit**: Enforced server-side for bespoke cake preparations to prevent order cancellations.
- **Independent Infrastructure**: Completely isolated from sister projects (e.g., Purefumes) with dedicated database, Cloudflare Worker backend, and Cloudinary storage account.

---

## 2. Technical Stack & Hosting

| Layer | Technology | Hosting / Runtime | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons | Cloudflare Workers / Pages | High-performance, luxury client UI with responsive catalog, cart, and customization |
| **Backend** | TypeScript, Cloudflare Workers Runtime | Cloudflare Workers Edge | Serverless REST API with WebCrypto security, order processing, and payment orchestration |
| **Database** | Cloudflare D1 (SQLite at the Edge) | Cloudflare D1 (`giftagram-db`) | Low-latency SQL database for catalog, orders, order items, and image metadata |
| **Media Storage** | Cloudinary (Dedicated Account) | Cloudinary CDN (`giftagram/` namespace) | Dynamic image transformations, fast global CDN, secure asset management |
| **Payments** | Razorpay Payment Gateway | Server-Side Verification | Authoritative price computation, order generation, signature verification, and webhooks |
| **Testing** | Node.js Test Runner, TSX, Puppeteer-Core, Oxlint | Local & Cloud Environments | Unit tests, API integration tests, real-browser rendering tests, production verifications |

---

## 3. Architecture & Data Flow

```
+-----------------------------------------------------------------------+
|                           REACT FRONTEND                              |
|   (Vite + Tailwind CSS + Framer Motion on Cloudflare Workers/Pages)   |
+-----------------------------------+-----------------------------------+
                                    |
                    REST API Calls  |  Image Requests (Direct CDN)
                                    v
+-----------------------------------+   +-------------------------------+
|     CLOUDFLARE WORKER BACKEND     |   |     CLOUDINARY GLOBAL CDN     |
|   - Router & Controllers          |   |   (Dedicated Giftagram Cloud) |
|   - WebCrypto SHA-1 & SHA-256     |   |   Namespace: giftagram/       |
|   - Authoritative Price Engine    |   |   - /products/                |
|   - Razorpay Signature Verifier   |   |   - /banners/                 |
+-----------------+-----------------+   +---------------+---------------+
                  |                                     ^
                  | D1 SQL Queries                      | Authenticated
                  v                                     | Upload/Delete
+-----------------+-----------------+                   | (Signed API)
|      CLOUDFLARE D1 DATABASE       |                   |
|   (Database: giftagram-db)        +-------------------+
|   - products                      |
|   - product_images (secure_url)   |
|   - orders & order_items          |
+-----------------------------------+
```

---

## 4. Current Project State & What Has Been Done Till Now

### Milestone 1: Cloudflare R2 Expunged Completely
- Completely removed all Cloudflare R2 architecture, bindings, and bucket configs (`IMAGES_BUCKET`, `r2_buckets`, etc.).
- Preserved Cloudflare D1 as the sole persistent relational data store.

### Milestone 2: Dedicated Cloudinary Architecture Established
- Configured Giftagram's **own independent Cloudinary account** (strictly separate from Purefumes).
- Implemented `backend/src/services/cloudinaryService.ts`:
  - Uses native **WebCrypto API** (`crypto.subtle.digest('SHA-1')`) compatible with Cloudflare Workers edge runtime (no Node `crypto` reliance).
  - Hardcoded namespace boundary validation: Only paths starting with `giftagram/` are allowed (`giftagram/products/`, etc.).
  - Signed image upload (`uploadImage`) and signed image deletion (`deleteImage`).

### Milestone 3: Database Schema & Cloudinary Migration
- **D1 Database**: `giftagram-db` (ID: `7c67abb1-2f3d-42f4-beb3-e9bc392f8c65`).
- Created non-destructive migration `0003_add_cloudinary_fields.sql`:
  - `secure_url TEXT`
  - `public_id TEXT`
  - `folder TEXT`
  - `is_primary INTEGER DEFAULT 0`
- Updated `productService.ts` on backend to prioritize `secure_url` while seamlessly falling back to local static catalog paths until full image migration.

### Milestone 4: Environment & Secrets System Hardening
- Determined and verified that **`backend/.dev.vars`** is the authoritative local secret file read by Cloudflare Wrangler (`wrangler dev`).
- Stored real local secrets in `backend/.dev.vars` and verified it is **100% git-ignored**.
- Sanitized `backend/.env` to placeholders, preventing secret duplication and drift.
- Verified frontend code has **zero exposure** to Cloudinary API secrets or backend keys.

### Milestone 5: Complete End-to-End Verification (Cloudinary → D1 → API → Frontend)
- **Real Cloudinary Upload**: Tested live upload with real credentials under `giftagram/products/`. Succeeded with HTTP 200, returning `secure_url` and `public_id`.
- **D1 Association**: Linked image to product `cake-royal-chocolate` non-destructively (product price, name, category, and orders remained untouched).
- **API Response**: Verified `GET /api/products/royal-chocolate` and `GET /api/products` return the Cloudinary CDN `secure_url`.
- **Real Browser Verification**: Launched headless browser (Edge via `puppeteer-core`) and loaded `http://localhost:5173/cakes/royal-chocolate`. Verified browser received `HTTP 200 OK` from Cloudinary and rendered image with `complete: true`.
- **Image Replacement Flow**: Tested uploading a second test image, updating D1, verifying new URL on API and frontend, and safely deleting the first temporary asset.
- **Clean Restoration**: Deleted all temporary test assets from Cloudinary, reset D1 back to clean catalog state, and removed all temporary test scripts.

---
### Milestone 6: Phase 1 Admin Authentication Foundation (Username + Password)
- **Design Philosophy**: Strictly `username + password` authentication. There is NO email-based login for administrators.
- **Database Schema (`0004_create_admin_auth.sql`)**:
  - `admin_users`: `id`, `username` (UNIQUE), `password_hash` (PBKDF2-SHA256), `full_name`, `role` (admin), `active` (1 or 0), `created_at`, `updated_at`.
  - `admin_sessions`: `id`, `admin_id` (FK), `token_hash` (UNIQUE, SHA-256), `user_agent`, `ip_address`, `expires_at`, `created_at`, `last_active_at`.
- **Security Invariants**:
  - Password hashing: WebCrypto PBKDF2-SHA256 (100,000 iterations, 16-byte random salt, 32-byte key).
  - Session tokens: 256-bit (32 bytes) cryptographically random tokens stored as SHA-256 hashes in D1.
  - HttpOnly cookie: `giftagram_admin_session` (SameSite=Lax, Path=/, Max-Age=604800, Secure in production).
  - Sanitized responses: Public endpoints NEVER expose `password_hash`, `token_hash`, or raw token in JSON.
  - Case & whitespace normalization: Usernames are normalized with `trim().toLowerCase()`.
  - Account enumeration protection: Generic error message `"Invalid username or password"` on both unknown username and wrong password.
- **Endpoints**:
  - `POST /api/admin/login` (Body: `{ username, password }`) -> Sets HttpOnly cookie, returns `{ user: { id, username, fullName, role } }`.
  - `POST /api/admin/logout` -> Revokes D1 session, expires cookie.
  - `GET /api/admin/me` -> Validates HttpOnly session cookie, returns authenticated profile.
- **Initial Administrator**:
  - Admin username: `giftstudio`
  - Name: `Giftagram Atelier Admin`
  - Seeded via `scripts/bootstrap-admin.ts` using PBKDF2-SHA256 hashing.

---

## 5. Database Schema & Current Catalog

### D1 Tables:
1. **`products`**:
   - `id` (PK, e.g. `cake-royal-chocolate`, `bq-rose-10`)
   - `slug` (UNIQUE, e.g. `royal-chocolate`, `rose-bouquet-10`)
   - `name`, `category` (`cakes` | `bouquets` | future categories)
   - `description`, `price` (in INR, e.g. 799)
   - `weight` (e.g. `500g`), `active` (1 or 0), `featured` (1 or 0)
   - `flavor_category` (`chocolate`, `fruit`, `premium`, `roses`, `photo`)
   - `stem_count` (integer for bouquets: 10, 20, 50, 100)

2. **`product_images`**:
   - `id` (PK, e.g. `img-cake-royal-chocolate-1`)
   - `product_id` (FK -> `products.id`)
   - `alt_text`, `sort_order`
   - `secure_url` (Cloudinary CDN URL)
   - `public_id` (Cloudinary Asset ID, e.g. `giftagram/products/xyz`)
   - `folder` (e.g. `giftagram/products`)
   - `is_primary` (1 = primary display image)

3. **`orders`**:
   - `id` (PK, e.g. `GFT-YYYYMMDD-XXXX`)
   - `customer_name`, `customer_phone`, `customer_email`
   - `pickup_date`, `pickup_time`, `special_instructions`
   - `subtotal`, `deposit_required` (50% non-refundable), `balance_due`
   - `payment_status` (`deposit_pending`, `deposit_paid`, `completed`)
   - `razorpay_order_id`, `razorpay_payment_id`

4. **`order_items`**:
   - `id`, `order_id` (FK -> `orders.id`), `product_id` (FK -> `products.id`)
   - `quantity`, `unit_price`, `subtotal`
   - `cake_design_notes`, `cake_colors`, `cake_lettering`, `agreed_to_deposit`

5. **`admin_users`**:
   - `id` (PK, e.g. `adm_...`)
   - `username` (UNIQUE, normalized lowercase)
   - `password_hash` (PBKDF2-SHA256)
   - `full_name`
   - `role` (`admin`)
   - `active` (1 or 0)
   - `created_at`, `updated_at`

6. **`admin_sessions`**:
   - `id` (PK, e.g. `sess_...`)
   - `admin_id` (FK -> `admin_users.id` ON DELETE CASCADE)
   - `token_hash` (UNIQUE, SHA-256)
   - `user_agent`, `ip_address`
   - `expires_at`, `created_at`, `last_active_at`

### Active 15 Production Products:
- **Cakes (9)**:
  1. Chocolate Belgium (₹499)
  2. Fresh Pineapple (₹550)
  3. Very Berry (₹550)
  4. Black Forest (₹550)
  5. Chocolate Fudge (₹599)
  6. Fresh Fruit (₹650)
  7. Biscoff (₹650)
  8. Nutella (₹650)
  9. Royal Chocolate (₹799)
- **Bouquets (6)**:
  1. Photo Bouquet (₹450)
  2. Chocolate Bouquet (₹550)
  3. Rose Bouquet 10 (₹499)
  4. Rose Bouquet 20 (₹999)
  5. Rose Bouquet 50 (₹1999)
  6. Rose Bouquet 100 (₹3000)

---

## 6. API Endpoints Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Worker info, health status, and version | Public |
| `GET` | `/api/health` | Service health & Cloudflare D1 connection check | Public |
| `GET` | `/api/products` | All active products (supports `?category=`, `?featured=`, `?search=`) | Public |
| `GET` | `/api/products/:slug` | Single product by slug with image gallery | Public |
| `GET` | `/api/categories` | Active & upcoming category catalog | Public |
| `POST` | `/api/orders` | Create order with authoritative server-side price calculation | Public |
| `POST` | `/api/orders/lookup` | Track order by order number + verified phone number | Public |
| `POST` | `/api/payments/create-order` | Generate Razorpay server payment order | Public |
| `POST` | `/api/payments/verify` | Verify Razorpay HMAC-SHA256 signature and transition status | Public |
| `POST` | `/api/payments/webhook` | Razorpay payment webhook with deduplication idempotency | Webhook Secret |
| `POST` | `/api/admin/login` | Admin username + password authentication | Public |
| `POST` | `/api/admin/logout` | Revoke session and clear HttpOnly cookie | Session Cookie |
| `GET` | `/api/admin/me` | Fetch authenticated admin profile | Session Cookie |
| `GET` | `/api/admin/products` | Retrieve full catalog for admin (active + inactive) | Session Cookie |
| `GET` | `/api/admin/products/:id` | Retrieve single product details for admin | Session Cookie |
| `POST` | `/api/admin/products` | Create new product with server validation | Session Cookie |
| `PUT` | `/api/admin/products/:id` | Update product fields via explicit allowlist | Session Cookie |
| `PATCH` | `/api/admin/products/:id/status` | Soft activate/deactivate product | Session Cookie |
| `GET` | `/api/admin/products/:id/images` | Retrieve all images for a product | Session Cookie |
| `POST` | `/api/admin/products/:id/images` | Upload image to Cloudinary and link to product | Session Cookie |
| `POST` | `/api/admin/products/:id/images/:imgId/replace` | Replace image safely (upload new before removing old) | Session Cookie |
| `PUT` | `/api/admin/products/:id/images/:imgId/primary` | Designate primary cover photo (enforces single primary) | Session Cookie |
| `PUT` | `/api/admin/products/:id/images/reorder` | Persist visual display order for product gallery | Session Cookie |
| `DELETE` | `/api/admin/products/:id/images/:imgId` | Delete image reference and Cloudinary asset | Session Cookie |
| `GET` | `/api/admin/orders` | List customer orders with search and status filtering | Session Cookie |
| `GET` | `/api/admin/orders/:id` | Detailed order dossier with frozen price snapshot & customization | Session Cookie |
| `PATCH` | `/api/admin/orders/:id/status` | Transition order status with business rules and audit logging | Session Cookie |

---

## 7. Security & Business Logic Invariants

1. **Authoritative Server Pricing**: The frontend client price is **completely ignored**. All subtotals and deposits are calculated strictly using Cloudflare D1 product prices.
2. **50% Non-Refundable Cake Deposit**: Every cake order mathematically requires exactly `ROUND(price * 0.5)` deposit with explicit acknowledgement flag (`depositAcknowledged: true`). Customer cancellation does not refund this deposit.
3. **Historical Order Snapshot Immutability**: Orders represent immutable legal & financial records. `unit_price_snapshot`, `product_name_snapshot`, line totals, and customer cake customization specs are stored permanently and are never recalculated or updated dynamically if catalog product prices change in the future.
4. **Controlled Order Status Lifecycle**: Status changes cannot be arbitrary strings. Valid state machine:
   - `payment_pending` -> `deposit_paid` (via verified Razorpay payment/webhook)
   - `deposit_paid` -> `confirmed` | `cancelled`
   - `confirmed` -> `processing` | `cancelled`
   - `processing` -> `ready` | `cancelled`
   - `ready` -> `completed` | `cancelled`
   - `completed` -> Terminal state (no transitions allowed)
   - `cancelled` -> Terminal state (no transitions allowed)
5. **Immutable Audit Trail (`order_events`)**: Every status change atomically logs an audit event with timestamp, actor role, and previous/new status payload.
6. **Cryptographic Validation**:
   - Razorpay payment authorization verified with timing-safe HMAC-SHA256 comparisons.
   - Cloudinary authenticated uploads signed with WebCrypto SHA-1.
   - Admin authentication uses WebCrypto PBKDF2-SHA256 password hashing.
   - Opaque session management: Raw 256-bit token stored strictly as SHA-256 hash in D1.
7. **Admin Route & Mutation Security**:
   - All product, image, and order admin endpoints are guarded server-side by `requireAdminAuth`.
   - HttpOnly `giftagram_admin_session` cookie is used exclusively (`credentials: "include"`).
   - Zero tokens stored in `localStorage` or `sessionStorage`.
8. **Soft Deactivation Invariant**: Products are never hard-deleted from D1 to preserve referential integrity with historical `order_items`. Deactivating a product immediately removes it from customer storefront APIs (`/api/products`), returning 404 on slug lookups while remaining fully manageable in the admin atelier.
9. **Cloudinary Namespace & Ownership Boundaries**:
   - Cloudinary uploads and deletions are strictly validated against `giftagram/` (`giftagram/products/...`).
   - Admins cannot manipulate or delete arbitrary Cloudinary assets outside the Giftagram namespace.
   - Image ownership is strictly enforced: an image must belong to the specified product ID in D1 before mutation or deletion.
   - Image replacement uses safe ordering: upload new asset -> verify success -> update D1 reference -> only then delete old asset.
10. **Single Primary Image Invariant**: Each product can have at most one primary image (`is_primary = 1`). Promoting an image to primary atomically unsets all other images for that product.
11. **Secret Hygiene**:
    - Secrets are managed via `backend/.dev.vars` locally and `wrangler secret put` in production.
    - `.dev.vars` and `.env` are strictly git-ignored.
    - Frontend client never receives API keys, Cloudinary secrets, or Razorpay secrets.

---

## 8. Verification & Test Suite Results

| Test Suite | Command | Status | Details |
| :--- | :--- | :---: | :--- |
| **Backend Typecheck** | `npm run typecheck` (in `backend`) | **PASS** | 0 TypeScript errors |
| **Backend Unit Tests** | `npm test` (in `backend`) | **PASS** | 37/37 passing (Crypto, IDs, Order Validators, PBKDF2, Sessions, Cookies) |
| **Local Core Integration**| `npm run test:integration` (in `backend`)| **PASS** | 72/72 passing (D1, Endpoints, Price Tampering, Razorpay, Admin Auth Flow) |
| **Phase 3 Image Integration** | `npx tsx test/admin_images.integration.test.ts` | **PASS** | 33/33 passing (Unauth guards, Cloudinary upload, MIME/size validation, Primary uniqueness, Safe Replace, Delete, Reorder, Storefront Gallery) |
| **Phase 4 Order Integration** | `npx tsx test/admin_orders.integration.test.ts` | **PASS** | 46/46 passing (Unauth guards, Orders list, Search, Filter, Frozen Price Snapshots, Cake Customizations, Deposit Verification, State Machine, Audit Logging, Terminal States) |
| **Frontend Production Build**| `npm run build` (in `frontend`) | **PASS** | Zero build errors (`tsc -b && vite build`) |
| **Frontend Lint** | `npm run lint` (in `frontend`) | **PASS** | 0 errors |
| **Phase 3 Image Browser QA** | `npx tsx test/admin_image_management_browser.test.ts` | **PASS** | 14/14 passing (Real Chrome automated testing of drawer, upload, gallery, delete, logout, storefront regression) |
| **Phase 4 Order Browser QA** | `npx tsx test/admin_order_management_browser.test.ts` | **PASS** | 31/31 passing (Real Chrome automated testing of orders ledger, search, status filter, order dossier, state transitions, cancel modal, storefront regression) |

---

## 9. Current Status & Completed Milestones

### Status:
**Phases 1, 2, 3, and 4 are 100% complete, fully verified, and tested across real browser workflows. The customer storefront remains completely operational and unchanged.**

### Completed Milestones:
- Milestone 1: Cloudflare R2 Expunged Completely
- Milestone 2: Dedicated Cloudinary Architecture Established
- Milestone 3: Database Schema & Cloudinary Migration
- Milestone 4: Environment & Secrets System Hardening
- Milestone 5: Complete End-to-End Image Verification
- Milestone 6: Phase 1 Admin Authentication Foundation (Username + Password)
- Milestone 7: Frontend Admin Authentication UI & Route Isolation (`/admin/login`, `/admin`)
- Milestone 8: Phase 2 Admin Product Management (`/admin/products`, Backend API, Atelier UI, Soft Deactivation)
- Milestone 9: Phase 3 Admin Image Management (`/admin/products` gallery drawer, Cloudinary secure proxy, signed uploads/deletions, primary image toggling, display reordering, replace safety)
- Milestone 10: Phase 4 Admin Order Management (`/admin/orders` ledger, bespoke cake customization inspection, 50% deposit auditing, validated status transitions, cancellation confirmation, immutable `order_events` trail)

### Strictly Out of Scope (Deferred to Future Work):
- Customer management CRM
- Analytics dashboard & revenue charts
- Coupons and loyalty points
- Email/SMS marketing automation
- Shipping gateway integrations
- AI recommendation engines



