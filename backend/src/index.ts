/**
 * Giftagram API — Cloudflare Workers Master Entry Point
 * 
 * Connected to:
 * - Cloudflare D1 (giftagram-db)
 * - Cloudflare R2 (giftagram-images)
 * - Razorpay (Server-Side Payment Authorization & Signature Verification)
 */

import { Env } from './env';
import { getCorsHeaders, errorResponse } from './utils/response';
import { handleHealthCheck } from './routes/health';
import { handleGetProducts, handleGetProductBySlug, handleGetCategories } from './routes/products';
import { handleCreateOrder } from './routes/orders';
import { handleOrderLookup } from './routes/orderLookup';
import { handleCreatePaymentOrder, handleVerifyPayment, handlePaymentWebhook } from './routes/payments';

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
      // Create Order
      else if (path === '/api/orders' && method === 'POST') {
        response = await handleCreateOrder(request, env);
      }
      // Order Lookup / Tracking
      else if (path === '/api/orders/lookup' && method === 'POST') {
        response = await handleOrderLookup(request, env);
      }
      // Create Razorpay Order
      else if ((path === '/api/payments/create-order' || path === '/api/payments/razorpay/create-order') && method === 'POST') {
        response = await handleCreatePaymentOrder(request, env);
      }
      // Verify Razorpay Signature
      else if ((path === '/api/payments/verify' || path === '/api/payments/razorpay/verify') && method === 'POST') {
        response = await handleVerifyPayment(request, env);
      }
      // Razorpay Webhook
      else if (path === '/api/payments/webhook' && method === 'POST') {
        response = await handlePaymentWebhook(request, env);
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
