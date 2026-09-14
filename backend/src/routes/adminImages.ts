import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { imageService } from '../services/imageService';

/**
 * GET /api/admin/products/:id/images
 * Lists all images associated with a product.
 */
export async function handleAdminGetProductImages(
  request: Request,
  env: Env,
  productId: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    const images = await imageService.getProductImages(env.DB, productId);
    return jsonResponse(images, 200);
  } catch (err: any) {
    console.error('[handleAdminGetProductImages] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Failed to retrieve product images.', 500);
  }
}

/**
 * POST /api/admin/products/:id/images
 * Uploads an image to Cloudinary and saves it in D1 product_images.
 */
export async function handleAdminUploadProductImage(
  request: Request,
  env: Env,
  productId: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err: any) {
    return errorResponse('INVALID_FORM_DATA', 'Expected multipart/form-data with file upload.', 400);
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return errorResponse('MISSING_FILE', 'No image file was provided for upload.', 400);
  }

  const altText = (formData.get('altText') as string | null) || undefined;
  const isPrimary = formData.get('isPrimary') === 'true' || formData.get('isPrimary') === '1';

  try {
    const createdImage = await imageService.uploadProductImage(
      env.DB,
      env,
      productId,
      file,
      altText,
      isPrimary
    );
    return jsonResponse(createdImage, 201);
  } catch (err: any) {
    console.error('[handleAdminUploadProductImage] Error:', err?.message || err);
    const msg = err?.message || '';
    if (err?.status === 409 || msg.includes('Maximum 5 images allowed')) {
      return errorResponse('IMAGE_LIMIT_REACHED', msg, 409);
    }
    if (msg.includes('not found')) {
      return errorResponse('PRODUCT_NOT_FOUND', 'Product not found.', 404);
    }
    if (msg.includes('Unsupported file format') || msg.includes('too large')) {
      return errorResponse('VALIDATION_ERROR', msg, 400);
    }
    return errorResponse('UPLOAD_FAILED', 'Failed to upload product image.', 500);
  }
}

/**
 * PUT /api/admin/products/:id/images/:imageId/primary
 * Sets an image as the primary cover photo for a product.
 */
export async function handleAdminSetPrimaryImage(
  request: Request,
  env: Env,
  productId: string,
  imageId: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    await imageService.setPrimaryImage(env.DB, productId, imageId);
    return jsonResponse({ success: true, message: 'Primary image updated.' }, 200);
  } catch (err: any) {
    console.error('[handleAdminSetPrimaryImage] Error:', err?.message || err);
    const msg = err?.message || '';
    if (msg.includes('does not belong') || msg.includes('not found')) {
      return errorResponse('IMAGE_NOT_FOUND', 'Image not found for this product.', 404);
    }
    return errorResponse('DATABASE_ERROR', 'Failed to set primary image.', 500);
  }
}

/**
 * PUT /api/admin/products/:id/images/reorder
 * Updates display order of images.
 */
export async function handleAdminReorderImages(
  request: Request,
  env: Env,
  productId: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  if (!Array.isArray(body?.imageIds)) {
    return errorResponse('VALIDATION_ERROR', 'Field "imageIds" must be an array of image IDs.', 400);
  }

  try {
    await imageService.reorderImages(env.DB, productId, body.imageIds);
    return jsonResponse({ success: true, message: 'Image order updated.' }, 200);
  } catch (err: any) {
    console.error('[handleAdminReorderImages] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Failed to update image order.', 500);
  }
}

/**
 * POST /api/admin/products/:id/images/:imageId/replace
 * Safely replaces an existing image with a new file.
 */
export async function handleAdminReplaceProductImage(
  request: Request,
  env: Env,
  productId: string,
  imageId: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('INVALID_FORM_DATA', 'Expected multipart/form-data with replacement file.', 400);
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return errorResponse('MISSING_FILE', 'No replacement image file was provided.', 400);
  }

  try {
    const updatedImage = await imageService.replaceProductImage(
      env.DB,
      env,
      productId,
      imageId,
      file
    );
    return jsonResponse(updatedImage, 200);
  } catch (err: any) {
    console.error('[handleAdminReplaceProductImage] Error:', err?.message || err);
    const msg = err?.message || '';
    if (msg.includes('not found')) {
      return errorResponse('IMAGE_NOT_FOUND', 'Image not found for this product.', 404);
    }
    if (msg.includes('Unsupported file format') || msg.includes('too large')) {
      return errorResponse('VALIDATION_ERROR', msg, 400);
    }
    return errorResponse('REPLACE_FAILED', 'Failed to replace product image.', 500);
  }
}

/**
 * DELETE /api/admin/products/:id/images/:imageId
 * Safely deletes an image from Cloudinary and D1.
 */
export async function handleAdminDeleteProductImage(
  request: Request,
  env: Env,
  productId: string,
  imageId: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    await imageService.deleteProductImage(env.DB, env, productId, imageId);
    return jsonResponse({ success: true, message: 'Image deleted successfully.' }, 200);
  } catch (err: any) {
    console.error('[handleAdminDeleteProductImage] Error:', err?.message || err);
    const msg = err?.message || '';
    if (msg.includes('not found')) {
      return errorResponse('IMAGE_NOT_FOUND', 'Image not found for this product.', 404);
    }
    return errorResponse('DELETE_FAILED', 'Failed to delete product image.', 500);
  }
}
