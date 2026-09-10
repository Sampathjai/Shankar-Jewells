import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../utils/errors.js';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local Multer Disk Storage Configuration
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img_${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.', 400));
  }
};

export const uploadMiddleware = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

export class StorageService {
  /**
   * Check if Cloudinary or S3 credentials are configured in environment
   */
  static isCloudStorageConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ||
      (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME)
    );
  }

  /**
   * Upload file buffer or stream to Cloudinary / Object storage if configured,
   * or return the local relative URL.
   */
  static async uploadFile(file: Express.Multer.File, req?: Request): Promise<{ url: string; storageKey: string }> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const formData = new FormData();
        const blob = new Blob([file.buffer || fs.readFileSync(file.path)], { type: file.mimetype });
        formData.append('file', blob, file.originalname);
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset');

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        const data: any = await res.json();

        if (data.secure_url) {
          return {
            url: data.secure_url,
            storageKey: data.public_id || file.filename,
          };
        }
      } catch (err) {
        console.warn('Cloudinary upload fallback to local disk:', err);
      }
    }

    // Default Local Storage behavior
    const filename = file.filename || path.basename(file.path);
    const fileUrl = `/uploads/${filename}`;
    return {
      url: fileUrl,
      storageKey: filename,
    };
  }

  /**
   * Generates public access URL for uploaded file
   */
  static getFileUrl(filename: string, req?: Request): string {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
    if (filename.startsWith('/uploads/')) return filename;
    return `/uploads/${path.basename(filename)}`;
  }
}
