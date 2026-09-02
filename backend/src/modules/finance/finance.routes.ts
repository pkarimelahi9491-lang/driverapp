import { Router } from 'express';
import prisma from '../../config/database';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { todayJalaliString, getJalaliDateTimeString } from '../../utils/persianDate';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'FINANCE'));

/**
 * GET /api/finance/monthly
 * Get monthly settlement report for a given year-month
 */
router.get('/monthly', asyncHandler(async (req, res) => {
  const { yearMonth } = req.query;
  if (!yearMonth) {
    throw AppError.badRequest('سال و ماه شمسی الزامی است (مثال: 1405-06)');
  }

  // Get all drivers
  const drivers = await prisma.driver.findMany({ orderBy: { fullName: 'asc' } });

  // Get trips for the month
  const trips = await prisma.trip.findMany({
    where: { tripJalaliDate: { startsWith: yearMonth as string } },
  });

  // Get daily work logs for the month
  const dailyLogs = await prisma.dailyWorkLog.findMany({
    where: { jalaliDate: { startsWith: yearMonth as string } },
  });

  // Get financial period
  const period = await prisma.financialPeriod.findUnique({
    where: { jalaliYearMonth: yearMonth as string },
  });

  // Build settlement rows
  const rows = drivers.map(driver => {
    const driverTrips = trips.filter(t => t.driverId === driver.id);
    const driverDailyLogs = dailyLogs.filter(l => l.driverId === driver.id);

    const workingDays = new Set(driverDailyLogs.map(l => l.jalaliDate)).size;
    const totalTripsCount = driverTrips.length;
    const finalizedIncome = driverDailyLogs
      .filter(l => l.status === 'FINALIZED')
      .reduce((sum, l) => sum + Number(l.totalIncome), 0);
    const draftIncome = driverDailyLogs
      .filter(l => l.status === 'DRAFT')
      .reduce((sum, l) => sum + Number(l.totalIncome), 0);
    const unfinalizedCount = driverDailyLogs.filter(l => l.status === 'DRAFT' || l.status === 'REJECTED').length;

    return {
      driverId: driver.id,
      driverName: driver.fullName,
      driverCode: driver.driverCode,
      personnelCode: driver.personnelCode,
      workingDaysCount: workingDays || (totalTripsCount > 0 ? 1 : 0),
      totalTripsCount,
      finalizedIncome,
      draftIncome,
      unfinalizedDaysCount: unfinalizedCount,
      paymentStatus: period?.status || 'PENDING_APPROVAL',
    };
  });

  const totalAmount = rows.reduce((sum, r) => sum + r.finalizedIncome, 0);

  res.json({
    success: true,
    data: {
      yearMonth,
      period: period || { status: 'PENDING_APPROVAL', totalAmount: 0 },
      rows,
      totalAmount,
    },
  });
}));

/**
 * PUT /api/finance/:yearMonth/status
 * Update payment status for a financial period
 */
router.put('/:yearMonth/status', asyncHandler(async (req, res) => {
  const { yearMonth } = req.params;
  const { status } = req.body;

  const validStatuses = ['CALCULATING', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_FINANCE', 'PAID'];
  if (!validStatuses.includes(status)) {
    throw AppError.badRequest(`وضعیت نامعتبر. مقادیر مجاز: ${validStatuses.join(', ')}`);
  }

  const existing = await prisma.financialPeriod.findUnique({
    where: { jalaliYearMonth: yearMonth },
  });

  const period = await prisma.financialPeriod.upsert({
    where: { jalaliYearMonth: yearMonth },
    create: {
      jalaliYearMonth: yearMonth,
      status: status,
      approvedBy: req.user!.username,
    },
    update: {
      status: status,
      approvedBy: req.user!.username,
      ...(status === 'PAID' && { paidAtJalali: todayJalaliString() }),
    },
  });

  const statusLabels: Record<string, string> = {
    CALCULATING: 'محاسبه نشده',
    PENDING_APPROVAL: 'در انتظار تأیید',
    APPROVED: 'تأیید شده',
    SENT_TO_FINANCE: 'ارسال به مالی',
    PAID: 'پرداخت شده',
  };

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      operatorName: req.user!.username,
      operatorRole: req.user!.role,
      action: 'UPDATE_FINANCIAL_STATUS',
      entityTitle: `دوره مالی ${yearMonth}`,
      details: `تغییر وضعیت به: ${statusLabels[status] || status}`,
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  res.json({ success: true, data: period });
}));

/**
 * GET /api/finance/export/csv
 * Export monthly report as CSV
 */
router.get('/export/csv', asyncHandler(async (req, res) => {
  const { yearMonth } = req.query;
  if (!yearMonth) {
    throw AppError.badRequest('سال و ماه شمسی الزامی است');
  }

  // Reuse the monthly report logic
  const drivers = await prisma.driver.findMany({ orderBy: { fullName: 'asc' } });
  const trips = await prisma.trip.findMany({
    where: { tripJalaliDate: { startsWith: yearMonth as string } },
  });
  const dailyLogs = await prisma.dailyWorkLog.findMany({
    where: { jalaliDate: { startsWith: yearMonth as string } },
  });

  let csv = '\uFEFF'; // UTF-8 BOM
  csv += 'گزارش کارکرد و تسویه‌حساب مالی رانندگان هلدینگ آرمان انتخاب\n';
  csv += `دوره مالی: ${yearMonth}\n`;
  csv += `تاریخ خروجی: ${todayJalaliString()}\n\n`;
  csv += 'ردیف,نام و نام خانوادگی,کد راننده,کد پرسنلی,تعداد روز کاری,تعداد کل سفرها,مبلغ قابل پرداخت (تومان),وضعیت پرداخت\n';

  let totalSum = 0;

  drivers.forEach((driver, index) => {
    const driverTrips = trips.filter(t => t.driverId === driver.id);
    const driverDailyLogs = dailyLogs.filter(l => l.driverId === driver.id);
    const workingDays = new Set(driverDailyLogs.map(l => l.jalaliDate)).size;
    const totalTripsCount = driverTrips.length;
    const finalizedIncome = driverDailyLogs
      .filter(l => l.status === 'FINALIZED')
      .reduce((sum, l) => sum + Number(l.totalIncome), 0);

    totalSum += finalizedIncome;

    csv += `${index + 1},"${driver.fullName}",${driver.driverCode},${driver.personnelCode},${workingDays},${totalTripsCount},${finalizedIncome},"تأیید شده"\n`;
  });

  csv += `\nجمع کل قابل پرداخت: ${totalSum} تومان\n`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="arman-fleet-report-${yearMonth}.csv"`);
  res.send(csv);
}));

export default router;
