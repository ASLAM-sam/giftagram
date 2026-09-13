import { passwordService } from '../src/services/passwordService';
import { generateRawSessionToken, hashSessionToken } from '../src/services/sessionService';
import { parseCookies, serializeCookie, createAdminSessionCookie, createAdminClearCookie, ADMIN_SESSION_COOKIE_NAME } from '../src/utils/cookie';

export async function runAuthUnitTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- RUNNING ADMIN AUTHENTICATION UNIT TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Password Service Tests
  const password = 'TestLuxuryAdminSecret123!';
  const hash1 = await passwordService.hashPassword(password);
  const hash2 = await passwordService.hashPassword(password);

  assert(typeof hash1 === 'string' && hash1.startsWith('pbkdf2$sha256$100000$'), 'PBKDF2 hash matches modular format pbkdf2$sha256$100000$');
  assert(hash1 !== hash2, 'Unique cryptographically random salt generates distinct hashes for identical passwords');

  const verifyCorrect = await passwordService.verifyPassword(password, hash1);
  assert(verifyCorrect === true, 'verifyPassword returns true for correct password');

  const verifyWrong = await passwordService.verifyPassword('WrongPassword456!', hash1);
  assert(verifyWrong === false, 'verifyPassword returns false for wrong password');

  const verifyEmpty = await passwordService.verifyPassword('', hash1);
  assert(verifyEmpty === false, 'verifyPassword returns false for empty password without throwing');

  const verifyMalformed1 = await passwordService.verifyPassword(password, 'invalid_hash_string');
  assert(verifyMalformed1 === false, 'verifyPassword returns false for malformed hash without throwing');

  const verifyMalformed2 = await passwordService.verifyPassword(password, 'pbkdf2$sha256$notanumber$abcd$ef01');
  assert(verifyMalformed2 === false, 'verifyPassword returns false for non-numeric iterations');

  const verifyMalformed3 = await passwordService.verifyPassword(password, 'sha256$plain$1000$salt$hash');
  assert(verifyMalformed3 === false, 'verifyPassword returns false for unsupported algorithm scheme');

  // 2. Session Token Tests
  const token1 = generateRawSessionToken();
  const token2 = generateRawSessionToken();

  assert(typeof token1 === 'string' && token1.length === 64, 'Raw session token is 64 hex characters (32 bytes entropy)');
  assert(token1 !== token2, 'Generated session tokens are cryptographically unique');

  const tokenHash1a = await hashSessionToken(token1);
  const tokenHash1b = await hashSessionToken(token1);
  const tokenHash2 = await hashSessionToken(token2);

  assert(typeof tokenHash1a === 'string' && tokenHash1a.length === 64, 'Token hash is 64 hex characters (SHA-256)');
  assert(tokenHash1a === tokenHash1b, 'Token SHA-256 hash is deterministic');
  assert(tokenHash1a !== tokenHash2, 'Distinct tokens yield distinct token hashes');

  // 3. Cookie Utility Tests
  const mockReq1 = new Request('http://localhost:8787', {
    headers: { 'Cookie': `${ADMIN_SESSION_COOKIE_NAME}=${token1}; other_cookie=hello%20world` }
  });
  const cookies1 = parseCookies(mockReq1);
  assert(cookies1[ADMIN_SESSION_COOKIE_NAME] === token1, 'parseCookies extracts session cookie');
  assert(cookies1['other_cookie'] === 'hello world', 'parseCookies decodes URI component values');

  const mockReqEmpty = new Request('http://localhost:8787');
  const cookiesEmpty = parseCookies(mockReqEmpty);
  assert(Object.keys(cookiesEmpty).length === 0, 'parseCookies handles missing Cookie header gracefully');

  const loginCookieHeader = createAdminSessionCookie(token1, true);
  assert(loginCookieHeader.includes(`${ADMIN_SESSION_COOKIE_NAME}=${token1}`), 'Set-Cookie contains cookie name and token');
  assert(loginCookieHeader.includes('HttpOnly'), 'Set-Cookie includes HttpOnly');
  assert(loginCookieHeader.includes('Secure'), 'Set-Cookie includes Secure when isSecure is true');
  assert(loginCookieHeader.includes('SameSite=Lax'), 'Set-Cookie includes SameSite=Lax');
  assert(loginCookieHeader.includes('Path=/'), 'Set-Cookie includes Path=/');
  assert(loginCookieHeader.includes('Max-Age=604800'), 'Set-Cookie includes Max-Age=604800 (7 days)');

  const clearCookieHeader = createAdminClearCookie(false);
  assert(clearCookieHeader.includes(`${ADMIN_SESSION_COOKIE_NAME}=`), 'Clear cookie sets empty value');
  assert(clearCookieHeader.includes('Max-Age=0'), 'Clear cookie sets Max-Age=0');
  assert(!clearCookieHeader.includes('Secure'), 'Clear cookie omits Secure when isSecure is false');

  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('auth.unit.test.ts')) {
  runAuthUnitTests().then(({ passed, failed }) => {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  });
}
