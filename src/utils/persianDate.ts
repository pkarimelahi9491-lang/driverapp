// تبدیل تاریخ میلادی به تاریخ شمسی با استفاده از موتور استاندارد Intl بدون نیاز به پکیج اضافی
export const toPersianDate = (date: Date | string | number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

export const toPersianDateTime = (date: Date | string | number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
};

export const formatPersianDate = toPersianDate;
export const formatPersianDateTime = toPersianDateTime;

export default {
  toPersianDate,
  toPersianDateTime,
  formatPersianDate,
  formatPersianDateTime,
};
