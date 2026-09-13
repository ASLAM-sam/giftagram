-- ============================================================
-- GIFTAGRAM CLOUDFLARE D1 SEED MIGRATION
-- Migration: 0002_seed_products.sql
-- ============================================================

-- 1. SEED CAKES (All 500g standard weight)
INSERT OR IGNORE INTO products (id, slug, name, category, description, price, weight, active, featured, flavor_category) VALUES
('cake-belgium', 'chocolate-belgium', 'Chocolate Belgium', 'cakes', 'Rich Belgian chocolate ganache layered with moist cocoa sponge. A decadent signature creation.', 499, '500g', 1, 1, 'chocolate'),
('cake-pineapple', 'fresh-pineapple', 'Fresh Pineapple', 'cakes', 'Layers of light vanilla sponge, fresh tropical pineapple compote, and whipped chantilly cream.', 550, '500g', 1, 0, 'fruit'),
('cake-very-berry', 'very-berry', 'Very Berry', 'cakes', 'Vanilla sponge infused with farm-fresh berry reduction, strawberry cream, and wild berries.', 550, '500g', 1, 0, 'fruit'),
('cake-black-forest', 'black-forest', 'Black Forest', 'cakes', 'Classic cocoa sponge with imported sour cherry coulis, dark chocolate shavings, and fresh cream.', 550, '500g', 1, 0, 'chocolate'),
('cake-chocolate-fudge', 'chocolate-fudge', 'Chocolate Fudge', 'cakes', 'Decadent melted fudge ganache over dense, gooey chocolate crumb layers.', 599, '500g', 1, 1, 'chocolate'),
('cake-fresh-fruit', 'fresh-fruit', 'Fresh Fruit', 'cakes', 'Moist vanilla sponge adorned with an assortment of seasonal orchard fruits and glaze.', 650, '500g', 1, 0, 'fruit'),
('cake-biscoff', 'biscoff', 'Biscoff', 'cakes', 'Spiced Lotus Biscoff spread whipped into silky buttercream with crunchy caramelized biscuit crumble.', 650, '500g', 1, 1, 'premium'),
('cake-nutella', 'nutella', 'Nutella', 'cakes', 'Hazelnut chocolate cream with genuine Nutella swirls and roasted hazelnut crunch.', 650, '500g', 1, 0, 'premium'),
('cake-royal-chocolate', 'royal-chocolate', 'Royal Chocolate', 'cakes', 'Our highest tiered celebration creation: Valrhona dark chocolate mousse with gold lustre accents.', 799, '500g', 1, 1, 'premium');

-- 2. SEED BOUQUETS
INSERT OR IGNORE INTO products (id, slug, name, category, description, price, weight, active, featured, flavor_category, stem_count) VALUES
('bq-photo', 'photo-bouquet', 'Photo Bouquet', 'bouquets', 'Custom hand-tied keepsake bouquet crafted with personalized polaroid photo prints and soft ribbons.', 450, NULL, 1, 0, 'photo', NULL),
('bq-choc', 'chocolate-bouquet', 'Chocolate Bouquet', 'bouquets', 'Artfully arranged premium chocolates surrounded by decorative greenery and luxury blush wrapping.', 550, NULL, 1, 0, 'chocolate', NULL),
('bq-rose-10', 'rose-bouquet-10', 'Rose Bouquet (10)', 'bouquets', 'Hand-picked bouquet of 10 fresh, velvety red roses tied with satin ribbons.', 499, NULL, 1, 1, 'roses', 10),
('bq-rose-20', 'rose-bouquet-20', 'Rose Bouquet (20)', 'bouquets', 'Romantic arrangement of 20 premium fresh red roses wrapped in double-layered matte paper.', 999, NULL, 1, 0, 'roses', 20),
('bq-rose-50', 'rose-bouquet-50', 'Rose Bouquet (50)', 'bouquets', 'Spectacular presentation of 50 hand-selected long-stem red roses in luxury gift wrap.', 1999, NULL, 1, 1, 'roses', 50),
('bq-rose-100', 'rose-bouquet-100', 'Rose Bouquet (100)', 'bouquets', 'The ultimate romantic statement: 100 opulent red roses arranged in an extravagant display.', 3000, NULL, 1, 1, 'roses', 100);

