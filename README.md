# GIFTAGRAM — Luxury Gifting & Bakery Studio

A production-grade e-commerce platform for a boutique gifting and bakery brand, featuring artisanal 500g cakes, romantic red rose bouquets, bespoke order customization with a 50% non-refundable deposit mandate, and preview collections.

---

## 📁 Repository Structure

```
giftagram/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS (Cloudflare Pages)
│   ├── public/           # Images (cakes, bouquets, logo)
│   ├── src/
│   │   ├── config/       # Brand & contact configuration (logo, phone, pickup)
│   │   ├── data/         # 500g cakes, bouquets, coming soon categories
│   │   ├── components/   # Modular UI, product cards, cart drawer, modals
│   │   ├── context/      # Cart, wishlist, and UI providers
│   │   ├── pages/        # Home, Shop, Cakes, Bouquets, Checkout, Success, etc.
│   │   └── services/     # Pre-wired API, order, and payment service stubs
│   ├── index.html        # Google Fonts & SEO metadata
│   └── package.json
│
├── backend/              # Cloudflare Workers + D1 Database + Razorpay Stubs
│   ├── src/              # Worker entry point & API endpoints
│   ├── schema.sql        # Cloudflare D1 SQLite database schema
│   ├── wrangler.toml     # Cloudflare Worker & D1 binding configuration
│   └── package.json
│
└── README.md
```

---

## 🌸 Brand Highlights

- **Visual Tone**: Warm Ivory, Soft Cream, Dusty Rose, Powder Pink, and Deep Espresso Brown (no dark theme).
- **Typography**: Editorial pairing of *Cormorant Garamond*, *Playfair Display*, *Pinyon Script*, and *Plus Jakarta Sans*.
- **Cakes Menu**: 9 signature 500g cakes (₹499 to ₹799).
- **Bouquets Menu**: 6 floral & keepsake arrangements (₹450 to ₹3,000) with upfront disclaimers.
- **Ordering Policy**: 48h advance bake schedule and mandatory 50% non-refundable deposit.
- **Official Contact**: `+91 81413 76677` (WhatsApp & direct phone).

---

## 🚀 Quick Start (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000/` or `http://localhost:5173/`.

### Production Build
```bash
cd frontend
npm run build
```

---

## ☁️ Deployment Target

- **Frontend**: Cloudflare Pages (`frontend/dist`)
- **Backend**: Cloudflare Workers (`backend/`)
- **Database**: Cloudflare D1
- **Payments**: Razorpay
