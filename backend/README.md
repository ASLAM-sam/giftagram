# Giftagram Backend — Cloudflare Workers & D1

Backend architecture for Giftagram Luxury Gifting & Bakery Studio.

## Architecture

- **Runtime**: Cloudflare Workers (Edge computing)
- **Database**: Cloudflare D1 (SQLite database at the edge)
- **Storage**: Cloudflare R2 (Product & customer photo uploads)
- **Payments**: Razorpay Node SDK (Order creation & signature verification)

## Setup & Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Create the D1 Database:
   ```bash
   npx wrangler d1 create giftagram_prod
   # Update database_id in wrangler.toml with the output ID
   ```

4. Execute database migrations:
   ```bash
   npx wrangler d1 execute giftagram_prod --file=./schema.sql
   ```

5. Run local development:
   ```bash
   npm run dev
   ```

6. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```
