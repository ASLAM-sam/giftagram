/**
 * Giftagram Cloudinary Image Optimizer Utility
 * 
 * Provides automated WebP/AVIF format negotiation (f_auto),
 * perceptual quality compression (q_auto), responsive width scaling,
 * and aspect ratio enforcement to eliminate layout shifts and reduce payload size.
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'thumb';
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low';
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
}

/**
 * Injects Cloudinary transformations into an asset URL.
 * Falls back gracefully to the original URL if not hosted on Cloudinary.
 */
export function getOptimizedImageUrl(src: string, options: ImageTransformOptions = {}): string {
  if (!src) return '/images/cakes/chocolate-belgium.jpg';

  // If not hosted on Cloudinary (e.g. local static path /images/cakes/...), pass through directly
  if (!src.includes('res.cloudinary.com') || !src.includes('/image/upload/')) {
    return src;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations: string[] = [];

  // 1. Automatic format negotiation (WebP/AVIF)
  transformations.push(`f_${format}`);

  // 2. Intelligent perceptual compression
  transformations.push(`q_${quality}`);

  // 3. Width & height sizing
  if (width) transformations.push(`w_${Math.round(width)}`);
  if (height) transformations.push(`h_${Math.round(height)}`);

  // 4. Crop mode
  if (width || height) {
    transformations.push(`c_${crop}`);
  }

  const transformString = transformations.join(',');

  // Cloudinary standard URL structure:
  // https://res.cloudinary.com/<cloud>/image/upload/[transformations/]v<version>/<public_id>.<ext>
  const uploadIndex = src.indexOf('/image/upload/');
  const prefix = src.slice(0, uploadIndex + '/image/upload/'.length);
  const suffix = src.slice(uploadIndex + '/image/upload/'.length);

  // Strip existing transformations if present right after /image/upload/
  // Matches patterns like "c_fill,w_400/" or "f_auto/" before "v1234..." or the asset path
  const cleanedSuffix = suffix.replace(/^(?:(?:[a-z]{1,2}_[a-zA-Z0-9_.:-]+,?)+\/)+/, '');

  return `${prefix}${transformString}/${cleanedSuffix}`;
}

/**
 * Generates an HTML responsive srcSet string for Cloudinary images.
 */
export function getResponsiveSrcSet(
  src: string,
  widths: number[] = [320, 480, 640, 800, 1000]
): string | undefined {
  if (!src || !src.includes('res.cloudinary.com') || !src.includes('/image/upload/')) {
    return undefined;
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(src, { width: w, crop: 'fill' })} ${w}w`)
    .join(', ');
}

/**
 * Standard sizes attribute for responsive 2-column mobile to 4-column desktop product cards
 */
export const CARD_IMAGE_SIZES = '(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 24vw';
