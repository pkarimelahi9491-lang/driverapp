import { Router } from 'express';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { getJalaliDateTimeString } from '../../utils/persianDate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/daily-work
 * List daily work logs with filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const { driverId, date, yearMonth, status, page = '1', limit = '100' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};

  if (req.user!.role === 'DRIVER') {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.userId } });
    if (driver) where.driverId = driver.id;
  } else if (driverId) {
    where.driverId = driverId;
  }

  if (date) where.jalaliDate = date;
  else if (yearMonth) where.jalaliDate = { startsWith: yearMonth as string };
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.dailyWorkLog.findMany({
      where,
      include: { driver: true, trips: true },
      orderBy: { jalaliDate: 'desc' },
      skip,
      take,
    }),
    prisma.dailyWorkLog.count({ where }),
  ]);

  // Enrich with driver info if needed
  const enriched = logs.map(log => ({
    ...log,
    driverName: log.driver?.fullName || '',
    driverCode: log.driver?.driverCode || '',
    personnelCode: log.driver?.personnelCode || '',
  }));

  res.json({
    success: true,
    data: enriched,
    pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) },
  });
}));

/**
 * GET /api/daily-work/:driverId/:date
 * Get specific daily work with trips
 */
router.get('/:driverId/:date', asyncHandler(async (req, res) => {
  const { driverId, date } = req.params;

  // Drivers can only view their own
  if (req.user!.role === 'DRIVER') {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.userId } });
    if (!driver || driver.id !== driverId) {
      throw AppError.forbidden('شما فقط کارکرد خودتان را می‌توانید مشاهده کنید');
    }
  }

  const dailyWork = await prisma.dailyWorkLog.findFirst({
    where: { driverId, jalaliDate: date },
    include: { trips: { orderBy: { createdAt: 'asc' } }, driver: true },
  });

  if (!dailyWork) {
    res.json({ success: true, data: null });
    return;
  }

  res.json({ success: true, data: dailyWork });
}));

/**
 * POST /api/daily-work/submit
 * Submit daily work for approval (Driver action)
 */
router.post('/submit', asyncHandler(async (req, res) => {
  const { driverId, jalaliDate } = req.body;

  if (!driverId || !jalaliDate) {
    throw AppError.badRequest('شناسه راننده و تاریخ الزامی است');
  }

  // Drivers can only submit their own
  if (req.user!.role === 'DRIVER') {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.userId } });
    if (!driver || driver.id !== driverId) {
      throw AppError.forbidden('شما فقط کارکرد خودتان را می‌توانید ارسال کنید');
    }
  }

  const dailyWork = await prisma.dailyWorkLog.findFirst({
    where: { driverId, jalaliDate },
    include: { driver: true },
  });

  if (!dailyWork) {
    throw AppError.notFound('کارکردی برای این تاریخ ثبت نشده است');
  }

  if (dailyWork.status === 'FINALIZED') {
    throw AppError.badRequest('کارکرد قبلاً نهایی شده است');
  }
  if (dailyWork.status === 'PENDING_APPROVAL') {
    throw AppError.badRequest('کارکرد قبلاً به مدیریت ارسال شده است');
  }

  if (dailyWork.totalTrips === 0) {
    throw AppError.badRequest('حداقل یک سفر باید ثبت شده باشد');
  }

  const updated = await prisma.dailyWorkLog.update({
    where: { id: dailyWork.id },
    data: { status: 'PENDING_APPROVAL' },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: dailyWork.driver?.fullName || req.user!.username,
      operatorRole: 'DRIVER',
      action: 'SUBMIT_FOR_APPROVAL',
      entityTitle: `کارکرد روز ${jalaliDate}`,
      details: `ارسال کارکرد ${dailyWork.totalTrips} سفر به ارزش ${dailyWork.totalIncome} تومان جهت تأیید`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: updated });
}));

/**
 * POST /api/daily-work/:id/approve
 * Approve daily work (Admin only)
 */
router.post('/:id/approve', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const dailyWork = await prisma.dailyWorkLog.findUnique({
    where: { id: req.params.id },
    include: { driver: true },
  });

  if (!dailyWork) {
    throw AppError.notFound('کارکرد یافت نشد');
  }

  if (dailyWork.status === 'FINALIZED') {
    throw AppError.badRequest('کارکرد قبلاً تأیید شده است');
  }

  const updated = await prisma.dailyWorkLog.update({
    where: { id: req.params.id },
    data: {
      status: 'FINALIZED',
      finalizedAt: new Date(),
      approvedBy: req.user!.username,
      rejectionReason: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'APPROVE_DAILY_WORK',
      entityTitle: `تأیید کارکرد ${dailyWork.jalaliDate} (${dailyWork.driver?.fullName})`,
      details: `تأیید نهایی کارکرد ${dailyWork.totalTrips} سفر به ارزش ${dailyWork.totalIncome} تومان`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: updated });
}));

/**
 * POST /api/daily-work/:id/reject
 * Reject daily work (Admin only)
 */
router.post('/:id/reject', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    throw AppError.badRequest('دلیل رد الزامی است');
  }

  const dailyWork = await prisma.dailyWorkLog.findUnique({
    where: { id: req.params.id },
    include: { driver: true },
  });

  if (!dailyWork) {
    throw AppError.notFound('کارکرد یافت نشد');
  }

  const updated = await prisma.dailyWorkLog.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      approvedBy: req.user!.username,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'REJECT_DAILY_WORK',
      entityTitle: `رد کارکرد ${dailyWork.jalaliDate} (${dailyWork.driver?.fullName})`,
      details: `رد کارکرد به علت: «${reason}»`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: updated });
}));

/**
 * POST /api/daily-work/:id/unlock
 * Unlock daily work for editing (Admin only)
 */
router.post('/:id/unlock', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const dailyWork = await prisma.dailyWorkLog.findUnique({
    where: { id: req.params.id },
    include: { driver: true },
  });

  if (!dailyWork) {
    throw AppError.notFound('کارکرد یافت نشد');
  }

  const updated = await prisma.dailyWorkLog.update({
    where: { id: req.params.id },
    data: {
      status: 'DRAFT',
      finalizedAt: null,
      approvedBy: null,
      rejectionReason: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'UNLOCK_DAILY_WORK',
      entityTitle: `بازگشایی کارکرد ${dailyWork.jalaliDate} (${dailyWork.driver?.fullName})`,
      details: `بازگشایی کارکرد جهت ویرایش مجدد توسط مدیر ناوگان`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: updated });
}));

export default router;
