import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { productService } from '../services/productService';
import { CreateProductInput, UpdateProductInput } from '../types';

/**
 * GET /api/admin/products
 * Retrieves all products (active and inactive) for admin management.
 */
export async function handleAdminGetProducts(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const activeParam = url.searchParams.get('active');
    const active = activeParam !== null ? (activeParam === 'true' || activeParam === '1' ? 1 : 0) : undefined;
    const search = url.searchParams.get('search') || undefined;

    const products = await productService.getAllAdminProducts(env.DB, {
      category,
      active,
      search,
    });

    return jsonResponse(products, 200);
  } catch (err: any) {
    console.error('[handleAdminGetProducts] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Failed to retrieve products for admin', 500);
  }
}

/**
 * GET /api/admin/products/:id
 * Retrieves a single product by ID for admin viewing/editing.
 */
export async function handleAdminGetProductById(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    const product = await productService.getAdminProductById(env.DB, id);
    if (!product) {
      return errorResponse('PRODUCT_NOT_FOUND', `Product with ID "${id}" was not found.`, 404);
    }
    return jsonResponse(product, 200);
  } catch (err: any) {
    console.error('[handleAdminGetProductById] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Failed to retrieve product details', 500);
  }
}

/**
 * POST /api/admin/products
 * Creates a new product in D1 with server validation.
 */
export async function handleAdminCreateProduct(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  // 1. Validation
  const name = body?.name;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Product name is required.', 400);
  }
  if (name.trim().length < 2 || name.trim().length > 100) {
    return errorResponse('VALIDATION_ERROR', 'Product name must be between 2 and 100 characters.', 400);
  }

  const category = body?.category;
  if (!category || typeof category !== 'string' || !category.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Product category is required.', 400);
  }

  const description = body?.description;
  if (!description || typeof description !== 'string' || !description.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Product description is required.', 400);
  }

  const priceRaw = body?.price;
  const price = Number(priceRaw);
  if (priceRaw === undefined || priceRaw === null || isNaN(price) || price <= 0) {
    return errorResponse('VALIDATION_ERROR', 'Price must be a valid positive number.', 400);
  }

  const input: CreateProductInput = {
    name: name.trim(),
    slug: body.slug && typeof body.slug === 'string' ? body.slug.trim() : undefined,
    category: category.trim(),
    description: description.trim(),
    price: Math.round(price),
    weight: body.weight && typeof body.weight === 'string' ? body.weight.trim() : null,
    active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
    featured: body.featured !== undefined ? (body.featured ? 1 : 0) : 0,
    flavorCategory: body.flavorCategory && typeof body.flavorCategory === 'string' ? body.flavorCategory.trim() : null,
    stemCount: body.stemCount !== undefined && body.stemCount !== null ? Number(body.stemCount) : null,
  };

  try {
    const product = await productService.createProduct(env.DB, input);
    return jsonResponse(product, 201);
  } catch (err: any) {
    console.error('[handleAdminCreateProduct] Error:', err?.message || err);
    if (err?.message?.includes('already exists')) {
      return errorResponse('SLUG_CONFLICT', err.message, 409);
    }
    return errorResponse('DATABASE_ERROR', err?.message || 'Failed to create product in database', 500);
  }
}

/**
 * PUT /api/admin/products/:id
 * Updates an existing product in D1 with server validation.
 */
export async function handleAdminUpdateProduct(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  // 1. Validation of supplied mutable fields
  const input: UpdateProductInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return errorResponse('VALIDATION_ERROR', 'Product name cannot be empty.', 400);
    }
    input.name = body.name.trim();
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || !body.slug.trim()) {
      return errorResponse('VALIDATION_ERROR', 'Product slug cannot be empty.', 400);
    }
    input.slug = body.slug.trim();
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !body.category.trim()) {
      return errorResponse('VALIDATION_ERROR', 'Category cannot be empty.', 400);
    }
    input.category = body.category.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      return errorResponse('VALIDATION_ERROR', 'Description cannot be empty.', 400);
    }
    input.description = body.description.trim();
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (isNaN(price) || price <= 0) {
      return errorResponse('VALIDATION_ERROR', 'Price must be a valid positive number.', 400);
    }
    input.price = Math.round(price);
  }

  if (body.weight !== undefined) {
    input.weight = body.weight && typeof body.weight === 'string' ? body.weight.trim() : null;
  }

  if (body.active !== undefined) {
    input.active = body.active ? 1 : 0;
  }

  if (body.featured !== undefined) {
    input.featured = body.featured ? 1 : 0;
  }

  if (body.flavorCategory !== undefined) {
    input.flavorCategory = body.flavorCategory && typeof body.flavorCategory === 'string' ? body.flavorCategory.trim() : null;
  }

  if (body.stemCount !== undefined) {
    input.stemCount = body.stemCount !== null ? Number(body.stemCount) : null;
  }

  try {
    const updated = await productService.updateProduct(env.DB, id, input);
    if (!updated) {
      return errorResponse('PRODUCT_NOT_FOUND', `Product with ID "${id}" was not found.`, 404);
    }
    return jsonResponse(updated, 200);
  } catch (err: any) {
    console.error('[handleAdminUpdateProduct] Error:', err?.message || err);
    if (err?.message?.includes('already exists')) {
      return errorResponse('SLUG_CONFLICT', err.message, 409);
    }
    return errorResponse('DATABASE_ERROR', err?.message || 'Failed to update product in database', 500);
  }
}

/**
 * PATCH /api/admin/products/:id/status
 * Quick soft toggle for active / inactive status.
 */
export async function handleAdminToggleProductStatus(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const activeVal = body?.active;
  if (activeVal === undefined || activeVal === null) {
    return errorResponse('VALIDATION_ERROR', 'Field "active" is required.', 400);
  }

  const activeNum = activeVal ? 1 : 0;

  try {
    const updated = await productService.toggleProductStatus(env.DB, id, activeNum);
    if (!updated) {
      return errorResponse('PRODUCT_NOT_FOUND', `Product with ID "${id}" was not found.`, 404);
    }
    return jsonResponse(updated, 200);
  } catch (err: any) {
    console.error('[handleAdminToggleProductStatus] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Failed to toggle product status', 500);
  }
}
