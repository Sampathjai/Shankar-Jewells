import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth.js';
import { catchAsync, AppError } from '../../utils/errors.js';

const router = Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.', 400) as any, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload/image (Admin & Staff: Upload product/category image)
router.post(
  '/image',
  authenticate,
  authorize('SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF', 'DESIGNER', 'WHOLESALE_MANAGER'),
  upload.single('image'),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No image file uploaded.', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: fileUrl,
      storageKey: req.file.filename,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: 'Image uploaded successfully.',
    });
  })
);

export default router;

