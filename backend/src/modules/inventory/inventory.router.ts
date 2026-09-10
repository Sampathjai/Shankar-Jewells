import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// GET /api/inventory (List stock with weights & low stock alerts)
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF', 'BILLING_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true } },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    const stockSummary = products.reduce(
      (acc, p) => {
        acc.totalUnits += p.stockQuantity;
        acc.totalGrossWeight += p.grossWeight * p.stockQuantity;
        acc.totalNetWeight += p.netWeight * p.stockQuantity;
        if (p.stockQuantity <= p.lowStockThreshold) acc.lowStockCount += 1;
        return acc;
      },
      { totalUnits: 0, totalGrossWeight: 0, totalNetWeight: 0, lowStockCount: 0 }
    );

    res.status(200).json({
      success: true,
      summary: {
        totalUnits: stockSummary.totalUnits,
        totalGrossWeight: Math.round(stockSummary.totalGrossWeight * 100) / 100,
        totalNetWeight: Math.round(stockSummary.totalNetWeight * 100) / 100,
        lowStockCount: stockSummary.lowStockCount,
      },
      data: products,
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

