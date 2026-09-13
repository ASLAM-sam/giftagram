import { jsonResponse, errorResponse } from '../utils/response';
import { razorpayService } from '../services/razorpayService';
import { Env } from '../env';

export async function handleCreatePaymentOrder(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const orderId = String(body.orderId || '').trim();
  if (!orderId) {
    return errorResponse('MISSING_ORDER_ID', 'Internal order ID is required to initiate payment', 400);
  }

  try {
    const paymentOrder = await razorpayService.createPaymentOrder(env, orderId);
    return jsonResponse(paymentOrder);
  } catch (err: any) {
    console.error('[handleCreatePaymentOrder] Error:', err);
    return errorResponse('PAYMENT_ORDER_CREATION_FAILED', err.message || 'Failed to create payment order', 400);
  }
}

export async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return errorResponse(
      'MISSING_PAYMENT_PROOF',
      'orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are all mandatory for signature verification.',
      400
    );
  }

  try {
    const result = await razorpayService.verifyPayment(env, {
      orderId: String(orderId),
      razorpayOrderId: String(razorpayOrderId),
      razorpayPaymentId: String(razorpayPaymentId),
      razorpaySignature: String(razorpaySignature),
    });
    return jsonResponse(result);
  } catch (err: any) {
    console.error('[handleVerifyPayment] Verification failed:', err);
    return errorResponse('PAYMENT_VERIFICATION_FAILED', err.message || 'Payment signature is invalid', 400);
  }
}

export async function handlePaymentWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-razorpay-signature');
  const rawBody = await request.text();

  try {
    const result = await razorpayService.handleWebhook(env, signature, rawBody);
    return jsonResponse(result);
  } catch (err: any) {
    console.error('[handlePaymentWebhook] Webhook error:', err);
    return errorResponse('WEBHOOK_PROCESSING_FAILED', err.message || 'Webhook verification failed', 400);
  }
}
