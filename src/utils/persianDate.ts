export function getJalaliDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function todayJalaliString(): string {
  return getJalaliDate(new Date());
}

export function getJalaliDateTimeString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

export default {
  getJalaliDate,
  todayJalaliString,
  getJalaliDateTimeString,
};
