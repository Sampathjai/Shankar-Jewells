import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { PricingService } from '../pricing/pricing.service.js';
import { PdfService } from '../../services/pdf.service.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// GET /api/quotations (Admin list quotations)
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'DESIGNER', 'BILLING_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const quotations = await prisma.quotation.findMany({
      include: {
        customRequest: { select: { requestNumber: true, name: true, phone: true, jewelleryType: true } },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: quotations,
    });
  })
);

// GET /api/quotations/token/:token (Public customer quotation portal view)
router.get(
  '/token/:token',
  catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { secureToken: token },
      include: {
        customRequest: {
          include: { images: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: { items: true },
        },
      },
    });

    if (!quotation) {
      throw new AppError('Quotation link invalid or expired.', 404);
    }

    const latestVersion = quotation.versions[0];

    res.status(200).json({
      success: true,
      data: {
        quotationNumber: quotation.quotationNumber,
        status: quotation.status,
        validUntil: quotation.validUntil,
        customRequest: quotation.customRequest,
        latestVersion,
        allVersionsCount: quotation.versions.length,
      },
    });
  })
);

// POST /api/quotations (Admin Create initial quotation or new version)
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'DESIGNER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      customRequestId,
      customerId,
      metalType = 'GOLD',
      purity = 'K22',
      grossWeight,
      netWeight,
      wastage = 3.5,
      makingCharges,
      stoneCharges = 0,
      otherCharges = 0,
      discount = 0,
      terms,
      notes,
      validDays = 7,
    } = req.body;

    if (!grossWeight || !netWeight || makingCharges === undefined) {
      throw new AppError('Gross weight, net weight, and making charges are required.', 400);
    }

    // 1. Calculate pricing through backend pricing engine
    const pricing = await PricingService.calculateItemPrice({
      metalType,
      purity,
      grossWeight: parseFloat(grossWeight),
      netWeight: parseFloat(netWeight),
      makingChargeType: 'FIXED',
      makingChargeValue: parseFloat(makingCharges),
      wastageType: 'PERCENTAGE',
      wastageValue: parseFloat(wastage),
      stoneCharge: parseFloat(stoneCharges),
      otherCharges: parseFloat(otherCharges),
      discount: parseFloat(discount),
      gstRate: 3.0,
    });

    let quotation = null;
    let versionNumber = 1;

    // Check if quotation already exists for custom request
    if (customRequestId) {
      quotation = await prisma.quotation.findFirst({
        where: { customRequestId },
        include: { versions: true },
      });
    }

    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    if (!quotation) {
      const count = await prisma.quotation.count();
      const quotationNumber = `QT-${String(count + 1).padStart(6, '0')}`;

      quotation = await prisma.quotation.create({
        data: {
          quotationNumber,
          customRequestId: customRequestId || null,
          customerId: customerId || null,
          status: 'SENT',
          validUntil,
          currentVersion: 1,
        },
        include: { versions: true },
      });
    } else {
      versionNumber = quotation.currentVersion + 1;
      await prisma.quotation.update({
        where: { id: quotation.id },
        data: {
          currentVersion: versionNumber,
          status: 'REVISED',
          validUntil,
        },
      });
    }

    // Create immutable quotation version record
    const version = await prisma.quotationVersion.create({
      data: {
        quotationId: quotation.id,
        versionNumber,
        metalType,
        purity,
        metalRate: pricing.metalRate,
        grossWeight: pricing.grossWeight,
        netWeight: pricing.netWeight,
        wastage: parseFloat(wastage),
        makingCharges: pricing.makingCharges,
        stoneCharges: pricing.stoneCharge,
        otherCharges: pricing.otherCharges,
        discount: pricing.discount,
        taxRate: 3.0,
        taxAmount: pricing.gstAmount,
        totalAmount: pricing.finalPrice,
        terms: terms || '50% advance upon order confirmation. Final price adjusted strictly for gold weight on crafting day.',
        notes: notes || `Calculated with ${metalType} ${purity} rate ₹${pricing.metalRate}/g`,
        createdBy: req.user?.name,
        items: {
          create: [
            {
              name: `Custom ${metalType} ${purity} Design Estimate`,
              description: `Est. Net Wt ${pricing.netWeight}g, Wastage ${wastage}%`,
              grossWeight: pricing.grossWeight,
              netWeight: pricing.netWeight,
              metalRate: pricing.metalRate,
              makingCharges: pricing.makingCharges,
              stoneCharges: pricing.stoneCharge,
              total: pricing.finalPrice,
            },
          ],
        },
      },
      include: { items: true },
    });

    // Update custom request pipeline status to QUOTATION_SENT
    if (customRequestId) {
      await prisma.customRequest.update({
        where: { id: customRequestId },
        data: {
          status: 'QUOTATION_SENT',
          statusHistory: {
            create: {
              status: 'QUOTATION_SENT',
              notes: `Quotation ${quotation.quotationNumber} v${versionNumber} issued for ₹${pricing.finalPrice.toLocaleString('en-IN')}`,
              changedBy: req.user?.name,
            },
          },
        },
      });
    }

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CREATE_QUOTATION_VERSION',
      entity: 'Quotation',
      entityId: quotation.id,
      newValue: { quotationNumber: quotation.quotationNumber, versionNumber, totalAmount: pricing.finalPrice },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        secureToken: quotation.secureToken,
        version,
      },
    });
  })
);

// POST /api/quotations/token/:token/accept (Customer accepts quotation)
router.post(
  '/token/:token/accept',
  catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { secureToken: token },
      include: { customRequest: true },
    });

    if (!quotation) throw new AppError('Quotation not found.', 404);

    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: 'ACCEPTED' },
    });

    if (quotation.customRequestId) {
      await prisma.customRequest.update({
        where: { id: quotation.customRequestId },
        data: {
          status: 'CUSTOMER_APPROVED',
          statusHistory: {
            create: {
              status: 'CUSTOMER_APPROVED',
              notes: 'Customer accepted quotation online. Production queue ready.',
              changedBy: 'Customer',
            },
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quotation accepted! Our store manager will contact you to collect the advance payment and initiate crafting.',
    });
  })
);

// GET /api/quotations/:id/pdf (Download PDF Quotation)
router.get(
  '/:id/pdf',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const quotation = await prisma.quotation.findFirst({
      where: { OR: [{ id }, { quotationNumber: id }] },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!quotation || !quotation.versions[0]) {
      throw new AppError('Quotation not found.', 404);
    }

    PdfService.generateQuotationPdf(quotation, quotation.versions[0], res);
  })
);

export default router;

