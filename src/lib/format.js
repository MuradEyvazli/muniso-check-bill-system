import { CURRENCY_SYMBOL } from "./constants";

/**
 * Tam sayı tutarları ondalıksız (₺150), küsuratlı tutarları iki hane ile (₺149.50) gösterir.
 */
export function formatCurrency(amount) {
  const n = Number(amount || 0);
  const hasDecimals = Math.round(n * 100) % 100 !== 0;
  const formatted = n.toLocaleString("tr-TR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOL}${formatted}`;
}
