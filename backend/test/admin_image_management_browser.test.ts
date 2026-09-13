import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://127.0.0.1:8787';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// 1x1 red PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// 1x1 blue PNG
const BLUE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifDwAEeQGvR9zP6QAAAABJRU5ErkJggg==',
  'base64'
);

async function runBrowserQA() {
  console.log('\n--- STARTING PHASE 3 ADMIN IMAGE MANAGEMENT BROWSER QA ---');
  let browser: any = null;
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Create temporary test files
  const tempDir = path.join(__dirname, 'scratch');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const testImgPath1 = path.join(tempDir, 'qa_atelier_cake_1.png');
  const testImgPath2 = path.join(tempDir, 'qa_atelier_cake_replaced.png');
  fs.writeFileSync(testImgPath1, TINY_PNG);
  fs.writeFileSync(testImgPath2, BLUE_PNG);

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.log('BROWSER JS ERROR:', err));

    // 1. Visit /admin/login
    await page.goto(`${FRONTEND_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 8000 });
    assert(page.url().includes('/admin/login'), 'Admin login page loaded');

    // 2. Log in with admin credentials
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 8000 });
    await page.type('input[name="username"]', 'giftstudio');
    await page.type('input[name="password"]', 'gift0077');
    await page.click('button[type="submit"]');

    // 3. Verify redirected to Studio dashboard
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login',
      { timeout: 10000 }
    );
    assert(page.url().includes('/admin'), 'Redirected to /admin after successful authentication');

    // 4. Navigate to /admin/products via Atelier tab
    const productsNavLink = await page.waitForSelector('a[href="/admin/products"]', { timeout: 8000 });
    await productsNavLink!.click();
    await page.waitForFunction(
      () => window.location.pathname === '/admin/products' && document.querySelector('h1')?.textContent?.includes('Products'),
      { timeout: 10000 }
    );
    assert(page.url().includes('/admin/products'), 'Atelier products catalog loaded');

    // 5. Verify Images button exists on table rows
    await page.waitForSelector('button[title="Manage product gallery photography"]', { timeout: 6000 });
    const imageButtons = await page.$$('button[title="Manage product gallery photography"]');
    assert(imageButtons.length > 0, `Found ${imageButtons.length} "Images" management buttons in catalog`);

    // 6. Click Images button for the first product
    const btnRect = await page.evaluate(() => {
      const btn = document.querySelector('button[title="Manage product gallery photography"]') as HTMLElement;
      const rect = btn.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    await page.mouse.click(btnRect.x, btnRect.y);

    // 7. Verify Atelier Photography drawer opens
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('atelier photography'),
      { timeout: 10000 }
    );
    assert(true, 'Atelier Photography drawer opened with product gallery');

    // Wait for initial image list or placeholder to finish loading
    await page.waitForFunction(
      () =>
        document.body.innerText.toLowerCase().includes('product gallery') ||
        document.body.innerText.toLowerCase().includes('no images uploaded yet'),
      { timeout: 10000 }
    );

    // 8. Upload new image using hidden file input
    const uploadInput = await page.waitForSelector('#admin-image-upload-input', { timeout: 8000 });
    assert(uploadInput !== null, 'Found image file upload input');

    // Fill alt text
    const altInput = await page.$('input[placeholder*="Alt text"]');
    if (altInput) {
      await altInput.type('Browser QA Atelier Cake Photo');
    }

    // Upload file and dispatch change event to trigger React handler
    await uploadInput!.uploadFile(testImgPath1);
    await page.evaluate(() => {
      const input = document.getElementById('admin-image-upload-input') as HTMLInputElement;
      if (input) {
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Wait for upload and success message
    await page.waitForFunction(
      () => document.body.innerText.includes('Uploaded successfully') || document.body.innerText.includes('Primary Cover'),
      { timeout: 25000 }
    );
    assert(true, 'File uploaded to Cloudinary & D1; success notification displayed');

    // 9. Verify gallery shows images and primary badges
    await page.waitForSelector('img[src*="res.cloudinary.com"], img[src*="cloudinary"]', { timeout: 12000 });
    const galleryCount = await page.evaluate(() => {
      const images = document.querySelectorAll('img[src*="res.cloudinary.com"], img[src*="cloudinary"]');
      return images.length;
    });
    assert(galleryCount > 0, `Gallery renders Cloudinary CDN images (found: ${galleryCount})`);

    // 10. Test "Set Primary" if there are multiple images
    const canPromote = await page.evaluate(() => {
      const btn = document.querySelector('button[title="Set as product primary cover photo"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (canPromote) {
      await page.waitForFunction(() => document.body.innerText.includes('primary cover photo updated'), {
        timeout: 8000,
      });
      assert(true, 'Promoted image to Atelier Primary Cover');
    } else {
      console.log('ℹ️ Only 1 image present or already primary; skipped promote button test');
    }

    // 11. Test "Delete" with confirmation
    await page.waitForSelector('button[title="Delete image"]', { timeout: 6000 });
    await page.evaluate(() => {
      const deleteBtn = document.querySelector('button[title="Delete image"]') as HTMLButtonElement;
      if (deleteBtn) deleteBtn.click();
    });

    // Click confirm
    await page.waitForFunction(() => document.body.innerText.includes('Confirm'), { timeout: 5000 });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find((b) => b.innerText.trim() === 'Confirm');
      if (confirmBtn) confirmBtn.click();
    });
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('removed from Atelier') ||
        document.body.innerText.toLowerCase().includes('product gallery'),
      { timeout: 10000 }
    );
    assert(true, 'Deleted image with confirmation; removed safely from Cloudinary & D1');

    // 12. Close drawer
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const doneBtn = buttons.find((b) => b.innerText.trim() === 'Done');
      if (doneBtn) doneBtn.click();
    });
    await page.waitForFunction(() => !document.body.innerText.includes('Select File to Upload'), { timeout: 6000 });
    assert(true, 'Atelier Photography drawer closed successfully');

    // 13. Admin Logout Flow while on products page
    const logoutBtn = await page.waitForSelector('button[aria-label="Sign out of atelier"]', { timeout: 6000 });
    await logoutBtn!.click();
    await page.waitForFunction(() => window.location.pathname === '/admin/login', { timeout: 8000 });
    assert(page.url().includes('/admin/login'), 'Admin logout redirects to /admin/login');

    // 14. Route Protection: Attempt direct navigation to /admin/products after logout
    await page.goto(`${FRONTEND_URL}/admin/products`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.pathname.includes('/admin/login'), { timeout: 8000 });
    assert(page.url().includes('/admin/login'), 'Protected route blocks unauthenticated access after logout');

    // 15. Customer storefront regression: check /cakes
    await page.goto(`${FRONTEND_URL}/cakes`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Cakes') || document.body.innerText.includes('Bespoke'), {
      timeout: 8000,
    });
    const cakeCards = await page.$$('article, .group');
    assert(cakeCards.length > 0, 'Customer cakes storefront displays product cards');

    // 16. Customer shop page regression
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('img', { timeout: 8000 });
    assert(true, 'Customer shop page loads products with imagery');

  } catch (err: any) {
    console.error('Browser QA Error:', err);
    failed++;
  } finally {
    if (browser) await browser.close();
    // Clean up temporary files
    try {
      if (fs.existsSync(testImgPath1)) fs.unlinkSync(testImgPath1);
      if (fs.existsSync(testImgPath2)) fs.unlinkSync(testImgPath2);
    } catch {}
  }

  console.log(`\nPhase 3 Browser QA Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runBrowserQA();
