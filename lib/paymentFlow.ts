export type PaymentAmountsInput = {
  quoteAmount?: number | string | null;
  depositPercent?: number | string | null;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createPaymentAmounts(input: PaymentAmountsInput) {
  const total = Math.max(toNumber(input.quoteAmount), 0);
  const depositPercent = Math.max(toNumber(input.depositPercent, 50), 0);
  const deposit = Number((total * (depositPercent / 100)).toFixed(2));
  const balance = Number(Math.max(total - deposit, 0).toFixed(2));
  return { total, depositPercent, deposit, balance };
}

export function formatMoney(value: number, currency = '$') {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export function toStripeCurrencyAmount(amount: number) {
  return Math.round(Number(amount || 0) * 100);
}

export function normalizeCurrency(input?: string | null) {
  const value = String(input || 'usd').trim().toLowerCase();
  if (value === '$') return 'usd';
  return value || 'usd';
}
