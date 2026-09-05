import { Router } from 'express';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { getJalaliDateTimeString, todayJalaliString } from '../../utils/persianDate';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/roster/:yearMonth
 * Get driver roster for a specific month
 */
router.get('/:yearMonth', asyncHandler(async (req, res) => {
  const { yearMonth } = req.params;

  // Get all drivers
  const allDrivers = await prisma.driver.findMany({
    orderBy: { fullName: 'asc' },
    include: { user: { select: { username: true } } },
  });

  // Get trips count per driver for this month
  const monthTrips = await prisma.trip.groupBy({
    by: ['driverId'],
    where: { tripJalaliDate: { startsWith: yearMonth } },
    _count: { id: true },
    _sum: { snapshotPrice: true },
  });

  // Get daily work logs per driver for this month
  const monthDailyWorks = await prisma.dailyWorkLog.groupBy({
    by: ['driverId', 'status'],
    where: { jalaliDate: { startsWith: yearMonth } },
    _count: { id: true },
    _sum: { totalIncome: true },
  });

  // Build roster
  const tripsMap = new Map(monthTrips.map(t => [t.driverId, { count: t._count.id, total: Number(t._sum.snapshotPrice || 0) }]));
  const dailyWorksMap = new Map<string, { draft: number; finalized: number; pending: number; totalIncome: number }>();

  monthDailyWorks.forEach(dw => {
    const existing = dailyWorksMap.get(dw.driverId) || { draft: 0, finalized: 0, pending: 0, totalIncome: 0 };
    if (dw.status === 'DRAFT') existing.draft = dw._count.id;
    else if (dw.status === 'FINALIZED') existing.finalized = dw._count.id;
    else if (dw.status === 'PENDING_APPROVAL') existing.pending = dw._count.id;
    existing.totalIncome += Number(dw._sum.totalIncome || 0);
    dailyWorksMap.set(dw.driverId, existing);
  });

  const roster = allDrivers.map(driver => {
    const tripData = tripsMap.get(driver.id) || { count: 0, total: 0 };
    const workData = dailyWorksMap.get(driver.id) || { draft: 0, finalized: 0, pending: 0, totalIncome: 0 };

    return {
      driverId: driver.id,
      driverCode: driver.driverCode,
      fullName: driver.fullName,
      personnelCode: driver.personnelCode,
      phoneNumber: driver.phoneNumber,
      carModel: driver.carModel,
      isActive: driver.isActive,
      username: driver.user?.username || '',
      monthlyStats: {
        totalTrips: tripData.count,
        totalIncome: tripData.total,
        workingDays: workData.draft + workData.finalized + workData.pending,
        finalizedDays: workData.finalized,
        pendingDays: workData.pending,
        draftDays: workData.draft,
      },
    };
  });

  res.json({
    success: true,
    data: {
      yearMonth,
      roster,
      summary: {
        totalDrivers: allDrivers.length,
        activeDrivers: allDrivers.filter(d => d.isActive).length,
        totalTrips: roster.reduce((sum, r) => sum + r.monthlyStats.totalTrips, 0),
        totalIncome: roster.reduce((sum, r) => sum + r.monthlyStats.totalIncome, 0),
      },
    },
  });
}));

/**
 * PUT /api/roster/:yearMonth/:driverId/toggle
 * Toggle driver active status for a specific month
 */
router.put('/:yearMonth/:driverId/toggle', asyncHandler(async (req, res) => {
  const { yearMonth, driverId } = req.params;
  const { isActive } = req.body;

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw AppError.notFound('راننده یافت نشد');
  }

  // Update driver status
  await prisma.driver.update({
    where: { id: driverId },
    data: { isActive: isActive !== undefined ? isActive : !driver.isActive },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'UPDATE_DRIVER_STATUS',
      entityTitle: driver.fullName,
      details: `تغییر وضعیت راننده ${driver.fullName} در ماه ${yearMonth} به ${isActive ? 'فعال' : 'غیرفعال'}`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, message: `وضعیت راننده ${driver.fullName} تغییر کرد` });
}));

/**
 * POST /api/roster/calculate
 * Auto-calculate and finalize all pending daily works for a month
 */
