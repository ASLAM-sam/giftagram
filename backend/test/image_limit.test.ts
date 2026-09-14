import { imageService } from '../src/services/imageService';
import { cloudinaryService } from '../src/services/cloudinaryService';
import { Env } from '../src/env';

// Mock cloudinaryService methods for fast, deterministic unit testing
cloudinaryService.uploadImage = async (file: File, folder: string) => {
  return {
    secure_url: `https://res.cloudinary.com/mock_cloud/image/upload/v123456/${folder}/sample_${Date.now()}.jpg`,
    public_id: `${folder}/sample_${Date.now()}`,
    folder: folder
  };
};

cloudinaryService.deleteImage = async () => {};

/**
 * In-memory Mock D1 Database to thoroughly test image limit and primary promotion logic
 */
class MockD1 {
  products: any[] = [{ id: 'prod-test-limit', category: 'cakes', name: 'Test Cake' }];
  product_images: any[] = [];

  prepare(query: string) {
    const self = this;
    let boundParams: any[] = [];
    const q = query.replace(/\s+/g, ' ').trim();

    const stmt = {
      bind(...params: any[]) {
        boundParams = params;
        return stmt;
      },
      async first<T = any>(): Promise<T | null> {
        if (q.includes('SELECT id, category FROM products WHERE id = ?')) {
          const p = self.products.find(x => x.id === boundParams[0]);
          return (p || null) as any;
        }
        if (q.includes('SELECT id FROM product_images WHERE id = ? AND product_id = ?')) {
          const img = self.product_images.find(x => x.id === boundParams[0] && x.product_id === boundParams[1]);
          return (img ? { id: img.id } : null) as any;
        }
        if (q.includes('SELECT * FROM product_images WHERE id = ? AND product_id = ?')) {
          const img = self.product_images.find(x => x.id === boundParams[0] && x.product_id === boundParams[1]);
          return (img || null) as any;
        }
        if (q.includes('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1')) {
          const imgs = self.product_images.filter(x => x.product_id === boundParams[0]);
          imgs.sort((a, b) => a.sort_order - b.sort_order);
          return (imgs[0] ? { id: imgs[0].id } : null) as any;
        }
        return null;
      },
      async all<T = any>(): Promise<{ results: T[] }> {
        if (q.includes('SELECT * FROM product_images') && q.includes('WHERE product_id = ?')) {
          const imgs = self.product_images.filter(x => x.product_id === boundParams[0]);
          // Default sorting: is_primary DESC, sort_order ASC, created_at ASC
          imgs.sort((a, b) => {
            if (b.is_primary !== a.is_primary) return b.is_primary - a.is_primary;
            return a.sort_order - b.sort_order;
          });
          return { results: [...imgs] as any };
        }
        return { results: [] };
      },
      async run(): Promise<{ success: boolean }> {
        const q = query.trim();
        if (q.includes('INSERT INTO product_images')) {
          const [id, product_id, r2_key, alt_text, sort_order, secure_url, public_id, folder, is_primary, created_at] = boundParams;
          self.product_images.push({
            id,
            product_id,
            r2_key,
            alt_text,
            sort_order,
            secure_url,
            public_id,
            folder,
            is_primary,
            created_at
          });
          return { success: true };
        }
        if (q.includes('UPDATE product_images SET is_primary = 0 WHERE product_id = ?')) {
          self.product_images.forEach(x => {
            if (x.product_id === boundParams[0]) x.is_primary = 0;
          });
          return { success: true };
        }
        if (q.includes('UPDATE product_images SET is_primary = 1 WHERE id = ?')) {
          const img = self.product_images.find(x => x.id === boundParams[0]);
          if (img) img.is_primary = 1;
          return { success: true };
        }
        if (q.includes('UPDATE product_images') && q.includes('secure_url = ?')) {
          const [secure_url, public_id, folder, r2_key, id, product_id] = boundParams;
          const img = self.product_images.find(x => x.id === id && x.product_id === product_id);
          if (img) {
            img.secure_url = secure_url;
            img.public_id = public_id;
            img.folder = folder;
            img.r2_key = r2_key;
          }
          return { success: true };
        }
        if (q.includes('DELETE FROM product_images WHERE id = ? AND product_id = ?')) {
          const idx = self.product_images.findIndex(x => x.id === boundParams[0] && x.product_id === boundParams[1]);
          if (idx !== -1) {
            self.product_images.splice(idx, 1);
          }
          return { success: true };
        }
        return { success: true };
      }
    };
    return stmt;
  }

