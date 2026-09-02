import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { getJalaliDateTimeString } from '../../utils/persianDate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/drivers
 * List all drivers (Admin/Finance)
 */
router.get('/', authorize('ADMIN', 'FINANCE'), asyncHandler(async (req, res) => {
  const { search, isActive, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { driverCode: { contains: search as string, mode: 'insensitive' } },
      { personnelCode: { contains: search as string, mode: 'insensitive' } },
      { phoneNumber: { contains: search as string } },
    ];
  }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      include: { user: { select: { id: true, username: true, role: true } } },
      orderBy: { fullName: 'asc' },
      skip,
      take,
    }),
    prisma.driver.count({ where }),
  ]);

  res.json({
    success: true,
    data: drivers,
    pagination: {
      page: parseInt(page as string),
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  });
}));

/**
 * GET /api/drivers/:id
 * Get driver details with stats
 */
router.get('/:id', authorize('ADMIN', 'FINANCE'), asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, username: true, role: true } } },
  });

  if (!driver) {
    throw AppError.notFound('راننده یافت نشد');
  }

  // Get today's stats
  const today = new Date();
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  const [todayTrips, monthlyTrips] = await Promise.all([
    prisma.trip.count({ where: { driverId: driver.id, tripJalaliDate: todayStr } }),
    prisma.trip.findMany({
      where: {
        driverId: driver.id,
        tripJalaliDate: { startsWith: todayStr.substring(0, 7) },
      },
    }),
  ]);

  const todayIncome = (await prisma.trip.findMany({
    where: { driverId: driver.id, tripJalaliDate: todayStr },
  })).reduce((sum, t) => sum + Number(t.snapshotPrice), 0);

  const monthlyIncome = monthlyTrips.reduce((sum, t) => sum + Number(t.snapshotPrice), 0);

  res.json({
    success: true,
    data: {
      ...driver,
      stats: {
        todayTrips,
        todayIncome,
        monthlyTrips: monthlyTrips.length,
        monthlyIncome,
      },
    },
  });
}));

/**
 * POST /api/drivers
 * Create a new driver (Admin only)
 */
router.post('/', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { fullName, driverCode, personnelCode, phoneNumber, nationalId, carModel, carPlate, joinDateJalali, description } = req.body;

  if (!fullName || !driverCode || !personnelCode || !phoneNumber || !carModel || !carPlate) {
    throw AppError.badRequest('فیلدهای الزامی را پر کنید: نام، کد راننده، کد پرسنلی، تلفن، خودرو، پلاک');
  }

  // Check uniqueness
  const existing = await prisma.driver.findFirst({
    where: { OR: [{ driverCode }, { personnelCode }] },
  });
  if (existing) {
    throw AppError.conflict('کد راننده یا کد پرسنلی تکراری است');
  }

  // Create user account for the driver
  const username = driverCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const defaultPassword = '123456';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'DRIVER',
    },
  });

  const driver = await prisma.driver.create({
    data: {
      userId: user.id,
      fullName,
      driverCode,
      personnelCode,
      phoneNumber,
      nationalId: nationalId || null,
      carModel,
      carPlate,
      joinDateJalali: joinDateJalali || new Date().toISOString().slice(0, 10),
      description: description || '',
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'CREATE_DRIVER',
      entityTitle: fullName,
      details: `ایجاد راننده جدید ${fullName} با کد ${driverCode}`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.status(201).json({
    success: true,
    data: driver,
    message: `حساب کاربری راننده ایجاد شد. نام کاربری: ${username}, رمز پیش‌فرض: ${defaultPassword}`,
  });
}));

/**
 * PUT /api/drivers/:id
 * Update driver info (Admin only)
 */
router.put('/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw AppError.notFound('راننده یافت نشد');
  }

  const { fullName, phoneNumber, nationalId, carModel, carPlate, description } = req.body;

  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: {
      ...(fullName && { fullName }),
      ...(phoneNumber && { phoneNumber }),
      ...(nationalId !== undefined && { nationalId }),
      ...(carModel && { carModel }),
      ...(carPlate && { carPlate }),
      ...(description !== undefined && { description }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'UPDATE_DRIVER',
      entityTitle: driver.fullName,
      details: `ویرایش اطلاعات راننده ${driver.fullName}`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: driver });
}));

/**
 * DELETE /api/drivers/:id
 * Delete driver and associated user account (Admin only)
 */
router.delete('/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!existing) {
    throw AppError.notFound('راننده یافت نشد');
  }

  // Check if driver has trips
  const tripCount = await prisma.trip.count({ where: { driverId: req.params.id } });
  if (tripCount > 0) {
    throw AppError.badRequest(`این راننده ${tripCount} سفر ثبت شده دارد. ابتدا سفرها را حذف کنید یا راننده را غیرفعال کنید.`);
  }

  // Check if driver has daily work logs
  const dailyWorkCount = await prisma.dailyWorkLog.count({ where: { driverId: req.params.id } });
  if (dailyWorkCount > 0) {
    throw AppError.badRequest(`این راننده ${dailyWorkCount} روز کارکرد ثبت شده دارد. ابتدا کارکردها را حذف کنید یا راننده را غیرفعال کنید.`);
  }

  // Delete driver first, then user
  await prisma.driver.delete({ where: { id: req.params.id } });
  if (existing.userId) {
    await prisma.user.delete({ where: { id: existing.userId } });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'DELETE_DRIVER',
      entityTitle: existing.fullName,
      details: `حذف راننده ${existing.fullName} (${existing.driverCode})`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, message: `راننده ${existing.fullName} با موفقیت حذف شد` });
}));

/**
 * PATCH /api/drivers/:id/toggle
 * Toggle driver active status
 */
router.patch('/:id/toggle', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw AppError.notFound('راننده یافت نشد');
  }

  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { isActive: !existing.isActive },
  });

  const statusText = driver.isActive ? 'فعال' : 'غیرفعال';

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'TOGGLE_DRIVER_STATUS',
      entityTitle: driver.fullName,
      details: `تغییر وضعیت راننده ${driver.fullName} به ${statusText}`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: driver });
}));

/**
 * GET /api/drivers/:id/trips
 * Get driver's trip history
 */
router.get('/:id/trips', authorize('ADMIN', 'FINANCE'), asyncHandler(async (req, res) => {
  const { yearMonth, page = '1', limit = '100' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = { driverId: req.params.id };
  if (yearMonth) {
    where.tripJalaliDate = { startsWith: yearMonth as string };
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
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
 * GET /api/drivers/:id/daily-work
 * Get driver's daily work logs
 */
router.get('/:id/daily-work', authorize('ADMIN', 'FINANCE'), asyncHandler(async (req, res) => {
  const { yearMonth } = req.query;

  const where: any = { driverId: req.params.id };
  if (yearMonth) {
    where.jalaliDate = { startsWith: yearMonth as string };
  }

  const dailyLogs = await prisma.dailyWorkLog.findMany({
    where,
    orderBy: { jalaliDate: 'desc' },
    include: { trips: true },
  });

  res.json({ success: true, data: dailyLogs });
}));

export default router;

