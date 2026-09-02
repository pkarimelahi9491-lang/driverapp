import { PrismaClient, UserRole, DailyWorkStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { parseCsvTiers, guessCityForLocation } from '../src/utils/csvParser';
import { FLEET_CSV_RAW } from '../src/utils/csvParser';
import { getJalaliDateTimeString, todayJalaliString } from '../src/utils/persianDate';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ══════════════════════════════════════════════════════════════════
  // 1. USERS
  // ══════════════════════════════════════════════════════════════════
  console.log('👤 Creating users...');

  const passwordHash = await bcrypt.hash('admin123', 12);
  const driverPasswordHash = await bcrypt.hash('driver123', 12);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { username: 'malimedia' },
    update: {},
    create: {
      username: 'malimedia',
      passwordHash,
      role: 'FINANCE',
    },
  });

  console.log(`  ✅ Admin: admin / admin123`);
  console.log(`  ✅ Finance: malimedia / admin123`);

  // ══════════════════════════════════════════════════════════════════
  // 2. DRIVERS
  // ══════════════════════════════════════════════════════════════════
  console.log('\n🚗 Creating drivers...');

  const driverData = [
    { code: 'D-101', name: 'علی رضایی', personnel: 'AE-84012', phone: '09121112233', car: 'پژو پارس سفید', plate: '۱۲ ج ۳۴۵ ایران ۲۲', joinDate: '1403/02/15', active: true, desc: 'راننده ویژه مدیرعامل و مأموریت‌های درون‌شهری' },
    { code: 'D-102', name: 'رضا محمدی', personnel: 'AE-84019', phone: '09123334455', car: 'سمند سورن پلاس خاکستری', plate: '۷۷ د ۸۹۱ ایران ۱۱', joinDate: '1403/05/10', active: true, desc: 'راننده ترانسفر فرودگاه و مأموریت‌های کرج' },
    { code: 'D-103', name: 'حسین کریمی', personnel: 'AE-84033', phone: '09125556677', car: 'تارا اتوماتیک مشکی', plate: '۴۵ ط ۶۱۲ ایران ۳۳', joinDate: '1404/01/20', active: true, desc: 'راننده مأموریت‌های برون‌شهری' },
    { code: 'D-104', name: 'محمد احمدی', personnel: 'AE-84048', phone: '09127778899', car: 'دنا پلاس توربو سفید', plate: '۳۳ ب ۷۴۵ ایران ۴۴', joinDate: '1404/06/01', active: true, desc: 'راننده پشتیبانی لجستیک' },
    { code: 'D-105', name: 'مهدی کاظمی', personnel: 'AE-84065', phone: '09129990011', car: 'پژو ۲۰۷i خاکستری', plate: '۶۸ ص ۲۱۱ ایران ۵۵', joinDate: '1404/09/15', active: false, desc: 'در حال مرخصی' },
  ];

  const driverUserIds: string[] = [];

  for (const d of driverData) {
    const userId = uuidv4();
    driverUserIds.push(userId);

    const user = await prisma.user.upsert({
      where: { username: d.code.toLowerCase().replace(/-/g, '') },
      update: {},
      create: {
        id: userId,
        username: d.code.toLowerCase().replace(/-/g, ''),
        passwordHash: driverPasswordHash,
        role: 'DRIVER',
      },
    });

    await prisma.driver.upsert({
      where: { driverCode: d.code },
      update: {},
      create: {
        id: `drv-${d.code}`,
        userId: user.id,
        fullName: d.name,
        driverCode: d.code,
        personnelCode: d.personnel,
        phoneNumber: d.phone,
        carModel: d.car,
        carPlate: d.plate,
        joinDateJalali: d.joinDate,
        isActive: d.active,
        description: d.desc,
      },
    });

    console.log(`  ✅ ${d.name} (${d.code}) → ${d.code.toLowerCase().replace(/-/g, '')} / driver123`);
  }

  // ══════════════════════════════════════════════════════════════════
  // 3. LOCATIONS & ROUTES FROM CSV
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📍 Creating locations and routes from CSV...');

  const originLocation = await prisma.location.upsert({
    where: { name: 'انبار مرکزی انتخاب (مورچه خورت)' },
    update: {},
    create: { name: 'انبار مرکزی انتخاب (مورچه خورت)', city: 'مورچه خورت / اصفهان' },
  });

  // Secondary origins
  await prisma.location.upsert({
    where: { name: 'کارخانه لوازم خانگی انتخاب (اسنوا)' },
    update: {},
    create: { name: 'کارخانه لوازم خانگی انتخاب (اسنوا)', city: 'مورچه خورت' },
  });
  await prisma.location.upsert({
    where: { name: 'دفتر مرکزی اصفهان' },
    update: {},
    create: { name: 'دفتر مرکزی اصفهان', city: 'اصفهان' },
  });
  await prisma.location.upsert({
    where: { name: 'انبار مرکزی تهران (ملاصدرا)' },
    update: {},
    create: { name: 'انبار مرکزی تهران (ملاصدرا)', city: 'تهران' },
  });

  const tiers = parseCsvTiers(FLEET_CSV_RAW);
  let locationCount = 0;
  let routeCount = 0;

  for (const tier of tiers) {
    for (let i = 0; i < tier.destinations.length; i++) {
      const destName = tier.destinations[i];

      let destLocation = await prisma.location.findFirst({ where: { name: destName } });
      if (!destLocation) {
        destLocation = await prisma.location.create({
          data: { name: destName, city: guessCityForLocation(destName) },
        });
        locationCount++;
      }

      const routeCode = `AR-${String(tier.code).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const routeId = `rt-${tier.code}-${i + 1}`;

      const existing = await prisma.route.findFirst({
        where: { originId: originLocation.id, destinationId: destLocation.id },
      });

      if (!existing) {
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
            changedBy: 'سیستم اولیه',
            effectiveDate: todayJalaliString(),
          },
        });

        routeCount++;
      }
    }
  }

  console.log(`  ✅ ${locationCount} locations created`);
  console.log(`  ✅ ${routeCount} routes created`);

  // ══════════════════════════════════════════════════════════════════
  // 4. SAMPLE TRIPS & DAILY WORK
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📝 Creating sample trips...');

  const sampleRoutes = await prisma.route.findMany({ take: 5 });

  if (sampleRoutes.length > 0) {
    const dailyWorkId = uuidv4();
    const today = todayJalaliString();

    await prisma.dailyWorkLog.create({
      data: {
        id: dailyWorkId,
        driverId: 'drv-D-101',
        jalaliDate: today,
        totalTrips: 2,
        totalIncome: BigInt(sampleRoutes[0].currentPrice.toNumber() + sampleRoutes[1].currentPrice.toNumber()),
        status: 'DRAFT',
      },
    });

    for (let i = 0; i < 2; i++) {
      const route = sampleRoutes[i];
      await prisma.trip.create({
        data: {
          id: uuidv4(),
          tripCode: `TRP-${today.replace(/\//g, '')}-${String(101 + i)}`,
          dailyWorkId,
          driverId: 'drv-D-101',
          routeId: route.id,
          originTitle: route.originId.toString(),
          destinationTitle: route.destinationId.toString(),
          routeCode: route.routeCode,
          snapshotPrice: route.currentPrice,
          tripJalaliDate: today,
          startTime: `${7 + i * 3}:${i === 0 ? '45' : '30'}`,
        },
      });
    }

    console.log(`  ✅ 2 sample trips created for today`);
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. FINANCIAL PERIOD
  // ══════════════════════════════════════════════════════════════════
  console.log('\n💰 Creating financial period...');

  const currentYearMonth = todayJalaliString().substring(0, 7).replace('/', '-');
  await prisma.financialPeriod.upsert({
    where: { jalaliYearMonth: currentYearMonth },
    update: {},
    create: {
      jalaliYearMonth: currentYearMonth,
      status: 'PENDING_APPROVAL',
      notes: 'دوره محاسبه کارکرد رانندگان ناوگان هلدینگ آرمان انتخاب',
    },
  });

  console.log(`  ✅ Financial period ${currentYearMonth} created`);

  // ══════════════════════════════════════════════════════════════════
  // 6. INITIAL AUDIT LOG
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📋 Creating audit log...');

  await prisma.auditLog.create({
    data: {
      operatorName: 'مدیر سیستم',
      operatorRole: 'ADMIN',
      action: 'INITIAL_SYSTEM_SETUP',
      entityTitle: 'راه‌اندازی سیستم',
      details: 'راه‌اندازی پایگاه داده مسیرها و نرخ‌های مصوب هلدینگ آرمان انتخاب',
      jalaliTimestamp: getJalaliDateTimeString(),
    },
  });

  console.log('  ✅ Initial audit log created');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:    admin / admin123');
  console.log('   Finance:  malimedia / admin123');
  console.log('   Drivers:  d101 / driver123, d102 / driver123, ...');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
