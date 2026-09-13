import { jsonResponse, errorResponse } from '../utils/response';
import { orderService } from '../services/orderService';
import { Env } from '../env';

export async function handleOrderLookup(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const orderNumber = String(body.orderNumber || '').trim();
  const phone = String(body.phone || '').trim();

  if (!orderNumber || !phone) {
    return errorResponse('MISSING_FIELDS', 'Both Order Number and phone number are required for order tracking.', 400);
  }

  try {
    const orderData = await orderService.lookupOrder(env.DB, orderNumber, phone);
    if (!orderData) {
      return errorResponse('ORDER_NOT_FOUND', 'No matching order found with provided Order Number and phone.', 404);
    }
    return jsonResponse(orderData);
  } catch (err: any) {
    console.error('[handleOrderLookup] Error:', err);
    return errorResponse('LOOKUP_FAILED', 'Failed to retrieve order details', 500);
  }
}
