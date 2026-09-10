import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { PricingService } from '../pricing/pricing.service.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// GET /api/inventory (List stock with weights, valuations & alerts)
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF', 'BILLING_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalUnits = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let goldStockValue = 0;
    let silverStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const enrichedProducts = await Promise.all(
      products.map(async (p) => {
        totalUnits += p.stockQuantity;
        totalGrossWeight += p.grossWeight * p.stockQuantity;
        totalNetWeight += p.netWeight * p.stockQuantity;

        if (p.stockQuantity === 0) {
          outOfStockCount += 1;
        } else if (p.stockQuantity <= p.lowStockThreshold) {
          lowStockCount += 1;
        }

        let calculatedPricing = null;
        if (p.pricingMode === 'METAL_RATE_BASED') {
          calculatedPricing = await PricingService.calculateItemPrice({
            metalType: p.metalType,
            purity: p.purity,
            grossWeight: p.grossWeight,
            netWeight: p.netWeight,
            makingChargeType: p.makingChargeType,
            makingChargeValue: p.makingChargeValue,
            wastageType: p.wastageType,
            wastageValue: p.wastageValue,
            stoneCharge: p.stoneCharge,
            otherCharges: p.otherCharges,
            gstRate: p.gstRate,
          });
        }

        const estPrice = calculatedPricing ? calculatedPricing.finalPrice : p.sellingPrice;
        const totalVal = estPrice * p.stockQuantity;

        if (p.metalType === 'GOLD') {
          goldStockValue += totalVal;
        } else {
          silverStockValue += totalVal;
        }

        return {
          ...p,
          calculatedPricing,
          displayPrice: estPrice,
          totalInventoryValue: totalVal,
        };
      })
    );

    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalUnits,
        totalGrossWeight: Math.round(totalGrossWeight * 100) / 100,
        totalNetWeight: Math.round(totalNetWeight * 100) / 100,
        goldStockValue: Math.round(goldStockValue),
        silverStockValue: Math.round(silverStockValue),
        totalInventoryValue: Math.round(goldStockValue + silverStockValue),
        lowStockCount,
        outOfStockCount,
      },
      data: enrichedProducts,
    });
  })
);

// GET /api/inventory/transactions (Audit log of all stock weight & unit movements)
router.get(
  '/transactions',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const transactions = await prisma.stockTransaction.findMany({
      include: {
        product: { select: { name: true, sku: true, metalType: true, purity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  })
);

// POST /api/inventory/adjust (Manual inventory adjustment with audit record)
router.post(
  '/adjust',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { productId, transactionType, quantityDelta, notes } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found.', 404);

    const delta = parseInt(quantityDelta, 10);
    const newQuantity = product.stockQuantity + delta;
    if (newQuantity < 0) throw new AppError('Cannot adjust stock to negative quantity.', 400);

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
    });

    await prisma.stockTransaction.create({
      data: {
        productId,
        transactionType: transactionType || (delta > 0 ? 'ADJUSTMENT' : 'DAMAGE'),
        quantity: Math.abs(delta),
        grossWeight: product.grossWeight * Math.abs(delta),
        netWeight: product.netWeight * Math.abs(delta),
        previousQuantity: product.stockQuantity,
        newQuantity,
        previousWeight: product.netWeight * product.stockQuantity,
        newWeight: product.netWeight * newQuantity,
        referenceType: 'MANUAL_ADJUSTMENT',
        userId: req.user?.id,
        notes: notes || 'Manual inventory adjustment',
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product',
      entityId: productId,
      oldValue: { stockQuantity: product.stockQuantity },
      newValue: { stockQuantity: newQuantity, notes },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: `Stock updated for ${product.sku}. New Quantity: ${newQuantity}`,
    });
  })
);

// GET & POST Suppliers
router.get(
  '/suppliers',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const suppliers = await prisma.supplier.findMany({
      include: { purchases: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: suppliers });
  })
);

router.post(
  '/suppliers',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.status(201).json({ success: true, data: supplier });
  })
);

// GET & POST Purchases
router.get(
  '/purchases',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: purchases });
  })
);

export default router;

