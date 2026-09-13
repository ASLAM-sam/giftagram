import { jsonResponse, errorResponse } from '../utils/response';
import { validateCreateOrderInput } from '../validators/orderValidator';
import { orderService } from '../services/orderService';
import { Env } from '../env';

export async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const validation = validateCreateOrderInput(body);
  if (!validation.valid || !validation.data) {
    return errorResponse('VALIDATION_FAILED', 'Order data failed validation checks', 400, validation.errors);
  }

  try {
    const createdOrder = await orderService.createOrder(env.DB, validation.data);
    return jsonResponse(createdOrder, 201);
  } catch (err: any) {
    console.error('[handleCreateOrder] Error:', err);
    return errorResponse('ORDER_CREATION_FAILED', err.message || 'Failed to create order in database', 400);
  }
}
