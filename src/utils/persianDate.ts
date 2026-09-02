import moment from 'moment-jalaali';

export function toPersianDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return moment(date).format('jYYYY/jMM/jDD');
}

export function toPersianDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  return moment(date).format('jYYYY/jMM/jDD HH:mm');
}

export function parsePersianDate(persianDateStr: string): Date | null {
  if (!persianDateStr) return null;
  let m = moment(persianDateStr, 'jYYYY/jMM/jDD');
  if (!m.isValid()) {
    m = moment(persianDateStr, 'jYYYY-jMM-jDD');
  }
  return m.isValid() ? m.toDate() : null;
}
