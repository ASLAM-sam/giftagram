import { Env } from '../env';
import { OrderRow, PaymentRow } from '../types';
import { createHmacSha256, timingSafeEqual } from '../utils/crypto';
import { generateId } from '../utils/ids';

export interface CreatePaymentOrderResponse {
  keyId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  orderNumber: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

function isLocalEnvironment(env: Env): boolean {
  const envVal = String(env.ENVIRONMENT || '').toLowerCase();
  if (envVal === 'production' || envVal === 'staging') {
    return false;
  }
  const nodeEnv =
    typeof (globalThis as any).process !== 'undefined'
      ? (globalThis as any).process?.env?.NODE_ENV
      : undefined;

  return (
    envVal === 'development' ||
    envVal === 'test' ||
    nodeEnv === 'test'
  );
}

export const razorpayService = {
  /**
   * Creates a Razorpay payment order for the 50% deposit amount
   * Handled strictly on the server with confidential server secrets
   */
  async createPaymentOrder(env: Env, orderIdOrNumber: string): Promise<CreatePaymentOrderResponse> {
    const db = env.DB;
    const isLocal = isLocalEnvironment(env);

    // 1. Load order from D1
    const order = await db
      .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
      .bind(orderIdOrNumber, orderIdOrNumber)
      .first<OrderRow>();

    if (!order) {
      throw new Error(`Order "${orderIdOrNumber}" not found.`);
    }

    if (order.status === 'deposit_paid' || order.status === 'completed') {
      throw new Error(`Order "${order.order_number}" deposit is already paid.`);
    }

    // Amount in integer paise
    const amountPaise = Math.round(order.deposit_amount * 100);

    // 2. Idempotency check: Reuse existing active Razorpay order if still pending
    const existingPayment = await db
      .prepare('SELECT * FROM payments WHERE order_id = ? AND status = "created" LIMIT 1')
      .bind(order.id)
      .first<PaymentRow>();

    if (existingPayment && existingPayment.provider_order_id) {
      return {
        keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock_mode',
        razorpayOrderId: existingPayment.provider_order_id,
        amount: amountPaise,
        currency: 'INR',
        orderNumber: order.order_number,
      };
    }

    let razorpayOrderId: string;

    // 3. Call Razorpay Orders API if real server secrets are present
    const hasRealSecrets = Boolean(
      env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      !env.RAZORPAY_KEY_ID.includes('YOUR_') &&
      !env.RAZORPAY_KEY_SECRET.includes('YOUR_') &&
      !env.RAZORPAY_KEY_ID.includes('placeholder') &&
      !env.RAZORPAY_KEY_SECRET.includes('placeholder') &&
      env.RAZORPAY_KEY_ID.startsWith('rzp_')
    );

    if (!isLocal && !hasRealSecrets) {
      throw new Error('Payment gateway configuration error: Razorpay live credentials are not configured in production.');
    }

    if (hasRealSecrets) {
      try {
        const credentials = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: 'INR',
            receipt: order.order_number,
            notes: {
              orderId: order.id,
              orderNumber: order.order_number,
              depositNote: '50% Non-refundable deposit for Giftagram custom bake order',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Razorpay API responded with ${response.status}: ${errText}`);
        }

        const rzpData = (await response.json()) as any;
        razorpayOrderId = rzpData.id;
      } catch (err: any) {
        console.error('[RazorpayService] Remote API failure:', err?.message || err);
        if (!isLocal) {
          throw new Error(`Failed to create order with payment gateway: ${err?.message || 'Remote gateway error'}`);
        }
        // Local development simulation fallback only
        razorpayOrderId = `order_sim_${Math.random().toString(36).substring(2, 12)}`;
      }
    } else {
      // Test Mode Simulation order for local development / test without external secrets
      razorpayOrderId = `order_test_${Math.random().toString(36).substring(2, 12)}`;
    }

    // 4. Store in payments table
    const paymentId = generateId('pay');
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO payments (
          id, order_id, provider, provider_order_id, amount, currency, status, signature_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        paymentId,
        order.id,
        'razorpay',
        razorpayOrderId,
        amountPaise,
        'INR',
        'created',
        0,
        now,
        now
      )
      .run();

    return {
      keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock_mode',
      razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      orderNumber: order.order_number,
    };
  },

  /**
   * Verifies payment authenticity via HMAC-SHA256 signature verification
   * Mandated by Razorpay before treating any payment as authentic
   */
  async verifyPayment(env: Env, input: VerifyPaymentInput): Promise<{ verified: boolean; orderNumber: string }> {
    const db = env.DB;
    const isLocal = isLocalEnvironment(env);

    const order = await db
      .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
      .bind(input.orderId, input.orderId)
      .first<OrderRow>();

    if (!order) {
      throw new Error('Order record not found for payment verification.');
    }

    // Idempotency: If already verified, return success
    if (order.status === 'deposit_paid' || order.status === 'confirmed') {
      return { verified: true, orderNumber: order.order_number };
    }

    const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    let isSignatureValid = false;

    const hasRealSecret = Boolean(
      env.RAZORPAY_KEY_SECRET &&
      !env.RAZORPAY_KEY_SECRET.includes('YOUR_') &&
      !env.RAZORPAY_KEY_SECRET.includes('placeholder')
    );

    if (!isLocal) {
      // PRODUCTION: Strictly require valid HMAC signature with configured secret
      if (!hasRealSecret) {
        throw new Error('Payment gateway configuration error: Razorpay secret is not configured in production.');
      }
      const expectedSignature = await createHmacSha256(env.RAZORPAY_KEY_SECRET, payload);
      isSignatureValid = timingSafeEqual(expectedSignature, input.razorpaySignature);
    } else {
      // LOCAL DEV / TEST:
      if (hasRealSecret) {
        const expectedSignature = await createHmacSha256(env.RAZORPAY_KEY_SECRET, payload);
        isSignatureValid = timingSafeEqual(expectedSignature, input.razorpaySignature);
      } else {
        // Isolated test simulation for local development only
        isSignatureValid =
          Boolean(input.razorpayOrderId) &&
          Boolean(input.razorpayPaymentId) &&
          Boolean(input.razorpaySignature) &&
          input.razorpaySignature !== 'invalid_signature_test';
      }
    }

    if (!isSignatureValid) {
      // Record failed payment attempt
      await db
        .prepare('UPDATE orders SET status = "payment_failed", updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), order.id)
        .run();

      throw new Error('Razorpay payment signature verification failed. Payment cannot be confirmed.');
    }

    // 5. Update Payment and Order status in D1 atomically
    const now = new Date().toISOString();
    await db.batch([
      db
        .prepare(
          `UPDATE payments 
           SET status = "captured", signature_verified = 1, provider_payment_id = ?, updated_at = ? 
           WHERE order_id = ? AND (provider_order_id = ? OR provider_order_id IS NULL)`
        )
        .bind(input.razorpayPaymentId, now, order.id, input.razorpayOrderId),
      db
        .prepare('UPDATE orders SET status = "deposit_paid", updated_at = ? WHERE id = ?')
        .bind(now, order.id),
      db
        .prepare(
          'INSERT INTO order_events (id, order_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(
          generateId('evt'),
          order.id,
          'payment_verified',
          JSON.stringify({
            provider: 'razorpay',
            paymentId: input.razorpayPaymentId,
            orderId: input.razorpayOrderId,
          }),
          now
        ),
    ]);

    return {
      verified: true,
      orderNumber: order.order_number,
    };
  },

  /**
   * Idempotent webhook handler for Razorpay asynchronous events
   */
  async handleWebhook(env: Env, signature: string | null, rawBody: string): Promise<{ received: boolean }> {
    const db = env.DB;
    const isLocal = isLocalEnvironment(env);

    if (!isLocal) {
      // PRODUCTION: Mandatory webhook signature verification
      if (
        !env.RAZORPAY_WEBHOOK_SECRET ||
        env.RAZORPAY_WEBHOOK_SECRET.includes('YOUR_') ||
        env.RAZORPAY_WEBHOOK_SECRET.includes('placeholder')
      ) {
        throw new Error('Razorpay webhook processing rejected: webhook secret is not configured in production.');
      }
      if (!signature || !signature.trim()) {
        throw new Error('Missing mandatory Razorpay webhook signature header (x-razorpay-signature).');
      }
      const expectedSig = await createHmacSha256(env.RAZORPAY_WEBHOOK_SECRET, rawBody);
      if (!timingSafeEqual(expectedSig, signature.trim())) {
        throw new Error('Invalid Razorpay webhook signature.');
      }
    } else {
      // LOCAL DEV / TEST:
      if (env.RAZORPAY_WEBHOOK_SECRET) {
        if (!signature || !signature.trim()) {
          throw new Error('Missing Razorpay webhook signature header.');
        }
        const expectedSig = await createHmacSha256(env.RAZORPAY_WEBHOOK_SECRET, rawBody);
        if (!timingSafeEqual(expectedSig, signature.trim())) {
          throw new Error('Invalid Razorpay webhook signature.');
        }
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error('Invalid JSON webhook payload.');
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
    const rzpPaymentId = paymentEntity?.id;

    if (!rzpOrderId) {
      return { received: true };
    }

    // Find order
    const paymentRow = await db
      .prepare('SELECT order_id FROM payments WHERE provider_order_id = ? LIMIT 1')
      .bind(rzpOrderId)
      .first<{ order_id: string }>();

    if (paymentRow) {
      const now = new Date().toISOString();
      if (event === 'payment.captured' || event === 'order.paid') {
        const sanitizedEventPayload = JSON.stringify({
          event,
          providerOrderId: rzpOrderId,
          providerPaymentId: rzpPaymentId,
          recordedAt: now,
        });

        await db.batch([
          db
            .prepare(
              'UPDATE payments SET status = "captured", provider_payment_id = ?, updated_at = ? WHERE provider_order_id = ?'
            )
            .bind(rzpPaymentId || null, now, rzpOrderId),
          db
            .prepare('UPDATE orders SET status = "deposit_paid", updated_at = ? WHERE id = ?')
            .bind(now, paymentRow.order_id),
          db
            .prepare(
              'INSERT INTO order_events (id, order_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)'
            )
            .bind(generateId('evt'), paymentRow.order_id, `webhook_${event}`, sanitizedEventPayload, now),
        ]);
      }
    }

    return { received: true };
  },
};
