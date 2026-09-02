/**
 * توابع کمکی محاسبات مالی و تبدیل ارقام و مقادیر BigInt
 */

export function formatRial(amount: bigint | number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '۰ ریال';
  const val = typeof amount === 'bigint' ? amount.toString() : String(amount);
  const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted} ریال`;
}

export function toToman(rialAmount: bigint | number): number {
  const val = typeof rialAmount === 'bigint' ? Number(rialAmount) : rialAmount;
  return Math.floor(val / 10);
}

export function sumAmounts(amounts: (bigint | number | string)[]): bigint {
  return amounts.reduce<bigint>((total, current) => {
    try {
      const val = typeof current === 'bigint' ? current : BigInt(Math.trunc(Number(current) || 0));
      return total + val;
    } catch {
      return total;
    }
  }, BigInt(0));
}

export function safeBigInt(val: any): bigint {
  if (typeof val === 'bigint') return val;
  if (!val) return BigInt(0);
  try {
    return BigInt(Math.trunc(Number(val)));
  } catch {
    return BigInt(0);
  }
}
