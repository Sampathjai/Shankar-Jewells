import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';
import {
  convertGoldTo24KEquivalent,
  convertCashTo24KEquivalent,
  calculateInvoiceGoldEquivalent,
  calculateMixedSettlement,
  roundGoldGrams,
  roundCurrency,
} from '../../services/gold-equivalent.service.js';
import { getActive24KGoldRate } from '../metal-rates/metal-rates.router.js';

const router = Router();

// All wholesale routes require authentication and appropriate roles
router.use(authenticate);

/**
 * Helper to enrich wholesale customer with dynamic gold-equivalent & INR calculations
 */
function enrichCustomer(customer: any, activeRate24K: number) {
  const creditLimitGoldGrams = roundGoldGrams(customer.creditLimitGoldGrams || 0, 4);
  const outstandingGoldGrams = roundGoldGrams(customer.outstandingGoldGrams || 0, 4);
  const availableCreditGoldGrams = roundGoldGrams(Math.max(0, creditLimitGoldGrams - outstandingGoldGrams), 4);

  return {
    ...customer,
    creditLimitGoldGrams,
    outstandingGoldGrams,
    availableCreditGoldGrams,
    activeRate24K,
    currentCreditLimitInr: roundCurrency(creditLimitGoldGrams * activeRate24K),
    currentOutstandingInr: roundCurrency(outstandingGoldGrams * activeRate24K),
    currentAvailableCreditInr: roundCurrency(availableCreditGoldGrams * activeRate24K),
  };
}

// ============================================================
// WHOLESALE CUSTOMERS
// ============================================================

// GET /api/wholesale/customers
router.get(
  '/customers',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const activeRate = await getActive24KGoldRate();

    const customers = await prisma.wholesaleCustomer.findMany({
      include: {
        _count: { select: { invoices: true, payments: true } },
      },
      orderBy: { businessName: 'asc' },
    });

    const enriched = customers.map((c) => enrichCustomer(c, activeRate));

    res.status(200).json({
      success: true,
      activeRate24K: activeRate,
      data: enriched,
    });
  })
);

// POST /api/wholesale/customers
router.post(
  '/customers',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      businessName,
      contactPerson,
      mobile,
      whatsapp,
      email,
      address,
      city,
      state,
      gstin,
      gstRegistered,
      pan,
      creditLimit,
      creditLimitGoldGrams: rawGoldGrams,
      paymentTerms,
      dueDays,
      discountRules,
      notes,
      photoUrl,
      photoStorageKey,
    } = req.body;

    if (!businessName || !mobile) {
      throw new AppError('Business name and mobile number are required.', 400);
    }

    const existing = await prisma.wholesaleCustomer.findUnique({ where: { mobile } });
    if (existing) {
      throw new AppError('A wholesale customer with this mobile number already exists.', 400);
    }

    const activeRate = await getActive24KGoldRate();
    let finalGoldGrams = 0;

    if (rawGoldGrams !== undefined && rawGoldGrams !== null && rawGoldGrams !== '') {
      finalGoldGrams = roundGoldGrams(parseFloat(rawGoldGrams), 4);
    } else if (creditLimit !== undefined && creditLimit !== null && creditLimit !== '') {
      const inr = parseFloat(creditLimit) || 0;
      finalGoldGrams = roundGoldGrams(inr / activeRate, 4);
    }

    const isGstRegistered = Boolean(gstRegistered);
    const cleanGstin = isGstRegistered && gstin ? gstin.trim().toUpperCase() : null;
    const finalInrLimit = roundCurrency(finalGoldGrams * activeRate);

    const customer = await prisma.wholesaleCustomer.create({
      data: {
        businessName,
        contactPerson: contactPerson || null,
        mobile,
        whatsapp: whatsapp || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        gstin: cleanGstin,
        gstRegistered: isGstRegistered,
        pan: pan || null,
        creditLimit: finalInrLimit,
        creditLimitGoldGrams: finalGoldGrams,
        outstandingBalance: 0.0,
        outstandingGoldGrams: 0.0,
        paymentTerms: paymentTerms || '30 Days',
        dueDays: parseInt(dueDays) || 30,
        discountRules: discountRules || null,
        notes: notes || null,
        photoUrl: photoUrl || null,
        photoStorageKey: photoStorageKey || null,
        status: 'ACTIVE',
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'WHOLESALE_CUSTOMER_CREATED',
      entity: 'WholesaleCustomer',
      entityId: customer.id,
      newValue: JSON.stringify(customer),
    });

    res.status(201).json({
      success: true,
      data: enrichCustomer(customer, activeRate),
      message: 'Wholesale customer created.',
    });
  })
);

