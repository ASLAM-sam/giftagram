import { execSync } from 'node:child_process';
import path from 'node:path';

const API_BASE = 'http://127.0.0.1:8787';

// 1x1 transparent PNG as base64
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function createTestImageBlob(mime = 'image/png'): Blob {
  const binary = atob(TINY_PNG_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function runAdminImagesIntegrationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- RUNNING PHASE 3: ADMIN IMAGE MANAGEMENT INTEGRATION TESTS ---');
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

  assert(rawToken.length === 64, 'Admin authenticated for image management tests');

  const testProductId = 'cake-royal-chocolate';

  // 1. Unauthenticated checks
  const noAuthGet = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`);
  assert(noAuthGet.status === 401, 'GET /api/admin/products/:id/images without cookie returns 401');

  const noAuthUpload = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    method: 'POST',
  });
  assert(noAuthUpload.status === 401, 'POST /api/admin/products/:id/images without cookie returns 401');

  const noAuthPrimary = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/fake-img/primary`, {
    method: 'PUT',
  });
  assert(noAuthPrimary.status === 401, 'PUT /api/admin/products/:id/images/:imgId/primary without cookie returns 401');

  const noAuthReorder = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageIds: ['img1'] }),
  });
  assert(noAuthReorder.status === 401, 'PUT /api/admin/products/:id/images/reorder without cookie returns 401');

  const noAuthDelete = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/fake-img`, {
    method: 'DELETE',
  });
  assert(noAuthDelete.status === 401, 'DELETE /api/admin/products/:id/images/:imgId without cookie returns 401');

  // 2. Validation: missing file
  const emptyForm = new FormData();
  const missingFileRes = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: emptyForm,
  });
  assert(missingFileRes.status === 400, 'Upload without file returns HTTP 400');

  // 3. Validation: invalid MIME type
  const badMimeForm = new FormData();
  const textBlob = new Blob(['Hello text file!'], { type: 'text/plain' });
  badMimeForm.append('file', textBlob, 'notes.txt');
  const badMimeRes = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: badMimeForm,
  });
  assert(badMimeRes.status === 400, 'Upload with invalid MIME (text/plain) returns HTTP 400');

  // 4. Validation: non-existent product
  const nonExistentForm = new FormData();
  nonExistentForm.append('file', createTestImageBlob(), 'test.png');
  const nonExistentRes = await fetch(`${API_BASE}/api/admin/products/non-existent-product-999/images`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: nonExistentForm,
  });
  assert(nonExistentRes.status === 404, 'Upload for non-existent product returns HTTP 404');

  // 5. Successful Upload 1 to real Cloudinary + D1
  const uploadForm1 = new FormData();
  uploadForm1.append('file', createTestImageBlob('image/png'), 'atelier_test_cake_1.png');
  uploadForm1.append('altText', 'Royal Belgian Truffle primary photo');
  uploadForm1.append('isPrimary', 'true');

  const uploadRes1 = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: uploadForm1,
  });
  const uploadJson1 = (await uploadRes1.json()) as any;
  assert(uploadRes1.status === 201, 'POST /api/admin/products/:id/images creates image with 201 Created');
  assert(Boolean(uploadJson1.data?.id), 'Returns created image ID');
  assert(uploadJson1.data?.secureUrl?.startsWith('https://res.cloudinary.com/'), 'Image has secure Cloudinary CDN URL');
  assert(uploadJson1.data?.publicId?.startsWith('giftagram/products/'), 'Image public_id is under giftagram/ namespace');
  assert(uploadJson1.data?.isPrimary === true, 'Image is designated as primary');

  const imageId1 = uploadJson1.data.id;
  const publicId1 = uploadJson1.data.publicId;

  // 6. Security Check: Cloudinary secrets not exposed in response
  const jsonString = JSON.stringify(uploadJson1);
  assert(!jsonString.includes('hrs9Z0RzNwJ'), 'Security check: Cloudinary API secret is NEVER exposed');
  assert(!jsonString.includes('api_secret'), 'Security check: No api_secret key in JSON');

  // 7. Successful Upload 2 (secondary image)
  const uploadForm2 = new FormData();
  uploadForm2.append('file', createTestImageBlob('image/png'), 'atelier_test_cake_2.png');
  uploadForm2.append('altText', 'Royal Belgian Truffle detail slice');
  uploadForm2.append('isPrimary', 'false');

  const uploadRes2 = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: uploadForm2,
  });
  const uploadJson2 = (await uploadRes2.json()) as any;
  assert(uploadRes2.status === 201, 'Second image uploaded successfully (201 Created)');
  assert(uploadJson2.data?.isPrimary === false, 'Second image has isPrimary = false');

  const imageId2 = uploadJson2.data.id;
  const publicId2 = uploadJson2.data.publicId;

  // 8. List Images for Product
  const listRes = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    headers: { Cookie: adminCookie },
  });
  const listJson = (await listRes.json()) as any;
  assert(listRes.status === 200, 'GET /api/admin/products/:id/images returns 200');
  assert(Array.isArray(listJson.data), 'Returns image array');
  assert(listJson.data.length >= 2, `Product has at least 2 images (count: ${listJson.data.length})`);

  // Verify primary image is first in list
  assert(listJson.data[0].id === imageId1 && listJson.data[0].isPrimary === true, 'Primary image is first in list');

  // 9. Set Primary Image (promote image 2)
  const setPrimaryRes = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/${imageId2}/primary`, {
    method: 'PUT',
    headers: { Cookie: adminCookie },
  });
  assert(setPrimaryRes.status === 200, 'PUT /api/admin/products/:id/images/:imgId/primary returns 200');

  const listAfterPrimary = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    headers: { Cookie: adminCookie },
  });
  const listAfterPrimaryJson = (await listAfterPrimary.json()) as any;
  const img1After = listAfterPrimaryJson.data.find((i: any) => i.id === imageId1);
  const img2After = listAfterPrimaryJson.data.find((i: any) => i.id === imageId2);
  assert(img2After?.isPrimary === true, 'Image 2 is now primary');
  assert(img1After?.isPrimary === false, 'Image 1 is no longer primary (single primary enforced)');

  // 10. Reorder Images
  const reorderRes = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ imageIds: [imageId1, imageId2] }),
  });
  assert(reorderRes.status === 200, 'PUT /api/admin/products/:id/images/reorder returns 200');

  // 11. Replace Image
  const replaceForm = new FormData();
  replaceForm.append('file', createTestImageBlob('image/png'), 'atelier_test_cake_replaced.png');
  const replaceRes = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/${imageId2}/replace`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: replaceForm,
  });
  const replaceJson = (await replaceRes.json()) as any;
  assert(replaceRes.status === 200, 'POST /api/admin/products/:id/images/:imgId/replace returns 200');
  assert(replaceJson.data?.publicId !== publicId2, 'Replaced image has new public_id');
  const replacedPublicId = replaceJson.data.publicId;

  // 12. Delete Image 1
  const deleteRes1 = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/${imageId1}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteRes1.status === 200, 'DELETE /api/admin/products/:id/images/:imgId returns 200');

  // 13. Delete Replaced Image 2 & Cleanup from D1
  const deleteRes2 = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images/${imageId2}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteRes2.status === 200, 'DELETE second image returns 200');

  // Verify images removed from D1
  const listAfterDelete = await fetch(`${API_BASE}/api/admin/products/${testProductId}/images`, {
    headers: { Cookie: adminCookie },
  });
  const listAfterDeleteJson = (await listAfterDelete.json()) as any;
  const remaining = listAfterDeleteJson.data.filter((i: any) => i.id === imageId1 || i.id === imageId2);
  assert(remaining.length === 0, 'Deleted images are completely removed from D1 product_images');

  // 14. Verify Customer Public Storefront continues functioning
  const publicStorefrontRes = await fetch(`${API_BASE}/api/products/royal-chocolate`);
  const publicStorefrontJson = (await publicStorefrontRes.json()) as any;
  assert(publicStorefrontRes.status === 200, 'Customer storefront GET /api/products/:slug returns 200');
  assert(Array.isArray(publicStorefrontJson.data?.images), 'Customer product has images array');

  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('admin_images.integration.test.ts')) {
  runAdminImagesIntegrationTests().then(({ passed, failed }) => {
    console.log(`\nPhase 3 Image Integration Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
    process.exit(0);
  });
}
