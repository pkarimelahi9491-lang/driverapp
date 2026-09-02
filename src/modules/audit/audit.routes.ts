import { Router } from 'express';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'FINANCE'));

/**
 * GET /api/audit
 * List audit logs with filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const { action, operatorRole, page = '1', limit = '100' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};
  if (action) where.action = action;
  if (operatorRole) where.operatorRole = operatorRole;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) },
  });
}));

export default router;
