import { Env } from '../env';
import { cloudinaryService } from './cloudinaryService';
import { generateId } from '../utils/ids';
import { ProductImageRow, ProductRow } from '../types';

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

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/jpg',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const imageService = {
  /**
   * Retrieves all images for a given product, primary image first.
   */
  async getProductImages(db: D1Database, productId: string): Promise<ProductImageItem[]> {
    const result = await db
      .prepare(
        `SELECT * FROM product_images 
         WHERE product_id = ? 
         ORDER BY is_primary DESC, sort_order ASC, created_at ASC`
      )
      .bind(productId)
      .all<ProductImageRow>();

    const rows = result.results || [];
    return rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      secureUrl: r.secure_url || `/assets/${r.r2_key}`,
      publicId: r.public_id || r.r2_key || '',
      folder: r.folder || 'giftagram/products',
      isPrimary: r.is_primary === 1,
      sortOrder: r.sort_order || 0,
      altText: r.alt_text || undefined,
      createdAt: r.created_at,
    }));
  },

  /**
   * Uploads an image to Cloudinary under giftagram/products and creates a D1 record.
   */
  async uploadProductImage(
    db: D1Database,
    env: Env,
    productId: string,
    file: File,
    altText?: string,
    isPrimary?: boolean
  ): Promise<ProductImageItem> {
    // 1. Verify product exists
    const product = await db
      .prepare('SELECT id, category FROM products WHERE id = ? LIMIT 1')
      .bind(productId)
      .first<ProductRow>();

    if (!product) {
      throw new Error(`Product with ID "${productId}" was not found.`);
    }

    // 2. Validate file MIME type
    if (!file || !file.type || !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      throw new Error('Unsupported file format. Please upload a valid JPG, PNG, WebP, or AVIF image.');
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Image file is too large. Maximum allowed size is 10MB.');
    }

    // 4. Upload to Cloudinary under strict giftagram/ namespace
    const folder = `giftagram/products/${product.category || 'cakes'}`;
    const uploadResult = await cloudinaryService.uploadImage(file, folder, env);

    // 5. Determine primary status & sort order in D1
    const existingImages = await this.getProductImages(db, productId);
    const shouldBePrimary = isPrimary !== undefined ? Boolean(isPrimary) : existingImages.length === 0;
    const nextSortOrder = existingImages.length > 0 ? Math.max(...existingImages.map((i) => i.sortOrder)) + 1 : 0;
    const imageId = generateId('img');
    const now = new Date().toISOString();

    try {
      const statements: D1PreparedStatement[] = [];

      if (shouldBePrimary && existingImages.length > 0) {
        statements.push(
          db
            .prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?')
            .bind(productId)
        );
      }

      statements.push(
        db
          .prepare(
            `INSERT INTO product_images (
              id, product_id, r2_key, alt_text, sort_order, secure_url, public_id, folder, is_primary, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            imageId,
            productId,
            uploadResult.public_id, // preserve backwards compatibility with r2_key column
            altText || null,
            nextSortOrder,
            uploadResult.secure_url,
            uploadResult.public_id,
            uploadResult.folder || folder || null,
            shouldBePrimary ? 1 : 0,
            now
          )
      );

      await db.batch(statements);

      return {
        id: imageId,
        productId,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        folder: uploadResult.folder || folder,
        isPrimary: shouldBePrimary,
        sortOrder: nextSortOrder,
        altText: altText || undefined,
        createdAt: now,
      };
    } catch (d1Err: any) {
      console.error('[uploadProductImage] D1 persistence failed. Running compensatory cleanup on Cloudinary:', d1Err);
      // Compensatory cleanup to prevent orphan asset in Cloudinary
      try {
        await cloudinaryService.deleteImage(uploadResult.public_id, env);
      } catch (cleanupErr) {
        console.error('[uploadProductImage] Failed to delete orphaned Cloudinary asset:', cleanupErr);
      }
      throw new Error(`Failed to save image record in database: ${d1Err?.message || d1Err}`);
    }
  },

  /**
   * Designates an image as the primary cover image for a product.
   */
  async setPrimaryImage(db: D1Database, productId: string, imageId: string): Promise<void> {
    const existing = await db
      .prepare('SELECT id FROM product_images WHERE id = ? AND product_id = ? LIMIT 1')
      .bind(imageId, productId)
      .first<{ id: string }>();

    if (!existing) {
      throw new Error(`Image with ID "${imageId}" does not belong to product "${productId}".`);
    }

    await db.batch([
      db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').bind(productId),
      db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?').bind(imageId, productId),
    ]);
  },

  /**
   * Persists custom display ordering for product images.
   */
  async reorderImages(db: D1Database, productId: string, imageIds: string[]): Promise<void> {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return;
    }

    const statements = imageIds.map((id, index) =>
      db
        .prepare('UPDATE product_images SET sort_order = ? WHERE id = ? AND product_id = ?')
        .bind(index, id, productId)
    );

    await db.batch(statements);
  },

  /**
   * Replaces an existing image asset safely: uploads new asset -> updates D1 -> destroys old asset.
   */
  async replaceProductImage(
    db: D1Database,
    env: Env,
    productId: string,
    imageId: string,
    file: File
  ): Promise<ProductImageItem> {
    // 1. Verify image exists and belongs to product
    const existing = await db
      .prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ? LIMIT 1')
      .bind(imageId, productId)
      .first<ProductImageRow>();

    if (!existing) {
      throw new Error(`Image with ID "${imageId}" was not found for product "${productId}".`);
    }

    // 2. Validate new file
    if (!file || !file.type || !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      throw new Error('Unsupported file format. Please upload a valid JPG, PNG, WebP, or AVIF image.');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Image file is too large. Maximum allowed size is 10MB.');
    }

    // 3. Upload new image to Cloudinary first
    const folder = existing.folder || `giftagram/products`;
    const newAsset = await cloudinaryService.uploadImage(file, folder, env);

    // 4. Update D1 reference
    try {
      await db
        .prepare(
          `UPDATE product_images 
           SET secure_url = ?, public_id = ?, folder = ?, r2_key = ? 
           WHERE id = ? AND product_id = ?`
        )
        .bind(newAsset.secure_url, newAsset.public_id, newAsset.folder || folder || null, newAsset.public_id, imageId, productId)
        .run();
    } catch (d1Err: any) {
      // Compensatory cleanup of the newly uploaded asset
      try {
        await cloudinaryService.deleteImage(newAsset.public_id, env);
      } catch (cleanupErr) {
        console.error('[replaceProductImage] Failed cleanup of new asset:', cleanupErr);
      }
      throw new Error(`Failed to update image reference in database: ${d1Err?.message || d1Err}`);
    }

    // 5. Only after D1 updates successfully, delete the old Cloudinary asset
    const oldPublicId = existing.public_id;
    if (oldPublicId && oldPublicId.startsWith('giftagram/')) {
      try {
        await cloudinaryService.deleteImage(oldPublicId, env);
      } catch (err) {
        console.warn(`[replaceProductImage] Could not destroy old Cloudinary asset "${oldPublicId}":`, err);
      }
    }

    return {
      id: imageId,
      productId,
      secureUrl: newAsset.secure_url,
      publicId: newAsset.public_id,
      folder: newAsset.folder,
      isPrimary: existing.is_primary === 1,
      sortOrder: existing.sort_order || 0,
      altText: existing.alt_text || undefined,
      createdAt: existing.created_at,
    };
  },

  /**
   * Safely deletes a product image from Cloudinary and D1, with automatic primary promotion.
   */
  async deleteProductImage(
    db: D1Database,
    env: Env,
    productId: string,
    imageId: string
  ): Promise<void> {
    const existing = await db
      .prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ? LIMIT 1')
      .bind(imageId, productId)
      .first<ProductImageRow>();

    if (!existing) {
      throw new Error(`Image with ID "${imageId}" was not found for product "${productId}".`);
    }

    // 1. Delete from Cloudinary if public_id belongs to giftagram namespace
    const publicId = existing.public_id;
    if (publicId && publicId.startsWith('giftagram/')) {
      await cloudinaryService.deleteImage(publicId, env);
    }

    // 2. Delete from D1
    await db
      .prepare('DELETE FROM product_images WHERE id = ? AND product_id = ?')
      .bind(imageId, productId)
      .run();

    // 3. If deleted image was primary, promote the next available image
    if (existing.is_primary === 1) {
      const nextImage = await db
        .prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1')
        .bind(productId)
        .first<{ id: string }>();

      if (nextImage) {
        await db
          .prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?')
          .bind(nextImage.id)
          .run();
      }
    }
  },
};
