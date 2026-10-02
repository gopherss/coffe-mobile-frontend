export const CURRENCY = 'ARS';
export const LOCALE = 'es-AR';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number): string {
  let formatter = moneyFormatters.get(CURRENCY);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: CURRENCY,
    });
    moneyFormatters.set(CURRENCY, formatter);
  }
  return formatter.format(cents / 100);
}

export function parseMoneyToCents(input: string): number {
  const normalized = input.replace(/[^\d,.-]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function formatQty(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace('.', ',');
}
