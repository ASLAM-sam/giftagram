import { ENV } from '../config/env';

export interface ProductImageItem {
  id: string;
  productId: string;
  secureUrl: string;
  publicId: string;
  folder: string;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string;
  createdAt?: string;
}

export const adminImageService = {
  /**
   * Fetch all images associated with a product.
   */
  async getProductImages(productId: string): Promise<ProductImageItem[]> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${productId}/images`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Unable to load product images.');
    }

    return result.data || [];
  },

  /**
   * Upload an image file for a product to Cloudinary & D1.
   */
  async uploadProductImage(
    productId: string,
    file: File,
    altText?: string,
    isPrimary?: boolean
  ): Promise<ProductImageItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }
    if (isPrimary !== undefined) {
      formData.append('isPrimary', isPrimary ? 'true' : 'false');
    }

    const response = await fetch(`${ENV.API_URL}/api/admin/products/${productId}/images`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Unable to upload image right now.');
    }

    return result.data;
  },

  /**
   * Set an image as the primary cover photo for a product.
   */
  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${productId}/images/${imageId}/primary`, {
      method: 'PUT',
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to set primary image.');
    }
  },

  /**
   * Reorder images for a product.
   */
  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${productId}/images/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ imageIds }),
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to update image order.');
    }
  },

  /**
   * Replace an existing image with a new file.
   */
  async replaceProductImage(productId: string, imageId: string, file: File): Promise<ProductImageItem> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${ENV.API_URL}/api/admin/products/${productId}/images/${imageId}/replace`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Unable to replace image.');
    }

    return result.data;
  },

  /**
   * Delete an image from Cloudinary and D1.
   */
  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    const response = await fetch(`${ENV.API_URL}/api/admin/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'This image could not be removed.');
    }
  },
};
