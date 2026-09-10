import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

export async function getActive24KGoldRate(): Promise<number> {
  const rateRecord = await prisma.metalRate.findFirst({
    where: {
      metalType: 'GOLD',
      purity: { in: ['K24', '24K', '999'] },
      effectiveTo: null,
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return rateRecord ? rateRecord.ratePerGram : 6830;
}

// GET /api/metal-rates/current
router.get(
  '/current',
  catchAsync(async (req: Request, res: Response) => {
    const rates = await prisma.metalRate.findMany({
      where: { effectiveTo: null, active: true },
      orderBy: { createdAt: 'desc' },
    });

    const getRateVal = (metal: string, purities: string[], fallback: number) => {
      const match = rates.find((r) => r.metalType === metal && purities.includes(r.purity));
      return match ? match.ratePerGram : fallback;
    };

    const structuredRates = {
      gold24k: { rate: getRateVal('GOLD', ['K24', '24K', '999'], 15431), purity: '24K', metal: 'Gold' },
      gold22k: { rate: getRateVal('GOLD', ['K22', '22K', '916'], 14145), purity: '22K', metal: 'Gold' },
      gold18k: { rate: getRateVal('GOLD', ['K18', '18K', '750'], 11915), purity: '18K', metal: 'Gold' },
      silver999: { rate: getRateVal('SILVER', ['SILVER_999', '999'], 255), purity: '999', metal: 'Silver' },
    };

    res.status(200).json({
      success: true,
      location: 'Trichy',
      currency: 'INR',
      unit: 'GRAM',
      rates: structuredRates,
      data: rates,
      updatedAt: rates[0]?.createdAt || new Date(),
      source: rates[0]?.source || 'TRICHY_BULLION_EXCHANGE',
    });
  })
);

// GET /api/metal-rates/history
router.get(
  '/history',
  catchAsync(async (req: Request, res: Response) => {
    const { metalType, purity, limit = 100 } = req.query;

    const whereClause: any = {};
    if (metalType) whereClause.metalType = metalType as string;
    if (purity) whereClause.purity = purity as string;

    const history = await prisma.metalRate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10) || 100,
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  })
);

// POST /api/metal-rates (Admin update rate - Never overwrites, creates new historical record!)
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'STORE_MANAGER', 'MANAGER', 'WHOLESALE_MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      metalType,
      purity,
      ratePerGram: rawRate,
      effectiveDate,
      effectiveTime,
      source = 'Manual Store Rate',
      notes,
    } = req.body;

    const parsedRate = parseFloat(rawRate);
    if (!metalType || !purity || isNaN(parsedRate) || parsedRate <= 0) {
      throw new AppError('Rate per gram must be a valid positive number greater than zero.', 400);
    }

    const now = new Date();

    // 1. Archive prior active rate for this metal/purity
    await prisma.metalRate.updateMany({
      where: { metalType, purity, effectiveTo: null, active: true },
      data: { effectiveTo: now, active: false },
    });

    // 2. Insert new historical rate record
    const newRate = await prisma.metalRate.create({
      data: {
        metalType,
        purity,
        ratePerGram: parsedRate,
        currency: 'INR',
        effectiveFrom: effectiveDate ? new Date(effectiveDate) : now,
        effectiveTime: effectiveTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        source: source || 'Manual Store Rate',
        notes: notes || null,
        active: true,
        createdBy: req.user?.name || req.user?.email || 'Admin',
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'UPDATE_METAL_RATE',
      entity: 'MetalRate',
      entityId: newRate.id,
      newValue: JSON.stringify({ metalType, purity, ratePerGram: parsedRate, effectiveTime, source, notes }),
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: newRate,
      message: `Successfully updated ${metalType} ${purity} rate to ₹${parsedRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g`,
    });
  })
);

export default router;
