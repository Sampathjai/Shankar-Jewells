import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { signToken, sendTokenCookie } from '../../utils/jwt.js';
import { AppError, catchAsync } from '../../utils/errors.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.js';
import { recordAuditLog } from '../../middleware/audit.js';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError('Invalid credentials.', 401);
    }

    if (!user.active) {
      throw new AppError('Account deactivated. Please contact administrator.', 403);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    sendTokenCookie(res, token);

    await recordAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  })
);

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  })
);

export default router;

