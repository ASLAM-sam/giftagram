import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:5173';
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

async function runAdminFrontendBrowserQA() {
  console.log('===============================================================');
  console.log(' STARTING GIFTAGRAM FRONTEND ADMIN AUTHENTICATION BROWSER TEST');
  console.log(` Frontend URL: ${FRONTEND_URL}`);
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

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
    // TEST 1 — Customer Storefront Unchanged
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Customer Storefront Layout Check ---');
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle2', timeout: 15000 });
    const hasCustomerHeader = await page.$('header nav');
    const hasCustomerFooter = await page.$('footer');
    record('Customer Homepage Renders with Header & Nav', hasCustomerHeader !== null);
    record('Customer Homepage Renders with Footer', hasCustomerFooter !== null);

    // -------------------------------------------------------------
    // TEST 2 — Unauthenticated /admin Redirects to /admin/login
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Protected Route Redirection ---');
    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[name="username"]', { timeout: 8000 });
    const currentUrlAfterRedirect = page.url();
    record('Unauthenticated /admin redirects to /admin/login', currentUrlAfterRedirect.includes('/admin/login'), `URL: ${currentUrlAfterRedirect}`);

    // -------------------------------------------------------------
    // TEST 3 — Admin Login Page Layout Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Admin Login Page Isolation & Branding ---');
    const loginPageText = await page.$eval('body', (el) => el.innerText);

    // Brand and Headings
    record('Displays GIFTAGRAM Branding', loginPageText.includes('GIFTAGRAM'));
    record('Displays Atelier Studio Subtitle', loginPageText.toLowerCase().includes('atelier studio'));
    record('Displays ADMIN ACCESS Header', loginPageText.includes('ADMIN ACCESS'));
    record('Displays Welcome back Greeting', loginPageText.includes('Welcome back'));

    // Customer navigation MUST NOT be present
    const customerNavInAdmin = await page.$('header nav');
    const cartButtonInAdmin = await page.$('button[aria-label*="cart" i], button[aria-label*="bag" i]');
    record('Customer Navigation NOT Present on Admin Login Page', customerNavInAdmin === null);
    record('Customer Cart Drawer Button NOT Present on Admin Login Page', cartButtonInAdmin === null);

    // Form inputs
    const usernameInput = await page.$('input[name="username"]');
    const passwordInput = await page.$('input[name="password"]');
    const submitBtn = await page.$('button[type="submit"]');
    record('Username Input Field Present with name="username"', usernameInput !== null);
    record('Password Input Field Present with name="password"', passwordInput !== null);
    record('Submit Button Present', submitBtn !== null);

    // Show/Hide password toggle check
    const passwordTypeInitial = await page.$eval('input[name="password"]', (el) => el.getAttribute('type'));
    record('Password Input Initial Type is "password"', passwordTypeInitial === 'password');

    const togglePasswordBtn = await page.$('button[aria-label="Show password"], button[aria-label="Hide password"]');
    if (togglePasswordBtn) {
      await togglePasswordBtn.click();
      const passwordTypeToggled = await page.$eval('input[name="password"]', (el) => el.getAttribute('type'));
      record('Toggle Password Changes Input Type to "text"', passwordTypeToggled === 'text');
      await togglePasswordBtn.click();
    }

    // -------------------------------------------------------------
    // TEST 4 — Failed Login (Wrong Password)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Invalid Credentials Handling ---');
    await page.click('input[name="username"]');
    await page.type('input[name="username"]', 'giftstudio');
    await page.click('input[name="password"]');
    await page.type('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for error alert
    await page.waitForFunction(
      () => document.body.innerText.includes('Invalid username or password'),
      { timeout: 5000 }
    );
    const postErrorText = await page.$eval('body', (el) => el.innerText);
    record('Displays Clean Error Message for Wrong Password', postErrorText.includes('Invalid username or password'));
    record('Remains on /admin/login Page after Failed Login', page.url().includes('/admin/login'));

    // -------------------------------------------------------------
    // TEST 5 — Successful Login (giftstudio)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Successful Admin Login ---');
    // Fresh visit to login page to guarantee clean inputs
    await page.goto(`${FRONTEND_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });

    await page.type('input[name="username"]', 'giftstudio');
    await page.type('input[name="password"]', 'gift0077');
    await page.click('button[type="submit"]');

    // Wait for transition to /admin dashboard
    await page.waitForFunction(
      () => window.location.pathname === '/admin',
      { timeout: 8000 }
    );
    record('Navigates to /admin after Successful Login', page.url().endsWith('/admin'));

    // -------------------------------------------------------------
    // TEST 6 — Admin Dashboard Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Admin Dashboard Content & Branding ---');
    await page.waitForSelector('h1', { timeout: 5000 });
    const dashboardText = await page.$eval('body', (el) => el.innerText);

    record('Displays "Welcome to Giftagram"', dashboardText.includes('Welcome to Giftagram'));
    record('Displays Personalized Welcome "Welcome back, Giftagram Atelier Admin"', dashboardText.includes('Welcome back, Giftagram Atelier Admin'));
    record('Displays "Securely Authenticated" Status', dashboardText.toLowerCase().includes('securely authenticated'));
    record('Displays Admin Username: giftstudio', dashboardText.includes('giftstudio'));
    record('Displays Administrator Role', dashboardText.includes('Administrator') || dashboardText.includes('admin'));
    record('Displays "Your studio is ready"', dashboardText.includes('Your studio is ready'));
    record('Customer Storefront Header/Footer NOT Present on Dashboard', (await page.$('header nav')) === null);

    // -------------------------------------------------------------
    // TEST 7 — Page Refresh (Cookie Session Persistence)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Page Refresh / Session Persistence ---');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 5000 });
    const postRefreshUrl = page.url();
    const postRefreshText = await page.$eval('body', (el) => el.innerText);

    record('Remains on /admin after Browser Refresh (No Redirect to Login)', postRefreshUrl.endsWith('/admin'));
    record('Still Authenticated as giftstudio after Refresh', postRefreshText.includes('giftstudio') && postRefreshText.includes('Welcome to Giftagram'));

    // -------------------------------------------------------------
    // TEST 8 — Logout Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Logout Flow ---');
    // Find logout button in header
    const logoutBtn = await page.$('button[aria-label="Sign out of atelier"]');
    if (logoutBtn) {
      await logoutBtn.click();
    } else {
      const cardLogoutBtn = await page.$('button::-p-text(Log out of studio)');
      if (cardLogoutBtn) await cardLogoutBtn.click();
    }

    // Wait for navigation back to /admin/login
    await page.waitForFunction(
      () => window.location.pathname.includes('/admin/login'),
      { timeout: 8000 }
    );
    record('Sign Out Redirects to /admin/login', page.url().includes('/admin/login'));

    // Try navigating back to /admin
    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    record('Subsequent Access to /admin Redirects to /admin/login', page.url().includes('/admin/login'));

    // -------------------------------------------------------------
    // TEST 9 — Storefront Unaffected After Admin Session
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Storefront Unaffected ---');
    await page.goto(`${FRONTEND_URL}/cakes`, { waitUntil: 'networkidle2' });
    const cakesText = await page.$eval('body', (el) => el.innerText);
    record('Customer Cakes Page Renders Perfectly', cakesText.includes('Chocolate Belgium') && cakesText.includes('Royal Chocolate'));

  } catch (err: any) {
    console.error('Test run encountered an unexpected exception:', err);
    record('Admin Frontend Browser QA Execution', false, err.message);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n===============================================================');
  console.log(' ADMIN FRONTEND QA SUMMARY REPORT');
  console.log('===============================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter((r) => !r.passed).forEach((r) => console.log(` - ${r.name}: ${r.details || ''}`));
    process.exit(1);
  } else {
    console.log('\nALL ADMIN FRONTEND BROWSER TESTS PASSED! 🎉');
  }
}

runAdminFrontendBrowserQA();
