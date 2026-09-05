/**
 * Jalali (Persian/Solar Hijri) Date Utilities for Backend
 * Handles date conversions and formatting for the fleet system
 */

const JALALI_EPOCH = 2121446460;

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.floor(a / b) * b;
}

function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number
): [number, number, number] {
  const g_d_m = [
    0, 31, 59, 90, 120, 151,
    181, 212, 243, 273, 304, 334
  ];

  const gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    355666 +
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) +
    gd +
    g_d_m[gm - 1];

  let jy = -1595 + 33 * div(days, 12053);

  days = mod(days, 12053);

  jy += 4 * div(days, 1461);

  days = mod(days, 1461);

  if (days > 365) {
    jy += div(days - 1, 365);
    days = mod(days - 1, 365);
  }

  const jm =
    days < 186
      ? 1 + div(days, 31)
      : 7 + div(days - 186, 30);

  const jd =
    days < 186
      ? mod(days, 31) + 1
      : mod(days - 186, 30) + 1;

  return [jy, jm, jd];
}

function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number
): [number, number, number] {
  const jy1 = jy - 979;
  const jm1 = jm - 1;
  const jd1 = jd - 1;

  let days =
    365 * jy1 +
    div(jy1, 33) * 8 +
    div(jy1 < 33 ? jy1 + 1 : jy1 - 29, 4);

  days +=
    [
      0,
      31,
      62,
      93,
      124,
      155,
      186,
      216,
      246,
      276,
      306,
      336
    ][jm1] + jd1;

  let gy = 1600 + 400 * div(days, 146097);

  days = mod(days, 146097);

  if (days > 36524) {
    days -= 1;

    gy += 100 * div(days, 36524);

    days = mod(days, 36524);

    if (days > 365) {
      days -= 1;
    }
  }

  gy += 4 * div(days, 1461);

  days = mod(days, 1461);

  if (days > 365) {
    gy += div(days - 1, 365);

    days = mod(days - 1, 365);
  }

  const gd = days + 1;

  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0
      ? 29
      : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];

  let gm = 0;

  while (gm < 13 && gd > sal_a[gm]) {
    gm++;
  }

  return [
    gy,
    gm,
    gd - (gm > 0 ? sal_a[gm - 1] : 0)
  ];
}

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export function getTodayJalali(): JalaliDate {
  const now = new Date();

  const [jy, jm, jd] = gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );

  return {
    year: jy,
    month: jm,
    day: jd
  };
}

export function jalaliToString(
  date: JalaliDate
): string {
  return (
    date.year +
    "/" +
    String(date.month).padStart(2, "0") +
    "/" +
    String(date.day).padStart(2, "0")
  );
}

export function todayJalaliString(): string {
  return jalaliToString(getTodayJalali());
}

export function getYearMonthKey(
  jalaliDate: JalaliDate
): string {
  return (
    jalaliDate.year +
    "-" +
    String(jalaliDate.month).padStart(2, "0")
  );
}

export function todayYearMonthKey(): string {
  return getYearMonthKey(getTodayJalali());
}

export function formatReadableJalali(
  date: JalaliDate
): string {
  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند"
  ];

  const dayNames = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه"
  ];

  return (
    dayNames[0] +
    " " +
    date.day +
    " " +
    monthNames[date.month - 1] +
    " " +
    date.year
  );
}

export function getCurrentTimeString(): string {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return "ساعت " + hours + ":" + minutes;
}

export function getJalaliDateTimeString(): string {
  return (
    formatReadableJalali(getTodayJalali()) +
    " - " +
    getCurrentTimeString()
  );
}

export {
  gregorianToJalali,
  jalaliToGregorian
};
