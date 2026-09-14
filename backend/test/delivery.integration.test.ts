const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8787';

async function runDeliveryIntegrationTests() {
  console.log('--- RUNNING STOREFRONT DELIVERY & PERFORMANCE INTEGRATION TESTS ---');
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

  // 1. Cloudflare Edge Cache-Control Header on Public Products API
  const productsRes = await fetch(`${API_BASE}/api/products`);
  const cacheControlHeader = productsRes.headers.get('cache-control');
  assert(productsRes.status === 200, 'GET /api/products returns HTTP 200');
  assert(
    cacheControlHeader !== null && cacheControlHeader.includes('public') && cacheControlHeader.includes('s-maxage=300'),
    `GET /api/products returns Cloudflare-native Cache-Control header (${cacheControlHeader})`
  );

  // 2. Cache-Control Header on Single Product
  const singleProductRes = await fetch(`${API_BASE}/api/products/royal-chocolate`);
  const singleCacheControl = singleProductRes.headers.get('cache-control');
  assert(singleProductRes.status === 200, 'GET /api/products/royal-chocolate returns HTTP 200');
  assert(
    singleCacheControl !== null && singleCacheControl.includes('public') && singleCacheControl.includes('s-maxage=300'),
    `GET /api/products/:slug returns Cloudflare-native Cache-Control header (${singleCacheControl})`
  );

  // 3. Cache-Control Header on Categories
  const categoriesRes = await fetch(`${API_BASE}/api/categories`);
  const catCacheControl = categoriesRes.headers.get('cache-control');
  assert(categoriesRes.status === 200, 'GET /api/categories returns HTTP 200');
  assert(
    catCacheControl !== null && catCacheControl.includes('public'),
    `GET /api/categories returns Cache-Control: public (${catCacheControl})`
  );

  // 4. Delivery Order Creation with Immutable D1 Address Persistence
  const deliveryOrderRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '10.0.2.1' },
    body: JSON.stringify({
      customer: {
        name: 'Sameer Khan',
        phone: '9876543210',
        email: 'sameer@example.com',
      },
      fulfillmentType: 'delivery',
      deliveryAddress: {
        addressLine1: 'Villa 14, Whispering Palms',
        addressLine2: 'Near Botanical Garden Road',
        locality: 'Kondapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500084',
        deliveryDate: '2026-09-21',
        deliveryTime: '16:00',
        instructions: 'Please call before ringing gate bell',
      },
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: {
            fullName: 'Sameer Khan',
            phone: '9876543210',
            pickupDate: '2026-09-21',
            pickupTime: '16:00',
            designRequirements: 'Chocolate ganache with golden leaf accents',
            lettering: 'Happy Anniversary',
            depositAcknowledged: true,
          },
        },
      ],
    }),
  });

  const deliveryOrderJson = (await deliveryOrderRes.json()) as any;
  assert(deliveryOrderRes.status === 201, 'POST /api/orders with delivery address returns HTTP 201 Created');
  assert(deliveryOrderJson.data?.fulfillmentType === 'delivery', 'Created order records fulfillmentType: delivery');
  assert(
    deliveryOrderJson.data?.deliveryAddress?.addressLine1 === 'Villa 14, Whispering Palms',
    'D1 order snapshot persists addressLine1'
  );
  assert(
    deliveryOrderJson.data?.deliveryAddress?.locality === 'Kondapur',
    'D1 order snapshot persists locality'
  );
  assert(
    deliveryOrderJson.data?.deliveryAddress?.city === 'Hyderabad',
    'D1 order snapshot persists city'
  );
  assert(
    deliveryOrderJson.data?.deliveryAddress?.state === 'Telangana',
    'D1 order snapshot persists state'
  );
  assert(
    deliveryOrderJson.data?.deliveryAddress?.pincode === '500084',
    'D1 order snapshot persists pincode 500084'
  );
  assert(
    deliveryOrderJson.data?.deliveryAddress?.deliveryDate === '2026-09-21',
    'D1 order snapshot persists deliveryDate'
  );

  const deliveryOrderNumber = deliveryOrderJson.data?.orderNumber;

  // 5. Order Tracking / Lookup of Delivery Order
  const deliveryLookupRes = await fetch(`${API_BASE}/api/orders/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: deliveryOrderNumber,
      phone: '9876543210',
    }),
  });

  const deliveryLookupJson = (await deliveryLookupRes.json()) as any;
  assert(deliveryLookupRes.status === 200, 'POST /api/orders/lookup returns HTTP 200 for delivery order');
  assert(deliveryLookupJson.data?.fulfillmentType === 'delivery', 'Lookup exposes fulfillmentType: delivery');
  assert(
    deliveryLookupJson.data?.deliveryAddress?.addressLine1 === 'Villa 14, Whispering Palms',
    'Lookup returns addressLine1 snapshot'
  );
  assert(
    deliveryLookupJson.data?.deliveryAddress?.pincode === '500084',
    'Lookup returns pincode snapshot'
  );

  // 6. Pickup Order Creation (Fulfillment = Pickup)
  const pickupOrderRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '10.0.2.2' },
    body: JSON.stringify({
      customer: {
        name: 'Priya Verma',
        phone: '9848012345',
        email: 'priya@example.com',
      },
      fulfillmentType: 'pickup',
      pickupDate: '2026-09-22',
      pickupTime: '12:00',
      specialInstructions: 'Studio collection at noon',
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: {
            fullName: 'Priya Verma',
            phone: '9848012345',
            pickupDate: '2026-09-22',
            pickupTime: '12:00',
            designRequirements: 'Classic ribbon finish',
            depositAcknowledged: true,
          },
        },
      ],
    }),
  });

  const pickupOrderJson = (await pickupOrderRes.json()) as any;
  assert(pickupOrderRes.status === 201, 'POST /api/orders with pickup returns HTTP 201 Created');
  assert(pickupOrderJson.data?.fulfillmentType === 'pickup', 'Created order records fulfillmentType: pickup');
  assert(pickupOrderJson.data?.pickupDate === '2026-09-22', 'Pickup date recorded properly');

  // 7. Backend Rejection: Invalid PIN code
  const badPinRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '10.0.2.3' },
    body: JSON.stringify({
      customer: { name: 'Invalid PIN Test', phone: '9876543210' },
      fulfillmentType: 'delivery',
      deliveryAddress: {
        addressLine1: 'Some Address',
        locality: 'Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '5000', // Only 4 digits
      },
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: { fullName: 'Test', phone: '9876543210', depositAcknowledged: true },
        },
      ],
    }),
  });
  assert(badPinRes.status === 400, 'Backend rejects 4-digit PIN code with HTTP 400');
  const badPinJson = (await badPinRes.json()) as any;
  assert(
    JSON.stringify(badPinJson.error?.details || '').includes('PIN code'),
    'Rejection message identifies invalid PIN code'
  );

  // 8. Backend Rejection: Missing Address Line 1
  const missingLine1Res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '10.0.1.1' },
    body: JSON.stringify({
      customer: { name: 'Missing Line 1 Test', phone: '9876543210' },
      fulfillmentType: 'delivery',
      deliveryAddress: {
        addressLine1: '', // Missing
        locality: 'Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
      },
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: { fullName: 'Test', phone: '9876543210', depositAcknowledged: true },
        },
      ],
    }),
  });
  assert(missingLine1Res.status === 400, 'Backend rejects missing addressLine1 with HTTP 400');

  // 9. Backend Rejection: Missing Locality
  const missingLocalityRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '10.0.1.2' },
    body: JSON.stringify({
      customer: { name: 'Missing Locality Test', phone: '9876543210' },
      fulfillmentType: 'delivery',
      deliveryAddress: {
        addressLine1: 'Flat 101, Lakeview',
        locality: '', // Missing
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
      },
      items: [
        {
          productId: 'cake-royal-chocolate',
          quantity: 1,
          cakeCustomization: { fullName: 'Test', phone: '9876543210', depositAcknowledged: true },
        },
      ],
    }),
  });
  assert(missingLocalityRes.status === 400, 'Backend rejects missing locality with HTTP 400');

  console.log(`\nDelivery Integration Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runDeliveryIntegrationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
