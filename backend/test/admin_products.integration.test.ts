import { execSync } from 'node:child_process';
import path from 'node:path';

const API_BASE = 'http://127.0.0.1:8787';

export async function runAdminProductsIntegrationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- RUNNING ADMIN PRODUCT MANAGEMENT INTEGRATION TESTS ---');
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

  // Helper: Login to get active admin session cookie
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

  assert(rawToken.length === 64, 'Successfully authenticated admin session for product management tests');

  // 1. Unauthenticated checks: Every admin product route must reject unauthenticated requests
  const noAuthGetRes = await fetch(`${API_BASE}/api/admin/products`);
  assert(noAuthGetRes.status === 401, 'GET /api/admin/products without cookie returns 401');

  const noAuthPostRes = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker Cake', price: 100 }),
  });
  assert(noAuthPostRes.status === 401, 'POST /api/admin/products without cookie returns 401');

  const noAuthPutRes = await fetch(`${API_BASE}/api/admin/products/cake-royal-chocolate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: 999 }),
  });
  assert(noAuthPutRes.status === 401, 'PUT /api/admin/products/:id without cookie returns 401');

  const noAuthPatchRes = await fetch(`${API_BASE}/api/admin/products/cake-royal-chocolate/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: 0 }),
  });
  assert(noAuthPatchRes.status === 401, 'PATCH /api/admin/products/:id/status without cookie returns 401');

  // 2. Authenticated: List products (returns all 22 products including inactive ones)
  const getProductsRes = await fetch(`${API_BASE}/api/admin/products`, {
    headers: { Cookie: adminCookie },
  });
  const getProductsJson = (await getProductsRes.json()) as any;
  assert(getProductsRes.status === 200, 'GET /api/admin/products with admin cookie returns 200');
  assert(Array.isArray(getProductsJson.data), 'Admin products payload is an array');
  assert(getProductsJson.data.length >= 22, `Returns full catalog for admin (count: ${getProductsJson.data.length})`);

  // Verify fields present on admin product representation
  const sample = getProductsJson.data[0];
  assert(
    Boolean(sample.id && sample.name && sample.slug && sample.category && sample.price !== undefined),
    'Admin product objects contain id, name, slug, category, price'
  );

  // 3. Search and Category filter for Admin
  const cakeFilterRes = await fetch(`${API_BASE}/api/admin/products?category=cakes`, {
    headers: { Cookie: adminCookie },
  });
  const cakeFilterJson = (await cakeFilterRes.json()) as any;
  assert(cakeFilterJson.data.length >= 9, 'Admin category filter returns cakes');

  const searchRes = await fetch(`${API_BASE}/api/admin/products?search=chocolate`, {
    headers: { Cookie: adminCookie },
  });
  const searchJson = (await searchRes.json()) as any;
  assert(searchJson.data.length > 0, 'Admin search returns matched products');

  // 4. Create Product Validation Rejections
  const badPriceRes = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Test Bad Price',
      category: 'cakes',
      description: 'A delicious test cake',
      price: -50,
    }),
  });
  assert(badPriceRes.status === 400, 'POST /api/admin/products rejects negative price');

  const missingNameRes = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: '',
      category: 'cakes',
      description: 'A delicious test cake',
      price: 500,
    }),
  });
  assert(missingNameRes.status === 400, 'POST /api/admin/products rejects empty name');

  const dupSlugRes = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Royal Chocolate Clone',
      slug: 'royal-chocolate', // Already exists!
      category: 'cakes',
      description: 'Duplicate slug test',
      price: 799,
    }),
  });
  assert(dupSlugRes.status === 409, 'POST /api/admin/products rejects duplicate slug with 409 Conflict');

  // 5. Create Valid Product
  const testSlug = `test-atelier-opera-${Date.now()}`;
  const createRes = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Atelier Opera Cake',
      slug: testSlug,
      category: 'cakes',
      description: 'Layers of almond sponge, coffee syrup, and French buttercream.',
      price: 850,
      weight: '600g',
      active: 1,
      featured: 0,
      flavorCategory: 'chocolate',
    }),
  });
  const createJson = (await createRes.json()) as any;
  assert(createRes.status === 201, 'POST /api/admin/products creates valid product with 201 Created');
  assert(createJson.data?.name === 'Atelier Opera Cake', 'Created product has correct name');
  assert(createJson.data?.price === 850, 'Created product has authoritative price ₹850');
  assert(createJson.data?.slug === testSlug, 'Created product has expected slug');
  const createdId = createJson.data?.id;

  // 6. Get Product by ID
  const getByIdRes = await fetch(`${API_BASE}/api/admin/products/${createdId}`, {
    headers: { Cookie: adminCookie },
  });
  const getByIdJson = (await getByIdRes.json()) as any;
  assert(getByIdRes.status === 200, 'GET /api/admin/products/:id retrieves created product');
  assert(getByIdJson.data?.id === createdId, 'Retrieved product matches requested ID');

  // 7. Update Product
  const updateRes = await fetch(`${API_BASE}/api/admin/products/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Atelier Grand Opera Cake',
      price: 920,
      weight: '750g',
    }),
  });
  const updateJson = (await updateRes.json()) as any;
  assert(updateRes.status === 200, 'PUT /api/admin/products/:id updates product successfully');
  assert(updateJson.data?.name === 'Atelier Grand Opera Cake', 'Product name updated');
  assert(updateJson.data?.price === 920, 'Product price updated to ₹920');
  assert(updateJson.data?.weight === '750g', 'Product weight updated to 750g');

  // 8. Soft Deactivate Product
  const deactivateRes = await fetch(`${API_BASE}/api/admin/products/${createdId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ active: 0 }),
  });
  const deactivateJson = (await deactivateRes.json()) as any;
  assert(deactivateRes.status === 200, 'PATCH /api/admin/products/:id/status toggles status to inactive');
  assert(deactivateJson.data?.active === false, 'Product active is now false');

  // Verify deactivated product is hidden from customer storefront API
  const customerPublicRes = await fetch(`${API_BASE}/api/products/${testSlug}`);
  assert(customerPublicRes.status === 404, 'Soft-deactivated product is hidden from public customer API (404)');

  // 9. Soft Reactivate Product
  const reactivateRes = await fetch(`${API_BASE}/api/admin/products/${createdId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ active: 1 }),
  });
  const reactivateJson = (await reactivateRes.json()) as any;
  assert(reactivateRes.status === 200, 'PATCH /api/admin/products/:id/status reactivates product');
  assert(reactivateJson.data?.active === true, 'Product active is now true');

  const customerPublicAfterReactivate = await fetch(`${API_BASE}/api/products/${testSlug}`);
  assert(customerPublicAfterReactivate.status === 200, 'Reactivated product is immediately visible to public storefront');

  // 10. Non-existent product 404
  const notFoundRes = await fetch(`${API_BASE}/api/admin/products/non-existent-product-id-999`, {
    headers: { Cookie: adminCookie },
  });
  assert(notFoundRes.status === 404, 'GET /api/admin/products/:id returns 404 for non-existent product');

  // 11. Cleanup test product from local D1
  execSync(
    `npx wrangler d1 execute DB --local --command "DELETE FROM products WHERE id = '${createdId}';"`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' }
  );
  console.log(`🧹 Cleaned up temporary test product ${createdId} from local D1.`);

  // 12. Existing Public Product APIs Still Untouched
  const publicAllRes = await fetch(`${API_BASE}/api/products`);
  const publicAllJson = (await publicAllRes.json()) as any;
  assert(publicAllRes.status === 200, 'Public GET /api/products returns HTTP 200');
  assert(publicAllJson.data.length === 15, `Public storefront continues returning exactly 15 active products (got ${publicAllJson.data.length})`);

  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('admin_products.integration.test.ts')) {
  runAdminProductsIntegrationTests().then(({ passed, failed }) => {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  });
}
