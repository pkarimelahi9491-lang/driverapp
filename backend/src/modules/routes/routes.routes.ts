import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { getJalaliDateTimeString, todayJalaliString } from '../../utils/persianDate';
import { parseCsvTiers, guessCityForLocation, FLEET_CSV_RAW } from '../../utils/csvParser';

const router = Router();
router.use(authenticate);

/**
 * GET /api/routes
 * List all routes with optional search
 */
router.get('/', asyncHandler(async (req, res) => {
  const { search, isActive, page = '1', limit = '100' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { routeCode: { contains: search as string, mode: 'insensitive' } },
      { origin: { name: { contains: search as string, mode: 'insensitive' } } },
      { destination: { name: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const [routes, total] = await Promise.all([
    prisma.route.findMany({
      where,
      include: { origin: true, destination: true },
      orderBy: { routeCode: 'asc' },
      skip,
      take,
    }),
    prisma.route.count({ where }),
  ]);

  res.json({
    success: true,
    data: routes,
    pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) },
  });
}));

/**
 * POST /api/routes/lookup
 * Look up a route by origin + destination (Driver use)
 */
router.post('/lookup', asyncHandler(async (req, res) => {
  const { originName, destinationName } = req.body;

  if (!originName || !destinationName) {
    throw AppError.badRequest('مبدأ و مقصد الزامی است');
  }

  const origin = await prisma.location.findFirst({ where: { name: originName, isActive: true } });
  const destination = await prisma.location.findFirst({ where: { name: destinationName, isActive: true } });

  if (!origin) {
    throw AppError.notFound('مبدأ مورد نظر در سیستم تعریف نشده است');
  }
  if (!destination) {
    throw AppError.notFound('مقصد مورد نظر در سیستم تعریف نشده است');
  }

  const route = await prisma.route.findFirst({
    where: { originId: origin.id, destinationId: destination.id, isActive: true },
    include: { origin: true, destination: true },
  });

  if (!route) {
    throw AppError.notFound('این مسیر در سیستم تعریف نشده است. لطفاً با مسئول کارکرد تماس بگیرید.');
  }

  res.json({ success: true, data: route });
}));

/**
 * POST /api/routes
 * Create new route (Admin only)
 */
router.post('/', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { routeCode, originId, destinationId, currentPrice, distanceKm, ratePerKm, description } = req.body;

  if (!routeCode || !originId || !destinationId || !currentPrice) {
    throw AppError.badRequest('کد مسیر، مبدأ، مقصد و قیمت الزامی است');
  }

  const existing = await prisma.route.findFirst({ where: { routeCode } });
  if (existing) {
    throw AppError.conflict('کد مسیر تکراری است');
  }

  const route = await prisma.route.create({
    data: {
      routeCode,
      originId: parseInt(originId),
      destinationId: parseInt(destinationId),
      currentPrice: BigInt(currentPrice),
      distanceKm: distanceKm || 0,
      ratePerKm: ratePerKm ? BigInt(ratePerKm) : 0n,
      description: description || '',
    },
    include: { origin: true, destination: true },
  });

  // Record price history
  await prisma.routePriceHistory.create({
    data: {
      routeId: route.id,
      routeCode,
      oldPrice: 0n,
      newPrice: BigInt(currentPrice),
      changedBy: req.user!.username,
      effectiveDate: todayJalaliString(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'CREATE_ROUTE',
      entityTitle: `مسیر ${routeCode}`,
      details: `ایجاد مسیر ${routeCode} با نرخ ${currentPrice} تومان`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.status(201).json({ success: true, data: route });
}));

/**
 * PUT /api/routes/:id
 * Update route (Admin only)
 */
router.put('/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw AppError.notFound('مسیر یافت نشد');
  }

  const { routeCode, originId, destinationId, currentPrice, distanceKm, ratePerKm, description, isActive } = req.body;

  const priceChanged = currentPrice && BigInt(currentPrice) !== existing.currentPrice;

  const route = await prisma.route.update({
    where: { id: req.params.id },
    data: {
      ...(routeCode && { routeCode }),
      ...(originId && { originId: parseInt(originId) }),
      ...(destinationId && { destinationId: parseInt(destinationId) }),
      ...(currentPrice && { currentPrice: BigInt(currentPrice) }),
      ...(distanceKm && { distanceKm }),
      ...(ratePerKm && { ratePerKm: BigInt(ratePerKm) }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { origin: true, destination: true },
  });

  // Record price history if changed
  if (priceChanged) {
    await prisma.routePriceHistory.create({
      data: {
        routeId: route.id,
        routeCode: route.routeCode,
        oldPrice: existing.currentPrice,
        newPrice: BigInt(currentPrice),
        changedBy: req.user!.username,
        effectiveDate: todayJalaliString(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        operatorName: req.user!.username,
        operatorRole: req.user!.role,
        action: 'UPDATE_ROUTE_PRICE',
        entityTitle: `مسیر ${route.routeCode}`,
        details: `تغییر نرخ از ${existing.currentPrice} به ${currentPrice} تومان`,
        jalaliTimestamp: getJalaliDateTimeString(),
      },
    });
  }

  res.json({ success: true, data: route });
}));

/**
 * PUT /api/routes/:id/price
 * Update only the price (with history tracking)
 */
router.put('/:id/price', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw AppError.notFound('مسیر یافت نشد');
  }

  const { price } = req.body;
  if (!price || price <= 0) {
    throw AppError.badRequest('قیمت معتبر وارد کنید');
  }

  if (BigInt(price) === existing.currentPrice) {
    throw AppError.badRequest('قیمت جدید با قیمت فعلی تفاوتی ندارد');
  }

  const route = await prisma.route.update({
    where: { id: req.params.id },
    data: { currentPrice: BigInt(price) },
  });

  await prisma.routePriceHistory.create({
    data: {
      routeId: route.id,
      routeCode: route.routeCode,
      oldPrice: existing.currentPrice,
      newPrice: BigInt(price),
      changedBy: req.user!.username,
      effectiveDate: todayJalaliString(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'UPDATE_ROUTE_PRICE',
      entityTitle: `مسیر ${route.routeCode}`,
      details: `تغییر نرخ مصوب از ${existing.currentPrice} به ${price} تومان`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: route });
}));

/**
 * GET /api/routes/:id/price-history
 * Get price history for a route
 */
router.get('/:id/price-history', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const history = await prisma.routePriceHistory.findMany({
    where: { routeId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: history });
}));

/**
 * POST /api/routes/sync-csv
 * Bulk import routes from CSV data
 */
router.post('/sync-csv', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { csvText } = req.body;
  const text = csvText || FLEET_CSV_RAW;

  const tiers = parseCsvTiers(text);
  if (tiers.length === 0) {
    throw AppError.badRequest('داده CSV معتبر نیست');
  }

  let originLocation = await prisma.location.findFirst({
    where: { name: 'انبار مرکزی انتخاب (مورچه خورت)' },
  });

  if (!originLocation) {
    originLocation = await prisma.location.create({
      data: { name: 'انبار مرکزی انتخاب (مورچه خورت)', city: 'مورچه خورت / اصفهان' },
    });
  }

  let routeCount = 0;
  let locationCount = 0;

  for (const tier of tiers) {
    for (let i = 0; i < tier.destinations.length; i++) {
      const destName = tier.destinations[i];

      // Ensure destination location exists
      let destLocation = await prisma.location.findFirst({ where: { name: destName } });
      if (!destLocation) {
        destLocation = await prisma.location.create({
          data: { name: destName, city: guessCityForLocation(destName) },
        });
        locationCount++;
      }

      // Check if route already exists
      const existingRoute = await prisma.route.findFirst({
        where: { originId: originLocation.id, destinationId: destLocation.id },
      });

      if (!existingRoute) {
        const routeCode = `AR-${String(tier.code).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        const routeId = `rt-${uuidv4().slice(0, 8)}`;

        await prisma.route.create({
          data: {
            id: routeId,
            routeCode,
            originId: originLocation.id,
            destinationId: destLocation.id,
            currentPrice: BigInt(tier.totalPriceToman),
            distanceKm: tier.distanceKm,
            ratePerKm: BigInt(tier.ratePerKmToman),
            description: `مسافت: ${tier.distanceKm} کیلومتر | نرخ: ${tier.ratePerKmToman} تومان/کیلومتر`,
          },
        });

        await prisma.routePriceHistory.create({
          data: {
            routeId,
            routeCode,
            oldPrice: 0n,
            newPrice: BigInt(tier.totalPriceToman),
            changedBy: 'سیستم همگام‌سازی CSV',
            effectiveDate: todayJalaliString(),
          },
        });

        routeCount++;
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'IMPORT_CSV_ROUTES',
      entityTitle: 'همگام‌سازی مسیرها از CSV',
      details: `همگام‌سازی ${routeCount} مسیر جدید و ${locationCount} مکان جدید`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({
    success: true,
    data: { routeCount, locationCount, totalTiers: tiers.length },
    message: `${routeCount} مسیر جدید و ${locationCount} مکان جدید اضافه شد`,
  });
}));

/**
 * PATCH /api/routes/:id/toggle
 * Toggle route active status (Admin only)
 */
router.patch('/:id/toggle', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw AppError.notFound('مسیر یافت نشد');
  }

  const route = await prisma.route.update({
    where: { id: req.params.id },
    data: { isActive: !existing.isActive },
    include: { origin: true, destination: true },
  });

  const statusText = route.isActive ? 'فعال' : 'غیرفعال';

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'TOGGLE_ROUTE_STATUS',
      entityTitle: `مسیر ${route.routeCode}`,
      details: `تغییر وضعیت مسیر ${route.routeCode} به ${statusText}`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: route });
}));

/**
 * DELETE /api/routes/:id
 * Delete a route (Admin only)
 */
router.delete('/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw AppError.notFound('مسیر یافت نشد');
  }

  // Check if route has trips
  const tripCount = await prisma.trip.count({ where: { routeId: req.params.id } });
  if (tripCount > 0) {
    throw AppError.badRequest(`این مسیر ${tripCount} سفر ثبت شده دارد. ابتدا سفرها را حذف کنید یا مسیر را غیرفعال کنید.`);
  }

  // Delete price history first
  await prisma.routePriceHistory.deleteMany({ where: { routeId: req.params.id } });
  await prisma.route.delete({ where: { id: req.params.id } });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'DELETE_ROUTE',
      entityTitle: `مسیر ${existing.routeCode}`,
      details: `حذف مسیر ${existing.routeCode} (${existing.routeCode})`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, message: `مسیر ${existing.routeCode} با موفقیت حذف شد` });
}));

export default router;
