import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

router.use(authenticate);

// ============================================================
// CONSIGNMENT PARTNERS
// ============================================================

// GET /api/consignment/partners
router.get(
  '/partners',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const partners = await prisma.consignmentPartner.findMany({
      include: {
        _count: { select: { consignments: true, settlements: true } },
      },
      orderBy: { businessName: 'asc' },
    });

    res.status(200).json({ success: true, data: partners });
  })
);

// POST /api/consignment/partners
router.post(
  '/partners',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      businessName,
      contactPerson,
      mobile,
      whatsapp,
      email,
      address,
      gstin,
      agreementNumber,
      commissionType,
      commissionBasis,
      commissionValue,
      settlementFrequency,
      terms,
      notes,
    } = req.body;

    if (!businessName || !mobile) {
      throw new AppError('Business name and mobile number are required.', 400);
    }

    const existing = await prisma.consignmentPartner.findUnique({ where: { mobile } });
    if (existing) {
      throw new AppError('A consignment partner with this mobile number already exists.', 400);
    }

    const partner = await prisma.consignmentPartner.create({
      data: {
        businessName,
        contactPerson: contactPerson || null,
        mobile,
        whatsapp: whatsapp || null,
        email: email || null,
        address: address || null,
        gstin: gstin || null,
        agreementNumber: agreementNumber || `AGR-${Date.now().toString().slice(-6)}`,
        commissionType: commissionType || 'PERCENTAGE',
        commissionBasis: commissionBasis || 'TOTAL_SALES',
        commissionValue: parseFloat(commissionValue) || 5.0,
        settlementFrequency: settlementFrequency || 'Monthly',
        terms: terms || null,
        notes: notes || null,
        status: 'ACTIVE',
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CONSIGNMENT_PARTNER_CREATED',
      entity: 'ConsignmentPartner',
      entityId: partner.id,
      newValue: JSON.stringify(partner),
    });

    res.status(201).json({ success: true, data: partner, message: 'Consignment partner registered.' });
  })
);

// ============================================================
// CONSIGNMENT STOCK ISSUANCE
// ============================================================

// POST /api/consignment/issues (Issue stock to partner)
router.post(
  '/issues',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { partnerId, expectedSettlementDate, items, notes } = req.body;

    if (!partnerId || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Partner ID and at least one stock item are required.', 400);
    }

    const partner = await prisma.consignmentPartner.findUnique({ where: { id: partnerId } });
    if (!partner || partner.status !== 'ACTIVE') {
      throw new AppError('Consignment partner not found or inactive.', 400);
    }

    let totalQty = 0;
    let totalGrossWt = 0;
    let totalNetWt = 0;
    let totalValue = 0;

    const consignmentItemsData: any[] = [];
    const stockTransfers: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.active) {
        throw new AppError(`Product ID ${item.productId} not found or inactive.`, 400);
      }

      const qty = parseInt(item.quantity) || 1;
      if (product.stockQuantity < qty) {
        throw new AppError(`Insufficient store vault stock for ${product.name}. Available: ${product.stockQuantity}`, 400);
      }

      const grossWt = product.grossWeight * qty;
      const netWt = product.netWeight * qty;
      const unitPrice = parseFloat(item.unitPrice) || product.sellingPrice;
      const itemTotal = qty * unitPrice;

      totalQty += qty;
      totalGrossWt += grossWt;
      totalNetWt += netWt;
      totalValue += itemTotal;

      consignmentItemsData.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        grossWeight: grossWt,
        netWeight: netWt,
        issuedQuantity: qty,
        issuedWeight: netWt,
        balanceQuantity: qty,
        balanceWeight: netWt,
        unitPrice,
      });

      stockTransfers.push({
        product,
        quantity: qty,
        grossWeight: grossWt,
        netWeight: netWt,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.consignment.count();
      const consignmentNumber = `CSG-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      // 1. Create Consignment record
      const consignment = await tx.consignment.create({
        data: {
          consignmentNumber,
          partnerId: partner.id,
          expectedSettlementDate: expectedSettlementDate ? new Date(expectedSettlementDate) : null,
          status: 'ISSUED',
          totalIssuedQuantity: totalQty,
          totalIssuedWeight: totalNetWt,
          balanceQuantity: totalQty,
          balanceWeight: totalNetWt,
          totalIssuedValue: totalValue,
          notes: notes || null,
          items: {
            create: consignmentItemsData,
          },
        },
        include: { items: true, partner: true },
      });

      // 2. Transfer Store Stock -> Consignment Stock
      for (const transfer of stockTransfers) {
        const p = transfer.product;
        const newStoreQty = p.stockQuantity - transfer.quantity;

        // Decrease Store Inventory
        await tx.product.update({
          where: { id: p.id },
          data: { stockQuantity: Math.max(0, newStoreQty) },
        });

        // Increase Consignment Partner Stock
        await tx.consignmentStock.upsert({
          where: {
            partnerId_productId: {
              partnerId: partner.id,
              productId: p.id,
            },
          },
          create: {
            partnerId: partner.id,
            productId: p.id,
            quantity: transfer.quantity,
            grossWeight: transfer.grossWeight,
            netWeight: transfer.netWeight,
          },
          update: {
            quantity: { increment: transfer.quantity },
            grossWeight: { increment: transfer.grossWeight },
            netWeight: { increment: transfer.netWeight },
          },
        });

        // Audit Movements
        await tx.consignmentStockLedger.create({
          data: {
            partnerId: partner.id,
            productId: p.id,
            transactionType: 'ISSUED',
            quantity: transfer.quantity,
            grossWeight: transfer.grossWeight,
            netWeight: transfer.netWeight,
            referenceId: consignment.id,
            userId: req.user?.id,
            notes: `Consignment Issue #${consignmentNumber}`,
          },
        });

        await tx.stockTransaction.create({
          data: {
            productId: p.id,
            transactionType: 'TRANSFER_OUT',
            quantity: transfer.quantity,
            grossWeight: transfer.grossWeight,
            netWeight: transfer.netWeight,
            previousQuantity: p.stockQuantity,
            newQuantity: newStoreQty,
            previousWeight: p.grossWeight * p.stockQuantity,
            newWeight: p.grossWeight * newStoreQty,
            referenceType: 'CONSIGNMENT_ISSUE',
            referenceId: consignment.id,
            userId: req.user?.id,
            notes: `Stock placed on consignment with ${partner.businessName} (#${consignmentNumber})`,
          },
        });
      }

      return consignment;
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CONSIGNMENT_STOCK_ISSUED',
      entity: 'Consignment',
      entityId: result.id,
      newValue: `Issued ${totalQty} items (${totalNetWt}g) to ${partner.businessName}`,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Consignment stock issued successfully.',
    });
  })
);

