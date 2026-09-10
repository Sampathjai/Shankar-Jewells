import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/reports/dashboard (Admin Dashboard Stats & Analytics)
router.get(
  '/dashboard',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'BILLING_STAFF', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales Stats
    const todayInvoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: today }, status: 'PAID' },
    });
    const monthInvoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: firstDayOfMonth }, status: 'PAID' },
    });

    const todaySales = todayInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const monthSales = monthInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    // Counts
    const totalOrders = await prisma.order.count();
    const totalProducts = await prisma.product.count({ where: { active: true } });
    const pendingCustom = await prisma.customRequest.count({
      where: { status: { in: ['NEW', 'REVIEWING', 'DESIGNING'] } },
    });

    // Inventory Stock Value
    const products = await prisma.product.findMany({ where: { active: true } });
    const stockStats = products.reduce(
      (acc, p) => {
        acc.totalUnits += p.stockQuantity;
        acc.totalNetWeight += p.netWeight * p.stockQuantity;
        if (p.stockQuantity <= p.lowStockThreshold) acc.lowStockCount += 1;
        return acc;
      },
      { totalUnits: 0, totalNetWeight: 0, lowStockCount: 0 }
    );

    // Recent Activity
    const recentOrders = await prisma.order.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentCustomRequests = await prisma.customRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.status(200).json({
      success: true,
      data: {
        todaySales: Math.round(todaySales),
        monthSales: Math.round(monthSales),
        totalOrders,
        totalProducts,
        pendingCustomRequests: pendingCustom,
        vaultStock: {
          totalUnits: stockStats.totalUnits,
          totalNetWeight: Math.round(stockStats.totalNetWeight * 100) / 100,
          lowStockAlerts: stockStats.lowStockCount,
        },
        recentOrders,
        recentCustomRequests,
      },
    });
  })
);

// GET /api/customers
router.get(
  '/customers',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const customers = await prisma.customer.findMany({
      include: { orders: { select: { orderNumber: true, grandTotal: true, createdAt: true } } },
      orderBy: { totalSpent: 'desc' },
    });
    res.status(200).json({ success: true, data: customers });
  })
);

// GET /api/audit-logs
router.get(
  '/audit-logs',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.status(200).json({ success: true, data: logs });
  })
);

// GET /api/settings
router.get(
  '/settings',
  catchAsync(async (req: Request, res: Response) => {
    const settings = await prisma.setting.findMany();
    const map: any = {};
    settings.forEach((s) => (map[s.key] = s.value));
    res.status(200).json({ success: true, data: map });
  })
);

export default router;

