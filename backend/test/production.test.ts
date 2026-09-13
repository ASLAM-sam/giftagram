import { createHmacSha256 } from '../src/utils/crypto';

const API_BASE = 'https://giftagram-backend.hydpurefumes.workers.dev';

async function runProductionTests() {
  console.log('===============================================================');
  console.log(' RUNNING CLOUD PRODUCTION VERIFICATION TESTS');
  console.log(` Target: ${API_BASE}`);
  console.log('===============================================================');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail !== undefined ? detail : '');
      failed++;
    }
  }

  // 1. Health & Database connectivity
  const healthRes = await fetch(`${API_BASE}/api/health`);
  const healthJson = await healthRes.json() as any;
  assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
  assert(healthJson.data?.status === 'healthy', 'Health status is "healthy"');
  assert(healthJson.data?.database === 'connected', 'Remote D1 database status is "connected"');

  // 2. Products Endpoint: 15 active products
  const productsRes = await fetch(`${API_BASE}/api/products`);
  const productsJson = await productsRes.json() as any;
  assert(productsRes.status === 200, 'GET /api/products returns HTTP 200');
  assert(Array.isArray(productsJson.data), 'Products data is an array');
  assert(productsJson.data.length === 15, `Returns exactly 15 active products from remote D1 (got ${productsJson.data.length})`);

  // 3. Category filtering
  const cakesRes = await fetch(`${API_BASE}/api/products?category=cakes`);
  const cakesJson = await cakesRes.json() as any;
  assert(cakesJson.data.length === 9, `GET /api/products?category=cakes returns 9 cakes (got ${cakesJson.data.length})`);

  const bouquetsRes = await fetch(`${API_BASE}/api/products?category=bouquets`);
  const bouquetsJson = await bouquetsRes.json() as any;
  assert(bouquetsJson.data.length === 6, `GET /api/products?category=bouquets returns 6 bouquets (got ${bouquetsJson.data.length})`);

  // 4. Specific product checks: Royal Chocolate, Chocolate Belgium, Photo Bouquet
  const royalRes = await fetch(`${API_BASE}/api/products/royal-chocolate`);
  const royalJson = await royalRes.json() as any;
  assert(royalRes.status === 200, 'GET /api/products/royal-chocolate returns HTTP 200');
  assert(royalJson.data.name === 'Royal Chocolate' && royalJson.data.price === 799 && royalJson.data.weight === '500g', 'Royal Chocolate has correct name, ₹799 price, and 500g weight');

  const belgiumRes = await fetch(`${API_BASE}/api/products/chocolate-belgium`);
  const belgiumJson = await belgiumRes.json() as any;
  assert(belgiumRes.status === 200, 'GET /api/products/chocolate-belgium returns HTTP 200');
  assert(belgiumJson.data.name === 'Chocolate Belgium' && belgiumJson.data.price === 499, 'Chocolate Belgium has correct ₹499 price');

  const photoBqRes = await fetch(`${API_BASE}/api/products/photo-bouquet`);
  const photoBqJson = await photoBqRes.json() as any;
  assert(photoBqRes.status === 200, 'GET /api/products/photo-bouquet returns HTTP 200');
  assert(photoBqJson.data.name === 'Photo Bouquet' && photoBqJson.data.price === 450, 'Photo Bouquet has correct ₹450 price');

  // 5. 404 test
  const notFoundRes = await fetch(`${API_BASE}/api/products/non-existent-product`);
  assert(notFoundRes.status === 404, 'Non-existent product returns HTTP 404');

  // 6. Categories endpoint
  const catsRes = await fetch(`${API_BASE}/api/categories`);
  const catsJson = await catsRes.json() as any;
  assert(catsJson.data.active.includes('cakes') && catsJson.data.active.includes('bouquets'), 'Active categories include cakes and bouquets');
  assert(catsJson.data.comingSoon.length >= 6, `ComingSoon categories present (count: ${catsJson.data.comingSoon.length})`);

  // 7. SECURITY TEST ON CLOUD WORKER: Client price tampering blocked!
  // Client maliciously sends price = ₹1, subtotal = ₹1, deposit = ₹0.50
  const orderRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        name: 'Pooja Verma',
        phone: '9876543210',
        email: 'pooja@example.com',
      },
      pickupDate: '2026-09-20',
      pickupTime: '16:00',
      specialInstructions: 'Golden shimmer please',
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          price: 1, // Tampered! Server MUST IGNORE this!
          subtotal: 1, // Tampered!
          depositAmount: 0.5, // Tampered!
          cakeCustomization: {
            fullName: 'Pooja Verma',
            phone: '9876543210',
            pickupDate: '2026-09-20',
            pickupTime: '16:00',
            designRequirements: 'Royal chocolate mousse with pearl borders',
            lettering: 'Happy Birthday Pooja',
            depositAcknowledged: true,
          },
        },
      ],
    }),
  });

  const orderJson = await orderRes.json() as any;
  assert(orderRes.status === 201, 'POST /api/orders returns HTTP 201 Created on remote Worker');
  assert(orderJson.data.subtotal === 799, `Security check: Subtotal calculated authoritatively from D1 (₹799, ignoring client's ₹1)`);
  assert(orderJson.data.depositAmount === 399.5, `Security check: 50% deposit calculated authoritatively (₹399.50)`);
  assert(orderJson.data.depositAmountPaise === 39950, `Deposit paise calculated accurately (39950 paise)`);
  assert(orderJson.data.orderNumber.startsWith('GFT-'), `Order number format generated: ${orderJson.data.orderNumber}`);

  const createdOrderNumber = orderJson.data.orderNumber;
  const createdOrderId = orderJson.data.id;

  // 8. Order Tracking / Lookup on Cloud Worker
  // Valid lookup
  const lookupRes = await fetch(`${API_BASE}/api/orders/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      phone: '9876543210',
    }),
  });
  const lookupJson = await lookupRes.json() as any;
  assert(lookupRes.status === 200, 'Order lookup returns HTTP 200 for matching phone');
  assert(lookupJson.data.orderNumber === createdOrderNumber, 'Lookup returns correct order number');
  assert(lookupJson.data.status === 'payment_pending', 'Lookup reflects payment_pending status');
  assert(lookupJson.data.items[0].productName === 'Royal Chocolate', 'Lookup reflects item snapshot from D1');

  // Lookup with wrong phone
  const badLookupRes = await fetch(`${API_BASE}/api/orders/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      phone: '1111111111',
    }),
  });
  assert(badLookupRes.status === 404, 'Order lookup returns 404 for non-matching phone');

  // 9. Razorpay Payment Order Creation on Cloud Worker
  const payOrderRes = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: createdOrderId,
    }),
  });
  const payOrderJson = await payOrderRes.json() as any;
  assert(payOrderRes.status === 200, 'POST /api/payments/create-order returns HTTP 200 on Cloud Worker');
  assert(payOrderJson.data.amount === 39950, 'Payment order amount is exactly 39950 paise');
  assert(typeof payOrderJson.data.razorpayOrderId === 'string', `Returns razorpayOrderId: ${payOrderJson.data.razorpayOrderId}`);

  const rzpOrderId = payOrderJson.data.razorpayOrderId;
  const rzpPaymentId = `pay_prod_test_${Math.random().toString(36).substring(2, 10)}`;

  // 10a. Invalid Signature Rejection Test on Cloud Worker (must be tested before valid confirmation)
  const badVerifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: createdOrderId,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: 'invalid_signature_test',
    }),
  });
  assert(badVerifyRes.status === 400, 'Payment verification with invalid signature returns HTTP 400');

  // 10b. Valid Payment Verification on Cloud Worker
  const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: createdOrderId,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: 'simulated_test_signature_valid',
    }),
  });
  const verifyJson = await verifyRes.json() as any;
  assert(verifyRes.status === 200, 'Payment verification returns HTTP 200 on Cloud Worker');
  assert(verifyJson.data.verified === true, 'Payment signature verified successfully');

  // 10c. Webhook & Duplicate Webhook Idempotency Test
  const webhookRes = await fetch(`${API_BASE}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            order_id: rzpOrderId,
            amount: 39950,
          },
        },
      },
    }),
  });
  assert(webhookRes.status === 200, 'POST /api/payments/webhook returns HTTP 200 on Cloud Worker');

  // Duplicate webhook delivery should succeed idempotently without error
  const dupWebhookRes = await fetch(`${API_BASE}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            order_id: rzpOrderId,
            amount: 39950,
          },
        },
      },
    }),
  });
  assert(dupWebhookRes.status === 200, 'Duplicate webhook returns HTTP 200 idempotently');

  // 10d. Validation Security Tests: Malformed payloads must return 400
  const negQtyRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Test User', phone: '9876543210' },
      items: [{ productId: 'cake-royal-chocolate', quantity: -2 }],
    }),
  });
  assert(negQtyRes.status === 400, 'Order with negative quantity returns HTTP 400');

  const zeroQtyRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Test User', phone: '9876543210' },
      items: [{ productId: 'cake-royal-chocolate', quantity: 0 }],
    }),
  });
  assert(zeroQtyRes.status === 400, 'Order with zero quantity returns HTTP 400');

  const noNameRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: '', phone: '9876543210' },
      items: [{ productId: 'cake-royal-chocolate', quantity: 1 }],
    }),
  });
  assert(noNameRes.status === 400, 'Order with missing customer name returns HTTP 400');

  const noDepositAckRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Test User', phone: '9876543210' },
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: {
            fullName: 'Test User',
            phone: '9876543210',
            pickupDate: '2026-09-20',
            pickupTime: '14:00',
            depositAcknowledged: false,
          },
        },
      ],
    }),
  });
  assert(noDepositAckRes.status === 400, 'Cake order without deposit acknowledgement returns HTTP 400');

  // 11. Verify D1 Order Status transitioned to "deposit_paid" on Cloud D1
  const postPayLookup = await fetch(`${API_BASE}/api/orders/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      phone: '9876543210',
    }),
  });
  const postPayJson = await postPayLookup.json() as any;
  assert(postPayJson.data.status === 'deposit_paid', 'Cloud D1 order status transitioned to "deposit_paid"');

  // 12. Multiple product order test: Royal Chocolate (₹799) + Rose Bouquet 10 (₹499)
  // Total: 799 + 499 = 1298; 50% deposit = 649
  const multiOrderRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        name: 'Sameer Khan',
        phone: '9123456789',
      },
      pickupDate: '2026-09-22',
      pickupTime: '12:00',
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: {
            fullName: 'Sameer Khan',
            phone: '9123456789',
            pickupDate: '2026-09-22',
            pickupTime: '12:00',
            designRequirements: 'Standard finish',
            depositAcknowledged: true,
          },
        },
        {
          productId: 'bq-rose-10',
          quantity: 1,
        },
      ],
    }),
  });
  const multiOrderJson = await multiOrderRes.json() as any;
  assert(multiOrderRes.status === 201, 'Multiple-product order created successfully');
  assert(multiOrderJson.data.subtotal === 1298, `Multiple-product subtotal is ₹1298 (799 + 499) (got ${multiOrderJson.data.subtotal})`);
  assert(multiOrderJson.data.depositAmount === 649, `Multiple-product 50% deposit is ₹649 (got ${multiOrderJson.data.depositAmount})`);
  assert(multiOrderJson.data.depositAmountPaise === 64900, `Multiple-product deposit paise is 64900 (got ${multiOrderJson.data.depositAmountPaise})`);

  // 13. CORS preflight test on Cloud Worker
  const optionsRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://giftagram-frontend.hydpurefumes.workers.dev',
      'Access-Control-Request-Method': 'POST',
    },
  });
  assert(optionsRes.status === 204, 'OPTIONS preflight returns HTTP 204');
  assert(
    optionsRes.headers.get('access-control-allow-origin') === 'https://giftagram-frontend.hydpurefumes.workers.dev',
    'CORS preflight reflects authorized frontend origin'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runProductionTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
