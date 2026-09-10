import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import prisma from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication session. Please sign in again.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, active: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'The user belonging to this session no longer exists.',
      });
    }

    if (!user.active) {
      return res.status(401).json({
        success: false,
        code: 'USER_DEACTIVATED',
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication error. Please log in again.',
    });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Permission denied. Role '${req.user.role}' is not authorized to access this route. Required roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

