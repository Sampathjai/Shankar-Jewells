import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync } from '../../utils/errors.js';

const router = Router();

// GET /api/categories
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      where: { active: true, parentId: null },
      include: {
        children: true,
        subcategories: true,
      },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  })
);

// GET /api/collections
router.get(
  '/collections',
  catchAsync(async (req: Request, res: Response) => {
    const collections = await prisma.collection.findMany({
      where: { active: true },
    });

    res.status(200).json({
      success: true,
      data: collections,
    });
  })
);

export default router;

