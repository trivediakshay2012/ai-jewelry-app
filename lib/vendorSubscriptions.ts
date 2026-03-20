export type VendorPlan = 'basic' | 'pro' | 'premium';

export type VendorPlanConfig = {
  code: VendorPlan;
  name: string;
  monthlyUsd: number;
  freeTrialDays: number;
  leadLimit: number | null;
  inventoryLimit: number | null;
  priorityWeight: number;
  featuredPlacement: boolean;
  analyticsLevel: 'standard' | 'enhanced' | 'advanced';
  notificationSpeed: 'standard' | 'priority' | 'fastest';
};

export const VENDOR_PLAN_CONFIG: Record<VendorPlan, VendorPlanConfig> = {
  basic: {
    code: 'basic',
    name: 'Basic',
    monthlyUsd: 49.99,
    freeTrialDays: 7,
    leadLimit: 15,
    inventoryLimit: 25,
    priorityWeight: 1,
    featuredPlacement: false,
    analyticsLevel: 'standard',
    notificationSpeed: 'standard',
  },
  pro: {
    code: 'pro',
    name: 'Pro',
    monthlyUsd: 99.99,
    freeTrialDays: 7,
    leadLimit: 45,
    inventoryLimit: 100,
    priorityWeight: 2,
    featuredPlacement: false,
    analyticsLevel: 'enhanced',
    notificationSpeed: 'priority',
  },
  premium: {
    code: 'premium',
    name: 'Premium',
    monthlyUsd: 109.99,
    freeTrialDays: 7,
    leadLimit: null,
    inventoryLimit: null,
    priorityWeight: 3,
    featuredPlacement: true,
    analyticsLevel: 'advanced',
    notificationSpeed: 'fastest',
  },
};

const STATIC_FX: Record<string, number> = {
  USD: 1,
  INR: 83.25,
  AED: 3.67,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52,
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'united states': 'USD',
  usa: 'USD',
  us: 'USD',
  india: 'INR',
  uae: 'AED',
  'united arab emirates': 'AED',
  dubai: 'AED',
  canada: 'CAD',
  uk: 'GBP',
  'united kingdom': 'GBP',
  europe: 'EUR',
  germany: 'EUR',
  france: 'EUR',
  australia: 'AUD',
};

export function normalizePlan(plan?: string | null): VendorPlan {
  const value = String(plan || 'basic').trim().toLowerCase();
  if (value === 'premium') return 'premium';
  if (value === 'pro') return 'pro';
  return 'basic';
}

export function getVendorPlanConfig(plan?: string | null): VendorPlanConfig {
  return VENDOR_PLAN_CONFIG[normalizePlan(plan)];
}

export function resolveCurrencyForCountry(country?: string | null): string {
  const value = String(country || '').trim().toLowerCase();
  return COUNTRY_TO_CURRENCY[value] || 'USD';
}

export async function fetchLiveFxRates(base = 'USD'): Promise<Record<string, number>> {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    const json = await response.json();
    if (json?.rates && typeof json.rates === 'object') {
      return { ...STATIC_FX, ...json.rates };
    }
  } catch {}
  return STATIC_FX;
}

export async function convertUsdPrice(amountUsd: number, currency: string) {
  const normalizedCurrency = String(currency || 'USD').toUpperCase();
  const rates = await fetchLiveFxRates('USD');
  const rate = Number(rates[normalizedCurrency] || 1);
  return Number((amountUsd * rate).toFixed(2));
}

export async function getLocalizedPlanPricing(plan?: string | null, country?: string | null) {
  const config = getVendorPlanConfig(plan);
  const currency = resolveCurrencyForCountry(country);
  const monthly = await convertUsdPrice(config.monthlyUsd, currency);
  return {
    ...config,
    currency,
    monthly,
    monthlyDisplay: `${currency} ${monthly.toLocaleString()}`,
  };
}

export function getTrialWindow(startedAt?: string | null, freeTrialDays = 7) {
  const start = startedAt ? new Date(startedAt) : new Date();
  const ends = new Date(start.getTime() + freeTrialDays * 24 * 60 * 60 * 1000);
  return {
    startedAt: start.toISOString(),
    endsAt: ends.toISOString(),
  };
}

export function planAllowsInventory(plan: string | null | undefined, currentCount: number) {
  const config = getVendorPlanConfig(plan);
  return config.inventoryLimit == null || currentCount < config.inventoryLimit;
}

export function planAllowsLead(plan: string | null | undefined, currentCount: number) {
  const config = getVendorPlanConfig(plan);
  return config.leadLimit == null || currentCount < config.leadLimit;
}
