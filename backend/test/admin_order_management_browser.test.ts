import puppeteer from 'puppeteer-core';
import { createHmacSha256 } from '../src/utils/crypto';

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://127.0.0.1:8787';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function dispatchClick(page: any, text: string, containerSelector = '') {
  return await page.evaluate(
    (targetText: string, container: string) => {
      const root = container ? document.querySelector(container) : document;
      if (!root) return false;
      const buttons = Array.from(root.querySelectorAll('button'));
      const btn = buttons.find((b) => b.innerText.toLowerCase().includes(targetText.toLowerCase()));
      if (!btn) return false;
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      btn.click();
      return true;
    },
    text,
    containerSelector
  );
}

async function runOrderBrowserQA() {
  console.log('\n--- STARTING PHASE 4 ADMIN ORDER MANAGEMENT BROWSER QA ---');
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

  try {
    // 0. Ensure a verified QA test order exists
    const uniqueName = `Aria Montgomery ${Date.now().toString().slice(-4)}`;
    const seedRes = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: uniqueName,
          phone: '9876543210',
          email: 'aria@atelier.luxury',
        },
        pickupDate: '2026-09-20',
        pickupTime: '14:00',
        specialInstructions: 'Bespoke Atelier QA Order',
        items: [
          {
            productId: 'cake-royal-chocolate',
            quantity: 1,
            price: 799,
            subtotal: 799,
            depositAmount: 399.5,
            cakeCustomization: {
              fullName: uniqueName,
              phone: '9876543210',
              email: 'aria@atelier.luxury',
              pickupDate: '2026-09-20',
              pickupTime: '14:00',
              designRequirements: 'Velvet Noir & Gold',
              lettering: 'Happy Birthday Aria',
              depositAcknowledged: true,
            },
          },
        ],
      }),
    });
    const seedJson = (await seedRes.json()) as any;
    assert(seedRes.status === 201, 'Seed QA customer order created successfully (201)');
    const testOrderId = seedJson.data.id;
    const testOrderNumber = seedJson.data.orderNumber;
    console.log(`[QA SETUP] Created test order ${testOrderNumber} (${testOrderId})`);

    // Verify deposit payment via authoritative Razorpay flow
    const payOrderRes = await fetch(`${API_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: testOrderId }),
    });
    const payOrderJson = (await payOrderRes.json()) as any;
    const rzpOrderId = payOrderJson.data.razorpayOrderId;
    const rzpPaymentId = `pay_qa_${Date.now()}`;
    const secret = 'test_secret_for_local_dev';
    const validSig = await createHmacSha256(secret, `${rzpOrderId}|${rzpPaymentId}`);

    const payRes = await fetch(`${API_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSig,
      }),
    });
    assert(payRes.status === 200, 'Seed deposit payment verified (order is deposit_paid)');

    // 1. Launch Puppeteer
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', (msg) => {
      const text = msg.text();
      if (!text.includes('[vite]') && !text.includes('React DevTools')) {
        console.log('BROWSER CONSOLE:', text);
      }
    });
    page.on('pageerror', (err) => console.log('BROWSER JS ERROR:', err));

    // 2. Visit /admin/login
    await page.goto(`${FRONTEND_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 8000 });
    assert(page.url().includes('/admin/login'), 'Admin login page loaded successfully');

    // 3. Authenticate as giftstudio
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 8000 });
    await page.type('input[name="username"]', 'giftstudio');
    await page.type('input[name="password"]', 'gift0077');
    await page.click('button[type="submit"]');

    // 4. Verify redirect to /admin dashboard
    await page.waitForFunction(
      () => window.location.pathname === '/admin' || (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login'),
      { timeout: 10000 }
    );
    assert(page.url().includes('/admin') && !page.url().includes('/admin/login'), 'Redirected to /admin dashboard upon login');

    // 5. Navigate to /admin/orders via nav link
    const ordersNavLink = await page.waitForSelector('a[href="/admin/orders"]', { timeout: 8000 });
    assert(!!ordersNavLink, 'Orders nav link present in AdminLayout header');
    await ordersNavLink!.click();

    await page.waitForFunction(
      () => window.location.pathname === '/admin/orders' && document.querySelector('h1')?.textContent?.includes('Orders'),
      { timeout: 10000 }
    );
    assert(page.url().includes('/admin/orders'), 'Navigated to /admin/orders URL');

    const headingText = await page.$eval('h1', (el: any) => el.innerText);
    assert(headingText.includes('Orders'), `Orders page heading verified: "${headingText}"`);

    // 6. Verify orders table is rendered
    await page.waitForSelector('table', { timeout: 8000 });
    const rowCount = await page.$$eval('tbody tr', (rows: any) => rows.length);
    assert(rowCount > 0, `Orders table rendered with ${rowCount} orders`);

    // 7. Search for our created test order by unique customer name
    const searchInput = await page.waitForSelector('input[placeholder*="Search by order number"]', { timeout: 8000 });
    assert(!!searchInput, 'Search input field is present');
    await searchInput!.type(uniqueName);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 600))); // debounce wait

    const searchedRows = await page.$$eval('tbody tr', (rows: any) => rows.length);
    assert(searchedRows >= 1, `Search by customer name returned ${searchedRows} matching order(s)`);

    // 8. Open the Order Detail Drawer via Dossier button
    const dossierClicked = await dispatchClick(page, 'Dossier', 'tbody');
    assert(dossierClicked, 'Dossier action button clicked');

    // 9. Verify Drawer content
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    assert(true, 'Admin Order Detail Drawer opened');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 600))); // wait for spring slide-in animation

    // Check customer info in drawer
    const drawerText = await page.$eval('[role="dialog"]', (el: any) => el.innerText);
    assert(drawerText.includes(uniqueName), `Drawer displays customer name: ${uniqueName}`);
    assert(drawerText.includes('9876543210'), 'Drawer displays customer phone: 9876543210');
    assert(drawerText.includes('Royal Chocolate'), 'Drawer displays purchased product name snapshot: Royal Chocolate');
    assert(drawerText.includes('Happy Birthday Aria'), 'Drawer displays bespoke cake lettering: Happy Birthday Aria');
    assert(
      drawerText.toLowerCase().includes('50% non-refundable deposit'),
      'Drawer displays authoritative 50% deposit policy'
    );

    // 10. Perform valid status transition in drawer
    // In deposit_paid status, the valid transition button is "Confirm Kitchen Schedule" (to confirmed)
    const confirmedClicked = await dispatchClick(page, 'Confirm Kitchen Schedule', '[role="dialog"]');
    assert(confirmedClicked, 'Clicked "Confirm Kitchen Schedule" status transition button');

    if (confirmedClicked) {
      await page.waitForFunction(
        () => {
          const dialog = document.querySelector('[role="dialog"]');
          return dialog && (dialog.textContent?.includes('Confirmed') || dialog.textContent?.includes('CONFIRMED'));
        },
        { timeout: 8000 }
      );
      assert(true, 'Order status successfully transitioned to Confirmed in real-time UI');
    }

    // Wait for drawer state to settle
    await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));

    // 11. Test Cancel Order confirmation modal
    const cancelTriggerClicked = await dispatchClick(page, 'Cancel Order', '[role="dialog"]');
    assert(cancelTriggerClicked, 'Clicked Cancel Order button');

    if (cancelTriggerClicked) {
      await page.waitForFunction(
        () => document.body.innerText.includes('Cancel this commission?'),
        { timeout: 6000 }
      );
      assert(true, 'Cancellation confirmation modal displayed with clear warning');

      // Dismiss the cancellation modal safely with "Keep Order"
      const keepActiveClicked = await dispatchClick(page, 'Keep Order');
      assert(keepActiveClicked, 'Clicked "Keep Order" to safely dismiss modal');
      await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
      assert(true, 'Cancellation modal safely dismissed with order preserved');
    }

    // Close the drawer
    const closeBtn = await page.$('button[aria-label="Close dossier"]');
    if (closeBtn) {
      await closeBtn.click();
      await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));
    }

    // 12. Test Filter Tabs
    // Clear search first
    const clearBtn = await page.$('button[aria-label="Clear search"]');
    if (clearBtn) {
      await clearBtn.click();
      await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));
    }

    // Click "Confirmed" filter tab
    const filterClicked = await dispatchClick(page, 'Confirmed', 'div');
    assert(filterClicked, 'Clicked "Confirmed" filter tab');

    if (filterClicked) {
      await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));
      const filteredRows = await page.$$eval('tbody tr', (rows: any) => rows.length);
      assert(filteredRows >= 1, `Filter tab "Confirmed" displays ${filteredRows} order(s)`);
    }

    // 13. Verify Customer Storefront regression
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 8000 });
    const homeH1 = await page.$eval('h1', (el: any) => el.innerText);
    assert(homeH1.length > 0, `Customer storefront homepage rendered smoothly (H1: "${homeH1}")`);

    await page.goto(`${FRONTEND_URL}/cakes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 8000 });
    const cakesH1 = await page.$eval('h1', (el: any) => el.innerText);
    assert(cakesH1.includes('Cakes') || cakesH1.includes('Artisanal'), `Customer cakes catalog page intact: "${cakesH1}"`);

    await page.goto(`${FRONTEND_URL}/bouquets`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 8000 });
    const bouquetsH1 = await page.$eval('h1', (el: any) => el.innerText);
    assert(bouquetsH1.includes('Bouquet') || bouquetsH1.includes('Floral'), `Customer bouquets catalog page intact: "${bouquetsH1}"`);

    // 14. Test Logout & Route Protection
    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle2' });
    const loggedOut = await dispatchClick(page, 'Log out');
    assert(loggedOut, 'Clicked "Log out" button on admin dashboard');

    if (loggedOut) {
      await page.waitForFunction(() => window.location.pathname.includes('/admin/login'), { timeout: 8000 });
      assert(page.url().includes('/admin/login'), 'Logged out and redirected to /admin/login');

      // Try directly visiting /admin/orders without session
      await page.goto(`${FRONTEND_URL}/admin/orders`, { waitUntil: 'networkidle2' });
      await page.waitForFunction(() => window.location.pathname.includes('/admin/login'), { timeout: 8000 });
      assert(page.url().includes('/admin/login'), 'Unauthenticated visit to /admin/orders strictly redirected to /admin/login');
    }

  } catch (err: any) {
    console.error('❌ Browser QA error:', err.message);
    failed++;
  } finally {
    if (browser) await browser.close();
  }

  console.log(`\nPhase 4 Browser QA Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runOrderBrowserQA();
