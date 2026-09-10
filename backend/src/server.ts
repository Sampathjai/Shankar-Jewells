import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

import authRouter from './modules/auth/auth.router.js';
import metalRatesRouter from './modules/metal-rates/metal-rates.router.js';
import pricingRouter from './modules/pricing/pricing.router.js';
import productsRouter from './modules/products/products.router.js';
import categoriesRouter from './modules/products/categories.router.js';
import customRouter from './modules/custom-jewellery/custom.router.js';
import quotationsRouter from './modules/custom-jewellery/quotations.router.js';
import inventoryRouter from './modules/inventory/inventory.router.js';
import billingRouter from './modules/billing/billing.router.js';
import reportsRouter from './modules/reports/reports.router.js';
import wholesaleRouter from './modules/wholesale/wholesale.router.js';
import usersRouter from './modules/users/users.router.js';
import uploadRouter from './modules/upload/upload.router.js';

import { errorHandler } from './utils/errors.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static File Uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

import prisma from './config/db.js';

// Healthcheck & Database Diagnostic Endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    system: 'Gold & Silver Jewellery Business Platform API',
    timestamp: new Date(),
  });
});

app.get('/api/health/database', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      api: 'ok',
      database: 'ok',
      timestamp: new Date(),
    });
  } catch (err: any) {
    res.status(500).json({
      api: 'ok',
      database: 'error',
      message: err.message,
    });
  }
});

// API Routes Registration
app.use('/api/auth', authRouter);
app.use('/api/metal-rates', metalRatesRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/custom-requests', customRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/billing', billingRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/wholesale', wholesaleRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);

// Global Error Handler
app.use(errorHandler);

// Production Static Frontend Asset Serving
import fs from 'fs';
const rootFrontendDist = path.resolve(process.cwd(), '../frontend/dist');
const localFrontendDist = path.resolve(__dirname, '../../frontend/dist');
const distPath = fs.existsSync(rootFrontendDist) ? rootFrontendDist : fs.existsSync(localFrontendDist) ? localFrontendDist : null;

if (distPath) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✨ Jewellery Platform Backend API listening on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});

