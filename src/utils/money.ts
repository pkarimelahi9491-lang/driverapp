export function formatMoney(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0';
  const numericAmount = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (isNaN(numericAmount)) return '0';
  return numericAmount.toLocaleString('fa-IR');
}

export function parseMoney(amountStr: string | number): number {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;
  const cleanStr = amountStr.toString().replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}
