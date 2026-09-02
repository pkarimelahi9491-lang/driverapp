import { Router } from 'express';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';

const router = Router();
router.use(authenticate);

/**
 * GET /api/locations
 * List all active locations
 */
router.get('/', asyncHandler(async (req, res) => {
  const { search, includeInactive } = req.query;

  const where: any = {};
  if (includeInactive !== 'true') {
    where.isActive = true;
  }
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { city: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const locations = await prisma.location.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: locations });
}));

/**
 * POST /api/locations
 * Create new location (Admin only)
 */
router.post('/', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { name, city } = req.body;
  if (!name || !city) {
    throw AppError.badRequest('نام مکان و شهر الزامی است');
  }

  const existing = await prisma.location.findFirst({ where: { name } });
  if (existing) {
    throw AppError.conflict('این مکان قبلاً تعریف شده است');
  }

  const location = await prisma.location.create({
    data: { name, city },
  });

  res.status(201).json({ success: true, data: location });
}));

export default router;
