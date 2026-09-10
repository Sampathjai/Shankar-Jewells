import { Router, Request, Response } from 'express';
import prisma from '../../config/db.js';
import { catchAsync } from '../../utils/errors.js';

const router = Router();

// GET /api/categories
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true' || req.query.admin === 'true';

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        children: true,
        subcategories: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
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

// POST /api/categories (Admin: Create category)
router.post(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { name, slug, description, imageUrl, metalType } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug: generatedSlug,
        description: description || null,
        imageUrl: imageUrl || null,
        metalType: metalType || null,
        active: true,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  })
);

// PATCH /api/categories/:id (Admin: Update category)
router.patch(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, slug, description, imageUrl, metalType, active } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(metalType !== undefined && { metalType }),
        ...(active !== undefined && { active }),
      },
    });

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  })
);

// DELETE /api/categories/:id (Admin: Delete or deactivate category)
router.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (existing._count.products > 0) {
      // Soft-deactivate if products exist
      const updated = await prisma.category.update({
        where: { id },
        data: { active: false },
      });
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Category deactivated because products are attached to it',
      });
    }

    await prisma.category.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

export default router;