// GET /api/consignment/issues
router.get(
  '/issues',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const consignments = await prisma.consignment.findMany({
      include: {
        partner: { select: { id: true, businessName: true, mobile: true, commissionType: true, commissionValue: true } },
        items: true,
        settlements: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: consignments });
  })
);

// GET /api/consignment/:id
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const consignment = await prisma.consignment.findUnique({
      where: { id: req.params.id },
      include: {
        partner: true,
        items: { include: { product: true } },
        settlements: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!consignment) {
      throw new AppError('Consignment not found.', 404);
    }

    res.status(200).json({ success: true, data: consignment });
  })
);

// ============================================================
// CONSIGNMENT SETTLEMENT & RETURNS
// ============================================================

// POST /api/consignment/:id/settlement
router.post(
  '/:id/settlement',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { items, paymentMethod, referenceNo, notes } = req.body;

    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: { partner: true, items: { include: { product: true } } },
    });

    if (!consignment) {
      throw new AppError('Consignment not found.', 404);
    }

    if (consignment.status === 'FULLY_SETTLED' || consignment.status === 'CLOSED') {
      throw new AppError('This consignment is already fully settled or closed.', 400);
    }

    let totalSoldQty = 0;
    let totalSoldWt = 0;
    let totalReturnedQty = 0;
    let totalReturnedWt = 0;
    let grossSalesValue = 0;

    const settlementUpdates: any[] = [];

    for (const reportItem of items) {
      const dbItem = consignment.items.find((i) => i.id === reportItem.itemId || i.productId === reportItem.productId);
      if (!dbItem) continue;

      const soldQty = parseInt(reportItem.soldQuantity) || 0;
      const returnedQty = parseInt(reportItem.returnedQuantity) || 0;

      // Rule Validation: Sold + Returned cannot exceed Issued
      if (soldQty + returnedQty > dbItem.balanceQuantity) {
        throw new AppError(
          `Validation Error for product ${dbItem.name}: Sold (${soldQty}) + Returned (${returnedQty}) exceeds remaining issued balance (${dbItem.balanceQuantity}).`,
          400
        );
      }

      const ratio = dbItem.issuedQuantity > 0 ? dbItem.netWeight / dbItem.issuedQuantity : 0;
      const soldWt = soldQty * ratio;
      const returnedWt = returnedQty * ratio;

      totalSoldQty += soldQty;
      totalSoldWt += soldWt;
      totalReturnedQty += returnedQty;
      totalReturnedWt += returnedWt;

      const itemSales = soldQty * dbItem.unitPrice;
      grossSalesValue += itemSales;

      settlementUpdates.push({
        dbItem,
        soldQty,
        soldWt,
        returnedQty,
        returnedWt,
        newBalanceQty: dbItem.balanceQuantity - (soldQty + returnedQty),
        newBalanceWt: dbItem.balanceWeight - (soldWt + returnedWt),
      });
    }

    // Calculate Commission based on partner settings
    const partner = consignment.partner;
    let commissionAmount = 0;

    if (partner.commissionType === 'PERCENTAGE') {
      commissionAmount = grossSalesValue * ((partner.commissionValue || 5.0) / 100);
    } else if (partner.commissionType === 'PER_GRAM') {
      commissionAmount = totalSoldWt * (partner.commissionValue || 100);
    } else if (partner.commissionType === 'FIXED') {
      commissionAmount = partner.commissionValue || 0;
    }

    const netPayable = Math.max(0, grossSalesValue - commissionAmount);

    // Execute Settlement Transaction
    const result = await prisma.$transaction(async (tx) => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.consignmentSettlement.count();
      const settlementNumber = `CSG-SET-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      // 1. Create Settlement Snapshot
      const settlement = await tx.consignmentSettlement.create({
        data: {
          settlementNumber,
          consignmentId: consignment.id,
          partnerId: partner.id,
          soldQuantity: totalSoldQty,
          soldWeight: totalSoldWt,
          returnedQuantity: totalReturnedQty,
          returnedWeight: totalReturnedWt,
          grossSalesValue,
          commissionType: partner.commissionType,
          commissionBasis: partner.commissionBasis,
          commissionValue: partner.commissionValue,
          commissionAmount,
          netPayable,
          amountPaid: netPayable,
          remainingBalance: 0,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          referenceNo: referenceNo || null,
          status: 'COMPLETED',
          notes: notes || null,
        },
      });

      // 2. Update Consignment Items & Return Unsold Stock to Vault
      let newConsignmentBalanceQty = consignment.balanceQuantity;
      let newConsignmentBalanceWt = consignment.balanceWeight;

      for (const update of settlementUpdates) {
        newConsignmentBalanceQty -= update.soldQty + update.returnedQty;
        newConsignmentBalanceWt -= update.soldWt + update.returnedWt;

        await tx.consignmentItem.update({
          where: { id: update.dbItem.id },
          data: {
            soldQuantity: { increment: update.soldQty },
            soldWeight: { increment: update.soldWt },
            returnedQuantity: { increment: update.returnedQty },
            returnedWeight: { increment: update.returnedWt },
            balanceQuantity: update.newBalanceQty,
            balanceWeight: update.newBalanceWt,
          },
        });

        // If items were returned, decrease consignment partner stock & increase store stock!
        if (update.returnedQty > 0) {
          const product = update.dbItem.product;

          // Increase Store Stock
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { increment: update.returnedQty } },
          });

          // Decrease Consignment Partner Stock
          await tx.consignmentStock.update({
            where: {
              partnerId_productId: {
                partnerId: partner.id,
                productId: product.id,
              },
            },
            data: {
              quantity: { decrement: update.returnedQty },
              grossWeight: { decrement: update.returnedWt },
              netWeight: { decrement: update.returnedWt },
            },
          });

          // Stock Ledger Movement (CONSIGNMENT_RETURN)
          await tx.consignmentStockLedger.create({
            data: {
              partnerId: partner.id,
              productId: product.id,
              transactionType: 'RETURNED',
              quantity: update.returnedQty,
              grossWeight: update.returnedWt,
              netWeight: update.returnedWt,
              referenceId: settlement.id,
              userId: req.user?.id,
              notes: `Stock returned from ${partner.businessName} (#${settlementNumber})`,
            },
          });

          await tx.stockTransaction.create({
            data: {
              productId: product.id,
              transactionType: 'TRANSFER_IN',
              quantity: update.returnedQty,
              grossWeight: update.returnedWt,
              netWeight: update.returnedWt,
              previousQuantity: product.stockQuantity,
              newQuantity: product.stockQuantity + update.returnedQty,
              previousWeight: product.grossWeight * product.stockQuantity,
              newWeight: product.grossWeight * (product.stockQuantity + update.returnedQty),
              referenceType: 'CONSIGNMENT_RETURN',
              referenceId: settlement.id,
              userId: req.user?.id,
              notes: `Consignment stock returned by ${partner.businessName}`,
            },
          });
        }
      }

      const finalStatus =
        newConsignmentBalanceQty <= 0 ? 'FULLY_SETTLED' : 'PARTIALLY_SETTLED';

      await tx.consignment.update({
        where: { id: consignment.id },
        data: {
          totalSoldQuantity: { increment: totalSoldQty },
          totalSoldWeight: { increment: totalSoldWt },
          totalReturnedQuantity: { increment: totalReturnedQty },
          totalReturnedWeight: { increment: totalReturnedWt },
          balanceQuantity: Math.max(0, newConsignmentBalanceQty),
          balanceWeight: Math.max(0, newConsignmentBalanceWt),
          status: finalStatus,
        },
      });

      return settlement;
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CONSIGNMENT_SETTLEMENT',
      entity: 'ConsignmentSettlement',
      entityId: result.id,
      newValue: `Settled Gross: ₹${grossSalesValue}, Commission: ₹${commissionAmount}, Net Payable: ₹${netPayable}`,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Consignment settlement recorded successfully.',
    });
  })
);

// GET /api/consignment/stock (Partner stock overview)
router.get(
  '/stock',
  authorize('SUPER_ADMIN', 'MANAGER', 'CONSIGNMENT_MANAGER', 'INVENTORY_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const stock = await prisma.consignmentStock.findMany({
      include: {
        partner: { select: { id: true, businessName: true, mobile: true } },
        product: { select: { id: true, name: true, sku: true, metalType: true, purity: true, grossWeight: true, netWeight: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({ success: true, data: stock });
  })
);

export default router;
