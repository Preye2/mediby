// src/lib/money.ts
export const toNaira = (kobo: number): string =>
  `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;