  async batch(statements: any[]) {
    for (const s of statements) {
      await s.run();
    }
    return [];
  }
}

async function runImageLimitTests() {
  console.log('--- RUNNING 5-IMAGE HARD LIMIT & GALLERY TESTS ---');
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

  const mockDb = new MockD1() as any;
  const mockEnv: Env = {
    DB: mockDb,
    CLOUDINARY_CLOUD_NAME: 'mock_cloud',
    CLOUDINARY_API_KEY: 'mock_key',
    CLOUDINARY_API_SECRET: 'mock_secret',
    ENVIRONMENT: 'development',
  };

  const fakeFile = new File(['fake image bytes'], 'test.jpg', { type: 'image/jpeg' });

  // 1. Upload images 1 through 5
  for (let i = 1; i <= 5; i++) {
    const uploaded = await imageService.uploadProductImage(
      mockDb,
      mockEnv,
      'prod-test-limit',
      fakeFile,
      `Image ${i}`,
      i === 1 // first is primary
    );
    assert(uploaded.id.startsWith('img_'), `Upload image #${i} succeeds`);
  }

  // Verify count is 5
  const imagesAt5 = await imageService.getProductImages(mockDb, 'prod-test-limit');
  assert(imagesAt5.length === 5, `Product has exactly 5 images (got ${imagesAt5.length})`);
  assert(imagesAt5[0].isPrimary === true, 'First image is primary');

  // 2. Attempt to upload 6th image (MUST BE REJECTED)
  let rejected = false;
  let errorStatus = 0;
  let errorMessage = '';
  try {
    await imageService.uploadProductImage(
      mockDb,
      mockEnv,
      'prod-test-limit',
      fakeFile,
      'Image 6 (Should Fail)',
      false
    );
  } catch (err: any) {
    rejected = true;
    errorStatus = err?.status || 0;
    errorMessage = err?.message || '';
  }

  assert(rejected === true, 'Upload #6 is rejected by server');
  assert(errorStatus === 409, `Rejected with status 409 Conflict (got ${errorStatus})`);
  assert(errorMessage.includes('Maximum 5 images allowed'), `Error message indicates 5-image limit: "${errorMessage}"`);

  // Verify count remains 5
  const imagesStill5 = await imageService.getProductImages(mockDb, 'prod-test-limit');
  assert(imagesStill5.length === 5, 'Total image count remains exactly 5 after rejected upload');

  // 3. Test Replace at 5 images
  const targetToReplace = imagesStill5[2]; // replace 3rd image
  const replaced = await imageService.replaceProductImage(
    mockDb,
    mockEnv,
    'prod-test-limit',
    targetToReplace.id,
    fakeFile
  );
  assert(replaced.id === targetToReplace.id, 'Image replacement succeeds in-place');
  const imagesAfterReplace = await imageService.getProductImages(mockDb, 'prod-test-limit');
  assert(imagesAfterReplace.length === 5, 'Total count remains 5 after replacement');

  // 4. Test Delete from 5 images
  const targetToDelete = imagesAfterReplace[4];
  await imageService.deleteProductImage(mockDb, mockEnv, 'prod-test-limit', targetToDelete.id);
  const imagesAfterDelete = await imageService.getProductImages(mockDb, 'prod-test-limit');
  assert(imagesAfterDelete.length === 4, `Total count decreases to 4 after deletion (got ${imagesAfterDelete.length})`);

  // 5. Test Upload after Delete (Now allowed again)
  const uploadAllowed = await imageService.uploadProductImage(
    mockDb,
    mockEnv,
    'prod-test-limit',
    fakeFile,
    'New 5th Image',
    false
  );
  assert(uploadAllowed.id.startsWith('img_'), 'Upload succeeds after freeing up a slot');
  const imagesBackTo5 = await imageService.getProductImages(mockDb, 'prod-test-limit');
  assert(imagesBackTo5.length === 5, 'Total count returns to 5');

  // 6. Test Primary Image Selection
  const newPrimaryTarget = imagesBackTo5[3];
  await imageService.setPrimaryImage(mockDb, 'prod-test-limit', newPrimaryTarget.id);
  const imagesWithNewPrimary = await imageService.getProductImages(mockDb, 'prod-test-limit');
  assert(imagesWithNewPrimary[0].id === newPrimaryTarget.id, 'Newly designated primary image is returned at index 0');
  const primaryCount = imagesWithNewPrimary.filter(i => i.isPrimary).length;
  assert(primaryCount === 1, `Exactly one image is primary (got ${primaryCount})`);

  console.log(`\nImage Limit Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runImageLimitTests().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
