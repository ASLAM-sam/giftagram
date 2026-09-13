import { ENV } from '../config/env';

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  category: 'cakes' | 'bouquets' | string;
  description: string;
  shortDescription?: string;
  price: number;
  weight?: string;
  images: string[];
  featured: boolean;
  active: boolean;
  flavorCategory?: string;
  stemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  category: string;
  description: string;
  price: number;
  weight?: string | null;
  active?: boolean;
  featured?: boolean;
  flavorCategory?: string | null;
  stemCount?: number | null;
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  price?: number;
  weight?: string | null;
  active?: boolean;
  featured?: boolean;
  flavorCategory?: string | null;
  stemCount?: number | null;
}

export interface AdminProductFilterParams {
  category?: string;
  active?: boolean;
  search?: string;
}

/**
 * Admin Product Service
 * 
 * Authenticated API client for Giftagram Atelier Product Management.
 * All requests use `credentials: "include"` to pass the HttpOnly admin session cookie.
 */
export const adminProductService = {
  /**
   * Retrieves all products (active and inactive) with optional filtering.
   */
  async getProducts(filters?: AdminProductFilterParams): Promise<AdminProduct[]> {
    const url = new URL(`${ENV.API_URL}/api/admin/products`);
    if (filters?.category) {
      url.searchParams.set('category', filters.category);
    }
    if (filters?.active !== undefined) {
      url.searchParams.set('active', String(filters.active));
    }
    if (filters?.search) {
      url.searchParams.set('search', filters.search);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your administrative session has expired. Please sign in again.');
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to retrieve products from atelier catalog.');
    }

    return json.data || [];
  },

  /**
   * Retrieves a single product by ID.
   */
  async getProductById(id: string): Promise<AdminProduct> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your administrative session has expired. Please sign in again.');
    }

    if (response.status === 404) {
      throw new Error('Product not found in atelier catalog.');
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to retrieve product details.');
    }

    return json.data;
  },

  /**
   * Creates a new product with server-side validation.
   */
  async createProduct(payload: CreateProductPayload): Promise<AdminProduct> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      throw new Error('Your administrative session has expired. Please sign in again.');
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      if (response.status === 409) {
        throw new Error(json?.error?.message || 'A product with this slug already exists.');
      }
      throw new Error(json?.error?.message || 'Failed to create product.');
    }

    return json.data;
  },

  /**
   * Updates an existing product with server-side validation.
   */
  async updateProduct(id: string, payload: UpdateProductPayload): Promise<AdminProduct> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      throw new Error('Your administrative session has expired. Please sign in again.');
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      if (response.status === 409) {
        throw new Error(json?.error?.message || 'A product with this slug already exists.');
      }
      if (response.status === 404) {
        throw new Error('Product not found.');
      }
      throw new Error(json?.error?.message || 'Failed to update product.');
    }

    return json.data;
  },

  /**
   * Toggles product active / inactive status (soft activation/deactivation).
   */
  async toggleStatus(id: string, active: boolean): Promise<AdminProduct> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ active: active ? 1 : 0 }),
    });

    if (response.status === 401) {
      throw new Error('Your administrative session has expired. Please sign in again.');
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      if (response.status === 404) {
        throw new Error('Product not found.');
      }
      throw new Error(json?.error?.message || 'Failed to update product status.');
    }

    return json.data;
  },
};
