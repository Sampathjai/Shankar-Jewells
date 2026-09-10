import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { PricingService } from '../pricing/pricing.service.js';
import { PdfService } from '../../services/pdf.service.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// POST /api/billing/checkout (Atomic POS Billing / E-Commerce Order Checkout)
router.post(
  '/checkout',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerGstin,
      items, // Array of { productId, quantity, customDiscount, customMakingOverride }
      paymentMethod = 'CASH',
      splitPayments = [],
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one product.', 400);
    }

    // Execute atomic DB transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get or create Customer
      let customer = null;
      if (customerPhone) {
        customer = await tx.customer.findUnique({ where: { phone: customerPhone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: customerName || 'Walk-in Customer',
              phone: customerPhone,
              email: customerEmail || null,
              address: customerAddress || null,
              gstin: customerGstin || null,
            },
          });
        }
      }

      // 2. Validate products & recalculate prices strictly through PricingEngine
      let subtotal = 0;
      let totalWastage = 0;
      let totalMaking = 0;
      let totalStone = 0;
      let totalTax = 0;
      let grandTotal = 0;

      const orderItemsData = [];
      const invoiceItemsData = [];
      const stockUpdates = [];

      for (const itemInput of items) {
        const product = await tx.product.findUnique({
          where: { id: itemInput.productId },
        });

        if (!product || !product.active) {
          throw new AppError(`Product ID ${itemInput.productId} not available.`, 400);
        }

        const qty = parseInt(itemInput.quantity, 10) || 1;
        if (product.stockQuantity < qty) {
          throw new AppError(
            `Insufficient stock for ${product.name} (SKU: ${product.sku}). Available: ${product.stockQuantity}, Requested: ${qty}`,
            400
          );
        }

        // Fetch current live metal rate
        const rateRecord = await tx.metalRate.findFirst({
          where: { metalType: product.metalType, purity: product.purity, effectiveTo: null },
          orderBy: { effectiveFrom: 'desc' },
        });
        const currentMetalRate = rateRecord ? rateRecord.ratePerGram : 6830.0;

        // Backend Pricing Calculation
        const itemPricing = await PricingService.calculateItemPrice({
          metalType: product.metalType,
          purity: product.purity,
          grossWeight: product.grossWeight,
          netWeight: product.netWeight,
          makingChargeType: product.makingChargeType,
          makingChargeValue: itemInput.customMakingOverride !== undefined ? parseFloat(itemInput.customMakingOverride) : product.makingChargeValue,
          wastageType: product.wastageType,
          wastageValue: product.wastageValue,
          stoneCharge: product.stoneCharge,
          otherCharges: product.otherCharges,
          discount: itemInput.customDiscount ? parseFloat(itemInput.customDiscount) : 0,
          gstRate: product.gstRate,
          overrideMetalRate: currentMetalRate,
        });

        const lineTotal = itemPricing.finalPrice * qty;

        subtotal += itemPricing.subtotal * qty;
        totalMaking += itemPricing.makingCharges * qty;
        totalStone += itemPricing.stoneCharge * qty;
        totalTax += itemPricing.gstAmount * qty;
        grandTotal += lineTotal;

        orderItemsData.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          metalType: product.metalType,
          purity: product.purity,
          grossWeight: product.grossWeight,
          netWeight: product.netWeight,
          metalRate: itemPricing.metalRate,
          makingCharge: itemPricing.makingCharges,
          wastage: itemPricing.wastageGrams,
          stoneCharge: itemPricing.stoneCharge,
          tax: itemPricing.gstAmount,
          unitPrice: itemPricing.finalPrice,
          quantity: qty,
          totalPrice: lineTotal,
        });

        invoiceItemsData.push({
          productId: product.id,
          sku: product.sku,
          description: `${product.name} (${product.purity} ${product.metalType}, ${product.netWeight}g)`,
          quantity: qty,
          grossWeight: product.grossWeight * qty,
          netWeight: product.netWeight * qty,
          metalRate: itemPricing.metalRate,
          makingCharge: itemPricing.makingCharges,
          tax: itemPricing.gstAmount * qty,
          total: lineTotal,
        });

        stockUpdates.push({
          productId: product.id,
          sku: product.sku,
          qty,
          prevStock: product.stockQuantity,
          newStock: product.stockQuantity - qty,
          grossWeight: product.grossWeight * qty,
          netWeight: product.netWeight * qty,
        });
      }

      // 3. Create Order
      const orderCount = await tx.order.count();
      const orderNumber = `ORD-2026-${String(orderCount + 1).padStart(6, '0')}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer?.id || null,
          userId: req.user?.id || null,
          status: 'COMPLETED',
          paymentStatus: 'COMPLETED',
          paymentMethod,
          subtotal,
          totalWastage,
          totalMaking,
          totalStone,
          totalTax,
          grandTotal: Math.round(grandTotal),
          shippingAddress: customerAddress || null,
          billingAddress: customerAddress || null,
          notes,
          items: {
            create: orderItemsData,
          },
        },
      });

      // 4. Create Invoice
      const invCount = await tx.invoice.count();
      const invoiceNumber = `INV-2026-${String(invCount + 1).padStart(6, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerId: customer?.id || null,
          subtotal,
          tax: totalTax,
          grandTotal: Math.round(grandTotal),
          status: 'PAID',
          notes,
          items: {
            create: invoiceItemsData,
          },
        },
      });

      // 5. Create Payment record
      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-2026-${String(payCount + 1).padStart(6, '0')}`;

      await tx.payment.create({
        data: {
          paymentNumber,
          orderId: order.id,
          invoiceId: invoice.id,
          amount: Math.round(grandTotal),
          paymentMethod,
          status: 'COMPLETED',
          notes: splitPayments.length > 0 ? JSON.stringify(splitPayments) : undefined,
        },
      });

      // 6. Update Stock Quantity and record StockTransaction logs
      for (const st of stockUpdates) {
        await tx.product.update({
          where: { id: st.productId },
          data: { stockQuantity: st.newStock },
        });

        await tx.stockTransaction.create({
          data: {
            productId: st.productId,
            transactionType: 'SALE',
            quantity: st.qty,
            grossWeight: st.grossWeight,
            netWeight: st.netWeight,
            previousQuantity: st.prevStock,
            newQuantity: st.newStock,
            previousWeight: st.netWeight * st.prevStock,
            newWeight: st.netWeight * st.newStock,
            referenceType: 'POS_BILLING',
            referenceId: invoice.invoiceNumber,
            userId: req.user?.id,
            notes: `Sold via Invoice ${invoice.invoiceNumber}`,
          },
        });
      }

      // 7. Update Customer spending history
      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: grandTotal },
          },
        });
      }

      return { order, invoice };
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'POS_CHECKOUT',
      entity: 'Invoice',
      entityId: result.invoice.id,
      newValue: { invoiceNumber: result.invoice.invoiceNumber, grandTotal: result.invoice.grandTotal },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Bill finalized! Invoice ${result.invoice.invoiceNumber} generated successfully.`,
      data: result,
    });
  })
);

// GET /api/invoices (List all invoices)
router.get(
  '/invoices',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: invoices,
    });
  })
);

// GET /api/invoices/:id/pdf (Download Invoice PDF)
router.get(
  '/invoices/:id/pdf',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!invoice) throw new AppError('Invoice not found.', 404);

    PdfService.generateInvoicePdf(invoice, res);
  })
);

// GET /api/orders (List all orders)
router.get(
  '/orders',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const where: any = {};
    if (req.user?.role === 'CUSTOMER') {
      const cust = await prisma.customer.findUnique({ where: { userId: req.user.id } });
      if (cust) where.customerId = cust.id;
      else where.userId = req.user.id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { product: { include: { images: true } } } },
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  })
);

export default router;