// PATCH /api/wholesale/customers/:id
router.patch(
  '/customers/:id',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const existing = await prisma.wholesaleCustomer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Wholesale customer not found.', 404);
    }

    const {
      businessName,
      contactPerson,
      mobile,
      whatsapp,
      email,
      address,
      city,
      state,
      gstin,
      gstRegistered,
      pan,
      creditLimit,
      creditLimitGoldGrams: rawGoldGrams,
      paymentTerms,
      dueDays,
      status,
      notes,
      photoUrl,
      photoStorageKey,
    } = req.body;

    if (mobile && mobile !== existing.mobile) {
      const mobileConflict = await prisma.wholesaleCustomer.findUnique({ where: { mobile } });
      if (mobileConflict) {
        throw new AppError('A wholesale customer with this mobile number already exists.', 400);
      }
    }

    const activeRate = await getActive24KGoldRate();
    let updatedGoldGrams = existing.creditLimitGoldGrams;

    if (rawGoldGrams !== undefined && rawGoldGrams !== null && rawGoldGrams !== '') {
      updatedGoldGrams = roundGoldGrams(parseFloat(rawGoldGrams), 4);
    } else if (creditLimit !== undefined && creditLimit !== null && creditLimit !== '') {
      const inr = parseFloat(creditLimit) || 0;
      updatedGoldGrams = roundGoldGrams(inr / activeRate, 4);
    }

    const isGstReg = gstRegistered !== undefined ? Boolean(gstRegistered) : existing.gstRegistered;
    const cleanGstin = isGstReg ? (gstin !== undefined ? (gstin ? gstin.trim().toUpperCase() : null) : existing.gstin) : null;
    const updatedInrLimit = roundCurrency(updatedGoldGrams * activeRate);

    const updatedCustomer = await prisma.wholesaleCustomer.update({
      where: { id },
      data: {
        ...(businessName !== undefined && { businessName }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(mobile !== undefined && { mobile }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        gstRegistered: isGstReg,
        gstin: cleanGstin,
        ...(pan !== undefined && { pan }),
        creditLimit: updatedInrLimit,
        creditLimitGoldGrams: updatedGoldGrams,
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(dueDays !== undefined && { dueDays: parseInt(dueDays) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(photoStorageKey !== undefined && { photoStorageKey }),
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'WHOLESALE_CUSTOMER_UPDATED',
      entity: 'WholesaleCustomer',
      entityId: id,
      newValue: JSON.stringify(updatedCustomer),
    });

    res.status(200).json({
      success: true,
      data: enrichCustomer(updatedCustomer, activeRate),
      message: 'Wholesale customer updated.',
    });
  })
);

// GET /api/wholesale/customers/:id
router.get(
  '/customers/:id',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const activeRate = await getActive24KGoldRate();

    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        ledgers: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!customer) {
      throw new AppError('Wholesale customer not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: enrichCustomer(customer, activeRate),
    });
  })
);

// ============================================================
// WHOLESALE INVOICING & CREDIT SALES
// ============================================================

