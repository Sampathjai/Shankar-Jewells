import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { PricingService } from '../pricing/pricing.service.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// GET /api/products (Public Catalogue with Search, Filter & Live Pricing Attachment)
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const {
      search,
      category,
      subcategory,
      collection,
      metalType,
      purity,
      featured,
      newArrival,
      bestSeller,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { active: true };

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { description: { contains: q } },
        { stoneType: { contains: q } },
      ];
    }

    if (category) {
      where.category = { slug: category as string };
    }
    if (subcategory) {
      where.subcategory = { slug: subcategory as string };
    }
    if (collection) {
      where.collection = { slug: collection as string };
    }
    if (metalType) where.metalType = metalType as string;
    if (purity) where.purity = purity as string;
    if (featured === 'true') where.featured = true;
    if (newArrival === 'true') where.newArrival = true;
    if (bestSeller === 'true') where.bestSeller = true;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price-low') orderBy = { sellingPrice: 'asc' };
    if (sortBy === 'price-high') orderBy = { sellingPrice: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const total = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        collection: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy,
      skip,
      take: limitNum,
    });

    // Attach dynamically calculated current metal pricing to every product
    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        let calculatedPricing = null;
        if (prod.pricingMode === 'METAL_RATE_BASED') {
          calculatedPricing = await PricingService.calculateItemPrice({
            metalType: prod.metalType,
            purity: prod.purity,
            grossWeight: prod.grossWeight,
            netWeight: prod.netWeight,
            makingChargeType: prod.makingChargeType,
            makingChargeValue: prod.makingChargeValue,
            wastageType: prod.wastageType,
            wastageValue: prod.wastageValue,
            stoneCharge: prod.stoneCharge,
            otherCharges: prod.otherCharges,
            gstRate: prod.gstRate,
          });
        }
        return {
          ...prod,
          calculatedPricing,
          displayPrice: calculatedPricing
            ? calculatedPricing.finalPrice
            : prod.sellingPrice,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: enrichedProducts,
    });
  })
);

// GET /api/products/:slug
router.get(
  '/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }, { sku: slug }, { barcode: slug }],
      },
      include: {
        category: true,
        subcategory: true,
        collection: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const calculatedPricing = await PricingService.calculateItemPrice({
      metalType: product.metalType,
      purity: product.purity,
      grossWeight: product.grossWeight,
      netWeight: product.netWeight,
      makingChargeType: product.makingChargeType,
      makingChargeValue: product.makingChargeValue,
      wastageType: product.wastageType,
      wastageValue: product.wastageValue,
      stoneCharge: product.stoneCharge,
      otherCharges: product.otherCharges,
      gstRate: product.gstRate,
    });

    res.status(200).json({
      success: true,
      data: {
        ...product,
        calculatedPricing,
        displayPrice: calculatedPricing.finalPrice,
      },
    });
  })
);

// POST /api/products (Admin Create Product)
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      subcategoryId,
      collectionId,
      metalType,
      purity,
      grossWeight,
      netWeight,
      stoneType,
      stoneWeight,
      diamondWeight,
      diamondQuality,
      makingChargeType,
      makingChargeValue,
      wastageType,
      wastageValue,
      stoneCharge,
      otherCharges,
      gstRate = 3.0,
      stockQuantity = 1,
      certification,
      hallmark = true,
      images = [],
    } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const product = await prisma.product.create({
      data: {
        sku: sku || `SKU-${Date.now()}`,
        barcode: barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
        name,
        slug,
        description,
        categoryId,
        subcategoryId: subcategoryId || null,
        collectionId: collectionId || null,
        metalType,
        purity,
        grossWeight: parseFloat(grossWeight),
        netWeight: parseFloat(netWeight),
        stoneType,
        stoneWeight: stoneWeight ? parseFloat(stoneWeight) : 0,
        diamondWeight: diamondWeight ? parseFloat(diamondWeight) : 0,
        diamondQuality,
        makingChargeType: makingChargeType || 'PER_GRAM',
        makingChargeValue: parseFloat(makingChargeValue || 0),
        wastageType: wastageType || 'PERCENTAGE',
        wastageValue: parseFloat(wastageValue || 0),
        stoneCharge: parseFloat(stoneCharge || 0),
        otherCharges: parseFloat(otherCharges || 0),
        gstRate: parseFloat(gstRate),
        stockQuantity: parseInt(stockQuantity, 10),
        certification,
        hallmark,
        images: {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        },
      },
      include: { images: true },
    });

    // Record initial inventory transaction
    await prisma.stockTransaction.create({
      data: {
        productId: product.id,
        transactionType: 'PURCHASE',
        quantity: product.stockQuantity,
        grossWeight: product.grossWeight * product.stockQuantity,
        netWeight: product.netWeight * product.stockQuantity,
        previousQuantity: 0,
        newQuantity: product.stockQuantity,
        previousWeight: 0,
        newWeight: product.netWeight * product.stockQuantity,
        referenceType: 'MANUAL_ENTRY',
        userId: req.user?.id,
        notes: 'Product creation vault stock initialization',
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      newValue: { name, sku, metalType, grossWeight, netWeight },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  })
);

// PATCH /api/products/:id (Admin Update Product)
router.patch(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('Product not found.', 404);

    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.subcategoryId !== undefined) updateData.subcategoryId = body.subcategoryId || null;
    if (body.metalType !== undefined) updateData.metalType = body.metalType;
    if (body.purity !== undefined) updateData.purity = body.purity;
    if (body.grossWeight !== undefined) updateData.grossWeight = parseFloat(body.grossWeight);
    if (body.netWeight !== undefined) updateData.netWeight = parseFloat(body.netWeight);
    if (body.makingChargeType !== undefined) updateData.makingChargeType = body.makingChargeType;
    if (body.makingChargeValue !== undefined) updateData.makingChargeValue = parseFloat(body.makingChargeValue);
    if (body.wastageType !== undefined) updateData.wastageType = body.wastageType;
    if (body.wastageValue !== undefined) updateData.wastageValue = parseFloat(body.wastageValue);
    if (body.stoneCharge !== undefined) updateData.stoneCharge = parseFloat(body.stoneCharge);
    if (body.otherCharges !== undefined) updateData.otherCharges = parseFloat(body.otherCharges);
    if (body.stockQuantity !== undefined) updateData.stockQuantity = parseInt(body.stockQuantity, 10);
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true, category: true },
    });

    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: body.images.map((img: any, idx: number) => ({
          productId: id,
          url: typeof img === 'string' ? img : img.url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      });
    }

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  })
);

// DELETE /api/products/:id (Deactivate or delete product)
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('Product not found.', 404);

    // Soft delete by deactivating so historical invoices/orders stay intact
    const deactivated = await prisma.product.update({
      where: { id },
      data: { active: false, stockQuantity: 0 },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'DEACTIVATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Product ${existing.sku} deactivated successfully.`,
      data: deactivated,
    });
  })
);

export default router;

