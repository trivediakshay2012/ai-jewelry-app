export type PricingLine = { label: string; value: number };
export type PricingEstimate = {
  currency: string;
  lines: PricingLine[];
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  targetBudget: number | null;
  differenceToBudget: number | null;
  isWithinBudget: boolean | null;
  disclaimer: string;
  assumptions: string[];
  regionLabel: string;
  liveRateStatus: 'api-ready-fallback' | 'configured-live';
};
export type PricingInput = {
  jewelryType?: string | null;
  metal?: string | null;
  metalPurity?: string | null;
  stone?: string | null;
  shape?: string | null;
  budget?: number | string | null;
  centerStoneCarat?: number | null;
  sideStoneCarat?: number | null;
  sideStoneCount?: number | null;
  necklaceLength?: string | null;
  wristSize?: string | null;
  country?: string | null;
  stateOrProvince?: string | null;
  markupMultiplier?: number | null;
};

type MetalRateRow = { base24k?: number; perGram?: number; note?: string };
const METAL_RATE_TABLE: Record<string, MetalRateRow> = {
  gold: { base24k: 74, note: 'API-ready fallback using per-gram USD equivalent.' },
  platinum: { perGram: 33, note: 'API-ready fallback using per-gram USD equivalent.' },
  silver: { perGram: 0.95, note: 'API-ready fallback using per-gram USD equivalent.' },
};

const NATURAL_DIAMOND_PER_CT = [
  { max: 0.49, rate: 2600 },
  { max: 0.99, rate: 5200 },
  { max: 1.99, rate: 9800 },
  { max: Infinity, rate: 14500 },
];
const LAB_DIAMOND_PER_CT = [
  { max: 0.49, rate: 420 },
  { max: 0.99, rate: 880 },
  { max: 1.99, rate: 1500 },
  { max: Infinity, rate: 2200 },
];
const GEMSTONE_FALLBACKS: Record<string, number> = {
  sapphire: 700,
  emerald: 950,
  ruby: 850,
  moissanite: 240,
  gemstone: 300,
};
const BASE_WEIGHT_BY_TYPE: Record<string, number> = {
  ring: 4.8,
  earrings: 4.2,
  pendant: 5.5,
  necklace: 16,
  chain: 18,
  bracelet: 9,
  'tennis bracelet': 11,
  bangle: 15,
  other: 7,
};

