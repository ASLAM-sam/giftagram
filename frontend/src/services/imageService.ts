/**
 * Image Asset Service (Cloudflare R2 Ready)
 * 
 * Future Architecture:
 * 1. Product and gallery images stored in Cloudflare R2 bucket.
 * 2. Served via custom domain with Cloudflare Polish / Images optimization.
 * 3. Client uploads for inspiration photos stored via presigned R2 URLs.
 */

export const imageService = {
  /**
   * Resolves image URL.
   * If an R2 CDN base URL is configured in future environment, prefixes it.
   */
  resolveImageUrl(path: string): string {
    // Currently serves from local /public
    return path;
  },

  /**
   * Future R2 upload for customer-submitted cake reference photos
   * TODO: Connect to Worker endpoint `POST /api/upload-reference` with R2 binding.
   */
  async uploadReferencePhoto(file: File): Promise<string> {
    console.info(`[ImageService] Uploading reference photo ${file.name} to R2 bucket`);
    return URL.createObjectURL(file);
  },
};
