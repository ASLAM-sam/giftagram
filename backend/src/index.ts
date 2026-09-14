/**
 * Giftagram API — Cloudflare Workers Master Entry Point
 * 
 * Connected to:
 * - Cloudflare D1 (giftagram-db)
 * - Razorpay (Server-Side Payment Authorization & Signature Verification)
 */

import { Env } from './env';
import { getCorsHeaders, errorResponse } from './utils/response';
import { checkRateLimit, createRateLimitResponse } from './services/rateLimiter';
import { handleHealthCheck } from './routes/health';
import { handleGetProducts, handleGetProductBySlug, handleGetCategories } from './routes/products';
import { handleCreateOrder } from './routes/orders';
import { handleOrderLookup } from './routes/orderLookup';
import { handleCreatePaymentOrder, handleVerifyPayment, handlePaymentWebhook } from './routes/payments';
import { handleAdminLogin, handleAdminLogout, handleAdminMe } from './routes/adminAuth';
import {
  handleAdminGetProducts,
  handleAdminGetProductById,
  handleAdminCreateProduct,
  handleAdminUpdateProduct,
  handleAdminToggleProductStatus,
} from './routes/adminProducts';
import {
  handleAdminGetProductImages,
  handleAdminUploadProductImage,
  handleAdminSetPrimaryImage,
  handleAdminReorderImages,
  handleAdminReplaceProductImage,
  handleAdminDeleteProductImage,
} from './routes/adminImages';
import {
  handleAdminGetOrders,
  handleAdminGetOrderById,
  handleAdminUpdateOrderStatus,
} from './routes/adminOrders';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(request, env.CORS_ORIGINS);

    // 1. Handle CORS Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      let response: Response;

      // 2. Route Dispatcher
      // Root info endpoint
      if ((path === '/' || path === '') && method === 'GET') {
        response = new Response(
          JSON.stringify(
            {
              success: true,
              name: 'Giftagram API — Cloudflare Workers & D1',
              status: 'online',
              version: '1.0.0',
              environment: env.ENVIRONMENT || 'production',
              description: 'Backend REST API for Giftagram luxury cakes and floral gifting.',
              endpoints: {
                health: '/api/health',
                products: '/api/products',
                categories: '/api/categories',
                orders: '/api/orders',
                orderLookup: '/api/orders/lookup',
              },
              frontend: 'https://giftagram-frontend.hydpurefumes.workers.dev',
            },
            null,
            2
          ),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
      // Health Check
      else if (path === '/api/health' && method === 'GET') {
        response = await handleHealthCheck(request, env);
      }
      // Products Listing
      else if (path === '/api/products' && method === 'GET') {
        response = await handleGetProducts(request, env);
      }
      // Categories Listing
      else if (path === '/api/categories' && method === 'GET') {
        response = await handleGetCategories(request, env);
      }
      // Single Product by Slug
      else if (path.startsWith('/api/products/') && method === 'GET') {
        const slug = decodeURIComponent(path.replace('/api/products/', ''));
        response = await handleGetProductBySlug(request, env, slug);
      }
      // Create Order (Rate limited: 10 per 10 minutes)
      else if (path === '/api/orders' && method === 'POST') {
        const rl = await checkRateLimit(env, request, { action: 'create_order', limit: 10, windowSeconds: 600 });
        if (!rl.allowed) return createRateLimitResponse(rl.retryAfter, corsHeaders);
        response = await handleCreateOrder(request, env);
      }
      // Order Lookup / Tracking (Rate limited: 20 per 5 minutes)
      else if (path === '/api/orders/lookup' && method === 'POST') {
        const rl = await checkRateLimit(env, request, { action: 'order_lookup', limit: 20, windowSeconds: 300 });
        if (!rl.allowed) return createRateLimitResponse(rl.retryAfter, corsHeaders);
        response = await handleOrderLookup(request, env);
      }
      // Create Razorpay Order (Rate limited: 15 per 5 minutes)
      else if ((path === '/api/payments/create-order' || path === '/api/payments/razorpay/create-order') && method === 'POST') {
        const rl = await checkRateLimit(env, request, { action: 'payment_create_order', limit: 15, windowSeconds: 300 });
        if (!rl.allowed) return createRateLimitResponse(rl.retryAfter, corsHeaders);
        response = await handleCreatePaymentOrder(request, env);
      }
      // Verify Razorpay Signature (Rate limited: 15 per 5 minutes)
      else if ((path === '/api/payments/verify' || path === '/api/payments/razorpay/verify') && method === 'POST') {
        const rl = await checkRateLimit(env, request, { action: 'payment_verify', limit: 15, windowSeconds: 300 });
        if (!rl.allowed) return createRateLimitResponse(rl.retryAfter, corsHeaders);
        response = await handleVerifyPayment(request, env);
      }
      // Razorpay Webhook
      else if (path === '/api/payments/webhook' && method === 'POST') {
        response = await handlePaymentWebhook(request, env);
      }
      // Admin Authentication (Rate limited: 5 attempts per 15 minutes)
      else if (path === '/api/admin/login' && method === 'POST') {
        const rl = await checkRateLimit(env, request, { action: 'admin_login', limit: 5, windowSeconds: 900 });
        if (!rl.allowed) return createRateLimitResponse(rl.retryAfter, corsHeaders);
        response = await handleAdminLogin(request, env);
      }
      else if (path === '/api/admin/logout' && method === 'POST') {
        response = await handleAdminLogout(request, env);
      }
      else if (path === '/api/admin/me' && method === 'GET') {
        response = await handleAdminMe(request, env);
      }
      // Admin Product Management
      else if (path === '/api/admin/products' && method === 'GET') {
        response = await handleAdminGetProducts(request, env);
      }
      else if (path === '/api/admin/products' && method === 'POST') {
        response = await handleAdminCreateProduct(request, env);
      }
      // Admin Product Image Management
      else if (path.startsWith('/api/admin/products/') && path.endsWith('/images/reorder') && method === 'PUT') {
        const productId = decodeURIComponent(path.replace('/api/admin/products/', '').replace('/images/reorder', ''));
        response = await handleAdminReorderImages(request, env, productId);
      }
      else if (path.startsWith('/api/admin/products/') && path.includes('/images/') && path.endsWith('/primary') && method === 'PUT') {
        const parts = path.replace('/api/admin/products/', '').replace('/primary', '').split('/images/');
        const productId = decodeURIComponent(parts[0]);
        const imageId = decodeURIComponent(parts[1]);
        response = await handleAdminSetPrimaryImage(request, env, productId, imageId);
      }
      else if (path.startsWith('/api/admin/products/') && path.includes('/images/') && path.endsWith('/replace') && method === 'POST') {
        const parts = path.replace('/api/admin/products/', '').replace('/replace', '').split('/images/');
        const productId = decodeURIComponent(parts[0]);
        const imageId = decodeURIComponent(parts[1]);
        response = await handleAdminReplaceProductImage(request, env, productId, imageId);
      }
      else if (path.startsWith('/api/admin/products/') && path.includes('/images/') && method === 'DELETE') {
        const parts = path.replace('/api/admin/products/', '').split('/images/');
        const productId = decodeURIComponent(parts[0]);
        const imageId = decodeURIComponent(parts[1]);
        response = await handleAdminDeleteProductImage(request, env, productId, imageId);
      }
      else if (path.startsWith('/api/admin/products/') && path.endsWith('/images') && method === 'GET') {
        const productId = decodeURIComponent(path.replace('/api/admin/products/', '').replace('/images', ''));
        response = await handleAdminGetProductImages(request, env, productId);
      }
      else if (path.startsWith('/api/admin/products/') && path.endsWith('/images') && method === 'POST') {
        const productId = decodeURIComponent(path.replace('/api/admin/products/', '').replace('/images', ''));
        response = await handleAdminUploadProductImage(request, env, productId);
      }
      else if (path.startsWith('/api/admin/products/') && path.endsWith('/status') && method === 'PATCH') {
        const id = decodeURIComponent(path.replace('/api/admin/products/', '').replace('/status', ''));
        response = await handleAdminToggleProductStatus(request, env, id);
      }
      else if (path.startsWith('/api/admin/products/') && method === 'PUT') {
        const id = decodeURIComponent(path.replace('/api/admin/products/', ''));
        response = await handleAdminUpdateProduct(request, env, id);
      }
      else if (path.startsWith('/api/admin/products/') && method === 'GET') {
        const id = decodeURIComponent(path.replace('/api/admin/products/', ''));
        response = await handleAdminGetProductById(request, env, id);
      }
      // Admin Orders
      else if (path === '/api/admin/orders' && method === 'GET') {
        response = await handleAdminGetOrders(request, env);
      }
      else if (path.startsWith('/api/admin/orders/') && path.endsWith('/status') && method === 'PATCH') {
        const id = decodeURIComponent(path.replace('/api/admin/orders/', '').replace('/status', ''));
        response = await handleAdminUpdateOrderStatus(request, env, id);
      }
      else if (path.startsWith('/api/admin/orders/') && method === 'GET') {
        const id = decodeURIComponent(path.replace('/api/admin/orders/', ''));
        response = await handleAdminGetOrderById(request, env, id);
      }
      // 404 Route Not Found
      else {
        response = errorResponse('ROUTE_NOT_FOUND', `Cannot ${method} ${path}`, 404);
      }

      // 3. Inject CORS Headers into the final response
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (unhandledErr: any) {
      console.error('[Worker Unhandled Error]:', unhandledErr);
      return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected server error occurred', 500, undefined, corsHeaders);
    }
  },
};
