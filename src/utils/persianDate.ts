/**
 * توابع تبدیل تاریخ شمسی و میلادی
 */

export function gregorianToJalali(gy_val: number, gm_val: number, gd_val: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy = (gm_val > 2) ? gy_val : gy_val - 1;
  let days = 355666 + (365 * gy_val) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) + gd_val + g_d_m[gm_val - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

export function toJalali(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

export function todayJalaliString(): string {
  return toJalali(new Date());
}

export function getJalaliDateTimeString(date: Date | string | number = new Date()): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const jalaliDate = toJalali(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${jalaliDate} ${hours}:${minutes}:${seconds}`;
}

export function toPersianDigits(n: number | string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => persianNumbers[+w]);
}
