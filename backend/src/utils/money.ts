/**
 * Money formatting utilities
 * All monetary values in the system are stored as BigInt (tomans)
 */

export function formatToman(amount: bigint | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return num.toLocaleString('fa-IR');
}

export function tomanToDisplay(amount: bigint | number): string {
  return `${formatToman(amount)} تومان`;
}

export function parseTomanInput(input: string): bigint {
  const cleaned = input.replace(/[,،\s]/g, '');
  return BigInt(cleaned || '0');
}

export function sumToman(values: (bigint | number)[]): bigint {
  return values.reduce((acc, val) => acc + BigInt(val), 0n);
}
