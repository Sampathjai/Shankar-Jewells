import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

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
import prisma from './config/db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Dynamic CORS configuration supporting Render environment variables
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_SITE_URL,
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGINS,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed) || allowed.includes(origin))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static File Uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Root & API Health Check Endpoints for Render / Health Monitoring
app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }
  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    system: 'Shanker Jewells API',
    timestamp: new Date(),
  });
});

app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }
  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    system: 'Gold & Silver Jewellery Business Platform API',
    timestamp: new Date(),
  });
});

app.get('/api/health/database', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      api: 'ok',
      database: 'connected',
      timestamp: new Date(),
    });
  } catch (err: any) {
    res.status(500).json({
      api: 'ok',
      database: 'disconnected',
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
const rootFrontendDist = path.resolve(process.cwd(), '../frontend/dist');
const localFrontendDist = path.resolve(__dirname, '../../frontend/dist');
const distPath = fs.existsSync(rootFrontendDist) ? rootFrontendDist : fs.existsSync(localFrontendDist) ? localFrontendDist : null;

if (distPath) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Bind to 0.0.0.0 as required by Render and containerized environments
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Shanker Jewells Backend API listening on 0.0.0.0:${PORT}`);
  console.log(`📍 Health Check: http://0.0.0.0:${PORT}/health`);

  // Safe Database Startup Health Check
  prisma.$queryRaw`SELECT 1`
    .then(() => {
      console.log('Database:\nConnected');
    })
    .catch((err) => {
      console.error('Database:\nConnection failed');
      console.error('Error detail:', err.message);
    });
});
