// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
type ImageQuality = 'high' | 'medium' | 'low' | 'auto';
type InputFidelity = 'high' | 'low';

function safe(value?: string, fallback = 'not specified') {
  return value?.trim() ? value.trim() : fallback;
}

function normalizeText(value?: string) {
  return (value || '').trim().toLowerCase();
}

function toNumber(value?: string) {
  const n = parseFloat(value || '');
  return Number.isFinite(n) ? n : 0;
}

function normalizeJewelryCategory(value?: string) {
  const v = normalizeText(value);
  if (v.includes('ring')) return 'ring';
  if (v.includes('bangle') || v.includes('kada')) return 'bangle';
  if (v.includes('bracelet') || v.includes('cuff')) return 'bracelet';
  if (v.includes('pendant')) return 'pendant';
  if (v.includes('necklace') || v.includes('chain') || v.includes('mangalsutra')) return 'necklace';
  if (v.includes('earring') || v.includes('stud') || v.includes('hoop') || v.includes('drop')) return 'earrings';
  return 'other';
}

function normalizeCountry(value?: string) {
  const v = normalizeText(value);
  if (v.includes('india')) return 'india';
  if (v.includes('dubai') || v.includes('uae') || v.includes('united arab emirates')) return 'dubai';
  if (v.includes('usa') || v.includes('united states') || v.includes('america') || v === 'us') return 'usa';
  return 'other';
}

