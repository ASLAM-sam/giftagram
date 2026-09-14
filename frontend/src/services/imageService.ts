/**
 * Image Asset Service
 * 
 * Architecture:
 * 1. Product and gallery images are stored in Cloudinary under the giftagram/ namespace.
 * 2. Served via Cloudinary's dynamic CDN.
 * 3. Future: Client uploads for inspiration photos stored via signed Cloudinary APIs.
 */

import {
  getOptimizedImageUrl,
  getResponsiveSrcSet,
  CARD_IMAGE_SIZES,
  ImageTransformOptions,
  PLACEHOLDER_PRODUCT_IMAGE,
} from '../utils/imageOptimizer';

export { getOptimizedImageUrl, getResponsiveSrcSet, CARD_IMAGE_SIZES, PLACEHOLDER_PRODUCT_IMAGE };
export type { ImageTransformOptions };

export const imageService = {
  /**
   * Resolves image URL with optional Cloudinary optimizations (f_auto, q_auto, width, height).
   */
  resolveImageUrl(path: string, options?: ImageTransformOptions): string {
    if (!path) return PLACEHOLDER_PRODUCT_IMAGE;
    if (options) {
      return getOptimizedImageUrl(path, options);
    }
    // Default to auto format & auto quality optimization if Cloudinary hosted
    return getOptimizedImageUrl(path, { quality: 'auto', format: 'auto' });
  },

  /**
   * Future upload for customer-submitted cake reference photos
   * TODO: Connect to Worker endpoint `POST /api/upload-reference` with Cloudinary service.
   */
  async uploadReferencePhoto(file: File): Promise<string> {
    console.info(`[ImageService] Uploading reference photo ${file.name} to Cloudinary`);
    return URL.createObjectURL(file);
  },
};
