import { ProductRow, ProductImageRow, CreateProductInput, UpdateProductInput } from '../types';
import { generateId, slugify } from '../utils/ids';

export interface FormattedProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  price: number;
  weight?: string;
  images: string[];
  featured: boolean;
  active?: boolean;
  tags: string[];
  flavorCategory?: string;
  stemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const STATIC_IMAGE_MAP: Record<string, string[]> = {
  'chocolate-belgium': ['/images/cakes/chocolate-belgium.jpg', '/images/cakes/chocolate-fudge.jpg', '/images/cakes/royal-chocolate.jpg'],
  'fresh-pineapple': ['/images/cakes/pineapple.jpg', '/images/cakes/fresh-fruit.jpg', '/images/cakes/very-berry.jpg'],
  'very-berry': ['/images/cakes/very-berry.jpg', '/images/cakes/fresh-fruit.jpg', '/images/cakes/pineapple.jpg'],
  'black-forest': ['/images/cakes/black-forest.jpg', '/images/cakes/chocolate-belgium.jpg', '/images/cakes/chocolate-fudge.jpg'],
  'chocolate-fudge': ['/images/cakes/chocolate-fudge.jpg', '/images/cakes/chocolate-belgium.jpg', '/images/cakes/royal-chocolate.jpg'],
  'fresh-fruit': ['/images/cakes/fresh-fruit.jpg', '/images/cakes/very-berry.jpg', '/images/cakes/pineapple.jpg'],
  'biscoff': ['/images/cakes/biscoff.jpg', '/images/cakes/nutella.jpg', '/images/cakes/chocolate-fudge.jpg'],
  'nutella': ['/images/cakes/nutella.jpg', '/images/cakes/biscoff.jpg', '/images/cakes/chocolate-belgium.jpg'],
  'royal-chocolate': ['/images/cakes/royal-chocolate.jpg', '/images/cakes/chocolate-belgium.jpg', '/images/cakes/chocolate-fudge.jpg'],
  'photo-bouquet': ['/images/bouquets/photo-bouquet.jpg', '/images/bouquets/rose-bouquet.jpg', '/images/bouquets/chocolate-bouquet.jpg'],
  'chocolate-bouquet': ['/images/bouquets/chocolate-bouquet.jpg', '/images/bouquets/photo-bouquet.jpg', '/images/bouquets/rose-bouquet.jpg'],
  'rose-bouquet-10': ['/images/bouquets/rose-bouquet-10.jpg', '/images/bouquets/rose-bouquet.jpg'],
  'rose-bouquet-20': ['/images/bouquets/rose-bouquet.jpg', '/images/bouquets/rose-bouquet-10.jpg'],
  'rose-bouquet-50': ['/images/bouquets/rose-bouquet.jpg', '/images/bouquets/rose-bouquet-10.jpg'],
  'rose-bouquet-100': ['/images/bouquets/rose-bouquet.jpg', '/images/bouquets/rose-bouquet-10.jpg'],
};

function resolveProductImages(slug: string, dbImages: string[]): string[] {
  // 1. If any database image has a Cloudinary URL (starts with http), prioritize it
  const cloudinaryUrls = dbImages.filter(url => url && url.startsWith('http'));
  if (cloudinaryUrls.length > 0) {
    return cloudinaryUrls;
  }

  // 2. Seamless fallback to local static map for the 15 current products
  if (STATIC_IMAGE_MAP[slug] && STATIC_IMAGE_MAP[slug].length > 0) {
    return STATIC_IMAGE_MAP[slug];
  }

  return dbImages.length > 0 ? dbImages : [`/images/cakes/royal-chocolate.jpg`];
}