// POST /api/wholesale/invoices
router.post(
  '/invoices',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      customerId,
      items,
      discount: rawDiscount,
      gstEnabled: rawGstEnabled,
      gstRate: rawGstRate,
      immediatePayment,
      paymentMethod,
      referenceNo,
      notes,
      creditOverride,
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Customer ID and at least one item are required.', 400);
    }

    const customer = await prisma.wholesaleCustomer.findUnique({ where: { id: customerId } });
    if (!customer || customer.status === 'BLOCKED' || customer.status === 'INACTIVE') {
      throw new AppError('Customer is invalid or blocked from credit transactions.', 400);
    }

    const activeRate = await getActive24KGoldRate();
    const paidNow = parseFloat(immediatePayment) || 0.0;
    const discount = parseFloat(rawDiscount) || 0.0;

    // Calculate totals and validate products
    let subtotal = 0;
    const invoiceItemsData: any[] = [];
    const stockDeductions: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.active) {
        throw new AppError(`Product ${item.productId} not found or inactive.`, 400);
      }
      if (product.stockQuantity < item.quantity) {
        throw new AppError(`Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}`, 400);
      }

      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || product.sellingPrice;
      const total = qty * unitPrice;
      subtotal += total;

      invoiceItemsData.push({
        productId: product.id,
        sku: product.sku,
        description: `${product.name} (${product.purity} ${product.metalType})`,
        quantity: qty,
        grossWeight: product.grossWeight * qty,
        netWeight: product.netWeight * qty,
        metalRate: item.metalRate || 0,
        makingCharge: item.makingCharge || 0,
        tax: item.tax || 0,
        total,
      });

      stockDeductions.push({
        product,
        quantity: qty,
      });
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const gstEnabled = Boolean(rawGstEnabled);
    const gstRate = gstEnabled ? (parseFloat(rawGstRate) >= 0 ? parseFloat(rawGstRate) : 3.0) : 0.0;
    const gstAmount = gstEnabled ? taxableAmount * (gstRate / 100) : 0.0;
    const grandTotal = roundCurrency(taxableAmount + gstAmount);

    const newCreditInr = Math.max(0, grandTotal - paidNow);
    const invoiceGoldEquivalent = roundGoldGrams(grandTotal / activeRate, 4);
    const paidNowGoldEq = roundGoldGrams(paidNow / activeRate, 4);
    const newCreditGoldEq = roundGoldGrams(newCreditInr / activeRate, 4);

    const projectedOutstandingGold = roundGoldGrams(customer.outstandingGoldGrams + newCreditGoldEq, 4);
    const availableGoldBefore = roundGoldGrams(Math.max(0, customer.creditLimitGoldGrams - customer.outstandingGoldGrams), 4);

    // Credit Limit Verification in 24K GOLD GRAMS
    let isOverride = false;
    if (projectedOutstandingGold > customer.creditLimitGoldGrams) {
      if (!creditOverride) {
        throw new AppError(
          `CREDIT LIMIT EXCEEDED! Approved Credit: ${customer.creditLimitGoldGrams.toFixed(4)} g 24K, Current Outstanding: ${customer.outstandingGoldGrams.toFixed(4)} g 24K, Available: ${availableGoldBefore.toFixed(4)} g 24K. Invoice Credit: ${newCreditGoldEq.toFixed(4)} g 24K. Manager override required.`,
          400
        );
      }

      if (!['SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER'].includes(req.user?.role || '')) {
        throw new AppError('Only Manager or Super Admin can authorize credit limit overrides.', 403);
      }
      isOverride = true;
    }

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.wholesaleInvoice.count();
      const invoiceNumber = `WHS-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + customer.dueDays);

      const paymentStatus = paidNow >= grandTotal ? 'PAID' : paidNow > 0 ? 'PARTIAL' : 'CREDIT';

      // 1. Create Invoice with 24K Rate Snapshot & Gold Equivalent
      const invoice = await tx.wholesaleInvoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          dueDate,
          paymentStatus,
          subtotal: roundCurrency(subtotal),
          discount: roundCurrency(discount),
          taxableAmount: roundCurrency(taxableAmount),
          gstEnabled,
          gstRate,
          gstAmount: roundCurrency(gstAmount),
          tax: roundCurrency(gstAmount),
          grandTotal,
          amountPaid: roundCurrency(paidNow),
          outstandingAmount: roundCurrency(newCreditInr),
          rate24K: activeRate,
          goldEquivalentGrams: invoiceGoldEquivalent,
          creditOverrideBy: isOverride ? req.user?.email : null,
          creditOverrideNotes: isOverride ? creditOverride.reason || 'Manager Override' : null,
          notes: notes || null,
          items: {
            create: invoiceItemsData,
          },
        },
        include: { items: true, customer: true },
      });

      // 2. Immediate Payment Record if paidNow > 0
      let paymentRecord = null;
      if (paidNow > 0) {
        const pCount = await tx.wholesalePayment.count();
        const paymentNumber = `WHS-PAY-${dateStr}-${(pCount + 1).toString().padStart(4, '0')}`;
        paymentRecord = await tx.wholesalePayment.create({
          data: {
            paymentNumber,
            customerId: customer.id,
            invoiceId: invoice.id,
            amount: roundCurrency(paidNow),
            paymentType: 'CASH',
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            rate24K: activeRate,
            cashAmount: roundCurrency(paidNow),
            cashEquivalent24KGrams: paidNowGoldEq,
            totalEquivalent24KGrams: paidNowGoldEq,
            referenceNo: referenceNo || null,
            recordedBy: req.user?.name || req.user?.email || 'System',
            notes: 'Immediate payment at wholesale bill creation',
          },
        });
      }

      // 3. Update Customer Outstanding Balance in 24K Gold Grams
      const newCustomerGoldBalance = roundGoldGrams(customer.outstandingGoldGrams + newCreditGoldEq, 4);
      const newCustomerInrBalance = roundCurrency(newCustomerGoldBalance * activeRate);

      await tx.wholesaleCustomer.update({
        where: { id: customer.id },
        data: {
          outstandingGoldGrams: newCustomerGoldBalance,
          outstandingBalance: newCustomerInrBalance,
        },
      });

      // 4. Update Ledger in 24K Gold Grams & INR
      await tx.wholesaleLedger.create({
        data: {
          customerId: customer.id,
          transactionType: 'INVOICE',
          invoiceId: invoice.id,
          debit: grandTotal,
          credit: roundCurrency(paidNow),
          balance: newCustomerInrBalance,
          debitGoldGrams: invoiceGoldEquivalent,
          creditGoldGrams: paidNowGoldEq,
          balanceGoldGrams: newCustomerGoldBalance,
          rate24K: activeRate,
          recordedBy: req.user?.name || req.user?.email || 'System',
          notes: `Wholesale Bill #${invoiceNumber} (${invoiceGoldEquivalent.toFixed(4)} g 24K @ ₹${activeRate}/g)`,
        },
      });

      // 5. Stock Deductions & Audit Movements
      for (const deduction of stockDeductions) {
        const p = deduction.product;
        const newQty = p.stockQuantity - deduction.quantity;
        await tx.product.update({
          where: { id: p.id },
          data: { stockQuantity: Math.max(0, newQty) },
        });

        await tx.stockTransaction.create({
          data: {
            productId: p.id,
            transactionType: 'SALE',
            quantity: deduction.quantity,
            grossWeight: p.grossWeight * deduction.quantity,
            netWeight: p.netWeight * deduction.quantity,
            previousQuantity: p.stockQuantity,
            newQuantity: newQty,
            previousWeight: p.grossWeight * p.stockQuantity,
            newWeight: p.grossWeight * newQty,
            referenceType: 'WHOLESALE_INVOICE',
            referenceId: invoice.id,
            userId: req.user?.id,
            notes: `Wholesale Sale #${invoiceNumber}`,
          },
        });
      }

      return invoice;
    });

    if (isOverride) {
      await recordAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'WHOLESALE_CREDIT_OVERRIDE',
        entity: 'WholesaleInvoice',
        entityId: result.id,
        newValue: `Credit limit exceeded. Authorized by ${req.user?.email}`,
      });
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Wholesale invoice created successfully.',
    });
  })
);

