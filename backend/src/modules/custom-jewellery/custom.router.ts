import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { uploadMiddleware, StorageService } from '../../services/storage.service.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// POST /api/custom-requests (Customer or Guest submit custom jewellery request)
router.post(
  '/',
  uploadMiddleware.array('images', 5),
  catchAsync(async (req: Request, res: Response) => {
    const {
      name,
      phone,
      whatsapp,
      email,
      jewelleryType,
      metalType = 'GOLD',
      purity = 'K22',
      approxBudget,
      approxWeight,
      quantity = 1,
      occasion,
      requiredDate,
      notes,
      customerId,
    } = req.body;

    if (!name || !phone || !jewelleryType) {
      throw new AppError('Name, phone number, and jewellery type are required.', 400);
    }

    // Generate unique CR-XXXXXX request number
    const count = await prisma.customRequest.count();
    const requestNumber = `CR-${String(count + 1).padStart(6, '0')}`;

    const files = (req.files as Express.Multer.File[]) || [];
    const imageUrls = files.map((file) => StorageService.getFileUrl(file.filename, req));

    const customRequest = await prisma.customRequest.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        name,
        phone,
        whatsapp: whatsapp || phone,
        email: email || null,
        jewelleryType,
        metalType,
        purity,
        approxBudget: approxBudget ? parseFloat(approxBudget) : null,
        approxWeight: approxWeight ? parseFloat(approxWeight) : null,
        quantity: parseInt(quantity, 10) || 1,
        occasion: occasion || null,
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        notes: notes || null,
        status: 'NEW',
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
        statusHistory: {
          create: [
            {
              status: 'NEW',
              notes: 'Custom design request submitted by customer',
            },
          ],
        },
      },
      include: {
        images: true,
        statusHistory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: customRequest,
      message: `Your custom jewellery request ${requestNumber} has been received! Our master craftsmen will review your design and prepare an estimate shortly.`,
    });
  })
);

// GET /api/custom-requests (Admin List requests with filters)
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'DESIGNER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { status, search } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { requestNumber: { contains: q } },
        { name: { contains: q } },
        { phone: { contains: q } },
        { jewelleryType: { contains: q } },
      ];
    }

    const requests = await prisma.customRequest.findMany({
      where,
      include: {
        images: true,
        quotations: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
          },
        },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  })
);

// GET /api/custom-requests/:id
router.get(
  '/:id',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const request = await prisma.customRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
      include: {
        images: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        quotations: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    if (!request) {
      throw new AppError('Custom request not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  })
);

// POST /api/custom-requests/:id/status (Update pipeline status & internal notes)
router.post(
  '/:id/status',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'DESIGNER'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, notes, assignedStaffId } = req.body;

    const customReq = await prisma.customRequest.findUnique({ where: { id } });
    if (!customReq) throw new AppError('Custom request not found.', 404);

    const updated = await prisma.customRequest.update({
      where: { id },
      data: {
        status: status || customReq.status,
        assignedStaffId: assignedStaffId || customReq.assignedStaffId,
        statusHistory: {
          create: {
            status: status || customReq.status,
            notes: notes || `Status updated to ${status}`,
            changedBy: req.user?.name,
          },
        },
      },
      include: {
        images: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'UPDATE_CUSTOM_REQUEST_STATUS',
      entity: 'CustomRequest',
      entityId: id,
      oldValue: { status: customReq.status },
      newValue: { status, notes },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  })
);

export default router;

