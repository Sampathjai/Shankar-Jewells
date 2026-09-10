import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from '../src/utils/jwt.js';
import { PricingService } from '../src/modules/pricing/pricing.service.js';

async function runTests() {
  console.log('🧪 Starting Shanker Jewells Automated Regression & Integration Tests...\n');
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

  try {
    // 1. AUTH TESTS
    console.log('--- 1. Auth Module Tests ---');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@shankerjewels.com' } });
    assert(adminUser !== null, 'Admin user admin@shankerjewels.com exists in database');
    assert(adminUser?.role === 'SUPER_ADMIN', 'Admin user has SUPER_ADMIN role');

    if (adminUser) {
      const passValid = await bcrypt.compare('Admin@123456', adminUser.passwordHash);
      assert(passValid, 'Bcrypt password check succeeds for Admin@123456');

      const passInvalid = await bcrypt.compare('WrongPassword', adminUser.passwordHash);
      assert(!passInvalid, 'Bcrypt password check fails for invalid password');

      const token = signToken({ userId: adminUser.id, email: adminUser.email, role: adminUser.role });
      assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');

      const decoded = verifyToken(token);
      assert(decoded.userId === adminUser.id && decoded.role === 'SUPER_ADMIN', 'JWT token decoded and verified');
    }

    // 2. METAL RATES MAPPING TESTS
    console.log('\n--- 2. Metal Rates Mapping & Rate Lookup Tests ---');
    const rate24K = await PricingService.getCurrentMetalRate('GOLD', 'K24');
    assert(rate24K === 15431, `24K Gold rate lookup returned Trichy benchmark ₹15,431/g (Actual: ₹${rate24K})`);

    const rate22K = await PricingService.getCurrentMetalRate('GOLD', 'K22');
    assert(rate22K === 14145, `22K Gold rate lookup returned Trichy benchmark ₹14,145/g (Actual: ₹${rate22K})`);

    const rate18K = await PricingService.getCurrentMetalRate('GOLD', 'K18');
    assert(rate18K === 11915, `18K Gold rate lookup returned Trichy benchmark ₹11,915/g (Actual: ₹${rate18K})`);

    const rateSilver = await PricingService.getCurrentMetalRate('SILVER', 'SILVER_999');
    assert(rateSilver === 255, `Silver 999 rate lookup returned Trichy benchmark ₹255/g (Actual: ₹${rateSilver})`);

    // 3. CALCULATOR PRICING ENGINE TESTS
    console.log('\n--- 3. Calculator Pricing Engine Tests ---');

    // Test Gold 22K Calculation
    const calcGold22 = await PricingService.calculateItemPrice({
      metalType: 'GOLD',
      purity: 'K22',
      grossWeight: 10,
      netWeight: 10,
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 400,
      wastageType: 'PERCENTAGE',
      wastageValue: 3.5,
      stoneCharge: 0,
      gstRate: 3.0,
    });

    assert(calcGold22.metalRate === 14145, `Gold 22K metal rate is ₹14,145/g`);
    assert(calcGold22.rawMetalValue === 141450, `Gold 22K 10g metal value is ₹1,41,450`);
    assert(calcGold22.wastageGrams === 0.35, `Gold 22K 3.5% wastage is 0.35g`);
    assert(calcGold22.makingCharges === 4000, `Gold 22K making charge at ₹400/g for 10g is ₹4,000`);
    assert(calcGold22.gstAmount === 4512.02, `3% GST amount calculated correctly (₹4,512.02)`);
    assert(calcGold22.finalPrice === 154912.77, `Final total price matches expected ₹1,54,912.77`);

    // Test Silver 999 Calculation
    const calcSilver = await PricingService.calculateItemPrice({
      metalType: 'SILVER',
      purity: 'SILVER_999',
      grossWeight: 10,
      netWeight: 10,
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 15,
      wastageType: 'PERCENTAGE',
      wastageValue: 2.0,
      stoneCharge: 0,
      gstRate: 3.0,
    });

    assert(calcSilver.metalRate === 255, `Silver 999 rate is ₹255/g`);
    assert(calcSilver.rawMetalValue === 2550, `Silver 999 10g metal value is ₹2,550`);
    assert(calcSilver.makingCharges === 150, `Silver making charges for 10g @ ₹15/g is ₹150`);
    assert(calcSilver.finalPrice > 2550, `Silver total calculation completed successfully (₹${calcSilver.finalPrice})`);

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Error running automated tests:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

