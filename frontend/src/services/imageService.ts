/**
 * Image Asset Service
 * 
 * Architecture:
 * 1. Product and gallery images are stored in Cloudinary under the giftagram/ namespace.
 * 2. Served via Cloudinary's dynamic CDN.
 * 3. Future: Client uploads for inspiration photos stored via signed Cloudinary APIs.
 */

export const imageService = {
  /**
   * Resolves image URL.
   */
  resolveImageUrl(path: string): string {
    // Backend API already returns fully qualified Cloudinary secure_urls,
    // or falls back to local /public paths for legacy items.
    return path;
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
