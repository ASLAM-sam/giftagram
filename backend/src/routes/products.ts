import { jsonResponse, errorResponse } from '../utils/response';
import { productService } from '../services/productService';
import { Env } from '../env';

export async function handleGetProducts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || undefined;
  const featuredParam = url.searchParams.get('featured');
  const featured = featuredParam !== null ? featuredParam === 'true' : undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const products = await productService.getActiveProducts(env.DB, {
      category,
      featured,
      search,
    });
    return jsonResponse(products);
  } catch (err: any) {
    console.error('[handleGetProducts] Error:', err);
    return errorResponse('DATABASE_ERROR', 'Failed to retrieve products from database', 500);
  }
}

export async function handleGetProductBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  try {
    const product = await productService.getProductBySlug(env.DB, slug);
    if (!product) {
      return errorResponse('PRODUCT_NOT_FOUND', `Product "${slug}" was not found or is no longer available.`, 404);
    }
    return jsonResponse(product);
  } catch (err: any) {
    console.error('[handleGetProductBySlug] Error:', err);
    return errorResponse('DATABASE_ERROR', 'Failed to retrieve product details', 500);
  }
}

export async function handleGetCategories(request: Request, env: Env): Promise<Response> {
  try {
    const activeResult = await env.DB
      .prepare('SELECT DISTINCT category FROM products WHERE active = 1')
      .all<{ category: string }>();

    const comingSoonResult = await env.DB
      .prepare('SELECT DISTINCT category FROM products WHERE active = 0')
      .all<{ category: string }>();

    return jsonResponse({
      active: (activeResult.results || []).map((r) => r.category),
      comingSoon: (comingSoonResult.results || []).map((r) => r.category),
    });
  } catch (err: any) {
    return errorResponse('DATABASE_ERROR', 'Failed to retrieve product categories', 500);
  }
}
