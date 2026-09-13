import { Product, ProductCategory } from '../types';
import { CAKE_PRODUCTS } from '../data/cakes';
import { BOUQUET_PRODUCTS } from '../data/bouquets';
import { ENV } from '../config/env';

/**
 * Product Service
 * 
 * Fetches products from Cloudflare Worker API connected to Cloudflare D1.
 * Provides reliable fallback to seeded catalog during offline development or API initialization.
 */

const LOCAL_PRODUCTS: Record<ProductCategory, Product[]> = {
  cakes: CAKE_PRODUCTS,
  bouquets: BOUQUET_PRODUCTS,
};

export const productService = {
  /**
   * Fetches active products, optionally filtered by category
   */
  async getProducts(category?: ProductCategory): Promise<Product[]> {
    try {
      const url = new URL(`${ENV.API_URL}/api/products`);
      if (category) {
        url.searchParams.set('category', category);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return json;
    } catch (err) {
      console.warn('[ProductService] Backend API not reachable or returned error. Using catalog fallback:', err);
      if (category) {
        return LOCAL_PRODUCTS[category] || [];
      }
      return [...CAKE_PRODUCTS, ...BOUQUET_PRODUCTS];
    }
  },

  /**
   * Fetches a single product by category and slug
   */
  async getProductBySlug(category: ProductCategory, slug: string): Promise<Product | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${ENV.API_URL}/api/products/${slug}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn(`[ProductService] Error fetching product /${category}/${slug} from API:`, err);
    }

    // Local fallback
    const list = LOCAL_PRODUCTS[category] || [];
    return list.find((p) => p.slug === slug) || null;
  },

  /**
   * Fetches featured products for the home page
   */
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${ENV.API_URL}/api/products?featured=true`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[ProductService] Fetching featured from fallback catalog:', err);
    }

    return [...CAKE_PRODUCTS, ...BOUQUET_PRODUCTS].filter((p) => p.featured);
  },
};