function normalize(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}
function jewelryType(raw?: string | null) {
  const value = normalize(raw);
  if (value.includes('tennis')) return 'tennis bracelet';
  if (value.includes('chain')) return 'chain';
  if (value.includes('ear')) return 'earrings';
  if (value.includes('neck')) return 'necklace';
  if (value.includes('pend')) return 'pendant';
  if (value.includes('bangle')) return 'bangle';
  if (value.includes('brace')) return 'bracelet';
  return 'ring';
}
function toNum(value?: string | number | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function parsePurity(raw?: string | null) {
  const value = normalize(raw);
  if (value.includes('22')) return 22/24;
  if (value.includes('18')) return 18/24;
  if (value.includes('14')) return 14/24;
  if (value.includes('10')) return 10/24;
  return 14/24;
}
function inferMetalFamily(raw?: string | null) {
  const value = normalize(raw);
  if (value.includes('platinum')) return 'platinum';
  if (value.includes('silver')) return 'silver';
  return 'gold';
}
function inferStoneRate(raw: string | null | undefined, ct: number) {
  const value = normalize(raw);
  if (!value || value.includes('no stone')) return 0;
  if (value.includes('lab') && value.includes('diamond')) return LAB_DIAMOND_PER_CT.find(r => ct <= r.max)!.rate;
  if (value.includes('diamond')) return NATURAL_DIAMOND_PER_CT.find(r => ct <= r.max)!.rate;
  for (const [name, rate] of Object.entries(GEMSTONE_FALLBACKS)) {
    if (value.includes(name)) return rate;
  }
  return GEMSTONE_FALLBACKS.gemstone;
}
function inferTax(country?: string | null, state?: string | null) {
  const c = normalize(country);
  const s = normalize(state);
  if (!c || c.includes('united states') || c === 'usa' || c === 'us') {
    if (s === 'new jersey' || s === 'nj') return 6.625;
    if (s === 'new york' || s === 'ny') return 8.875;
    if (s === 'california' || s === 'ca') return 7.25;
    if (s === 'texas' || s === 'tx') return 6.25;
    return 7.0;
  }
  if (c.includes('india')) return 3.0;
  if (c.includes('canada')) return 13.0;
  if (c.includes('united kingdom') || c === 'uk') return 20.0;
  if (c.includes('uae') || c.includes('dubai')) return 5.0;
  return 10.0;
}
function inferCurrency(country?: string | null) {
  const c = normalize(country);
  if (c.includes('india')) return '₹';
  if (c.includes('uae') || c.includes('dubai')) return 'AED ';
  if (c.includes('united kingdom') || c === 'uk') return '£';
  if (c.includes('canada')) return 'C$';
  return '$';
}
function convertFromUsd(amount: number, country?: string | null) {
  const c = normalize(country);
  if (c.includes('india')) return amount * 83;
  if (c.includes('uae') || c.includes('dubai')) return amount * 3.67;
  if (c.includes('united kingdom') || c === 'uk') return amount * 0.79;
  if (c.includes('canada')) return amount * 1.35;
  return amount;
}
function estimateWeight(input: PricingInput, type: string) {
  const base = BASE_WEIGHT_BY_TYPE[type] || BASE_WEIGHT_BY_TYPE.other;
  const center = Math.max(0, toNum(input.centerStoneCarat));
  const side = Math.max(0, toNum(input.sideStoneCarat));
  const sideCount = Math.max(0, toNum(input.sideStoneCount));
  const lengthFactor = Math.max(0, parseFloat(String(input.necklaceLength || input.wristSize || '').match(/[\d.]+/)?.[0] || '0'));
  if (type === 'chain' || type === 'necklace') return Number((base + lengthFactor * 0.28).toFixed(2));
  if (type === 'tennis bracelet') return Number((base + sideCount * 0.08 + side * 1.3).toFixed(2));
  return Number((base + center * 0.6 + side * 0.45 + sideCount * 0.03).toFixed(2));
}
function metalCostPerGram(input: PricingInput) {
  const family = inferMetalFamily(input.metal);
  if (family === 'gold') {
    const base24k = METAL_RATE_TABLE.gold.base24k || 74;
    return base24k * parsePurity(input.metalPurity);
  }
  return METAL_RATE_TABLE[family].perGram || 1;
}

export function createPricingEstimate(input: PricingInput): PricingEstimate {
  const type = jewelryType(input.jewelryType);
  const weightGrams = estimateWeight(input, type);
  const centerStoneCarat = Math.max(0, toNum(input.centerStoneCarat, type === 'ring' ? 1 : 0.35));
  const sideStoneCarat = Math.max(0, toNum(input.sideStoneCarat));
  const sideStoneCount = Math.max(0, Math.round(toNum(input.sideStoneCount, type === 'tennis bracelet' ? 48 : 0)));
  const centerRate = inferStoneRate(input.stone, centerStoneCarat || 0.2);
  const sideRate = inferStoneRate(input.stone, Math.max(sideStoneCarat, 0.08));
  const metalUsd = weightGrams * metalCostPerGram(input);
  const centerUsd = centerStoneCarat * centerRate;
  const sideUsd = sideStoneCarat * Math.max(sideRate * 0.55, 90);
  const laborGeoFactor = normalize(input.country).includes('india') ? 0.72 : normalize(input.country).includes('usa') || !normalize(input.country) ? 1.15 : 1;
  const laborBase = ({ring:240, earrings:190, pendant:220, necklace:290, chain:250, bracelet:240, 'tennis bracelet':320, bangle:280} as Record<string, number>)[type] || 220;
  const laborUsd = laborBase * laborGeoFactor;
  const avgMarkup = input.markupMultiplier && input.markupMultiplier > 0 ? input.markupMultiplier : 1.55;
  const geoOverheadUsd = normalize(input.stateOrProvince).includes('new york') || normalize(input.stateOrProvince) === 'ny' ? 120 : 75;
  const rawSubtotalUsd = metalUsd + centerUsd + sideUsd + laborUsd + geoOverheadUsd;
  const subtotalUsd = rawSubtotalUsd * avgMarkup;
  const taxRatePercent = inferTax(input.country, input.stateOrProvince);
  const taxUsd = subtotalUsd * (taxRatePercent / 100);
  const totalUsd = subtotalUsd + taxUsd;
  const targetBudget = toNum(input.budget) > 0 ? toNum(input.budget) : null;
  const total = convertFromUsd(totalUsd, input.country);
  const subtotal = convertFromUsd(subtotalUsd, input.country);
  const taxAmount = convertFromUsd(taxUsd, input.country);
  const difference = targetBudget !== null ? Number((total - targetBudget).toFixed(2)) : null;
  const currency = inferCurrency(input.country);
  const metalLabel = `${input.metalPurity || ''} ${input.metal || 'metal'}`.trim();
  return {
    currency,
    lines: [
      { label: `Metal (${weightGrams.toFixed(2)}g ${metalLabel})`, value: Number(convertFromUsd(metalUsd, input.country).toFixed(2)) },
      { label: `Center stone (${centerStoneCarat.toFixed(2)}ct)`, value: Number(convertFromUsd(centerUsd, input.country).toFixed(2)) },
      { label: `Accent stones (${sideStoneCarat.toFixed(2)}ct total${sideStoneCount ? ` / ${sideStoneCount} pcs` : ''})`, value: Number(convertFromUsd(sideUsd, input.country).toFixed(2)) },
      { label: 'Manufacturing labor', value: Number(convertFromUsd(laborUsd, input.country).toFixed(2)) },
      { label: 'Regional overhead & vendor-average markup basis', value: Number(convertFromUsd(geoOverheadUsd, input.country).toFixed(2)) },
    ],
    subtotal: Number(subtotal.toFixed(2)),
    taxRatePercent,
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    targetBudget,
    differenceToBudget: difference,
    isWithinBudget: targetBudget !== null ? total <= targetBudget : null,
    disclaimer: 'Phase 2 pricing uses API-ready live-rate placeholders with deterministic formulas for metal by grams, stone quality buckets, geo-based labor, average vendor markup, and included tax. Wire your production rate APIs and admin overrides before go-live.',
    assumptions: [
      `${type} estimated metal weight: ${weightGrams.toFixed(2)}g`,
      `${metalLabel || 'metal'} priced using API-ready fallback market rate`,
      `Stone pricing separates natural and lab diamonds by carat tier`,
      `Geo-adjusted labor and average vendor markup used for ${input.stateOrProvince || input.country || 'default market'}`,
    ],
    regionLabel: input.stateOrProvince ? `${input.stateOrProvince}, ${input.country || 'US'}` : (input.country || 'US'),
    liveRateStatus: 'api-ready-fallback',
  };
}
