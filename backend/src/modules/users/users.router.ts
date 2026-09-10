import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { catchAsync, AppError } from '../../utils/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// Strictly restrict ALL user management endpoints to SUPER_ADMIN
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

// GET /api/users (Super Admin: List system users)
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: users });
  })
);

// POST /api/users (Super Admin: Create system user)
router.post(
  '/',
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { name, email, phone, role, password } = req.body;

    if (!name || !email || !password || !role) {
      throw new AppError('Full Name, Email, Password, and Role are required.', 400);
    }

    const validRoles = [
      'SUPER_ADMIN',
      'STORE_MANAGER',
      'BILLING_STAFF',
      'INVENTORY_STAFF',
      'WHOLESALE_MANAGER',
      'CONSIGNMENT_MANAGER',
      'DESIGNER',
    ];

    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`, 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new AppError('A user with this email address already exists.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        role,
        passwordHash,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: `Created user ${user.email} with role ${user.role}`,
    });

    res.status(201).json({ success: true, data: user, message: 'User created successfully.' });
  })
);

// PATCH /api/users/:id (Super Admin: Update user)
router.patch(
  '/:id',
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, phone, role, active } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('User not found.', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      newValue: JSON.stringify(updatedUser),
    });

    res.status(200).json({ success: true, data: updatedUser, message: 'User updated successfully.' });
  })
);

// POST /api/users/:id/reset-password (Super Admin: Reset password)
router.post(
  '/:id/reset-password',
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('User not found.', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await recordAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: id,
      newValue: `Password reset by Super Admin ${req.user?.email}`,
    });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  })
);

export default router;