-- 3. SEED FUTURE CATEGORIES (Inactive: active = 0)
INSERT OR IGNORE INTO products (id, slug, name, category, description, price, weight, active, featured) VALUES
('cat-cupcakes', 'cupcakes', 'Artisanal Cupcakes', 'cupcakes', 'Miniature confectionery cupcakes with delicate cream piping.', 0, NULL, 0, 0),
('cat-hampers', 'hampers', 'Luxury Gift Hampers', 'hampers', 'Curated luxury gifting hampers with artisan treats and flowers.', 0, NULL, 0, 0),
('cat-trousseau', 'trousseau', 'Trousseau Packing', 'trousseau', 'Bespoke bridal and wedding trousseau packaging hampers.', 0, NULL, 0, 0),
('cat-frames', 'frames', 'Custom Keepsake Frames', 'frames', 'Handcrafted customized memory frames and polaroid mounts.', 0, NULL, 0, 0),
('cat-bento', 'bento', 'Bento Cakes', 'bento', 'Petite Korean-style minimalist bento lunchbox cakes.', 0, NULL, 0, 0),
('cat-tiered', 'tiered-cakes', 'Tiered Celebration Cakes', 'tiered-cakes', 'Grand multi-tiered cakes for engagements and weddings.', 0, NULL, 0, 0),
('cat-pr', 'pr-preeties', 'PR & Preeties', 'pr-preeties', 'Boutique media packages, brand gifts, and influencer hampers.', 0, NULL, 0, 0);

-- 4. SEED PRODUCT IMAGES (Image keys)
INSERT OR IGNORE INTO product_images (id, product_id, r2_key, alt_text, sort_order) VALUES
('img-cake-belgium-1', 'cake-belgium', 'cakes/chocolate-belgium.webp', 'Chocolate Belgium Cake 500g', 1),
('img-cake-pineapple-1', 'cake-pineapple', 'cakes/fresh-pineapple.webp', 'Fresh Pineapple Cake 500g', 1),
('img-cake-very-berry-1', 'cake-very-berry', 'cakes/very-berry.webp', 'Very Berry Cake 500g', 1),
('img-cake-black-forest-1', 'cake-black-forest', 'cakes/black-forest.webp', 'Black Forest Cake 500g', 1),
('img-cake-chocolate-fudge-1', 'cake-chocolate-fudge', 'cakes/chocolate-fudge.webp', 'Chocolate Fudge Cake 500g', 1),
('img-cake-fresh-fruit-1', 'cake-fresh-fruit', 'cakes/fresh-fruit.webp', 'Fresh Fruit Cake 500g', 1),
('img-cake-biscoff-1', 'cake-biscoff', 'cakes/biscoff.webp', 'Biscoff Cake 500g', 1),
('img-cake-nutella-1', 'cake-nutella', 'cakes/nutella.webp', 'Nutella Cake 500g', 1),
('img-cake-royal-chocolate-1', 'cake-royal-chocolate', 'cakes/royal-chocolate.webp', 'Royal Chocolate Cake 500g', 1),
('img-bq-photo-1', 'bq-photo', 'bouquets/photo-bouquet.webp', 'Custom Polaroid Photo Bouquet', 1),
('img-bq-choc-1', 'bq-choc', 'bouquets/chocolate-bouquet.webp', 'Luxury Chocolate Bouquet', 1),
('img-bq-rose-10-1', 'bq-rose-10', 'bouquets/rose-10.webp', 'Handcrafted Red Rose Bouquet 10 Roses', 1),
('img-bq-rose-20-1', 'bq-rose-20', 'bouquets/rose-20.webp', 'Premium Red Rose Bouquet 20 Roses', 1),
('img-bq-rose-50-1', 'bq-rose-50', 'bouquets/rose-50.webp', 'Extravagant Red Rose Bouquet 50 Roses', 1),
('img-bq-rose-100-1', 'bq-rose-100', 'bouquets/rose-100.webp', 'Grand Red Rose Bouquet 100 Roses', 1);
