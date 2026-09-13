import { execSync } from 'node:child_process';
import path from 'node:path';
import { hashSessionToken } from '../src/services/sessionService';
import { passwordService } from '../src/services/passwordService';

const API_BASE = 'http://127.0.0.1:8787';

export async function runAdminAuthIntegrationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- RUNNING ADMIN AUTHENTICATION INTEGRATION TESTS (USERNAME-BASED) ---');
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

  async function waitForServer(url = `${API_BASE}/api/health`, retries = 20) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return;
      } catch {
        // waiting for Miniflare isolate reload
      }
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  const testUsername = 'giftstudio';
  const testPassword = 'gift0077';

  // 1. Invalid JSON body -> 400
  const badJsonRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not a valid json string',
  });
  assert(badJsonRes.status === 400, 'Login with invalid JSON body returns HTTP 400');

  // 2. Missing username or password -> 400
  const missingUserRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: testPassword }),
  });
  assert(missingUserRes.status === 400, 'Login with missing username returns HTTP 400');

  const missingPassRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername }),
  });
  assert(missingPassRes.status === 400, 'Login with missing password returns HTTP 400');

  const shortUserRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ab', password: testPassword }),
  });
  assert(shortUserRes.status === 400, 'Login with username < 3 chars returns HTTP 400');

  // 3. Unknown username -> 401 with generic message
  const unknownUserRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'unknown_admin_user', password: testPassword }),
  });
  const unknownUserJson = (await unknownUserRes.json()) as any;
  assert(unknownUserRes.status === 401, 'Login with unknown username returns HTTP 401');
  assert(
    unknownUserJson.error?.message === 'Invalid username or password',
    'Generic error message prevents username enumeration on unknown username'
  );

  // 4. Correct username with wrong password -> 401 with same generic message
  const wrongPassRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: 'WrongPassword456!' }),
  });
  const wrongPassJson = (await wrongPassRes.json()) as any;
  assert(wrongPassRes.status === 401, 'Login with wrong password returns HTTP 401');
  assert(
    wrongPassJson.error?.message === 'Invalid username or password',
    'Generic error message prevents enumeration on wrong password'
  );

  // 5. Inactive admin user -> 403
  const inactiveUsername = 'temp_inactive_admin';
  const inactiveHash = await passwordService.hashPassword('InactivePass123!');
  execSync(
    `npx wrangler d1 execute DB --local --command "INSERT OR REPLACE INTO admin_users (id, username, password_hash, full_name, role, active) VALUES ('adm_inactive_test', '${inactiveUsername}', '${inactiveHash}', 'Suspended Admin', 'admin', 0);"`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' }
  );
  await waitForServer();

  const inactiveLoginRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: inactiveUsername, password: 'InactivePass123!' }),
  });
  assert(inactiveLoginRes.status === 403, 'Login for deactivated admin user returns HTTP 403');

  // Clean up temporary inactive test admin
  execSync(
    `npx wrangler d1 execute DB --local --command "DELETE FROM admin_users WHERE id = 'adm_inactive_test';"`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' }
  );
  await waitForServer();

  // 6. Valid login with normalization (mixed case and surrounding whitespace)
  const validLoginRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: '  GIFTSTUDIO  ',
      password: testPassword,
    }),
  });

  assert(validLoginRes.status === 200, 'Valid login with case/whitespace normalization returns HTTP 200');

  const setCookieHeader = validLoginRes.headers.get('set-cookie') || '';
  assert(setCookieHeader.includes('giftagram_admin_session='), 'Response includes Set-Cookie for giftagram_admin_session');
  assert(setCookieHeader.includes('HttpOnly'), 'Cookie has HttpOnly attribute');
  assert(setCookieHeader.includes('SameSite=Lax'), 'Cookie has SameSite=Lax attribute');
  assert(setCookieHeader.includes('Path=/'), 'Cookie has Path=/ attribute');
  assert(setCookieHeader.includes('Max-Age=604800'), 'Cookie has 7-day Max-Age (604800s)');

  // Extract session token from cookie
  const match = setCookieHeader.match(/giftagram_admin_session=([^;]+)/);
  const rawToken = match ? match[1] : '';
  assert(typeof rawToken === 'string' && rawToken.length === 64, 'Raw session token extracted (64 hex chars)');

  const validLoginJson = (await validLoginRes.json()) as any;
  assert(validLoginJson.success === true, 'Login response success is true');
  assert(validLoginJson.data?.user?.username === testUsername, 'Response contains admin username: giftstudio');
  assert(validLoginJson.data?.user?.fullName === 'Giftagram Atelier Admin', 'Response contains admin fullName');
  assert(validLoginJson.data?.user?.role === 'admin', 'Response contains admin role');

  // SECURITY CHECK: Response MUST NOT contain token or password_hash
  assert(validLoginJson.data?.token === undefined, 'Security check: Raw token is NOT exposed in JSON body');
  assert(validLoginJson.data?.user?.password_hash === undefined, 'Security check: password_hash is NOT exposed');
  assert(validLoginJson.data?.user?.password === undefined, 'Security check: plaintext password is NOT exposed');
  assert(validLoginJson.data?.user?.email === undefined, 'Security check: no email field in admin response');

  // SECURITY CHECK: D1 database check - D1 contains SHA-256(token), NOT raw token
  const expectedTokenHash = await hashSessionToken(rawToken);
  const d1SessionsCheck = execSync(
    `npx wrangler d1 execute DB --local --command "SELECT id, admin_id, token_hash FROM admin_sessions WHERE token_hash = '${expectedTokenHash}';"`,
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  assert(d1SessionsCheck.includes(expectedTokenHash), 'D1 stores SHA-256 hash of session token');

  const rawTokenCheck = execSync(
    `npx wrangler d1 execute DB --local --command "SELECT count(*) as cnt FROM admin_sessions WHERE token_hash = '${rawToken}';"`,
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  assert(rawTokenCheck.includes('"cnt": 0'), 'Security check: Raw token is NEVER stored in D1');

  // 7. GET /api/admin/me without cookie -> 401
  const noCookieMeRes = await fetch(`${API_BASE}/api/admin/me`);
  assert(noCookieMeRes.status === 401, 'GET /api/admin/me without cookie returns HTTP 401');

  // 8. GET /api/admin/me with invalid/forged cookie -> 401
  const fakeCookieMeRes = await fetch(`${API_BASE}/api/admin/me`, {
    headers: { Cookie: 'giftagram_admin_session=invalid_tampered_token_1234567890abcdef' },
  });
  assert(fakeCookieMeRes.status === 401, 'GET /api/admin/me with forged cookie returns HTTP 401');

  // 9. GET /api/admin/me with expired session -> 401
  const expiredRawToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const expiredTokenHash = await hashSessionToken(expiredRawToken);
  const adminId = validLoginJson.data.user.id;
  execSync(
    `npx wrangler d1 execute DB --local --command "INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at) VALUES ('sess_expired_test', '${adminId}', '${expiredTokenHash}', datetime('now', '-1 day'));"`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' }
  );
  await waitForServer();

  const expiredMeRes = await fetch(`${API_BASE}/api/admin/me`, {
    headers: { Cookie: `giftagram_admin_session=${expiredRawToken}` },
  });
  assert(expiredMeRes.status === 401, 'GET /api/admin/me with expired session returns HTTP 401');

  // Clean up expired session test record
  execSync(
    `npx wrangler d1 execute DB --local --command "DELETE FROM admin_sessions WHERE id = 'sess_expired_test';"`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' }
  );
  await waitForServer();

  // 10. GET /api/admin/me with valid session cookie -> 200
  const validMeRes = await fetch(`${API_BASE}/api/admin/me`, {
    headers: { Cookie: `giftagram_admin_session=${rawToken}` },
  });
  assert(validMeRes.status === 200, 'GET /api/admin/me with valid session cookie returns HTTP 200');
  const validMeJson = (await validMeRes.json()) as any;
  assert(validMeJson.data?.user?.username === testUsername, 'GET /api/admin/me returns authenticated admin username');
  assert(validMeJson.data?.user?.fullName === 'Giftagram Atelier Admin', 'GET /api/admin/me returns authenticated admin fullName');
  assert(validMeJson.data?.user?.role === 'admin', 'GET /api/admin/me returns authenticated admin role');

  // 11. POST /api/admin/logout
  const logoutRes = await fetch(`${API_BASE}/api/admin/logout`, {
    method: 'POST',
    headers: { Cookie: `giftagram_admin_session=${rawToken}` },
  });
  assert(logoutRes.status === 200, 'POST /api/admin/logout returns HTTP 200');
  const logoutCookieHeader = logoutRes.headers.get('set-cookie') || '';
  assert(logoutCookieHeader.includes('giftagram_admin_session='), 'Logout Set-Cookie clears session cookie');
  assert(logoutCookieHeader.includes('Max-Age=0'), 'Logout cookie sets Max-Age=0');

  // 12. Verify session is revoked: GET /api/admin/me with old token -> 401
  const postLogoutMeRes = await fetch(`${API_BASE}/api/admin/me`, {
    headers: { Cookie: `giftagram_admin_session=${rawToken}` },
  });
  assert(postLogoutMeRes.status === 401, 'GET /api/admin/me with revoked session cookie returns HTTP 401');

  // 13. Verify session record deleted from D1
  const postLogoutDbCheck = execSync(
    `npx wrangler d1 execute DB --local --command "SELECT count(*) as count FROM admin_sessions WHERE token_hash = '${expectedTokenHash}';"`,
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  assert(postLogoutDbCheck.includes('"count": 0'), 'Session record was deleted from D1 on logout');

  // 14. Idempotent logout without cookie -> 200
  const repeatLogoutRes = await fetch(`${API_BASE}/api/admin/logout`, { method: 'POST' });
  assert(repeatLogoutRes.status === 200, 'Repeated logout without cookie succeeds gracefully');

  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('admin_auth.integration.test.ts')) {
  runAdminAuthIntegrationTests().then(({ passed, failed }) => {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  });
}
