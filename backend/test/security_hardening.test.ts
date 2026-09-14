import { razorpayService } from '../src/services/razorpayService';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '../src/services/rateLimiter';
import { createHmacSha256 } from '../src/utils/crypto';
import { Env } from '../src/env';

export async function runSecurityHardeningTests() {
  console.log('\n--- RUNNING SECURITY HARDENING & PRODUCTION AUDIT TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Helper to create a mock D1Database for unit testing
  function createMockD1(): D1Database {
    const ordersMap = new Map<string, any>();
    const paymentsMap = new Map<string, any>();
    const rateLimitsMap = new Map<string, { count: number; reset_at: number }>();

    // Seed test order
    ordersMap.set('ord_prod_test_001', {
      id: 'ord_prod_test_001',
      order_number: 'GFT-20260914-TEST',
      status: 'payment_pending',
      deposit_amount: 500,
    });

    const mockDb: any = {
      prepare(query: string) {
        let boundArgs: any[] = [];
        return {
          bind(...args: any[]) {
            boundArgs = args;
            return this;
          },
          async first<T = any>(): Promise<T | null> {
            if (query.includes('FROM orders WHERE id = ?')) {
              const id = boundArgs[0];
              const order = ordersMap.get(id);
              return (order as any) || null;
            }
            if (query.includes('INSERT INTO rate_limits')) {
              const key = boundArgs[0];
              const newResetAt = boundArgs[1];
              const now = boundArgs[2];

              let current = rateLimitsMap.get(key);
              if (!current || current.reset_at <= now) {
                current = { count: 1, reset_at: newResetAt };
              } else {
                current = { count: current.count + 1, reset_at: current.reset_at };
              }
              rateLimitsMap.set(key, current);
              return { count: current.count, reset_at: current.reset_at } as any;
            }
            return null;
          },
          async run() {
            return { success: true, meta: { changes: 1 } };
          },
          async all() {
            return { results: [], success: true };
          },
        };
      },
      async batch(statements: any[]) {
        for (const s of statements) {
          await s.run();
        }
        return [];
      },
    };

    return mockDb as D1Database;
  }

  const mockDb = createMockD1();

  // =========================================================================
  // 1. PAYMENT VERIFICATION IN PRODUCTION (CRIT-01)
  // =========================================================================
  console.log('\n[CRIT-01] Razorpay Production Payment Verification');

  // Test 1: Production + Secret Missing -> MUST FAIL
  {
    const prodEnvNoSecret: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_real_id_12345',
      RAZORPAY_KEY_SECRET: '', // Missing!
    };

    let caughtError: any = null;
    try {
      await razorpayService.verifyPayment(prodEnvNoSecret, {
        orderId: 'ord_prod_test_001',
        razorpayOrderId: 'order_rzp_123',
        razorpayPaymentId: 'pay_rzp_456',
        razorpaySignature: 'any_mock_signature',
      });
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.includes('not configured in production'),
      'Production + secret missing -> FAILS SAFELY with configuration error'
    );
  }

  // Test 2: Production + Secret Placeholder -> MUST FAIL
  {
    const prodEnvPlaceholder: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_test_placeholder',
      RAZORPAY_KEY_SECRET: 'placeholder_secret_key',
    };

    let caughtError: any = null;
    try {
      await razorpayService.verifyPayment(prodEnvPlaceholder, {
        orderId: 'ord_prod_test_001',
        razorpayOrderId: 'order_rzp_123',
        razorpayPaymentId: 'pay_rzp_456',
        razorpaySignature: 'any_signature',
      });
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.includes('not configured in production'),
      'Production + placeholder secret -> FAILS SAFELY (rejects placeholder strings)'
    );
  }

  // Test 3: Production + Fake/Mock Signature -> MUST FAIL
  {
    const realSecret = 'live_secret_real_abcdef123456';
    const prodEnv: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_real_key_123',
      RAZORPAY_KEY_SECRET: realSecret,
    };

    let caughtError: any = null;
    try {
      await razorpayService.verifyPayment(prodEnv, {
        orderId: 'ord_prod_test_001',
        razorpayOrderId: 'order_rzp_123',
        razorpayPaymentId: 'pay_rzp_456',
        razorpaySignature: 'fake_forged_signature_12345',
      });
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.toLowerCase().includes('signature verification failed'),
      'Production + fake/forged signature -> REJECTED (invalid signature)'
    );
  }

  // Test 4: Production + Valid HMAC-SHA256 Signature -> MUST PASS
  {
    const realSecret = 'live_secret_real_abcdef123456';
    const orderRzpId = 'order_rzp_12345';
    const payRzpId = 'pay_rzp_67890';
    const validSignature = await createHmacSha256(realSecret, `${orderRzpId}|${payRzpId}`);

    const prodEnv: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_real_key_123',
      RAZORPAY_KEY_SECRET: realSecret,
    };

    const result = await razorpayService.verifyPayment(prodEnv, {
      orderId: 'ord_prod_test_001',
      razorpayOrderId: orderRzpId,
      razorpayPaymentId: payRzpId,
      razorpaySignature: validSignature,
    });

    assert(result.verified === true, 'Production + valid HMAC-SHA256 signature -> VERIFIED');
  }

  // Test 5: Production Create Order Without Secrets -> FAILS SAFELY
  {
    const prodEnvNoKeys: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_test_placeholder',
      RAZORPAY_KEY_SECRET: '',
    };

    let caughtError: any = null;
    try {
      await razorpayService.createPaymentOrder(prodEnvNoKeys, 'ord_prod_test_001');
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.includes('not configured in production'),
      'Production create-order without live secrets -> FAILS SAFELY without fallback to mock orders'
    );
  }

  // =========================================================================
  // 2. WEBHOOK SIGNATURE ENFORCEMENT (CRIT-02)
  // =========================================================================
  console.log('\n[CRIT-02] Webhook Signature Enforcement');

  // Test 6: Production Webhook + Secret Missing -> MUST FAIL
  {
    const prodEnvNoWebhookSecret: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_123',
      RAZORPAY_KEY_SECRET: 'live_secret_123',
      RAZORPAY_WEBHOOK_SECRET: '', // Missing!
    };

    let caughtError: any = null;
    try {
      await razorpayService.handleWebhook(prodEnvNoWebhookSecret, 'sig_header', '{"event":"payment.captured"}');
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.includes('webhook secret is not configured in production'),
      'Production webhook + secret missing -> REJECTED'
    );
  }

  // Test 7: Production Webhook + Missing Signature Header -> MUST FAIL
  {
    const prodEnv: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_123',
      RAZORPAY_KEY_SECRET: 'live_secret_123',
      RAZORPAY_WEBHOOK_SECRET: 'whsec_prod_live_abc123',
    };

    let caughtError: any = null;
    try {
      await razorpayService.handleWebhook(prodEnv, null, '{"event":"payment.captured"}');
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.includes('Missing mandatory Razorpay webhook signature header'),
      'Production webhook + missing x-razorpay-signature header -> REJECTED'
    );
  }

  // Test 8: Production Webhook + Invalid Signature -> MUST FAIL
  {
    const prodEnv: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_123',
      RAZORPAY_KEY_SECRET: 'live_secret_123',
      RAZORPAY_WEBHOOK_SECRET: 'whsec_prod_live_abc123',
    };

    let caughtError: any = null;
    try {
      await razorpayService.handleWebhook(prodEnv, 'wrong_signature_abc', '{"event":"payment.captured"}');
    } catch (err) {
      caughtError = err;
    }

    assert(
      caughtError !== null && caughtError.message.includes('Invalid Razorpay webhook signature'),
      'Production webhook + invalid signature -> REJECTED'
    );
  }

  // Test 9: Production Webhook + Valid Signature -> MUST PASS
  {
    const webhookSecret = 'whsec_prod_live_abc123';
    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_prod_123',
            order_id: 'order_prod_456',
          },
        },
      },
    });

    const validSig = await createHmacSha256(webhookSecret, rawPayload);

    const prodEnv: Env = {
      DB: mockDb,
      ENVIRONMENT: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_123',
      RAZORPAY_KEY_SECRET: 'live_secret_123',
      RAZORPAY_WEBHOOK_SECRET: webhookSecret,
    };

    const result = await razorpayService.handleWebhook(prodEnv, validSig, rawPayload);
    assert(result.received === true, 'Production webhook + valid HMAC-SHA256 signature -> PROCESSED SUCCESSFULLY');
  }

  // =========================================================================
  // 3. RATE LIMITING (HIGH-01)
  // =========================================================================
  console.log('\n[HIGH-01] Edge Rate Limiting');

  // Test 10: Client IP extraction
  {
    const reqCf = new Request('https://api.giftagram.com/api/orders', {
      headers: { 'cf-connecting-ip': '203.0.113.195' },
    });
    assert(getClientIp(reqCf) === '203.0.113.195', 'Client IP extracted from cf-connecting-ip');

    const reqFwd = new Request('https://api.giftagram.com/api/orders', {
      headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
    });
    assert(getClientIp(reqFwd) === '198.51.100.1', 'Client IP extracted from first x-forwarded-for entry');

    const reqEmpty = new Request('https://api.giftagram.com/api/orders');
    assert(getClientIp(reqEmpty) === '127.0.0.1', 'Default fallback IP when headers are absent');
  }

  // Test 11: Rate Limiter enforcement and 429 response
  {
    const testEnv: Env = {
      DB: mockDb,
      RAZORPAY_KEY_ID: 'rzp_test',
      RAZORPAY_KEY_SECRET: 'rzp_secret',
    };

    const req = new Request('https://api.giftagram.com/api/admin/login', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '192.0.2.88' },
    });

    const config = { action: 'test_admin_login', limit: 3, windowSeconds: 60 };

    const res1 = await checkRateLimit(testEnv, req, config);
    assert(res1.allowed && res1.currentCount === 1, 'Request 1/3 allowed');

    const res2 = await checkRateLimit(testEnv, req, config);
    assert(res2.allowed && res2.currentCount === 2, 'Request 2/3 allowed');

    const res3 = await checkRateLimit(testEnv, req, config);
    assert(res3.allowed && res3.currentCount === 3, 'Request 3/3 allowed (at limit)');

    const res4 = await checkRateLimit(testEnv, req, config);
    assert(!res4.allowed && res4.retryAfter > 0, 'Request 4/3 BLOCKED with Retry-After');

    // Check 429 response formatting
    const resp429 = createRateLimitResponse(res4.retryAfter, { 'Access-Control-Allow-Origin': '*' });
    assert(resp429.status === 429, 'createRateLimitResponse returns HTTP status 429');
    assert(resp429.headers.get('Retry-After') === String(res4.retryAfter), '429 response includes Retry-After header');
    assert(resp429.headers.get('Access-Control-Allow-Origin') === '*', '429 response preserves CORS headers');

    const body429 = await resp429.json() as any;
    assert(body429.error === 'RATE_LIMIT_EXCEEDED', '429 body contains RATE_LIMIT_EXCEEDED');
    assert(body429.message.includes('Too many requests'), '429 body contains generic safe user message');
  }

  console.log(`\nSecurity Hardening Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    throw new Error(`${failed} security tests failed!`);
  }
}

// Execute when run directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('security_hardening.test.ts')) {
  runSecurityHardeningTests().catch((err) => {
    console.error('Fatal test failure:', err);
    process.exit(1);
  });
}