export const productService = {
  /**
   * Retrieves active products from Cloudflare D1
   */
  async getActiveProducts(
    db: D1Database,
    filters?: { category?: string; featured?: boolean; search?: string }
  ): Promise<FormattedProduct[]> {
    let sql = 'SELECT * FROM products WHERE active = 1';
    const params: any[] = [];

    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.featured !== undefined) {
      sql += ' AND featured = ?';
      params.push(filters.featured ? 1 : 0);
    }

    if (filters?.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ' ORDER BY featured DESC, price ASC';

    const result = await db.prepare(sql).bind(...params).all<ProductRow>();
    const products = result.results || [];

    // Fetch images for these products
    const imagesRes = await db
      .prepare('SELECT * FROM product_images ORDER BY sort_order ASC')
      .all<ProductImageRow>();
    const imagesByProduct = new Map<string, string[]>();

    (imagesRes.results || []).forEach((img) => {
      const list = imagesByProduct.get(img.product_id) || [];
      const imgUrl = img.secure_url || `/assets/${img.r2_key}`;
      list.push(imgUrl);
      imagesByProduct.set(img.product_id, list);
    });

    return products.map((p) => {
      const dbImgs = imagesByProduct.get(p.id) || [];
      const images = resolveProductImages(p.slug, dbImgs);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        description: p.description,
        shortDescription: p.description.length > 100 ? `${p.description.substring(0, 97)}...` : p.description,
        price: p.price,
        weight: p.weight || undefined,
        images,
        featured: p.featured === 1,
        tags: [p.category, p.flavor_category || ''].filter(Boolean),
        flavorCategory: p.flavor_category || undefined,
        stemCount: p.stem_count || undefined,
      };
    });
  },

  /**
   * Retrieves a single active product by slug
   */
  async getProductBySlug(db: D1Database, slug: string): Promise<FormattedProduct | null> {
    const product = await db
      .prepare('SELECT * FROM products WHERE slug = ? AND active = 1 LIMIT 1')
      .bind(slug)
      .first<ProductRow>();

    if (!product) return null;

    const imagesRes = await db
      .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC')
      .bind(product.id)
      .all<ProductImageRow>();

    const dbImages = (imagesRes.results || []).map((img) => img.secure_url || `/assets/${img.r2_key}`);
    const images = resolveProductImages(product.slug, dbImages);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      description: product.description,
      shortDescription: product.description.length > 100 ? `${product.description.substring(0, 97)}...` : product.description,
      price: product.price,
      weight: product.weight || undefined,
      images,
      featured: product.featured === 1,
      tags: [product.category, product.flavor_category || ''].filter(Boolean),
      flavorCategory: product.flavor_category || undefined,
      stemCount: product.stem_count || undefined,
      active: product.active === 1,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  },

  /**
   * Retrieves all products (active and inactive) for admin management
   */
  async getAllAdminProducts(
    db: D1Database,
    filters?: { category?: string; active?: number; search?: string }
  ): Promise<FormattedProduct[]> {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.active !== undefined) {
      sql += ' AND active = ?';
      params.push(filters.active);
    }

    if (filters?.search) {
      sql += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ' ORDER BY updated_at DESC, created_at DESC';

    const result = await db.prepare(sql).bind(...params).all<ProductRow>();
    const products = result.results || [];

    const imagesRes = await db
      .prepare('SELECT * FROM product_images ORDER BY sort_order ASC')
      .all<ProductImageRow>();
    const imagesByProduct = new Map<string, string[]>();

    (imagesRes.results || []).forEach((img) => {
      const list = imagesByProduct.get(img.product_id) || [];
      const imgUrl = img.secure_url || `/assets/${img.r2_key}`;
      list.push(imgUrl);
      imagesByProduct.set(img.product_id, list);
    });

    return products.map((p) => {
      const dbImgs = imagesByProduct.get(p.id) || [];
      const images = resolveProductImages(p.slug, dbImgs);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        description: p.description,
        shortDescription: p.description.length > 100 ? `${p.description.substring(0, 97)}...` : p.description,
        price: p.price,
        weight: p.weight || undefined,
        images,
        featured: p.featured === 1,
        active: p.active === 1,
        tags: [p.category, p.flavor_category || ''].filter(Boolean),
        flavorCategory: p.flavor_category || undefined,
        stemCount: p.stem_count || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });
  },

  /**
   * Retrieves a single product by ID (including inactive)
   */
  async getAdminProductById(db: D1Database, id: string): Promise<FormattedProduct | null> {
    const p = await db
      .prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProductRow>();

    if (!p) return null;

    const imagesRes = await db
      .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC')
      .bind(p.id)
      .all<ProductImageRow>();

    const dbImages = (imagesRes.results || []).map((img) => img.secure_url || `/assets/${img.r2_key}`);
    const images = resolveProductImages(p.slug, dbImages);

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      description: p.description,
      shortDescription: p.description.length > 100 ? `${p.description.substring(0, 97)}...` : p.description,
      price: p.price,
      weight: p.weight || undefined,
      images,
      featured: p.featured === 1,
      active: p.active === 1,
      tags: [p.category, p.flavor_category || ''].filter(Boolean),
      flavorCategory: p.flavor_category || undefined,
      stemCount: p.stem_count || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  },

  /**
   * Creates a new product in D1 with authoritative server validation
   */
  async createProduct(db: D1Database, input: CreateProductInput): Promise<FormattedProduct> {
    const name = input.name.trim();
    let slug = input.slug ? slugify(input.slug) : slugify(name);
    if (!slug) {
      slug = `product-${Date.now()}`;
    }

    // Check slug uniqueness
    const existingSlug = await db
      .prepare('SELECT id FROM products WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first<{ id: string }>();

    if (existingSlug) {
      throw new Error(`A product with the slug "${slug}" already exists.`);
    }

    const id = generateId(input.category === 'cakes' ? 'cake' : input.category === 'bouquets' ? 'bq' : 'prod');
    const price = Math.round(Number(input.price));
    const active = input.active === false || input.active === 0 ? 0 : 1;
    const featured = input.featured === true || input.featured === 1 ? 1 : 0;
    const weight = input.weight ? input.weight.trim() : null;
    const flavorCategory = input.flavorCategory ? input.flavorCategory.trim() : null;
    const stemCount = input.stemCount !== undefined && input.stemCount !== null ? Number(input.stemCount) : null;

    await db
      .prepare(
        `INSERT INTO products (id, slug, name, category, description, price, weight, active, featured, flavor_category, stem_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        id,
        slug,
        name,
        input.category,
        input.description.trim(),
        price,
        weight,
        active,
        featured,
        flavorCategory,
        stemCount
      )
      .run();

    const created = await this.getAdminProductById(db, id);
    if (!created) {
      throw new Error('Failed to retrieve newly created product.');
    }
    return created;
  },

  /**
   * Updates an existing product in D1 with an explicit allowlist
   */
  async updateProduct(db: D1Database, id: string, input: UpdateProductInput): Promise<FormattedProduct | null> {
    const existing = await db
      .prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProductRow>();

    if (!existing) {
      return null;
    }

    let slug = existing.slug;
    if (input.slug !== undefined) {
      const proposedSlug = slugify(input.slug);
      if (proposedSlug && proposedSlug !== existing.slug) {
        // Verify proposed slug uniqueness
        const dup = await db
          .prepare('SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1')
          .bind(proposedSlug, id)
          .first<{ id: string }>();
        if (dup) {
          throw new Error(`A product with the slug "${proposedSlug}" already exists.`);
        }
        slug = proposedSlug;
      }
    }

    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const category = input.category !== undefined ? input.category : existing.category;
    const description = input.description !== undefined ? input.description.trim() : existing.description;
    const price = input.price !== undefined ? Math.round(Number(input.price)) : existing.price;
    const weight = input.weight !== undefined ? (input.weight ? input.weight.trim() : null) : existing.weight;
    const active = input.active !== undefined ? (input.active ? 1 : 0) : existing.active;
    const featured = input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured;
    const flavorCategory = input.flavorCategory !== undefined ? (input.flavorCategory ? input.flavorCategory.trim() : null) : existing.flavor_category;
    const stemCount = input.stemCount !== undefined ? (input.stemCount !== null ? Number(input.stemCount) : null) : existing.stem_count;

    await db
      .prepare(
        `UPDATE products
         SET slug = ?,
             name = ?,
             category = ?,
             description = ?,
             price = ?,
             weight = ?,
             active = ?,
             featured = ?,
             flavor_category = ?,
             stem_count = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(
        slug,
        name,
        category,
        description,
        price,
        weight,
        active,
        featured,
        flavorCategory,
        stemCount,
        id
      )
      .run();

    return this.getAdminProductById(db, id);
  },

  /**
   * Quick status toggle (soft activation / deactivation)
   */
  async toggleProductStatus(db: D1Database, id: string, active: number): Promise<FormattedProduct | null> {
    const existing = await db
      .prepare('SELECT id FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProductRow>();

    if (!existing) {
      return null;
    }

    await db
      .prepare('UPDATE products SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(active === 1 ? 1 : 0, id)
      .run();

    return this.getAdminProductById(db, id);
  },
};
