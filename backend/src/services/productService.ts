import { ProductRow, ProductImageRow } from '../types';

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
  tags: string[];
  flavorCategory?: string;
  stemCount?: number;
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
      // Default local or R2 image path resolver
      const imgUrl = `/assets/${img.r2_key}`;
      list.push(imgUrl);
      imagesByProduct.set(img.product_id, list);
    });

    return products.map((p) => {
      const images = imagesByProduct.get(p.id) || [`/assets/products/${p.slug}.webp`];
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

    const images = (imagesRes.results || []).map((img) => `/assets/${img.r2_key}`);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      description: product.description,
      shortDescription: product.description.length > 100 ? `${product.description.substring(0, 97)}...` : product.description,
      price: product.price,
      weight: product.weight || undefined,
      images: images.length > 0 ? images : [`/assets/products/${product.slug}.webp`],
      featured: product.featured === 1,
      tags: [product.category, product.flavor_category || ''].filter(Boolean),
      flavorCategory: product.flavor_category || undefined,
      stemCount: product.stem_count || undefined,
    };
  },
};
