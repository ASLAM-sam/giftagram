import { createHmacSha256 } from '../src/utils/crypto';

const API_BASE = 'http://127.0.0.1:8787';

export async function runAdminOrdersIntegrationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- RUNNING PHASE 4: ADMIN ORDER MANAGEMENT INTEGRATION TESTS ---');
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

  // 1. Admin Authentication
  const loginRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'giftstudio',
      password: 'gift0077',
    }),
  });
  const setCookieHeader = loginRes.headers.get('set-cookie') || '';
  const match = setCookieHeader.match(/giftagram_admin_session=([^;]+)/);
  const rawToken = match ? match[1] : '';
  const adminCookie = `giftagram_admin_session=${rawToken}`;

  assert(rawToken.length === 64, 'Admin authenticated for order management tests');

  // 2. Unauthenticated Security Checks
  const noAuthList = await fetch(`${API_BASE}/api/admin/orders`);
  assert(noAuthList.status === 401, 'GET /api/admin/orders without cookie returns 401');

  const noAuthDetail = await fetch(`${API_BASE}/api/admin/orders/fake-order-id`);
  assert(noAuthDetail.status === 401, 'GET /api/admin/orders/:id without cookie returns 401');

  const noAuthStatus = await fetch(`${API_BASE}/api/admin/orders/fake-order-id/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'confirmed' }),
  });
  assert(noAuthStatus.status === 401, 'PATCH /api/admin/orders/:id/status without cookie returns 401');

  // 3. Create a Real Customer Order with Bespoke Cake Customization
  const testPhone = '9876543210';
  const customerName = 'Lady Genevieve';
  const orderPayload = {
    customer: {
      name: customerName,
      phone: testPhone,
      email: 'genevieve@atelier-test.luxury',
    },
    pickupDate: '2026-09-25',
    pickupTime: '15:30',
    specialInstructions: 'Handle with utmost care, velvet ribbon packaging.',
    items: [
      {
        productId: 'cake-royal-chocolate',
        quantity: 1,
        cakeCustomization: {
          fullName: customerName,
          phone: testPhone,
          pickupDate: '2026-09-25',
          pickupTime: '15:30',
          designRequirements: 'Baroque gold leaf trim with dark chocolate ganache drip',
          colors: 'Espresso brown and champagne gold',
          lettering: 'Joyeux Anniversaire Geneviève',
          depositAcknowledged: true,
        },
      },
    ],
  };

  const createOrderRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  const createOrderJson = (await createOrderRes.json()) as any;
  assert(createOrderRes.status === 201, 'Customer order created successfully with 201');
  assert(Boolean(createOrderJson.data?.id), 'Returns created order ID');
  assert(createOrderJson.data?.status === 'payment_pending', 'Initial status is payment_pending');

  const createdOrderId = createOrderJson.data.id;
  const createdOrderNumber = createOrderJson.data.orderNumber;
  const subtotal = createOrderJson.data.subtotal;
  const depositAmount = createOrderJson.data.depositAmount;

  // 4. Create Razorpay Order and Verify Payment
  const payOrderRes = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: createdOrderId }),
  });
  const payOrderJson = (await payOrderRes.json()) as any;
  assert(payOrderRes.status === 200, 'POST /api/payments/create-order returns HTTP 200');

  const rzpOrderId = payOrderJson.data?.razorpayOrderId || 'order_mock_test_phase4';
  const rzpPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
  const secret = 'test_secret_for_local_dev';
  const validSig = await createHmacSha256(secret, `${rzpOrderId}|${rzpPaymentId}`);

  const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: createdOrderId,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: validSig,
    }),
  });
  assert(verifyRes.status === 200, 'Payment verification transitioned order to deposit_paid');

  // 5. Admin Order Listing (GET /api/admin/orders)
  const listRes = await fetch(`${API_BASE}/api/admin/orders`, {
    headers: { Cookie: adminCookie },
  });
  const listJson = (await listRes.json()) as any;
  assert(listRes.status === 200, 'GET /api/admin/orders returns HTTP 200');
  assert(Array.isArray(listJson.data), 'Returns array of orders');

  const foundOrder = listJson.data.find((o: any) => o.id === createdOrderId);
  assert(Boolean(foundOrder), 'Created order appears in admin orders list');
  assert(foundOrder?.customerName === customerName, 'Order summary contains customer name');
  assert(foundOrder?.status === 'deposit_paid', 'Order summary reflects deposit_paid status');
  assert(foundOrder?.itemsCount >= 1, 'Order summary contains itemsCount');

  // 6. Admin Order Filtering by Status
  const filterPaidRes = await fetch(`${API_BASE}/api/admin/orders?status=deposit_paid`, {
    headers: { Cookie: adminCookie },
  });
  const filterPaidJson = (await filterPaidRes.json()) as any;
  const inPaidFilter = filterPaidJson.data.some((o: any) => o.id === createdOrderId);
  assert(inPaidFilter, 'Order matches status=deposit_paid filter');

  const filterCompletedRes = await fetch(`${API_BASE}/api/admin/orders?status=completed`, {
    headers: { Cookie: adminCookie },
  });
  const filterCompletedJson = (await filterCompletedRes.json()) as any;
  const inCompletedFilter = filterCompletedJson.data.some((o: any) => o.id === createdOrderId);
  assert(!inCompletedFilter, 'Order correctly excluded from status=completed filter');

  // 7. Admin Order Search (by order number and by customer name)
  const searchNumberRes = await fetch(`${API_BASE}/api/admin/orders?search=${createdOrderNumber}`, {
    headers: { Cookie: adminCookie },
  });
  const searchNumberJson = (await searchNumberRes.json()) as any;
  assert(searchNumberJson.data.length > 0 && searchNumberJson.data[0].id === createdOrderId, 'Search by order number finds target order');

  const searchNameRes = await fetch(`${API_BASE}/api/admin/orders?search=Genevieve`, {
    headers: { Cookie: adminCookie },
  });
  const searchNameJson = (await searchNameRes.json()) as any;
  assert(searchNameJson.data.length > 0 && searchNameJson.data[0].id === createdOrderId, 'Search by customer name finds target order');

  // 8. Admin Order Detail Dossier (GET /api/admin/orders/:id)
  const detailRes = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}`, {
    headers: { Cookie: adminCookie },
  });
  const detailJson = (await detailRes.json()) as any;
  assert(detailRes.status === 200, 'GET /api/admin/orders/:id returns HTTP 200');

  const orderDetail = detailJson.data;
  assert(orderDetail.orderNumber === createdOrderNumber, 'Detail matches orderNumber');
  assert(orderDetail.customerName === customerName, 'Detail matches customerName');
  assert(orderDetail.subtotal === subtotal, 'Detail preserves authoritative subtotal');
  assert(orderDetail.depositAmount === depositAmount, 'Detail preserves authoritative 50% deposit amount');

  // Verify frozen price snapshot in items
  assert(Array.isArray(orderDetail.items) && orderDetail.items.length > 0, 'Detail includes order items array');
  const firstItem = orderDetail.items[0];
  assert(firstItem.unitPriceSnapshot === 799, 'Product price snapshot is preserved immutably (₹799)');
  assert(firstItem.productNameSnapshot === 'Royal Chocolate', 'Product name snapshot is preserved');

  // Verify cake customizations
  assert(Boolean(firstItem.cakeCustomization), 'Bespoke cake customization details are present');
  assert(firstItem.cakeCustomization.lettering === 'Joyeux Anniversaire Geneviève', 'Cake lettering matches commission request');
  assert(firstItem.cakeCustomization.colors === 'Espresso brown and champagne gold', 'Cake color scheme preserved');

  // Verify payment record
  assert(Array.isArray(orderDetail.payments) && orderDetail.payments.length > 0, 'Detail includes payments list');
  const paymentRecord = orderDetail.payments[0];
  assert(paymentRecord.amountRupees === depositAmount, 'Payment amount matches 50% deposit');

  // Security Check: Ensure NO secrets exposed in detail JSON
  const detailJsonStr = JSON.stringify(detailJson);
  assert(!detailJsonStr.includes('api_secret'), 'Security: No api_secret in order detail response');
  assert(!detailJsonStr.includes('RAZORPAY_KEY_SECRET'), 'Security: No Razorpay secret in order detail response');

  // Verify audit events log
  assert(Array.isArray(orderDetail.events) && orderDetail.events.length > 0, 'Audit log events present');

  // 9. Order Status Transitions State Machine Validation
  // Invalid Transition: Cannot transition deposit_paid directly to completed
  const invalidTransitionRes = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'completed' }),
  });
  assert(invalidTransitionRes.status === 400, 'Invalid transition (deposit_paid -> completed) rejected with HTTP 400');

  // Invalid Status: Arbitrary status string rejected
  const arbitraryStatusRes = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'shipped_in_transit' }),
  });
  assert(arbitraryStatusRes.status === 400, 'Arbitrary invalid status rejected with HTTP 400');

  // Valid Step 1: deposit_paid -> confirmed
  const step1Res = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'confirmed', reason: 'Atelier master confirmed kitchen schedule.' }),
  });
  assert(step1Res.status === 200, 'Valid transition: deposit_paid -> confirmed returns 200');

  // Valid Step 2: confirmed -> processing
  const step2Res = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'processing', reason: 'Pastry chef started ganache preparation.' }),
  });
  assert(step2Res.status === 200, 'Valid transition: confirmed -> processing returns 200');

  // Valid Step 3: processing -> ready
  const step3Res = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'ready', reason: 'Cake boxed and placed in temperature-controlled display.' }),
  });
  assert(step3Res.status === 200, 'Valid transition: processing -> ready returns 200');

  // Valid Step 4: ready -> completed
  const step4Res = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'completed', reason: 'Collected by customer in atelier studio.' }),
  });
  assert(step4Res.status === 200, 'Valid transition: ready -> completed returns 200');

  // Terminal State Invariant: Completed order cannot be transitioned again
  const terminalRes = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'confirmed' }),
  });
  assert(terminalRes.status === 400, 'Terminal state protection: completed order cannot be transitioned');

  // 10. Verify Audit Events Recorded for Transitions
  const finalDetailRes = await fetch(`${API_BASE}/api/admin/orders/${createdOrderId}`, {
    headers: { Cookie: adminCookie },
  });
  const finalDetailJson = (await finalDetailRes.json()) as any;
  const statusEvents = finalDetailJson.data.events.filter((e: any) => e.eventType === 'status_changed');
  assert(statusEvents.length === 4, `All 4 status transitions recorded in immutable audit log (found: ${statusEvents.length})`);
  assert(finalDetailJson.data.status === 'completed', 'Order status is persisted as completed in D1');

  // 11. Customer Public Storefront Order Lookup continues functioning
  const publicLookupRes = await fetch(`${API_BASE}/api/orders/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      phone: testPhone,
    }),
  });
  const publicLookupJson = (await publicLookupRes.json()) as any;
  assert(publicLookupRes.status === 200, 'Customer storefront order lookup returns 200');
  assert(publicLookupJson.data.status === 'completed', 'Storefront reflects completed status');

  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('admin_orders.integration.test.ts')) {
  runAdminOrdersIntegrationTests().then(({ passed, failed }) => {
    console.log(`\nPhase 4 Order Integration Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
    process.exit(0);
  });
}
