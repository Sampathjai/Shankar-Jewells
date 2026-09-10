import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// All wholesale routes require authentication and appropriate roles
router.use(authenticate);

// ============================================================
// WHOLESALE CUSTOMERS
// ============================================================

// GET /api/wholesale/customers
router.get(
  '/customers',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const customers = await prisma.wholesaleCustomer.findMany({
      include: {
        _count: { select: { invoices: true, payments: true } },
      },
      orderBy: { businessName: 'asc' },
    });

    res.status(200).json({ success: true, data: customers });
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
      pan,
      creditLimit,
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
        gstin: gstin || null,
        pan: pan || null,
        creditLimit: parseFloat(creditLimit) || 0.0,
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

    res.status(201).json({ success: true, data: customer, message: 'Wholesale customer created.' });
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
      pan,
      creditLimit,
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
        ...(gstin !== undefined && { gstin }),
        ...(pan !== undefined && { pan }),
        ...(creditLimit !== undefined && { creditLimit: parseFloat(creditLimit) }),
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

    res.status(200).json({ success: true, data: updatedCustomer, message: 'Wholesale customer updated.' });
  })
);

// GET /api/wholesale/customers/:id
router.get(
  '/customers/:id',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
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

    const availableCredit = Math.max(0, customer.creditLimit - customer.outstandingBalance);

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        availableCredit,
      },
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
    const { customerId, items, immediatePayment, paymentMethod, referenceNo, notes, creditOverride } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Customer ID and at least one item are required.', 400);
    }

    const customer = await prisma.wholesaleCustomer.findUnique({ where: { id: customerId } });
    if (!customer || customer.status === 'BLOCKED' || customer.status === 'INACTIVE') {
      throw new AppError('Customer is invalid or blocked from credit transactions.', 400);
    }

    const paidNow = parseFloat(immediatePayment) || 0.0;

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

    const tax = subtotal * 0.03; // 3% GST
    const grandTotal = subtotal + tax;
    const newCreditAmount = Math.max(0, grandTotal - paidNow);
    const projectedOutstanding = customer.outstandingBalance + newCreditAmount;

    // Credit Limit Verification
    let isOverride = false;
    if (projectedOutstanding > customer.creditLimit) {
      if (!creditOverride) {
        throw new AppError(
          `Credit limit exceeded! Limit: ₹${customer.creditLimit.toLocaleString('en-IN')}, Current Outstanding: ₹${customer.outstandingBalance.toLocaleString('en-IN')}, Bill Net Credit: ₹${newCreditAmount.toLocaleString('en-IN')}. Requires Manager override.`,
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

      const paymentStatus =
        paidNow >= grandTotal ? 'PAID' : paidNow > 0 ? 'PARTIAL' : 'CREDIT';

      // 1. Create Invoice
      const invoice = await tx.wholesaleInvoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          dueDate,
          paymentStatus,
          subtotal,
          tax,
          grandTotal,
          amountPaid: paidNow,
          outstandingAmount: newCreditAmount,
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
            amount: paidNow,
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            referenceNo: referenceNo || null,
            notes: 'Immediate payment at wholesale bill creation',
          },
        });
      }

      // 3. Update Customer Outstanding Balance
      const newBalance = customer.outstandingBalance + newCreditAmount;
      await tx.wholesaleCustomer.update({
        where: { id: customer.id },
        data: { outstandingBalance: newBalance },
      });

      // 4. Update Ledger (Debit for Invoice)
      await tx.wholesaleLedger.create({
        data: {
          customerId: customer.id,
          transactionType: 'INVOICE',
          invoiceId: invoice.id,
          debit: grandTotal,
          credit: paidNow,
          balance: newBalance,
          notes: `Wholesale Bill #${invoiceNumber}`,
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
// WHOLESALE PAYMENTS & LEDGER
// ============================================================

// POST /api/wholesale/payments
router.post(
  '/payments',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { customerId, invoiceId, amount, paymentMethod, referenceNo, paymentDate, notes } = req.body;

    if (!customerId || !amount || parseFloat(amount) <= 0) {
      throw new AppError('Customer ID and positive payment amount are required.', 400);
    }

    const payAmount = parseFloat(amount);
    const customer = await prisma.wholesaleCustomer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new AppError('Wholesale customer not found.', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.wholesalePayment.count();
      const paymentNumber = `WHS-PAY-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      // 1. Create Payment
      const payment = await tx.wholesalePayment.create({
        data: {
          paymentNumber,
          customerId,
          invoiceId: invoiceId || null,
          amount: payAmount,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          referenceNo: referenceNo || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes: notes || null,
        },
      });

      // 2. If tied to invoice, update invoice outstanding
      if (invoiceId) {
        const inv = await tx.wholesaleInvoice.findUnique({ where: { id: invoiceId } });
        if (inv) {
          const newPaid = inv.amountPaid + payAmount;
          const newOutstanding = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL';

          await tx.wholesaleInvoice.update({
            where: { id: invoiceId },
            data: {
              amountPaid: newPaid,
              outstandingAmount: newOutstanding,
              paymentStatus: newStatus,
            },
          });
        }
      }

      // 3. Update Customer Outstanding Balance
      const newCustomerOutstanding = Math.max(0, customer.outstandingBalance - payAmount);
      await tx.wholesaleCustomer.update({
        where: { id: customerId },
        data: { outstandingBalance: newCustomerOutstanding },
      });

      // 4. Update Ledger (Credit for Payment)
      await tx.wholesaleLedger.create({
        data: {
          customerId,
          transactionType: 'PAYMENT',
          paymentId: payment.id,
          invoiceId: invoiceId || null,
          debit: 0.0,
          credit: payAmount,
          balance: newCustomerOutstanding,
          notes: `Payment #${paymentNumber} (${paymentMethod})`,
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
      newValue: `Amount: ₹${payAmount}, Customer: ${customer.businessName}`,
    });

    res.status(201).json({ success: true, data: result, message: 'Payment recorded successfully.' });
  })
);

// GET /api/wholesale/ledger/:customerId
router.get(
  '/ledger/:customerId',
  authorize('SUPER_ADMIN', 'MANAGER', 'WHOLESALE_MANAGER', 'BILLING_STAFF'),
  catchAsync(async (req: Request, res: Response) => {
    const { customerId } = req.params;
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
      data: {
        customer,
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
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const now = new Date();

    const customerAgingList = customers.map((c) => {
      let current = 0;
      let d1_30 = 0;
      let d31_60 = 0;
      let d61_90 = 0;
      let d90_plus = 0;

      for (const inv of c.invoices) {
        totalWholesaleSales += inv.grandTotal;
        totalCollected += inv.amountPaid;
        totalOutstanding += inv.outstandingAmount;

        const diffTime = Math.abs(now.getTime() - new Date(inv.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = now > new Date(inv.dueDate);

        if (isOverdue) {
          totalOverdue += inv.outstandingAmount;
          if (diffDays <= 30) d1_30 += inv.outstandingAmount;
          else if (diffDays <= 60) d31_60 += inv.outstandingAmount;
          else if (diffDays <= 90) d61_90 += inv.outstandingAmount;
          else d90_plus += inv.outstandingAmount;
        } else {
          current += inv.outstandingAmount;
        }
      }

      return {
        id: c.id,
        businessName: c.businessName,
        contactPerson: c.contactPerson,
        mobile: c.mobile,
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
      data: {
        totalWholesaleSales,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        activeCustomersCount: customers.length,
        customers: customerAgingList,
      },
    });
  })
);

export default router;
