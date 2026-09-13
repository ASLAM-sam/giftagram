import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { orderService } from '../services/orderService';

/**
 * GET /api/admin/orders
 * Lists all orders with search, status filtering, and pagination.
 */
export async function handleAdminGetOrders(
  request: Request,
  env: Env
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!, 10) : undefined;

    const orders = await orderService.getAdminOrders(env.DB, {
      status,
      search,
      limit,
      offset,
    });

    return jsonResponse(orders, 200);
  } catch (err: any) {
    console.error('[handleAdminGetOrders] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Unable to load orders right now.', 500);
  }
}

/**
 * GET /api/admin/orders/:id
 * Retrieves full order dossier: line items, cake customizations, payment records, and audit events.
 */
export async function handleAdminGetOrderById(
  request: Request,
  env: Env,
  idOrOrderNumber: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  try {
    const order = await orderService.getAdminOrderById(env.DB, idOrOrderNumber);
    if (!order) {
      return errorResponse('ORDER_NOT_FOUND', `Order "${idOrOrderNumber}" was not found.`, 404);
    }

    return jsonResponse(order, 200);
  } catch (err: any) {
    console.error('[handleAdminGetOrderById] Error:', err?.message || err);
    return errorResponse('DATABASE_ERROR', 'Unable to retrieve order details.', 500);
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 * Transitions an order status following strict business state machine validation.
 */
export async function handleAdminUpdateOrderStatus(
  request: Request,
  env: Env,
  idOrOrderNumber: string
): Promise<Response> {
  const auth = await requireAdminAuth(request, env);
  if (!auth.success) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  if (!body?.status || typeof body.status !== 'string') {
    return errorResponse('VALIDATION_ERROR', 'Field "status" is required and must be a string.', 400);
  }

  try {
    const updated = await orderService.updateOrderStatus(
      env.DB,
      idOrOrderNumber,
      body.status,
      body.reason
    );
    return jsonResponse(updated, 200);
  } catch (err: any) {
    console.error('[handleAdminUpdateOrderStatus] Error:', err?.message || err);
    const msg = err?.message || 'Unable to update order status.';
    if (msg.includes('not found')) {
      return errorResponse('ORDER_NOT_FOUND', msg, 404);
    }
    if (msg.includes('Cannot transition') || msg.includes('Invalid status')) {
      return errorResponse('INVALID_STATUS_TRANSITION', msg, 400);
    }
    return errorResponse('UPDATE_FAILED', 'Unable to update this order.', 500);
  }
}
