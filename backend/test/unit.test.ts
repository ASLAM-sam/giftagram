import { validateCreateOrderInput } from '../src/validators/orderValidator';
import { createHmacSha256, timingSafeEqual } from '../src/utils/crypto';
import { generateOrderNumber, generateId } from '../src/utils/ids';
import { runAuthUnitTests } from './auth.unit.test';

async function runUnitTests() {
  console.log('--- RUNNING GIFTAGRAM BACKEND UNIT TESTS ---');
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

  // 1. Crypto & HMAC tests
  const secret = 'rzp_test_secret_987654';
  const data = 'order_test_123|pay_test_456';
  const sig1 = await createHmacSha256(secret, data);
  const sig2 = await createHmacSha256(secret, data);
  const sig3 = await createHmacSha256('wrong_secret', data);

  assert(typeof sig1 === 'string' && sig1.length === 64, 'HMAC SHA-256 outputs 64-char hex string');
  assert(sig1 === sig2, 'HMAC SHA-256 is deterministic');
  assert(timingSafeEqual(sig1, sig2), 'timingSafeEqual returns true for identical signatures');
  assert(!timingSafeEqual(sig1, sig3), 'timingSafeEqual returns false for invalid signatures');

  // 2. Order Number generator tests
  const orderNum1 = generateOrderNumber();
  const orderNum2 = generateOrderNumber();
  assert(orderNum1.startsWith('GFT-'), 'Order number starts with GFT-');
  assert(orderNum1 !== orderNum2, 'Order numbers are unique');
  assert(/^GFT-\d{8}-[A-Z0-9]{4}$/.test(orderNum1), `Order number matches pattern GFT-YYYYMMDD-XXXX: ${orderNum1}`);

  // 3. Validation: Reject empty customer
  const vEmptyCust = validateCreateOrderInput({
    customer: {},
    items: [{ productId: 'cake-belgium', quantity: 1 }],
    pickupDate: '2026-09-15',
    pickupTime: '14:00',
  });
  assert(!vEmptyCust.valid, 'Validator rejects empty customer name/phone');

  // 4. Validation: Reject invalid phone (<10 digits)
  const vBadPhone = validateCreateOrderInput({
    customer: { name: 'Alisha', phone: '123' },
    items: [{ productId: 'cake-belgium', quantity: 1 }],
    pickupDate: '2026-09-15',
    pickupTime: '14:00',
  });
  assert(!vBadPhone.valid, 'Validator rejects phone numbers shorter than 10 digits');

  // 5. Validation: Reject negative/zero quantity
  const vBadQty = validateCreateOrderInput({
    customer: { name: 'Alisha', phone: '8141376677' },
    items: [{ productId: 'cake-belgium', quantity: 0 }],
    pickupDate: '2026-09-15',
    pickupTime: '14:00',
  });
  assert(!vBadQty.valid, 'Validator rejects quantity = 0');

  // 6. Validation: Reject cake without deposit acknowledgement
  const vNoDepositAck = validateCreateOrderInput({
    customer: { name: 'Alisha', phone: '8141376677' },
    pickupDate: '2026-09-15',
    pickupTime: '14:00',
    items: [
      {
        productId: 'cake-belgium',
        quantity: 1,
        cakeCustomization: {
          designRequirements: 'Vintage Lambeth piping',
          depositAcknowledged: false, // Rejected!
        },
      },
    ],
  });
  assert(!vNoDepositAck.valid, 'Validator rejects cake order without deposit acknowledgement');

  // 7. Validation: Valid cake order accepted
  const vGoodOrder = validateCreateOrderInput({
    customer: { name: 'Alisha Sharma', phone: '8141376677', email: 'alisha@example.com' },
    pickupDate: '2026-09-16',
    pickupTime: '14:00',
    items: [
      {
        productId: 'cake-royal-chocolate',
        quantity: 1,
        cakeCustomization: {
          fullName: 'Alisha Sharma',
          phone: '8141376677',
          pickupDate: '2026-09-16',
          pickupTime: '14:00',
          designRequirements: 'Gold leaf and chocolate pearls',
          depositAcknowledged: true,
        },
      },
    ],
  });
  assert(vGoodOrder.valid && vGoodOrder.data !== undefined, 'Validator accepts properly configured order');

  const authResults = await runAuthUnitTests();
  passed += authResults.passed;
  failed += authResults.failed;

  console.log(`\nOverall Unit Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runUnitTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