router.post('/calculate', asyncHandler(async (req, res) => {
  const { yearMonth, driverIds } = req.body;

  if (!yearMonth) {
    throw AppError.badRequest('ماه شمسی الزامی است');
  }

  // Get all daily works for this month that are DRAFT or PENDING_APPROVAL
  const where: any = {
    jalaliDate: { startsWith: yearMonth },
    status: { in: ['DRAFT', 'PENDING_APPROVAL'] },
  };

  if (driverIds && driverIds.length > 0) {
    where.driverId = { in: driverIds };
  }

  const dailyWorks = await prisma.dailyWorkLog.findMany({
    where,
    include: { driver: true, trips: true },
  });

  let updatedCount = 0;
  let totalCalculatedIncome = 0;

  for (const work of dailyWorks) {
    // Recalculate totals from trips
    const trips = await prisma.trip.findMany({
      where: { dailyWorkId: work.id },
    });

    const totalTrips = trips.length;
    const totalIncome = trips.reduce((sum, t) => sum + Number(t.snapshotPrice), 0);

    // Auto-submit for approval
    await prisma.dailyWorkLog.update({
      where: { id: work.id },
      data: {
        totalTrips,
        totalIncome: BigInt(totalIncome),
        status: 'PENDING_APPROVAL',
      },
    });

    totalCalculatedIncome += totalIncome;
    updatedCount++;
  }

  // Create or update financial period
  const existingPeriod = await prisma.financialPeriod.findUnique({
    where: { jalaliYearMonth: yearMonth },
  });

  await prisma.financialPeriod.upsert({
    where: { jalaliYearMonth: yearMonth },
    create: {
      jalaliYearMonth: yearMonth,
      status: 'PENDING_APPROVAL',
      totalAmount: BigInt(totalCalculatedIncome),
      notes: `محاسبه خودکار: ${updatedCount} کارکرد`,
    },
    update: {
      totalAmount: BigInt(totalCalculatedIncome),
      notes: `بروزرسانی خودکار: ${updatedCount} کارکرد`,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'AUTO_CALCULATE',
      entityTitle: `محاسبه خودکار ماه ${yearMonth}`,
      details: `${updatedCount} کارکرد روزانه محاسبه و ارسال شد. مجموع: ${totalCalculatedIncome.toLocaleString('fa-IR')} تومان`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({
    success: true,
    data: {
      updatedCount,
      totalCalculatedIncome,
      yearMonth,
    },
    message: `${updatedCount} کارکرد محاسبه و ارسال شد. مجموع: ${totalCalculatedIncome.toLocaleString('fa-IR')} تومان`,
  });
}));

/**
 * POST /api/roster/bulk-finalize
 * Bulk finalize all pending approvals for a month
 */
router.post('/bulk-finalize', asyncHandler(async (req, res) => {
  const { yearMonth } = req.body;

  if (!yearMonth) {
    throw AppError.badRequest('ماه شمسی الزامی است');
  }

  const pendingWorks = await prisma.dailyWorkLog.findMany({
    where: {
      jalaliDate: { startsWith: yearMonth },
      status: 'PENDING_APPROVAL',
    },
  });

  let finalizedCount = 0;

  for (const work of pendingWorks) {
    await prisma.dailyWorkLog.update({
      where: { id: work.id },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        approvedBy: req.user!.username,
      },
    });
    finalizedCount++;
  }

  // Update financial period
  await prisma.financialPeriod.upsert({
    where: { jalaliYearMonth: yearMonth },
    create: {
      jalaliYearMonth: yearMonth,
      status: 'APPROVED',
      approvedBy: req.user!.username,
    },
    update: {
      status: 'APPROVED',
      approvedBy: req.user!.username,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'BULK_FINALIZE',
      entityTitle: `نهایی‌سازی دسته‌جمعی ماه ${yearMonth}`,
      details: `${finalizedCount} کارکرد تأیید و نهایی شد`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({
    success: true,
    data: { finalizedCount, yearMonth },
    message: `${finalizedCount} کارکرد نهایی شد`,
  });
}));

export default router;
