import { Router, Request, Response } from 'express';
import { PricingService } from './pricing.service.js';
import { catchAsync } from '../../utils/errors.js';

const router = Router();

// POST /api/pricing/calculate
router.post(
  '/calculate',
  catchAsync(async (req: Request, res: Response) => {
    const body = req.body || {};
    const input = {
      metalType: body.metalType || body.metal || 'GOLD',
      purity: body.purity || 'K22',
      grossWeight: Number(body.grossWeight ?? body.weightGrams) || 0,
      netWeight: Number(body.netWeight ?? body.weightGrams) || 0,
      makingChargeType: body.makingChargeType || 'PER_GRAM',
      makingChargeValue: Number(body.makingChargeValue ?? body.makingCharge) || 0,
      wastageType: body.wastageType || 'PERCENTAGE',
      wastageValue: Number(body.wastageValue ?? body.wastagePercent) || 0,
      stoneCharge: Number(body.stoneCharge ?? body.stoneValue) || 0,
      otherCharges: Number(body.otherCharges) || 0,
      discount: Number(body.discount) || 0,
      gstRate: body.gstRate !== undefined ? Number(body.gstRate) : 3.0,
      overrideMetalRate: body.overrideMetalRate ? Number(body.overrideMetalRate) : undefined,
    };

    const calculation = await PricingService.calculateItemPrice(input);
    res.status(200).json({
      success: true,
      calculation,
      data: calculation,
    });
  })
);

export default router;