// GET /api/wholesale/invoices
router.get(
  '/invoices',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const invoices = await prisma.wholesaleInvoice.findMany({
      include: {
        customer: { select: { id: true, businessName: true, mobile: true, gstin: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: invoices });
  })
);

// ============================================================
// WHOLESALE PAYMENTS & LEDGER SETTLEMENT
// ============================================================

// POST /api/wholesale/payments
router.post(
  '/payments',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      customerId,
      invoiceId,
      paymentType: rawPaymentType = 'CASH',
      paymentMethod = 'BANK_TRANSFER',
      goldWeightGrams: rawGoldWeight,
      goldPurity: rawGoldPurity,
      cashAmount: rawCashAmount,
      referenceNo,
      paymentDate,
      notes,
      authorizeOverpayment,
    } = req.body;

    if (!customerId) {
      throw new AppError('Customer ID is required.', 400);
    }

    const customer = await prisma.wholesaleCustomer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new AppError('Wholesale customer not found.', 404);
    }

    const activeRate = await getActive24KGoldRate();
    const paymentType = (rawPaymentType || 'CASH').toUpperCase();

    const settlement = calculateMixedSettlement({
      goldWeightGrams: paymentType === 'CASH' ? 0 : parseFloat(rawGoldWeight) || 0,
      goldPurity: paymentType === 'CASH' ? '24K' : rawGoldPurity || '24K',
      cashAmount: paymentType === 'GOLD' ? 0 : parseFloat(rawCashAmount) || 0,
      rate24K: activeRate,
    });

    if (settlement.totalEquivalent24KGrams <= 0) {
      throw new AppError('Payment must include either valid gold weight or cash amount.', 400);
    }

    // Overpayment Protection: Check if settlement exceeds current gold outstanding
    const diff = roundGoldGrams(settlement.totalEquivalent24KGrams - customer.outstandingGoldGrams, 4);

    if (diff > 0.0001 && !authorizeOverpayment) {
      throw new AppError(
        `PAYMENT_EXCEEDS_OUTSTANDING: Settlement of ${settlement.totalEquivalent24KGrams.toFixed(4)} g 24K exceeds current outstanding balance of ${customer.outstandingGoldGrams.toFixed(4)} g 24K (Excess: ${diff.toFixed(4)} g 24K). Please adjust payment weight/cash or check 'Authorize Overpayment' to record as a Gold Advance.`,
        400
      );
    }

    const totalAmountInr = roundCurrency(settlement.goldValueInr + settlement.cashAmount);

    const result = await prisma.$transaction(async (tx) => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.wholesalePayment.count();
      const paymentNumber = `WHS-PAY-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      // 1. Create Payment Record with Gold & Cash Breakdown Snapshots
      const payment = await tx.wholesalePayment.create({
        data: {
          paymentNumber,
          customerId,
          invoiceId: invoiceId || null,
          amount: totalAmountInr,
          paymentType,
          paymentMethod: paymentType === 'GOLD' ? 'GOLD' : paymentMethod || 'CASH',
          rate24K: activeRate,
          goldPurity: settlement.goldPurity,
          goldWeightGrams: settlement.goldWeightGrams,
          goldEquivalent24KGrams: settlement.goldEquivalent24KGrams,
          cashAmount: settlement.cashAmount,
          cashEquivalent24KGrams: settlement.cashEquivalent24KGrams,
          totalEquivalent24KGrams: settlement.totalEquivalent24KGrams,
          referenceNo: referenceNo || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          recordedBy: req.user?.name || req.user?.email || 'Staff',
          notes: notes || null,
        },
      });

      // 2. If tied to invoice, update invoice outstanding INR
      if (invoiceId) {
        const inv = await tx.wholesaleInvoice.findUnique({ where: { id: invoiceId } });
        if (inv) {
          const newPaid = inv.amountPaid + totalAmountInr;
          const newOutstanding = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL';

          await tx.wholesaleInvoice.update({
            where: { id: invoiceId },
            data: {
              amountPaid: roundCurrency(newPaid),
              outstandingAmount: roundCurrency(newOutstanding),
              paymentStatus: newStatus,
            },
          });
        }
      }

      // 3. Update Customer Outstanding Balance in 24K Gold Grams & INR
      const newCustomerGoldOutstanding = roundGoldGrams(customer.outstandingGoldGrams - settlement.totalEquivalent24KGrams, 4);
      const newCustomerInrOutstanding = roundCurrency(newCustomerGoldOutstanding * activeRate);

      await tx.wholesaleCustomer.update({
        where: { id: customerId },
        data: {
          outstandingGoldGrams: newCustomerGoldOutstanding,
          outstandingBalance: newCustomerInrOutstanding,
        },
      });

      // 4. Update Ledger in 24K Gold Grams
      let ledgerNote = `Payment #${paymentNumber} (${paymentType})`;
      if (paymentType === 'GOLD') {
        ledgerNote += `: ${settlement.goldWeightGrams}g ${settlement.goldPurity} Gold (${settlement.goldEquivalent24KGrams.toFixed(4)}g 24K eq)`;
      } else if (paymentType === 'CASH') {
        ledgerNote += `: ₹${settlement.cashAmount.toLocaleString('en-IN')} Cash (${settlement.cashEquivalent24KGrams.toFixed(4)}g 24K eq @ ₹${activeRate}/g)`;
      } else {
        ledgerNote += `: ${settlement.goldWeightGrams}g ${settlement.goldPurity} Gold + ₹${settlement.cashAmount.toLocaleString('en-IN')} Cash (Total ${settlement.totalEquivalent24KGrams.toFixed(4)}g 24K eq)`;
      }

      await tx.wholesaleLedger.create({
        data: {
          customerId,
          transactionType: 'PAYMENT',
          paymentId: payment.id,
          invoiceId: invoiceId || null,
          debit: 0.0,
          credit: totalAmountInr,
          balance: newCustomerInrOutstanding,
          debitGoldGrams: 0.0,
          creditGoldGrams: settlement.totalEquivalent24KGrams,
          balanceGoldGrams: newCustomerGoldOutstanding,
          rate24K: activeRate,
          goldPurity: settlement.goldPurity,
          goldWeightGrams: settlement.goldWeightGrams,
          cashAmount: settlement.cashAmount,
          recordedBy: req.user?.name || req.user?.email || 'Staff',
          notes: ledgerNote,
        },
      });

      return payment;
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'WHOLESALE_PAYMENT_RECORDED',
      entity: 'WholesalePayment',
      entityId: result.id,
      newValue: `Payment #${result.paymentNumber} Type: ${paymentType}, Total 24K Eq: ${settlement.totalEquivalent24KGrams}g, Customer: ${customer.businessName}`,
    });

    res.status(201).json({
      success: true,
      data: result,
      settlement,
      message: 'Wholesale payment recorded successfully.',
    });
  })
);

