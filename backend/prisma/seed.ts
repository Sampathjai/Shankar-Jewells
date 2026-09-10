import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Shanker Jewells...');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotationVersion.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.customRequestStatusHistory.deleteMany();
  await prisma.customRequestImage.deleteMany();
  await prisma.customRequest.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.return.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.metalRate.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.address.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users & Passwords
  const commonPassword = await bcrypt.hash('Admin@123456', 10);
  const custPassword = await bcrypt.hash('Customer@123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@shankerjewels.com',
      passwordHash: commonPassword,
      name: 'Shankar (Super Admin)',
      phone: '+919443949192',
      role: 'SUPER_ADMIN',
    },
  });

  // Seed aliases for shankarjewels spelling
  await prisma.user.create({
    data: {
      email: 'admin@shankarjewels.com',
      passwordHash: commonPassword,
      name: 'Shankar (Super Admin Alias)',
      phone: '+919443949192',
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@royaljewels.com',
      passwordHash: commonPassword,
      name: 'Shankar (Super Admin Royal Jewels Alias)',
      phone: '+919443949192',
      role: 'SUPER_ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@shankerjewels.com',
      passwordHash: commonPassword,
      name: 'Priya Sharma (Store Manager)',
      phone: '+919443949193',
      role: 'MANAGER',
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager@shankarjewels.com',
      passwordHash: commonPassword,
      name: 'Priya Sharma (Store Manager Alias)',
      phone: '+919443949193',
      role: 'MANAGER',
    },
  });

  const billingStaff = await prisma.user.create({
    data: {
      email: 'billing@shankerjewels.com',
      passwordHash: commonPassword,
      name: 'Amit Patel (Billing Desk)',
      phone: '+919443949194',
      role: 'BILLING_STAFF',
    },
  });

  await prisma.user.create({
    data: {
      email: 'billing@shankarjewels.com',
      passwordHash: commonPassword,
      name: 'Amit Patel (Billing Desk Alias)',
      phone: '+919443949194',
      role: 'BILLING_STAFF',
    },
  });

  const inventoryStaff = await prisma.user.create({
    data: {
      email: 'inventory@shankerjewels.com',
      passwordHash: commonPassword,
      name: 'Suresh Kumar (Vault Specialist)',
      phone: '+919443949195',
      role: 'INVENTORY_STAFF',
    },
  });

  await prisma.user.create({
    data: {
      email: 'inventory@shankarjewels.com',
      passwordHash: commonPassword,
      name: 'Suresh Kumar (Vault Specialist Alias)',
      phone: '+919443949195',
      role: 'INVENTORY_STAFF',
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: 'designer@shankerjewels.com',
      passwordHash: commonPassword,
      name: 'Ananya Roy (Custom Master Craftsman)',
      phone: '+919443949196',
      role: 'DESIGNER',
    },
  });

  await prisma.user.create({
    data: {
      email: 'designer@shankarjewels.com',
      passwordHash: commonPassword,
      name: 'Ananya Roy (Custom Master Craftsman Alias)',
      phone: '+919443949196',
      role: 'DESIGNER',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      passwordHash: custPassword,
      name: 'Sunita Mehta',
      phone: '+919988776655',
      role: 'CUSTOMER',
    },
  });

  console.log('✅ Users seeded');

  // Seed Customer Profile
  await prisma.customer.create({
    data: {
      userId: customerUser.id,
      name: customerUser.name,
      phone: customerUser.phone,
      email: customerUser.email,
      address: 'No.4 sandhukadai, bigbazzar street, trichy - 620008',
      gstin: '33AAAAA0000A1Z5',
      totalOrders: 1,
      totalSpent: 125000.0,
    },
  });

  // 2. Metal Rates Initialization (Standardized to Trichy market rates & per gram)
  const initialRates = [
    { metalType: 'GOLD', purity: 'K24', ratePerGram: 15431.0, source: 'TRICHY_BULLION_EXCHANGE' },
    { metalType: 'GOLD', purity: 'K22', ratePerGram: 14145.0, source: 'TRICHY_BULLION_EXCHANGE' },
    { metalType: 'GOLD', purity: '18K', ratePerGram: 11915.0, source: 'TRICHY_BULLION_EXCHANGE' },
    { metalType: 'GOLD', purity: '80', ratePerGram: 12345.0, source: 'TRICHY_BULLION_EXCHANGE' },
    { metalType: 'GOLD', purity: '70', ratePerGram: 10800.0, source: 'TRICHY_BULLION_EXCHANGE' },
    { metalType: 'SILVER', purity: 'SILVER_999', ratePerGram: 255.0, source: 'TRICHY_BULLION_EXCHANGE' },
    { metalType: 'SILVER', purity: 'SILVER_925', ratePerGram: 236.0, source: 'TRICHY_BULLION_EXCHANGE' },
  ];

  for (const rate of initialRates) {
    await prisma.metalRate.create({
      data: {
        ...rate,
        createdBy: admin.id,
      },
    });
  }
  console.log('✅ Metal rates seeded');

  // 3. Categories & Collections
  const catGold = await prisma.category.create({
    data: {
      name: 'Gold Jewellery',
      slug: 'gold-jewellery',
      metalType: 'GOLD',
      description: 'Handcrafted 22K, 18K, 80 & 70 gold ornaments for divine grace and elegance.',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800',
    },
  });

  const catSilver = await prisma.category.create({
    data: {
      name: 'Silver Ornaments',
      slug: 'silver-jewellery',
      metalType: 'SILVER',
      description: 'Chic, modern and traditional 925 sterling silver artisan pieces.',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800',
    },
  });

  const subRings = await prisma.subcategory.create({
    data: { name: 'Rings', slug: 'rings', categoryId: catGold.id, description: 'Gold & Diamond Solitaire, Band and Cocktail Rings' },
  });
  const subNecklaces = await prisma.subcategory.create({
    data: { name: 'Necklaces', slug: 'necklaces', categoryId: catGold.id, description: 'Chokers, Haram and Temple Gold Necklaces' },
  });
  const subEarrings = await prisma.subcategory.create({
    data: { name: 'Earrings', slug: 'earrings', categoryId: catGold.id, description: 'Jhumkas, Studs and Chandbalis' },
  });

  const colBridal = await prisma.collection.create({
    data: {
      name: 'Royal Heritage Bridal',
      slug: 'royal-heritage-bridal',
      description: 'Heavy Kundan, Antique Polki, and Temple Masterpieces for royal weddings.',
      bannerUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200',
    },
  });

  // 4. Products
  const productsData = [
    {
      sku: 'GLD-NCK-001',
      barcode: '8901000100101',
      name: 'Royal Mayura Kundan Gold Haram Necklace',
      slug: 'royal-mayura-kundan-gold-haram-necklace',
      description: 'Exquisite 22K yellow gold haram necklace with peacock handcrafted motifs, ruby drops, and BIS hallmark certification.',
      categoryId: catGold.id,
      subcategoryId: subNecklaces.id,
      collectionId: colBridal.id,
      metalType: 'GOLD',
      purity: 'K22',
      grossWeight: 42.50,
      netWeight: 38.20,
      stoneType: 'Ruby & Kundan',
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 450.0,
      wastageType: 'PERCENTAGE',
      wastageValue: 3.5,
      stoneCharge: 12500.0,
      certification: 'BIS 916 Hallmarked',
      featured: true,
      bestSeller: true,
      stockQuantity: 3,
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800',
    },
    {
      sku: 'GLD-RNG-002',
      barcode: '8901000100102',
      name: 'Solitaire Cushion Diamond Ring in 18K Gold',
      slug: 'solitaire-cushion-diamond-ring-in-18k-gold',
      description: 'Breathtaking 1.2 carat VVS1 EF cushion cut solitaire set in an 18K hallmarked white gold band.',
      categoryId: catGold.id,
      subcategoryId: subRings.id,
      metalType: 'GOLD',
      purity: 'K18',
      grossWeight: 4.80,
      netWeight: 4.56,
      stoneType: 'Diamond VVS1',
      makingChargeType: 'FIXED',
      makingChargeValue: 3500.0,
      wastageType: 'PERCENTAGE',
      wastageValue: 2.0,
      stoneCharge: 85000.0,
      certification: 'SGL Certified Diamond & BIS 750',
      featured: true,
      newArrival: true,
      stockQuantity: 5,
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800',
    },
    {
      sku: 'GLD-JHM-003',
      barcode: '8901000100103',
      name: 'Antique Lakshmi Temple Gold Jhumka Earrings',
      slug: 'antique-lakshmi-temple-gold-jhumka-earrings',
      description: 'Hand-carved Goddess Lakshmi motif 22K antique gold jhumkas adorned with pearl cluster droplets.',
      categoryId: catGold.id,
      subcategoryId: subEarrings.id,
      metalType: 'GOLD',
      purity: 'K22',
      grossWeight: 18.90,
      netWeight: 17.50,
      stoneType: 'Freshwater Pearls & Emeralds',
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 380.0,
      wastageType: 'PERCENTAGE',
      wastageValue: 4.0,
      stoneCharge: 4500.0,
      certification: 'BIS 916 Hallmarked',
      featured: true,
      bestSeller: true,
      stockQuantity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800',
    },
    {
      sku: 'SLV-ORN-004',
      barcode: '8901000100104',
      name: 'Traditional 925 Sterling Silver Payal Anklet',
      slug: 'traditional-925-sterling-silver-payal-anklet',
      description: 'Charming pair of traditional 925 sterling silver anklets with sweet jingling ghungroos.',
      categoryId: catSilver.id,
      metalType: 'SILVER',
      purity: 'SILVER_925',
      grossWeight: 45.00,
      netWeight: 45.00,
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 15.0,
      wastageType: 'PERCENTAGE',
      wastageValue: 2.0,
      stoneCharge: 0.0,
      certification: '925 Silver Stamped',
      featured: true,
      stockQuantity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800',
    },
  ];

  for (const item of productsData) {
    const prod = await prisma.product.create({
      data: {
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        slug: item.slug,
        description: item.description,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId,
        collectionId: item.collectionId,
        metalType: item.metalType,
        purity: item.purity,
        grossWeight: item.grossWeight,
        netWeight: item.netWeight,
        stoneType: item.stoneType,
        makingChargeType: item.makingChargeType,
        makingChargeValue: item.makingChargeValue,
        wastageType: item.wastageType,
        wastageValue: item.wastageValue,
        stoneCharge: item.stoneCharge,
        certification: item.certification,
        featured: item.featured || false,
        newArrival: item.newArrival || false,
        bestSeller: item.bestSeller || false,
        stockQuantity: item.stockQuantity,
      },
    });

    await prisma.productImage.create({
      data: {
        productId: prod.id,
        url: item.imageUrl,
        isPrimary: true,
        sortOrder: 0,
      },
    });

    await prisma.stockTransaction.create({
      data: {
        productId: prod.id,
        transactionType: 'PURCHASE',
        quantity: item.stockQuantity,
        grossWeight: item.grossWeight * item.stockQuantity,
        netWeight: item.netWeight * item.stockQuantity,
        previousQuantity: 0,
        newQuantity: item.stockQuantity,
        previousWeight: 0.0,
        newWeight: item.netWeight * item.stockQuantity,
        referenceType: 'INITIAL_SEED',
        notes: 'Initial inventory seeding for vault launch',
      },
    });
  }

  // 5. System Settings Seed for Shanker Jewells Trichy
  const settings = [
    { key: 'BUSINESS_NAME', value: 'Shanker Jewells', group: 'GENERAL', description: 'Legal Business Name' },
    { key: 'BUSINESS_ADDRESS', value: 'No.4 sandhukadai, bigbazzar street, trichy - 620008', group: 'GENERAL', description: 'Registered Store Address' },
    { key: 'BUSINESS_PHONE', value: '+91 9443949192', group: 'GENERAL', description: 'Store Contact Phone' },
    { key: 'BUSINESS_EMAIL', value: 'contact@shankarjewels.com', group: 'GENERAL', description: 'Store Support Email' },
    { key: 'BUSINESS_LOCATION', value: 'Trichy', group: 'GENERAL', description: 'Primary Metal Rate Location' },
    { key: 'BUSINESS_STATE', value: 'Tamil Nadu', group: 'GENERAL', description: 'State' },
    { key: 'BUSINESS_COUNTRY', value: 'India', group: 'GENERAL', description: 'Country' },
    { key: 'BUSINESS_GSTIN', value: '33AAAAA0000A1Z5', group: 'GENERAL', description: 'GST Identification Number' },
    { key: 'WHATSAPP_NUMBER', value: '919443949192', group: 'BUSINESS', description: 'Official WhatsApp Business Number' },
    { key: 'DEFAULT_GST_RATE', value: '3.0', group: 'PRICING', description: 'Default GST percentage for gold jewellery' },
    { key: 'INVOICE_PREFIX', value: 'INV-2026-', group: 'BUSINESS', description: 'Invoice serial numbering prefix' },
    { key: 'QUOTATION_PREFIX', value: 'QT-', group: 'BUSINESS', description: 'Quotation serial numbering prefix' },
  ];

  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }

  console.log('✅ System settings seeded for Shanker Jewells Trichy');
  console.log('🎉 DB SEED COMPLETE!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