function normalizeState(value?: string) {
  return normalizeText(value).replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function fileFromDataUrl(dataUrl: string, fileName: string, fallbackMime = 'image/png') {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  const mimeType = match?.[1] || fallbackMime;
  const base64 = match?.[2] || dataUrl;
  const bytes = decodeBase64(base64);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new File([arrayBuffer], fileName, { type: mimeType });
}

function getMimeExtension(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'png';
}

async function sourceToFile(source: string, index: number): Promise<File> {
  if (!source) throw new Error(`Missing image source at index ${index}`);
  if (source.startsWith('data:')) return fileFromDataUrl(source, `input-${index}.png`);

  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not fetch image source at index ${index}: ${response.status}`);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/png';
  const extension = getMimeExtension(mimeType);
  return new File([blob], `input-${index}.${extension}`, { type: mimeType });
}

async function callImageEdit({
  openaiApiKey,
  images,
  prompt,
  size = '1024x1024',
  quality = 'medium',
  inputFidelity = 'high',
}: {
  openaiApiKey: string;
  images: string[];
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
  inputFidelity?: InputFidelity;
}) {
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('quality', quality);
  form.append('input_fidelity', inputFidelity);
  form.append('output_format', 'png');
  form.append('background', 'opaque');
  form.append('n', '1');

  for (let i = 0; i < images.length; i += 1) {
    form.append('image[]', await sourceToFile(images[i], i));
  }

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
    body: form,
  });

  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function callImageGeneration({
  openaiApiKey,
  prompt,
  size = '1024x1024',
  quality = 'medium',
}: {
  openaiApiKey: string;
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
}) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      quality,
      output_format: 'png',
      size,
      n: 1,
      background: 'opaque',
    }),
  });

  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json));
  return json;
}

function extractBase64Image(json: any) {
  return json?.data?.[0]?.b64_json || null;
}

function getOptionDirection(optionIndex: number) {
  const directions = [
    'Closest premium interpretation with strongest fidelity to the requested design.',
    'Softer and more elegant interpretation with refined proportions.',
    'Richer luxury interpretation with stronger brilliance and elevated detail.',
    'Editorial hero-shot interpretation with elevated craftsmanship presence.',
  ];
  const safeIndex = Math.min(Math.max(optionIndex || 0, 0), directions.length - 1);
  return { label: `Option ${safeIndex + 1}`, instruction: directions[safeIndex] };
}

function estimateCenterStoneDiameterMm(carat: number, shape?: string): number {
  if (!carat || carat <= 0) return 0;
  const lowerShape = normalizeText(shape);
  const roundMm = 6.5 * Math.cbrt(carat);
  if (lowerShape.includes('oval')) return Number((roundMm * 1.12).toFixed(2));
  if (lowerShape.includes('emerald')) return Number((roundMm * 1.15).toFixed(2));
  if (lowerShape.includes('pear')) return Number((roundMm * 1.1).toFixed(2));
  if (lowerShape.includes('marquise')) return Number((roundMm * 1.18).toFixed(2));
  if (lowerShape.includes('princess')) return Number((roundMm * 0.96).toFixed(2));
  return Number(roundMm.toFixed(2));
}

function buildSizingRules(designData: any) {
  const centerStoneCarat = toNumber(designData?.centerStoneCarat);
  const sideStoneTotalCarat = toNumber(designData?.sideStoneTotalCarat);
  const sideStoneCount = toNumber(designData?.sideStoneCount);
  const prongCount = toNumber(designData?.prongCount);
  const bandWidthMm = toNumber(designData?.bandWidthMm);
  const eachSideStone = sideStoneTotalCarat > 0 && sideStoneCount > 0 ? sideStoneTotalCarat / sideStoneCount : 0;
  return `
Sizing rules:
- Center stone target visual weight: ${centerStoneCarat || 0} carat
- Side stones total weight: ${sideStoneTotalCarat || 0} carat
- Side stone count: ${sideStoneCount || 0}
- Derived side stone weight per stone: ${eachSideStone ? eachSideStone.toFixed(3) : 0} carat
- Prong count target: ${prongCount || 0}
- Band width target: ${bandWidthMm || 0} mm
`;
}

const USD_TO_INR = 83;
const USD_TO_AED = 3.67;
const USA_STATE_TAX_RATES: Record<string, number> = {
  alabama: 0.04, alaska: 0, arizona: 0.056, arkansas: 0.065, california: 0.0725,
  colorado: 0.029, connecticut: 0.0635, delaware: 0, florida: 0.06, georgia: 0.04,
  hawaii: 0.04, idaho: 0.06, illinois: 0.0625, indiana: 0.07, iowa: 0.06,
  kansas: 0.065, kentucky: 0.06, louisiana: 0.05, maine: 0.055, maryland: 0.06,
  massachusetts: 0.0625, michigan: 0.06, minnesota: 0.06875, mississippi: 0.07,
  missouri: 0.04225, montana: 0, nebraska: 0.055, nevada: 0.0685, 'new hampshire': 0,
  'new jersey': 0.06625, 'new mexico': 0.05125, 'new york': 0.04, 'north carolina': 0.0475,
  'north dakota': 0.05, ohio: 0.0575, oklahoma: 0.045, oregon: 0, pennsylvania: 0.06,
  'rhode island': 0.07, 'south carolina': 0.06, 'south dakota': 0.042, tennessee: 0.07,
  texas: 0.0625, utah: 0.061, vermont: 0.06, virginia: 0.053, washington: 0.065,
  'west virginia': 0.06, wisconsin: 0.05, wyoming: 0.04,
  dc: 0.06, 'district of columbia': 0.06,
};

function convertUsdToCurrency(amountUsd: number, currency: string) {
  if (currency === 'INR') return amountUsd * USD_TO_INR;
  if (currency === 'AED') return amountUsd * USD_TO_AED;
  return amountUsd;
}

function money(value: number) {
  return Number(value.toFixed(2));
}

function getCurrencyForPricing(designData: any) {
  const explicit = safe(designData?.budgetCurrency, '').toUpperCase();
  if (['USD', 'INR', 'AED'].includes(explicit)) return explicit;
  const country = normalizeCountry(designData?.country);
  if (country === 'india') return 'INR';
  if (country === 'dubai') return 'AED';
  return 'USD';
}

function getTaxProfile(designData: any) {
  const country = normalizeCountry(designData?.country);
  if (country === 'india') return { rate: 0.03, label: 'India GST estimate' };
  if (country === 'dubai') return { rate: 0.05, label: 'Dubai / UAE VAT estimate' };
  if (country === 'usa') {
    const state = normalizeState(designData?.stateOrProvince);
    return {
      rate: USA_STATE_TAX_RATES[state] ?? 0,
      label: state ? `USA sales tax estimate (${designData?.stateOrProvince})` : 'USA sales tax estimate (state not specified)',
    };
  }
  return { rate: 0, label: 'Tax estimate unavailable' };
}

function estimateMetalWeightGrams(designData: any) {
  const category = normalizeJewelryCategory(designData?.jewelryType);
  const bandWidthMm = toNumber(designData?.bandWidthMm);
  const centerStoneCarat = toNumber(designData?.centerStoneCarat);
  const sideStoneTotalCarat = toNumber(designData?.sideStoneTotalCarat);
  const necklaceLength = toNumber((String(designData?.necklaceLength || '').match(/\d+(\.\d+)?/) || [0])[0]);
  const earringLength = toNumber(designData?.earringLengthMm);

  if (category === 'ring') return Math.max(3.5, 3.2 + bandWidthMm * 1.35 + centerStoneCarat * 0.35 + sideStoneTotalCarat * 0.18);
  if (category === 'bracelet') return Math.max(9, 9 + sideStoneTotalCarat * 0.4);
  if (category === 'bangle') return Math.max(12, 12 + sideStoneTotalCarat * 0.45);
  if (category === 'necklace' || category === 'pendant') return Math.max(7, 6 + necklaceLength * 0.2 + centerStoneCarat * 0.2 + sideStoneTotalCarat * 0.2);
  if (category === 'earrings') return Math.max(4.5, 4.5 + earringLength * 0.08 + sideStoneTotalCarat * 0.22);
  return 7.5;
}

function getMetalUsdPerGram(designData: any) {
  const metal = normalizeText(designData?.metal);
  const purity = normalizeText(designData?.metalPurity);
  const country = normalizeCountry(designData?.country);
  const countryFactor = country === 'usa' ? 1.05 : country === 'india' ? 1 : country === 'dubai' ? 0.99 : 1.02;

  let base = 78;
  if (metal.includes('platinum')) base = 34;
  else if (metal.includes('silver')) base = 1.1;
  else if (purity.includes('24')) base = 86;
  else if (purity.includes('22')) base = 79;
  else if (purity.includes('21')) base = 75;
  else if (purity.includes('18')) base = 66;
  else if (purity.includes('14')) base = 52;
  else if (purity.includes('10')) base = 38;

  return base * countryFactor;
}

function getStoneUsdPerCarat(designData: any) {
  const stone = normalizeText(designData?.stone);
  if (!stone || stone.includes('no stone')) return 0;
  if (stone.includes('diamond') && stone.includes('lab')) return 1450;
  if (stone.includes('diamond')) return 6200;
  if (stone.includes('moissanite')) return 220;
  if (stone.includes('sapphire')) return 850;
  if (stone.includes('emerald')) return 1200;
  if (stone.includes('ruby')) return 1100;
  if (stone.includes('lab')) return 1200;
  return 450;
}

function estimateHaloCarat(designData: any) {
  const setting = normalizeText(designData?.settingStyle);
  if (!setting.includes('halo')) return 0;

  const centerStoneCarat = Math.max(0, toNumber(designData?.centerStoneCarat));
  const sideStoneTotalCarat = Math.max(0, toNumber(designData?.sideStoneTotalCarat));
  if (sideStoneTotalCarat > 0) return Number((sideStoneTotalCarat * 0.28).toFixed(2));
  if (centerStoneCarat > 0) return Number(Math.max(0.12, Math.min(0.75, centerStoneCarat * 0.24)).toFixed(2));
  return 0.15;
}

function buildStoneCostBreakdown(designData: any) {
  const stone = normalizeText(designData?.stone);
  const rate = getStoneUsdPerCarat(designData);
  const centerStoneCarat = Math.max(0, toNumber(designData?.centerStoneCarat));
  const sideStoneTotalCarat = Math.max(0, toNumber(designData?.sideStoneTotalCarat));
  const haloCarat = estimateHaloCarat(designData);
  const centerMultiplier = stone.includes('diamond') ? 1 : 0.92;
  const accentMultiplier = stone.includes('diamond') ? 0.34 : 0.5;
  const haloMultiplier = stone.includes('diamond') ? 0.28 : 0.42;

  const centerUsd = centerStoneCarat * rate * centerMultiplier;
  const sideUsd = sideStoneTotalCarat * rate * accentMultiplier;
  const haloUsd = haloCarat * rate * haloMultiplier;

  return {
    stoneLabel: safe(designData?.stone, 'Stone'),
    centerStoneCarat,
    sideStoneTotalCarat,
    haloCarat,
    centerUsd,
    sideUsd,
    haloUsd,
    totalUsd: centerUsd + sideUsd + haloUsd,
  };
}

function getLaborUsdEstimate(designData: any) {
  const country = normalizeCountry(designData?.country);
  const category = normalizeJewelryCategory(designData?.jewelryType);
  const baseByCategory: Record<string, number> = {
    ring: 260,
    necklace: 340,
    pendant: 280,
    bracelet: 300,
    bangle: 320,
    earrings: 240,
    other: 260,
  };
  const countryFactor = country === 'usa' ? 1.25 : country === 'india' ? 0.72 : country === 'dubai' ? 0.95 : 1;
  return (baseByCategory[category] || baseByCategory.other) * countryFactor;
}

function buildPricingEstimate(designData: any) {
  const currency = getCurrencyForPricing(designData);
  const metalWeightGrams = estimateMetalWeightGrams(designData);
  const stoneBreakdown = buildStoneCostBreakdown(designData);
  const metalUsd = metalWeightGrams * getMetalUsdPerGram(designData);
  const stoneUsd = stoneBreakdown.totalUsd;
  const laborUsd = getLaborUsdEstimate(designData);
  const miscUsd = Math.max(85, metalUsd * 0.06);
  const complexityUsd = Math.max(65, stoneUsd * 0.05 + laborUsd * 0.12);
  const subtotalUsd = metalUsd + stoneUsd + laborUsd + miscUsd + complexityUsd;
  const taxProfile = getTaxProfile(designData);
  const taxUsd = subtotalUsd * taxProfile.rate;
  const totalUsd = subtotalUsd + taxUsd;
  const targetBudget = toNumber(designData?.budget);

  const subtotal = money(convertUsdToCurrency(subtotalUsd, currency));
  const taxAmount = money(convertUsdToCurrency(taxUsd, currency));
  const total = money(convertUsdToCurrency(totalUsd, currency));

  const lines = [
    { label: `Benchmark metal estimate · ${safe(designData?.metalPurity, 'metal')} ${safe(designData?.metal, 'metal')} (${metalWeightGrams.toFixed(1)} g)`, value: money(convertUsdToCurrency(metalUsd, currency)) },
  ];

  if (stoneBreakdown.centerUsd > 0) {
    lines.push({
      label: `${stoneBreakdown.stoneLabel} center estimate · ${stoneBreakdown.centerStoneCarat} ct`,
      value: money(convertUsdToCurrency(stoneBreakdown.centerUsd, currency)),
    });
  }

  if (stoneBreakdown.sideUsd > 0) {
    lines.push({
      label: `${stoneBreakdown.stoneLabel} side stone estimate · ${stoneBreakdown.sideStoneTotalCarat} ct total`,
      value: money(convertUsdToCurrency(stoneBreakdown.sideUsd, currency)),
    });
  }

  if (stoneBreakdown.haloUsd > 0) {
    lines.push({
      label: `${stoneBreakdown.stoneLabel} halo estimate · approx. ${stoneBreakdown.haloCarat} ct`,
      value: money(convertUsdToCurrency(stoneBreakdown.haloUsd, currency)),
    });
  }

  lines.push(
    { label: 'Making / labor estimate', value: money(convertUsdToCurrency(laborUsd, currency)) },
    { label: 'Setting / finishing / polish', value: money(convertUsdToCurrency(miscUsd, currency)) },
    { label: 'Complexity / craftsmanship', value: money(convertUsdToCurrency(complexityUsd, currency)) },
  );

  return {
    country: safe(designData?.country),
    stateOrProvince: safe(designData?.stateOrProvince, ''),
    currency,
    metalWeightGrams: money(metalWeightGrams),
    taxRatePercent: money(taxProfile.rate * 100),
    taxLabel: taxProfile.label,
    subtotal,
    taxAmount,
    total,
    targetBudget: targetBudget > 0 ? money(targetBudget) : null,
    differenceToBudget: targetBudget > 0 ? money(total - targetBudget) : null,
    isWithinBudget: targetBudget > 0 ? total <= targetBudget : null,
    lines,
    disclaimer: 'Structured MVP estimate using benchmark-style metal, center stone, side stone, halo, making charges, craftsmanship, and country/state tax logic. Final live quotes can still vary by vendor, stone grade, certification, and location.',
  };
}

function buildBudgetOptimizationPlan(designData: any) {
  const originalEstimate = buildPricingEstimate(designData);
  const budget = toNumber(designData?.budget);
  const currentTotal = originalEstimate.total;
  const ratio = budget > 0 ? Math.min(0.9, budget / Math.max(currentTotal, 1)) : 0.82;
  const optimized = { ...designData };
  const changes: { title: string; detail: string }[] = [];

  if (budget > 0 && currentTotal > budget) {
    const centerStoneCarat = toNumber(designData?.centerStoneCarat);
    if (centerStoneCarat > 0) {
      const newCarat = Math.max(0.3, Number((centerStoneCarat * Math.max(0.62, ratio)).toFixed(2)));
      optimized.centerStoneCarat = String(newCarat);
      changes.push({ title: 'Center stone resizing', detail: `Reduced center stone from about ${centerStoneCarat} ct to about ${newCarat} ct to protect the same overall look while cutting cost.` });
    }

    const sideStoneTotalCarat = toNumber(designData?.sideStoneTotalCarat);
    if (sideStoneTotalCarat > 0) {
      const newSide = Math.max(0, Number((sideStoneTotalCarat * Math.max(0.55, ratio)).toFixed(2)));
      optimized.sideStoneTotalCarat = String(newSide);
      changes.push({ title: 'Accent stone balancing', detail: `Reduced side stones from about ${sideStoneTotalCarat} ct total to about ${newSide} ct total while keeping the same placement rhythm.` });
    }

    const bandWidth = toNumber(designData?.bandWidthMm);
    if (bandWidth > 0) {
      const newBand = Math.max(1.6, Number((bandWidth * 0.9).toFixed(2)));
      optimized.bandWidthMm = String(newBand);
      changes.push({ title: 'Hidden metal reduction', detail: `Trimmed hidden structural metal and tuned the band from ${bandWidth} mm to about ${newBand} mm in less visible areas.` });
    } else {
      changes.push({ title: 'Structure simplification', detail: 'Reduced hidden mass, internal gallery thickness, and non-hero detailing to keep the same design identity at a lower cost.' });
    }
  } else {
    changes.push({ title: 'Budget already aligned', detail: 'The original estimate is already close to the entered budget, so only minimal hidden-structure optimization is needed.' });
  }

  changes.push({ title: 'Protected design identity', detail: 'The visible top view, motif language, silhouette, and overall luxury feel stay aligned with the original selected design.' });
  const optimizedEstimate = buildPricingEstimate(optimized);
  return { optimizedDesignData: optimized, originalEstimate, optimizedEstimate, changes };
}

function buildBudgetAwareReport(designData: any) {
  const plan = buildBudgetOptimizationPlan(designData);
  const stone = normalizeText(designData?.stone);
  const recommendation = stone.includes('diamond')
    ? 'To preserve the same visible design more closely, consider a modest budget increase, 14K instead of 18K where acceptable, or lab-grown diamonds for the hero and halo stones.'
    : 'To preserve the same visible design more closely, consider a modest budget increase, slightly lower metal purity, or fewer accent details in hidden areas.';

  return {
    title: 'Budget-Aware Optimization Summary',
    targetBudget: `${plan.originalEstimate.currency} ${safe(designData?.budget)}`,
    protectedDesign: 'Original silhouette, design family, and premium look preserved',
    changeSummary:
      plan.originalEstimate.targetBudget && plan.originalEstimate.isWithinBudget === false
        ? `AI reduced hidden metal usage, tuned center and accent stone cost, and simplified non-hero structure to move the design closer to the target budget. ${recommendation}`
        : 'AI kept the same design identity and only applied light efficiency changes because the estimate was already near budget.',
    originalEstimate: plan.originalEstimate,
    optimizedEstimate: plan.optimizedEstimate,
    changes: plan.changes,
  };
}

function buildTechnicalSheetData(designData: any) {
  const category = normalizeJewelryCategory(designData?.jewelryType);
  const jewelryType = safe(designData?.jewelryType, 'custom jewelry');
  const metal = safe(designData?.metal);
  const metalPurity = safe(designData?.metalPurity);
  const stone = safe(designData?.stone);
  const shape = safe(designData?.shape);
  const finishLevel = safe(designData?.finishLevel, 'polished');
  const centerStoneCarat = toNumber(designData?.centerStoneCarat);
  const centerStoneDiameterMm = estimateCenterStoneDiameterMm(centerStoneCarat, designData?.shape);
  const sideStoneTotalCarat = toNumber(designData?.sideStoneTotalCarat);
  const sideStoneCount = Math.round(toNumber(designData?.sideStoneCount));
  const sideStonesPerSide = sideStoneCount > 0 && sideStoneCount % 2 === 0 ? sideStoneCount / 2 : sideStoneCount;
  const sideStoneEachCarat = sideStoneCount > 0 ? Number((sideStoneTotalCarat / sideStoneCount).toFixed(3)) : 0;
  const prongCount = Math.round(toNumber(designData?.prongCount));
  const bandWidthMm = toNumber(designData?.bandWidthMm);

  const categoryNotes: Record<string, string[]> = {
    ring: [
      centerStoneCarat > 0 ? `Center stone target visual size ≈ ${centerStoneDiameterMm} mm.` : 'Center stone size not specified.',
      sideStoneCount > 0 ? `Side stones distributed as ${sideStonesPerSide} per side when symmetry is possible.` : 'No side stones specified.',
      bandWidthMm > 0 ? `Band width target is ${bandWidthMm} mm.` : 'Band width not specified.',
      prongCount > 0 ? `Prong configuration target is ${prongCount}-prong.` : 'Prong configuration not specified.',
    ],
    pendant: [
      `Pendant style: ${safe(designData?.pendantStyle)}.`,
      `Chain detail: ${safe(designData?.chainStyle, 'pendant only')}.`,
      centerStoneCarat > 0 ? `Main stone target visual size ≈ ${centerStoneDiameterMm} mm.` : 'Main stone size not specified.',
      `Frame / silhouette detail: ${safe(designData?.bandStyle)}.`,
    ],
    necklace: [
      `Necklace length target: ${safe(designData?.necklaceLength)}.`,
      `Chain style target: ${safe(designData?.chainStyle)}.`,
      `Clasp detail: ${safe(designData?.claspStyle)}.`,
      `Center motif: ${safe(designData?.pendantStyle)}.`,
    ],
    bracelet: [
      `Bracelet style: ${safe(designData?.braceletStyle)}.`,
      `Wrist size target: ${safe(designData?.wristSize)}.`,
      `Clasp detail: ${safe(designData?.claspStyle)}.`,
      `Finish level: ${finishLevel}.`,
    ],
    bangle: [
      `Bangle style: ${safe(designData?.bangleStyle)}.`,
      `Inner diameter / size: ${safe(designData?.bangleInnerDiameterMm)}.`,
      `Opening style: ${safe(designData?.isOpenableBangle)}.`,
      `Wrist size target: ${safe(designData?.wristSize)}.`,
    ],
    earrings: [
      `Earring style: ${safe(designData?.earringStyle)}.`,
      `Length / size target: ${safe(designData?.earringLengthMm)}.`,
      `Backing type: ${safe(designData?.earringBackingType)}.`,
      sideStoneCount > 0 ? `Pair layout includes ${sideStoneCount} total stones / elements.` : 'Stone count for the pair was not specified.',
    ],
    other: [
      `Primary structure detail: ${safe(designData?.settingStyle)}.`,
      `Secondary structure detail: ${safe(designData?.bandStyle)}.`,
      `Finish level: ${finishLevel}.`,
      `Final note: ${safe(designData?.finalCustomNote)}.`,
    ],
  };

  const baseRows = [
    { label: 'Jewelry Type', value: jewelryType },
    { label: 'Country / Market', value: `${safe(designData?.country)}${designData?.stateOrProvince ? ` / ${designData.stateOrProvince}` : ''}` },
    { label: 'Metal', value: metal },
    { label: 'Metal Purity', value: metalPurity },
    { label: 'Stone', value: stone },
    { label: 'Shape', value: shape },
  ];

  const categoryRows: Record<string, { label: string; value: string }[]> = {
    ring: [
      { label: 'Ring Size', value: safe(designData?.ringSize) },
      { label: 'Center Stone', value: centerStoneCarat > 0 ? `${centerStoneCarat} ct / approx. ${centerStoneDiameterMm} mm` : 'Not specified' },
      { label: 'Side Stones', value: sideStoneCount > 0 ? `${sideStoneCount} total / ${sideStoneTotalCarat} ct total / ${sideStoneEachCarat} ct each` : 'Not specified' },
      { label: 'Prongs', value: prongCount > 0 ? `${prongCount}` : 'Not specified' },
      { label: 'Band Width', value: bandWidthMm > 0 ? `${bandWidthMm} mm` : 'Not specified' },
      { label: 'Setting', value: safe(designData?.settingStyle) },
      { label: 'Band Style', value: safe(designData?.bandStyle) },
    ],
    pendant: [
      { label: 'Pendant Style', value: safe(designData?.pendantStyle) },
      { label: 'Chain Length', value: safe(designData?.necklaceLength, 'Pendant only') },
      { label: 'Chain Style', value: safe(designData?.chainStyle, 'Pendant only') },
      { label: 'Stone Setting', value: safe(designData?.settingStyle) },
      { label: 'Frame / Bail', value: safe(designData?.bandStyle) },
    ],
    necklace: [
      { label: 'Necklace Length', value: safe(designData?.necklaceLength) },
      { label: 'Chain Style', value: safe(designData?.chainStyle) },
      { label: 'Clasp Style', value: safe(designData?.claspStyle) },
      { label: 'Center Motif', value: safe(designData?.pendantStyle) },
    ],
    bracelet: [
      { label: 'Bracelet Style', value: safe(designData?.braceletStyle) },
      { label: 'Wrist Size', value: safe(designData?.wristSize) },
      { label: 'Clasp Style', value: safe(designData?.claspStyle) },
    ],
    bangle: [
      { label: 'Bangle Style', value: safe(designData?.bangleStyle) },
      { label: 'Wrist Size', value: safe(designData?.wristSize) },
      { label: 'Inner Diameter / Size', value: safe(designData?.bangleInnerDiameterMm) },
      { label: 'Opening Style', value: safe(designData?.isOpenableBangle) },
    ],
    earrings: [
      { label: 'Earring Style', value: safe(designData?.earringStyle) },
      { label: 'Length / Size', value: safe(designData?.earringLengthMm) },
      { label: 'Backing Type', value: safe(designData?.earringBackingType) },
      { label: 'Stone Layout', value: safe(designData?.settingStyle) },
      { label: 'Pair Elements', value: sideStoneCount > 0 ? `${sideStoneCount} total` : 'Not specified' },
    ],
    other: [
      { label: 'Structure', value: safe(designData?.settingStyle) },
      { label: 'Secondary Detail', value: safe(designData?.bandStyle) },
    ],
  };

  return {
    title: 'Technical Specification Sheet',
    jewelryType,
    normalizedType: category,
    metal,
    metalPurity,
    stone,
    shape,
    ringSize: safe(designData?.ringSize),
    centerStoneCarat,
    centerStoneDiameterMm,
    sideStoneTotalCarat,
    sideStoneCount,
    sideStonesPerSide,
    sideStoneEachCarat,
    prongCount,
    bandWidthMm,
    settingStyle: safe(designData?.settingStyle),
    finishLevel,
    necklaceLength: safe(designData?.necklaceLength),
    chainStyle: safe(designData?.chainStyle),
    pendantStyle: safe(designData?.pendantStyle),
    braceletStyle: safe(designData?.braceletStyle),
    claspStyle: safe(designData?.claspStyle),
    wristSize: safe(designData?.wristSize),
    bangleStyle: safe(designData?.bangleStyle),
    bangleInnerDiameterMm: safe(designData?.bangleInnerDiameterMm),
    isOpenableBangle: safe(designData?.isOpenableBangle),
    earringStyle: safe(designData?.earringStyle),
    earringLengthMm: safe(designData?.earringLengthMm),
    earringBackingType: safe(designData?.earringBackingType),
    notes: categoryNotes[category] || categoryNotes.other,
    specRows: [...baseRows, ...(categoryRows[category] || categoryRows.other), { label: 'Finish', value: finishLevel }],
  };
}

function buildBeautyPrompt(designData: any, basePrompt: string, inspirationAnalysis: string, optionIndex: number) {
  const option = getOptionDirection(optionIndex);
  return `${basePrompt}

Reference inspiration analysis: ${inspirationAnalysis || 'No inspiration analysis provided.'}

Mode: Product image only.
Variation direction: ${option.instruction}

Critical instructions:
- Keep the jewelry itself as the hero.
- Preserve the requested structure, size, stone count, and proportions.
- Make the output look like high-end luxury jewelry campaign photography.
- No random extra stones or extra structures.
- Ultra realistic, premium lighting, macro detail, sharp reflections, photorealistic.
- Return a single product image on a studio background.`;
}

function buildLifestylePrompt(designData: any, inspirationAnalysis: string) {
  return `Transform the provided jewelry product image into a luxury model preview.

Rules:
- Keep the jewelry design exactly the same as the selected option image.
- Do not change the jewelry structure, engraving pattern, silhouette, stone count, proportions, or metal type.
- Show a realistic model naturally wearing THIS exact jewelry piece.
- Premium editorial jewelry photography.
- Jewelry must remain clearly visible.

Wearer styling:
- Gender / style: ${safe(designData?.wearerGender, 'female')} with ${safe(designData?.wearerStyle, 'refined luxury styling')}
- Outfit: ${safe(designData?.outfitType, 'luxury editorial outfit')}
- Outfit color: ${safe(designData?.outfitColor, 'neutral luxury palette')}
- Occasion: ${safe(designData?.occasion, 'special occasion')}
- Mood: ${safe(designData?.styleMood, 'luxurious')}

Reference inspiration analysis: ${inspirationAnalysis || 'No inspiration analysis provided.'}
Photorealistic only.`;
}

function buildPersonalPreviewPrompt(designData: any, inspirationAnalysis: string) {
  return `Create a personal jewelry try-on preview using the provided selected jewelry option image and the uploaded customer face photo.

Input priority:
- Image 1 and Image 3 are the locked product blueprint for the jewelry.
- Image 2 is the locked facial identity reference.

Hard requirements:
- Preserve the jewelry from Image 1 / Image 3 exactly as selected.
- Do not redesign, restyle, resize, recolor, or reinterpret the jewelry.
- Keep the exact same metal color, stone arrangement, silhouette, setting style, and visible proportions.
- The customer face must stay as close as possible to the uploaded person with no face widening, slimming, age shift, or beauty-filter distortion.
- This should look like the selected jewelry was realistically placed onto the uploaded person, not like a newly invented jewelry concept.
- If there is any conflict, prioritize jewelry fidelity and face identity over scene creativity.

Wearer styling:
- Gender / style: ${safe(designData?.wearerGender, 'female')} with ${safe(designData?.wearerStyle, 'luxury styling')}
- Outfit: ${safe(designData?.outfitType, 'luxury outfit')}
- Outfit color: ${safe(designData?.outfitColor, 'neutral refined palette')}
- Mood: ${safe(designData?.styleMood, 'luxurious')}

Reference inspiration analysis: ${inspirationAnalysis || 'No inspiration analysis provided.'}
Photorealistic only. Keep the selected jewelry visibly identical to the chosen option.`;
}

function buildRegenerationPrompt(designData: any, editInstruction: string) {
  return `Edit the provided jewelry image.

Keep the same jewelry category and same core design identity.
The selected input image is locked and must remain the primary blueprint.

Requested change:
${safe(editInstruction, 'Refine the selected option while preserving the original design identity.')}

Original constraints:
- Metal: ${safe(designData?.metal)}
- Stone: ${safe(designData?.stone)}
- Shape: ${safe(designData?.shape)}
- Ring size: ${safe(designData?.ringSize)}
- Center stone carat: ${safe(designData?.centerStoneCarat, '0')}
- Side stone total: ${safe(designData?.sideStoneTotalCarat, '0')}
- Side stone count: ${safe(designData?.sideStoneCount, '0')}
- Prong count: ${safe(designData?.prongCount, '0')}
- Band width: ${safe(designData?.bandWidthMm, '0')} mm
- Finish: ${safe(designData?.finishLevel, 'polished')}

Rules:
- Preserve the same overall design family.
- Apply the change request strongly and visibly.
- Do not ignore the edit request.
- Keep the result premium, realistic, and jewelry-catalog ready.`;
}

function buildBudgetAwarePrompt(designData: any, plan: any) {
  return `Edit the provided jewelry image into a budget-aware version.

Primary goal:
- Keep the same visible design identity as the selected jewelry piece.
- This is an optimization pass, NOT a redesign pass.
- The base selected image is the locked blueprint and must remain visually recognizable.

Hard rules:
- Preserve the same overall silhouette, motif placement, center concept, and jewelry category.
- Do not make the result look like a different design.
- Keep the same metal color family unless absolutely necessary.
- Keep the same center-stone shape unless absolutely necessary.
- Preserve the emotional appeal and recognizability of the original design.
- Any reduction must happen through hidden engineering, efficient stone sizing, or non-hero structural simplification.

Budget target: ${safe(designData?.budget)} ${safe(designData?.budgetCurrency, '')}
Current estimated total: ${plan.originalEstimate.currency} ${plan.originalEstimate.total}
Optimized target estimate: ${plan.optimizedEstimate.currency} ${plan.optimizedEstimate.total}
Country / market: ${safe(designData?.country)} ${safe(designData?.stateOrProvince, '')}

Apply these specific optimization moves strongly:
${plan.changes.map((change: any, index: number) => `${index + 1}. ${change.title}: ${change.detail}`).join('\n')}

Output requirement:
- The result should look like the same design optimized for budget, not a newly invented piece.
- Photorealistic, premium jewelry product render only.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      prompt,
      designData,
      inspirationAnalysis,
      uploadedInspirationUrls,
      editInstruction,
      selectedBaseImage,
      facePhotoDataUrl,
      mode,
      optionIndex,
    } = await req.json();

    if (mode === 'technical-sheet') {
      const technicalSheet = buildTechnicalSheetData(designData || {});
      const pricingEstimate = buildPricingEstimate(designData || {});
      return new Response(JSON.stringify({ technicalSheet, pricingEstimate }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY secret in Supabase' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inspirationSources: string[] = Array.isArray(uploadedInspirationUrls)
      ? uploadedInspirationUrls.filter(Boolean)
      : [];
    const hasInspiration = inspirationSources.length > 0;
    const option = getOptionDirection(optionIndex ?? 0);
    const sizingRules = buildSizingRules(designData || {});

    const baseContext = `
You are designing original luxury jewelry.

Core user prompt:
${prompt}

Design data:
- Jewelry Type: ${designData?.jewelryType || 'fine jewelry piece'}
- Occasion: ${designData?.occasion || 'special occasion'}
- Country / Region: ${designData?.country || 'global luxury taste'}
- State / Province / Emirate: ${designData?.stateOrProvince || 'not specified'}
- Wearer Gender: ${designData?.wearerGender || 'wearer'}
- Wearer Style: ${designData?.wearerStyle || 'refined'}
- Metal: ${designData?.metal || 'premium metal'}
- Metal Purity: ${designData?.metalPurity || 'premium purity'}
- Stone: ${designData?.stone || 'gemstone'}
- Shape: ${designData?.shape || 'elegant cut'}
- Ring Size: ${designData?.ringSize || 'not specified'}
- Setting Style: ${designData?.settingStyle || 'high-end setting'}
- Band Style: ${designData?.bandStyle || 'luxury band'}
- Necklace Length: ${designData?.necklaceLength || 'not specified'}
- Chain Style: ${designData?.chainStyle || 'not specified'}
- Pendant Style: ${designData?.pendantStyle || 'not specified'}
- Bracelet Style: ${designData?.braceletStyle || 'not specified'}
- Wrist Size: ${designData?.wristSize || 'not specified'}
- Bangle Style: ${designData?.bangleStyle || 'not specified'}
- Bangle Inner Diameter: ${designData?.bangleInnerDiameterMm || 'not specified'}
- Bangle Opening: ${designData?.isOpenableBangle || 'not specified'}
- Clasp Style: ${designData?.claspStyle || 'not specified'}
- Earring Style: ${designData?.earringStyle || 'not specified'}
- Earring Length: ${designData?.earringLengthMm || 'not specified'}
- Earring Backing: ${designData?.earringBackingType || 'not specified'}
- Finish Level: ${designData?.finishLevel || 'polished'}
- Style Mood: ${designData?.styleMood || 'luxurious'}
- Reference Inspiration: ${designData?.referenceInspiration || 'high jewelry editorial'}
- Luxury Tone: ${designData?.luxuryTone || 'high luxury'}
- Background Style: ${designData?.backgroundStyle || 'clean white studio'}
- Outfit Type: ${designData?.outfitType || 'luxury styling'}
- Outfit Color: ${designData?.outfitColor || 'refined palette'}
- Budget: ${designData?.budget || 'not specified'} ${designData?.budgetCurrency || ''}
- Final Custom Note: ${designData?.finalCustomNote || 'none'}

${sizingRules}

Inspiration analysis:
${inspirationAnalysis || 'No inspiration analysis was provided.'}

Requested edit from user:
${editInstruction || 'No additional change request.'}

Selected option direction:
${option.label}: ${option.instruction}

Critical source behavior:
${hasInspiration
  ? '- Use the uploaded inspiration images heavily. Preserve pattern language, ornament density, silhouette logic, motif repetition, and cultural styling from the source images. The result must feel strongly inspired by the uploaded references while remaining original.'
  : '- No inspiration images were uploaded. Use the answered fields and the final custom note as the primary design source. Follow the final custom note heavily and do not drift into generic jewelry.'}
`;

    if (mode === 'lifestyle') {
      if (!selectedBaseImage) {
        return new Response(JSON.stringify({ error: 'Missing selectedBaseImage for lifestyle mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const lifestyleResult = await callImageEdit({
        openaiApiKey,
        images: [selectedBaseImage],
        prompt: `${baseContext}\n\n${buildLifestylePrompt(designData || {}, inspirationAnalysis || '')}`,
        size: '1024x1536',
        quality: 'high',
        inputFidelity: 'high',
      });

      const lifestyleB64 = extractBase64Image(lifestyleResult);
      if (!lifestyleB64) throw new Error('No lifestyle image returned');

      return new Response(JSON.stringify({ lifestyleImage: `data:image/png;base64,${lifestyleB64}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'personal-preview') {
      if (!selectedBaseImage || !facePhotoDataUrl) {
        return new Response(JSON.stringify({ error: 'Missing selectedBaseImage or facePhotoDataUrl for personal-preview mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const personalResult = await callImageEdit({
        openaiApiKey,
        images: [selectedBaseImage, facePhotoDataUrl, selectedBaseImage],
        prompt: `${baseContext}\n\n${buildPersonalPreviewPrompt(designData || {}, inspirationAnalysis || '')}`,
        size: '1024x1536',
        quality: 'high',
        inputFidelity: 'high',
      });

      const personalB64 = extractBase64Image(personalResult);
      if (!personalB64) throw new Error('No personal preview image returned');

      return new Response(JSON.stringify({ personalPreviewImage: `data:image/png;base64,${personalB64}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'regenerate-selected') {
      if (!selectedBaseImage) {
        return new Response(JSON.stringify({ error: 'Missing selectedBaseImage for regenerate-selected mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const regeneratePrompt = buildRegenerationPrompt(designData || {}, editInstruction || '');
      const regenImages = hasInspiration ? [selectedBaseImage, ...inspirationSources] : [selectedBaseImage];
      const regeneratedResult = await callImageEdit({
        openaiApiKey,
        images: regenImages,
        prompt: `${baseContext}\n\n${regeneratePrompt}`,
        size: '1024x1024',
        quality: 'high',
        inputFidelity: 'high',
      });

      const regeneratedB64 = extractBase64Image(regeneratedResult);
      if (!regeneratedB64) throw new Error('No regenerated image returned');

      return new Response(JSON.stringify({
        regeneratedImage: `data:image/png;base64,${regeneratedB64}`,
        appliedPrompt: `${baseContext}\n\n${regeneratePrompt}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'budget-aware') {
      if (!selectedBaseImage) {
        return new Response(JSON.stringify({ error: 'Missing selectedBaseImage for budget-aware mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!designData?.budget || !String(designData.budget).trim()) {
        return new Response(JSON.stringify({ error: 'Missing designData.budget for budget-aware mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const budgetPlan = buildBudgetOptimizationPlan(designData || {});
      const budgetAwarePrompt = buildBudgetAwarePrompt(designData || {}, budgetPlan);
      const budgetImages = hasInspiration ? [selectedBaseImage, ...inspirationSources] : [selectedBaseImage];
      const budgetResult = await callImageEdit({
        openaiApiKey,
        images: budgetImages,
        prompt: `${baseContext}\n\n${budgetAwarePrompt}`,
        size: '1024x1024',
        quality: 'high',
        inputFidelity: 'high',
      });

      const budgetB64 = extractBase64Image(budgetResult);
      if (!budgetB64) throw new Error('No budget-aware image returned');

      return new Response(JSON.stringify({
        budgetAwareImage: `data:image/png;base64,${budgetB64}`,
        budgetAwareReport: buildBudgetAwareReport(designData || {}),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'product-single') {
      const productPrompt = buildBeautyPrompt(designData || {}, baseContext, inspirationAnalysis || '', optionIndex ?? 0);
      const productResult = hasInspiration
        ? await callImageEdit({
            openaiApiKey,
            images: inspirationSources,
            prompt: productPrompt,
            size: '1024x1024',
            quality: 'high',
            inputFidelity: 'high',
          })
        : await callImageGeneration({
            openaiApiKey,
            prompt: productPrompt,
            size: '1024x1024',
            quality: 'high',
          });

      const productB64 = extractBase64Image(productResult);
      if (!productB64) throw new Error(`No product image returned for ${option.label}`);

      return new Response(JSON.stringify({
        productImage: {
          id: `product-${(optionIndex ?? 0) + 1}`,
          label: option.label,
          dataUrl: `data:image/png;base64,${productB64}`,
        },
        appliedPrompt: productPrompt,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-jewelry-image error:', error);
    return new Response(JSON.stringify({
      error: 'Unexpected generate-jewelry-image error',
      details: error?.message || String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