// GET /api/wholesale/payments (List Payment History)
router.get(
  '/payments',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const activeRate = await getActive24KGoldRate();

    const payments = await prisma.wholesalePayment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            businessName: true,
            contactPerson: true,
            mobile: true,
            photoUrl: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      activeRate24K: activeRate,
      data: payments,
    });
  })
);

// GET /api/wholesale/ledger/:customerId
router.get(
  '/ledger/:customerId',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const activeRate = await getActive24KGoldRate();

    const customer = await prisma.wholesaleCustomer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw new AppError('Wholesale customer not found.', 404);
    }

    const ledgers = await prisma.wholesaleLedger.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      activeRate24K: activeRate,
      data: {
        customer: enrichCustomer(customer, activeRate),
        ledgers,
      },
    });
  })
);

// GET /api/wholesale/receivables (Dashboard KPI & Aging Report)
router.get(
  '/receivables',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const activeRate = await getActive24KGoldRate();

    const customers = await prisma.wholesaleCustomer.findMany({
      where: { status: 'ACTIVE' },
      include: {
        invoices: {
          where: { outstandingAmount: { gt: 0 } },
        },
      },
    });

    let totalWholesaleSales = 0;
    let totalCollected = 0;
    let totalOutstandingInr = 0;
    let totalOutstandingGoldGrams = 0;
    let totalOverdueInr = 0;

    const now = new Date();

    const customerAgingList = customers.map((c) => {
      let current = 0;
      let d1_30 = 0;
      let d31_60 = 0;
      let d61_90 = 0;
      let d90_plus = 0;

      totalOutstandingGoldGrams += c.outstandingGoldGrams;

      for (const inv of c.invoices) {
        totalWholesaleSales += inv.grandTotal;
        totalCollected += inv.amountPaid;
        totalOutstandingInr += inv.outstandingAmount;

        const diffTime = Math.abs(now.getTime() - new Date(inv.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = now > new Date(inv.dueDate);

        if (isOverdue) {
          totalOverdueInr += inv.outstandingAmount;
          if (diffDays <= 30) d1_30 += inv.outstandingAmount;
          else if (diffDays <= 60) d31_60 += inv.outstandingAmount;
          else if (diffDays <= 90) d61_90 += inv.outstandingAmount;
          else d90_plus += inv.outstandingAmount;
        } else {
          current += inv.outstandingAmount;
        }
      }

      const creditLimitGoldGrams = roundGoldGrams(c.creditLimitGoldGrams || 0, 4);
      const outstandingGoldGrams = roundGoldGrams(c.outstandingGoldGrams || 0, 4);
      const availableCreditGoldGrams = roundGoldGrams(Math.max(0, creditLimitGoldGrams - outstandingGoldGrams), 4);

      return {
        id: c.id,
        businessName: c.businessName,
        contactPerson: c.contactPerson,
        mobile: c.mobile,
        photoUrl: c.photoUrl,
        creditLimitGoldGrams,
        outstandingGoldGrams,
        availableCreditGoldGrams,
        currentCreditLimitInr: roundCurrency(creditLimitGoldGrams * activeRate),
        currentOutstandingInr: roundCurrency(outstandingGoldGrams * activeRate),
        currentAvailableCreditInr: roundCurrency(availableCreditGoldGrams * activeRate),
        creditLimit: c.creditLimit,
        outstandingBalance: c.outstandingBalance,
        aging: {
          current,
          d1_30,
          d31_60,
          d61_90,
          d90_plus,
          total: c.outstandingBalance,
        },
      };
    });

    res.status(200).json({
      success: true,
      activeRate24K: activeRate,
      data: {
        totalWholesaleSales: roundCurrency(totalWholesaleSales),
        totalCollected: roundCurrency(totalCollected),
        totalOutstandingInr: roundCurrency(totalOutstandingInr),
        totalOutstandingGoldGrams: roundGoldGrams(totalOutstandingGoldGrams, 4),
        totalOverdueInr: roundCurrency(totalOverdueInr),
        activeCustomersCount: customers.length,
        customers: customerAgingList,
      },
    });
  })
);

export default router;
