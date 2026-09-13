import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';
import path from 'node:path';

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://127.0.0.1:8787';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name}${details ? ' - ' + details : ''}`);
}

async function runAdminProductBrowserQA() {
  console.log('===================================================================');
  console.log(' STARTING GIFTAGRAM PHASE 2: ADMIN PRODUCT MANAGEMENT BROWSER QA');
  console.log(` Frontend URL: ${FRONTEND_URL}`);
  console.log(` Backend API:  ${API_URL}`);
  console.log('===================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      if (!text.includes('favicon') && !text.includes('status of 40')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`Uncaught JS Exception: ${err.message}`);
  });

  try {
    // -------------------------------------------------------------
    // TEST 1 — Route Protection: Unauthenticated /admin/products
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Unauthenticated Route Protection ---');
    await page.goto(`${FRONTEND_URL}/admin/products`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[name="username"]', { timeout: 8000 });
    const currentUrl = page.url();
    record(
      'Unauthenticated /admin/products redirects to /admin/login',
      currentUrl.includes('/admin/login'),
      `Current URL: ${currentUrl}`
    );

    // -------------------------------------------------------------
    // TEST 2 — Admin Login & Navigation to Products
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Admin Authentication & Atelier Navigation ---');
    await page.goto(`${FRONTEND_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 8000 });

    await page.click('input[name="username"]');
    await page.type('input[name="username"]', 'giftstudio');
    await page.click('input[name="password"]');
    await page.type('input[name="password"]', 'gift0077');
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin or /admin/products
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login',
      { timeout: 10000 }
    );
    const landedPath = await page.evaluate(() => window.location.pathname);
    record('Login successful, landed on admin area', true, `Path: ${landedPath}`);

    // Verify Atelier Navigation tab for Products is present
    const productsNavLink = await page.waitForSelector('a[href="/admin/products"]', { timeout: 5000 });
    record('Admin layout displays Products navigation link', productsNavLink !== null);

    const studioNavLink = await page.waitForSelector('a[href="/admin"]', { timeout: 5000 });
    record('Admin layout displays Studio navigation link', studioNavLink !== null);

    // If currently on /admin, click to /admin/products; if already on /admin/products, click to /admin and back to verify navigation
    if (landedPath === '/admin') {
      await productsNavLink!.click();
      await page.waitForFunction(() => window.location.pathname === '/admin/products', { timeout: 8000 });
      record('Navigated to /admin/products via Atelier navigation', true);
    } else {
      await studioNavLink!.click();
      await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 8000 });
      record('Navigated to /admin via Studio tab', true);
      const prodLinkAgain = await page.waitForSelector('a[href="/admin/products"]', { timeout: 5000 });
      await prodLinkAgain!.click();
      await page.waitForFunction(() => window.location.pathname === '/admin/products', { timeout: 8000 });
      record('Navigated to /admin/products via Atelier navigation', true);
    }

    // -------------------------------------------------------------
    // TEST 3 — Product List Page Elements & Brand Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Product List Layout & Brand Isolation ---');
    await page.waitForFunction(
      () => document.querySelector('h1')?.textContent?.includes('Products'),
      { timeout: 8000 }
    );
    const headingText = await page.$eval('h1', (el) => el.textContent || '');
    record('Displays luxury page heading "Products"', headingText.includes('Products'));

    const pageContent = await page.content();
    record(
      'Displays brand subtitle "Manage the collection available through your Giftagram atelier."',
      pageContent.includes('Manage the collection available through your Giftagram atelier.')
    );

    // Ensure customer navigation is absent
    const customerCartIcon = await page.$('button[aria-label*="cart" i]');
    record('Customer cart icon is NOT rendered in admin workspace', customerCartIcon === null);

    // Verify product table rendered
    await page.waitForSelector('table tbody tr', { timeout: 8000 });
    const productRowsCount = await page.$$eval('table tbody tr', (rows) => rows.length);
    record('Product catalog table loaded rows from D1', productRowsCount >= 22, `Rows rendered: ${productRowsCount}`);

    // Verify status badges visible
    const activeBadges = await page.$$eval('span', (spans) =>
      spans.filter((s) => s.textContent?.trim().toLowerCase() === 'active').length
    );
    record('Status badges ("Active") rendered for products', activeBadges > 0, `Count: ${activeBadges}`);

    // -------------------------------------------------------------
    // TEST 4 — Search and Filtering
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Search & Filtering ---');
    const searchInput = await page.$('input[placeholder*="Search"]');
    record('Search input is present', searchInput !== null);

    // Search for "Chocolate"
    await searchInput!.type('Chocolate');
    await new Promise((r) => setTimeout(r, 600)); // debounce/render
    const filteredRows = await page.$$eval('table tbody tr', (rows) => rows.length);
    record('Searching "Chocolate" filters catalog to matching items', filteredRows > 0 && filteredRows < productRowsCount, `Filtered count: ${filteredRows}`);

    // Clear search
    await page.click('button[type="button"] svg.lucide-x');
    await new Promise((r) => setTimeout(r, 400));
    const restoredRows = await page.$$eval('table tbody tr', (rows) => rows.length);
    record('Clearing search restores full catalog', restoredRows === productRowsCount);

    // Filter by Inactive
    const clickedInactive = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent?.trim() === 'Inactive');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (clickedInactive) {
      await new Promise((r) => setTimeout(r, 400));
      const inactiveRows = await page.$$eval('table tbody tr', (rows) => rows.length);
      record('Status filter "Inactive" filters catalog', inactiveRows > 0 && inactiveRows < productRowsCount, `Inactive count: ${inactiveRows}`);
    }

    // Reset filter to All
    const allFilterBtn = await page.$$eval('button', (btns) => {
      const b = btns.find((x) => x.textContent?.trim() === 'All');
      if (b) { (b as HTMLElement).click(); return true; }
      return false;
    });
    record('Reset status filter to All', allFilterBtn);
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------
    // TEST 5 — Create Product
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Create Product UI & Submission ---');
    // Click Add Product
    const addProductBtn = await page.$$eval('button', (btns) => {
      const b = btns.find((x) => x.textContent?.includes('Add Product'));
      if (b) { (b as HTMLElement).click(); return true; }
      return false;
    });
    record('Clicked "+ Add Product" button', addProductBtn);

    // Verify modal opened
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
    record('Create Product modal opened', true);

    // Verify Phase 3 Image Boundary Notice is present
    const modalText = await page.$eval('div[role="dialog"]', (el) => el.textContent || '');
    record('Modal communicates Phase 3 image management boundary', modalText.includes('Image Management (Phase 3)'));

    // Fill form
    const testProductName = `Saffron Gold Cake ${Date.now().toString().slice(-4)}`;
    const testSlug = `saffron-gold-cake-${Date.now().toString().slice(-4)}`;

    await page.type('input[placeholder*="Royal Belgian"]', testProductName);
    await page.type('input[placeholder*="royal-belgian"]', testSlug);
    await page.type('input[placeholder="799"]', '1250');
    await page.type('textarea', 'Exquisite artisanal saffron sponge with delicate edible gold leaf and pistachio crème.');
    await page.type('input[placeholder*="500g"]', '1 kg');

    // Submit form
    const submitBtn = await page.$('div[role="dialog"] button[type="submit"]');
    await submitBtn!.click();

    // Wait for modal to close and success banner
    await page.waitForSelector('div[role="dialog"]', { hidden: true, timeout: 8000 });
    record('Create product modal closed on successful creation', true);

    await page.waitForFunction((name) => document.body.innerText.includes(name), { timeout: 8000 }, testProductName);
    record('Newly created product appears in catalog list', true, `Product: ${testProductName}`);

    // Verify price in row
    const rowContent = await page.content();
    record('Created product displays correct price ₹1,250', rowContent.includes('1,250'));

    // -------------------------------------------------------------
    // TEST 6 — Edit Product
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Edit Product UI & Submission ---');
    // Find row with test product and click Edit
    const editClicked = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent?.includes(name)) {
          const editBtn = Array.from(row.querySelectorAll('button')).find((b) => b.textContent?.includes('Edit'));
          if (editBtn) {
            editBtn.click();
            return true;
          }
        }
      }
      return false;
    }, testProductName);
    record('Clicked "Edit" on newly created product', editClicked);

    // Wait for modal in edit mode
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
    const editModalTitle = await page.$eval('div[role="dialog"] h2', (el) => el.textContent || '');
    record('Edit modal opened with product title', editModalTitle.includes(testProductName));

    // Update Price from 1250 to 1450
    const priceInput = await page.$('input[placeholder="799"]');
    await priceInput!.click({ clickCount: 3 });
    await priceInput!.type('1450');

    // Save Changes
    const saveBtn = await page.$('div[role="dialog"] button[type="submit"]');
    await saveBtn!.click();

    await page.waitForSelector('div[role="dialog"]', { hidden: true, timeout: 8000 });
    record('Edit modal closed after saving changes', true);

    await new Promise((r) => setTimeout(r, 600));
    const updatedContent = await page.content();
    record('Product row reflects updated price ₹1,450', updatedContent.includes('1,450'));

    // -------------------------------------------------------------
    // TEST 7 — Soft Deactivation & Reactivation
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Soft Deactivation & Reactivation ---');
    // Click Deactivate button on test product
    const deactivatedClicked = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent?.includes(name)) {
          const btn = Array.from(row.querySelectorAll('button')).find((b) => b.textContent?.includes('Deactivate'));
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }, testProductName);
    record('Clicked "Deactivate" on product', deactivatedClicked);

    // Wait for status to change to Inactive
    await new Promise((r) => setTimeout(r, 1000));
    const isNowInactive = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent?.includes(name)) {
          return row.textContent.includes('Inactive') && row.textContent.includes('Activate');
        }
      }
      return false;
    }, testProductName);
    record('Product status changed to Inactive and toggle shows "Activate"', isNowInactive);

    // Verify public customer API does not return this inactive product
    const publicFetchInactive = await fetch(`${API_URL}/api/products/${testSlug}`);
    record('Deactivated product is hidden from customer public API (HTTP 404)', publicFetchInactive.status === 404);

    // Click Activate to reactivate product
    const reactivateClicked = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent?.includes(name)) {
          const btn = Array.from(row.querySelectorAll('button')).find((b) => b.textContent?.includes('Activate'));
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }, testProductName);
    record('Clicked "Activate" to reactivate product', reactivateClicked);

    await new Promise((r) => setTimeout(r, 1000));
    const isNowActive = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent?.includes(name)) {
          return row.textContent.includes('Active') && row.textContent.includes('Deactivate');
        }
      }
      return false;
    }, testProductName);
    record('Product status changed back to Active', isNowActive);

    const publicFetchActive = await fetch(`${API_URL}/api/products/${testSlug}`);
    record('Reactivated product is immediately visible on customer public API (HTTP 200)', publicFetchActive.status === 200);

    // -------------------------------------------------------------
    // TEST 8 — Refresh Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Refresh Persistence ---');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('table tbody tr', { timeout: 8000 });
    const currentUrlAfterReload = page.url();
    record('Page reload keeps session active without redirect to login', currentUrlAfterReload.includes('/admin/products'));

    // -------------------------------------------------------------
    // TEST 9 — Cleanup Test Product from Local D1
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Cleanup Test Product ---');
    execSync(
      `npx wrangler d1 execute DB --local --command "DELETE FROM products WHERE slug = '${testSlug}';"`,
      { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' }
    );
    record(`Cleaned up temporary test product (${testSlug}) from local D1`, true);

    // -------------------------------------------------------------
    // TEST 10 — Admin Logout Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Admin Logout Flow ---');
    const logoutBtn = await page.waitForSelector('button[aria-label="Sign out of atelier"]', { timeout: 5000 });
    await logoutBtn!.click();

    await page.waitForFunction(() => window.location.pathname === '/admin/login', { timeout: 8000 });
    record('Clicking Sign out redirects to /admin/login', true);

    // Try navigating back to /admin/products
    await page.goto(`${FRONTEND_URL}/admin/products`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 8000 });
    record('Direct navigation to /admin/products after logout redirects to /admin/login', page.url().includes('/admin/login'));

    // -------------------------------------------------------------
    // TEST 11 — Customer Storefront Regression Checks
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: Customer Storefront Regression Checks ---');
    // 1. Homepage
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle2', timeout: 15000 });
    const homeTitle = await page.title();
    const homeNav = await page.$('header nav');
    record('Customer Homepage renders title and navigation', Boolean(homeTitle && homeNav));

    // 2. Cakes page
    await page.goto(`${FRONTEND_URL}/cakes`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 8000 });
    const cakesHeader = await page.$eval('h1', (el) => el.textContent || '');
    record('Customer Cakes page renders properly', cakesHeader.toLowerCase().includes('cake'), `Header: ${cakesHeader}`);

    // 3. Bouquets page
    await page.goto(`${FRONTEND_URL}/bouquets`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 8000 });
    const bouquetsHeader = await page.$eval('h1', (el) => el.textContent || '');
    record('Customer Bouquets page renders properly', bouquetsHeader.toLowerCase().includes('bouquet'), `Header: ${bouquetsHeader}`);

    // 4. Shop listing page
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle2', timeout: 15000 });
    const shopContent = await page.content();
    record('Customer Shop page renders properly', shopContent.length > 1000);

    // Check uncaught console errors
    record('No unexpected console or JavaScript errors occurred during session', consoleErrors.length === 0, consoleErrors.join(' | '));

  } catch (err: any) {
    record('Unhandled Browser QA Exception', false, err?.message || String(err));
  } finally {
    try {
      await Promise.race([
        browser.close(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      // ignore close errors
    }
  }

  // Summary
  console.log('\n===================================================================');
  console.log(' BROWSER QA TEST SUMMARY');
  console.log('===================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter((r) => !r.passed).forEach((r) => console.log(` - ${r.name}: ${r.details || ''}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADMIN PRODUCT MANAGEMENT BROWSER TESTS PASSED!');
    process.exit(0);
  }
}

runAdminProductBrowserQA();
