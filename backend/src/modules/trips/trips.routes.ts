import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { getJalaliDateTimeString } from '../../utils/persianDate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/trips
 * List trips with filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const { driverId, date, yearMonth, page = '1', limit = '100' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};

  // Drivers can only see their own trips
  if (req.user!.role === 'DRIVER') {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.userId } });
    if (driver) where.driverId = driver.id;
  } else if (driverId) {
    where.driverId = driverId;
  }

  if (date) where.tripJalaliDate = date;
  else if (yearMonth) where.tripJalaliDate = { startsWith: yearMonth as string };

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { route: { include: { origin: true, destination: true } } },
    }),
    prisma.trip.count({ where }),
  ]);

  res.json({
    success: true,
    data: trips,
    pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) },
  });
}));

/**
 * POST /api/trips
 * Register a new trip (Driver only)
 */
router.post('/', asyncHandler(async (req, res) => {
  // Get driver profile
  const driver = await prisma.driver.findFirst({ where: { userId: req.user!.userId } });
  if (!driver) {
    throw AppError.notFound('پروفایل راننده یافت نشد');
  }
  if (!driver.isActive) {
    throw AppError.forbidden('حساب راننده غیرفعال است');
  }

  const { routeId, tripJalaliDate, startTime, endTime, description } = req.body;

  if (!routeId || !tripJalaliDate || !startTime) {
    throw AppError.badRequest('مسیر، تاریخ و ساعت شروع الزامی است');
  }

  // Get the route and its current price (immutable snapshot)
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: { origin: true, destination: true },
  });
  if (!route) {
    throw AppError.notFound('مسیر مورد نظر یافت نشد');
  }
  if (!route.isActive) {
    throw AppError.badRequest('این مسیر غیرفعال است');
  }

  // Check daily work status
  const dailyWork = await prisma.dailyWorkLog.findFirst({
    where: { driverId: driver.id, jalaliDate: tripJalaliDate },
  });

  if (dailyWork?.status === 'FINALIZED') {
    throw AppError.badRequest('کارکرد این تاریخ نهایی شده و قفل است. با مدیر سیستم تماس بگیرید.');
  }
  if (dailyWork?.status === 'PENDING_APPROVAL') {
    throw AppError.badRequest('کارکرد این تاریخ به مدیریت ارسال شده است.');
  }

  // Create or get daily work log
  const dailyWorkId = dailyWork?.id || `dw-${tripJalaliDate.replace(/\//g, '')}-${driver.id.slice(-4)}`;
  if (!dailyWork) {
    await prisma.dailyWorkLog.create({
      data: {
        id: dailyWorkId,
        driverId: driver.id,
        jalaliDate: tripJalaliDate,
        status: 'DRAFT',
      },
    });
  }

  // Generate unique trip code
  const tripId = uuidv4();
  const tripCode = `TRP-${tripJalaliDate.replace(/\//g, '')}-${String(Math.floor(100 + Math.random() * 900))}`;

  // CRITICAL: Snapshot the current price - this NEVER changes after creation
  const trip = await prisma.trip.create({
    data: {
      id: tripId,
      tripCode,
      dailyWorkId,
      driverId: driver.id,
      routeId: route.id,
      originTitle: route.origin?.name || `مبدأ #${route.originId}`,
      destinationTitle: route.destination?.name || `مقصد #${route.destinationId}`,
      routeCode: route.routeCode,
      snapshotPrice: route.currentPrice, // IMMUTABLE PRICE SNAPSHOT
      currency: route.currency,
      tripJalaliDate,
      startTime,
      endTime: endTime || null,
      description: description || '',
    },
  });

  // Update daily work totals
  const allDayTrips = await prisma.trip.findMany({
    where: { dailyWorkId },
  });
  const totalTrips = allDayTrips.length;
  const totalIncome = allDayTrips.reduce((sum, t) => sum + Number(t.snapshotPrice), 0);

  await prisma.dailyWorkLog.update({
    where: { id: dailyWorkId },
    data: {
      totalTrips,
      totalIncome: BigInt(totalIncome),
      status: 'DRAFT',
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: driver.fullName,
      operatorRole: 'DRIVER',
      action: 'REGISTER_TRIP',
      entityTitle: `سفر ${tripCode}`,
      details: `ثبت سفر ${route.origin?.name || 'نامشخص'} ← ${route.destination?.name || 'نامشخص'} (${route.routeCode}) به مبلغ ${route.currentPrice} تومان`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.status(201).json({
    success: true,
    data: {
      ...trip,
      route: {
        routeCode: route.routeCode,
        originName: route.origin?.name || '',
        destinationName: route.destination?.name || '',
        currentPrice: Number(route.currentPrice),
      },
    },
  });
}));

/**
 * DELETE /api/trips/:id
 * Delete a trip (Driver only, if not finalized)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) {
    throw AppError.notFound('سفر یافت نشد');
  }

  // Drivers can only delete their own trips
  if (req.user!.role === 'DRIVER') {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.userId } });
    if (!driver || trip.driverId !== driver.id) {
      throw AppError.forbidden('شما فقط سفرهای خودتان را می‌توانید حذف کنید');
    }
  }

  // Check if daily work is finalized
  const dailyWork = await prisma.dailyWorkLog.findUnique({ where: { id: trip.dailyWorkId } });
  if (dailyWork?.status === 'FINALIZED') {
    throw AppError.badRequest('امکان حذف سفر در کارکرد نهایی شده وجود ندارد');
  }
  if (dailyWork?.status === 'PENDING_APPROVAL') {
    throw AppError.badRequest('امکان حذف سفر در وضعیت در انتظار تأیید وجود ندارد');
  }

  await prisma.trip.delete({ where: { id: req.params.id } });

  // Recalculate daily totals
  const remainingTrips = await prisma.trip.findMany({
    where: { dailyWorkId: trip.dailyWorkId },
  });
  const totalTrips = remainingTrips.length;
  const totalIncome = remainingTrips.reduce((sum, t) => sum + Number(t.snapshotPrice), 0);

  await prisma.dailyWorkLog.update({
    where: { id: trip.dailyWorkId },
    data: {
      totalTrips,
      totalIncome: BigInt(totalIncome),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'DELETE_TRIP',
      entityTitle: `سفر ${trip.tripCode}`,
      details: `حذف سفر ${trip.routeCode} (${trip.originTitle} ← ${trip.destinationTitle})`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, message: 'سفر با موفقیت حذف شد' });
}));

export default router;
