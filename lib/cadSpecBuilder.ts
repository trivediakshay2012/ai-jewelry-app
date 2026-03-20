export type CadSpecLine = { label: string; value: string };
export type CadViewLabel = { title: string; subtitle: string };
export type CadSpec = {
  title: string;
  summary: string;
  category: string;
  dimensions: CadSpecLine[];
  stoneTable: CadSpecLine[];
  metalTable: CadSpecLine[];
  viewLabels: CadViewLabel[];
  engineeringNotes: string[];
  manufacturingSteps: string[];
};
export type CadInput = {
  jewelryType?: string | null;
  metal?: string | null;
  metalPurity?: string | null;
  stone?: string | null;
  shape?: string | null;
  ringSize?: string | number | null;
  centerStoneCarat?: number | string | null;
  sideStoneCarat?: number | string | null;
  sideStoneCount?: number | string | null;
  bandWidthMm?: number | string | null;
  necklaceLength?: string | null;
  wristSize?: string | null;
  bangleInnerDiameterMm?: string | null;
  earringLengthMm?: string | null;
  budget?: number | string | null;
  designTitle?: string | null;
};
function num(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function normalize(raw?: string | null) { return String(raw || '').trim().toLowerCase(); }
function inferType(raw?: string | null) {
  const value = normalize(raw);
  if (value.includes('tennis')) return 'Tennis Bracelet';
  if (value.includes('chain')) return 'Chain';
  if (value.includes('ear')) return 'Earrings';
  if (value.includes('neck')) return 'Necklace';
  if (value.includes('pend')) return 'Pendant';
  if (value.includes('bangle')) return 'Bangle';
  if (value.includes('brace')) return 'Bracelet';
  return 'Ring';
}
export function buildCadSpec(input: CadInput): CadSpec {
  const type = inferType(input.jewelryType);
  const centerStoneCarat = num(input.centerStoneCarat, type === 'Ring' ? 1.1 : 0.35);
  const accentCt = num(input.sideStoneCarat, type === 'Tennis Bracelet' ? 3.0 : 0.4);
  const sideStoneCount = num(input.sideStoneCount, type === 'Tennis Bracelet' ? 48 : type === 'Earrings' ? 16 : 8);
  const bandWidthMm = num(input.bandWidthMm, type === 'Ring' ? 2.2 : type === 'Bangle' ? 6 : 3.5);
  const ringSize = input.ringSize ? String(input.ringSize) : '6.5 US';
  const necklaceLength = String(input.necklaceLength || '18 in');
  const wristSize = String(input.wristSize || '7.0 in');
  const innerDiameter = String(input.bangleInnerDiameterMm || '62 mm');
  const earringLength = String(input.earringLengthMm || '18 mm');
  const metalLabel = `${input.metalPurity || '14k'} ${input.metal || 'Gold'}`.trim();
  const stoneLabel = `${input.shape || 'Round'} ${input.stone || 'Diamond'}`.trim();

  const commonViews = [
    { title: 'Front View', subtitle: 'Primary elevation and silhouette lock' },
    { title: 'Side View', subtitle: 'Depth, profile, and setting clearance' },
    { title: 'Perspective View', subtitle: 'Retail visualization and finish review' },
  ];

  const dimensions: CadSpecLine[] = [
    { label: 'Jewelry Type', value: type },
    { label: 'Metal', value: metalLabel },
    { label: 'Primary Stone', value: stoneLabel },
  ];
  const stoneTable: CadSpecLine[] = [
    { label: 'Center stone', value: `${centerStoneCarat.toFixed(2)} ct` },
    { label: 'Accent stone total', value: `${accentCt.toFixed(2)} ct` },
    { label: 'Accent stone count', value: `${Math.round(sideStoneCount)} pcs` },
  ];
  const metalTable: CadSpecLine[] = [
    { label: 'Target alloy', value: metalLabel },
    { label: 'Finish', value: 'Polished / production QC finish' },
    { label: 'Weight basis', value: 'Rule-based estimate for quote and CAD review' },
  ];

  if (type === 'Ring') {
    dimensions.push(
      { label: 'Ring size', value: ringSize },
      { label: 'Band width', value: `${bandWidthMm.toFixed(1)} mm` },
      { label: 'Head height', value: `${(bandWidthMm * 1.9).toFixed(1)} mm` },
      { label: 'Shoulder taper', value: `${Math.max(1.8, bandWidthMm - 0.4).toFixed(1)} mm` },
    );
  } else if (type === 'Earrings') {
    dimensions.push(
      { label: 'Pair length', value: earringLength },
      { label: 'Post / backing', value: 'Determined by earring style + secure wear' },
      { label: 'Face width', value: `${Math.max(4.5, bandWidthMm * 2.4).toFixed(1)} mm` },
    );
  } else if (type === 'Pendant') {
    dimensions.push(
      { label: 'Pendant height', value: `${Math.max(16, centerStoneCarat * 8 + 10).toFixed(1)} mm` },
      { label: 'Pendant width', value: `${Math.max(8, centerStoneCarat * 6 + 5).toFixed(1)} mm` },
      { label: 'Bail opening', value: 'Sized to chain gauge + comfort clearance' },
    );
  } else if (type === 'Necklace' || type === 'Chain') {
    dimensions.push(
      { label: 'Length', value: necklaceLength },
      { label: 'Gauge', value: `${Math.max(1.2, bandWidthMm * 0.55).toFixed(1)} mm` },
      { label: 'Clasp', value: 'Lobster / box clasp per chain family' },
    );
  } else if (type === 'Bracelet' || type === 'Tennis Bracelet') {
    dimensions.push(
      { label: 'Length', value: wristSize },
      { label: 'Link width', value: `${Math.max(2.5, bandWidthMm * 1.8).toFixed(1)} mm` },
      { label: 'Clasp', value: type === 'Tennis Bracelet' ? 'Safety lock + tongue clasp' : 'Lobster / box clasp' },
    );
  } else if (type === 'Bangle') {
    dimensions.push(
      { label: 'Inner diameter', value: innerDiameter },
      { label: 'Wall thickness', value: `${Math.max(2.2, bandWidthMm * 0.5).toFixed(1)} mm` },
      { label: 'Band width', value: `${bandWidthMm.toFixed(1)} mm` },
    );
  }

  return {
    title: input.designTitle || `${type} CAD specification sheet`,
    summary: `${type} specification sheet generated from locked design data for CAD review, quoting, and production alignment.`,
    category: type,
    dimensions,
    stoneTable,
    metalTable,
    viewLabels: commonViews,
    engineeringNotes: [
      'Preserve locked silhouette, setting family, and primary shape across all downstream outputs.',
      'Budget-aware revisions may reduce internal metal volume, accent stone count, purity, or secondary stone scale only.',
      'Final production file should confirm exact stone measurements, seat depth, and casting tolerances before manufacturing.',
      'Use this sheet as a deterministic bridge between AI render, CAD view, quote estimate, and vendor review.',
    ],
    manufacturingSteps: [
      'Freeze customer-approved design lock and silhouette references.',
      'Confirm category-specific dimensions and structural support points.',
      'Generate CAD-ready production geometry and tolerance checks.',
      'Review pricing, approve quote, then proceed to cast / print / set / finish.',
    ],
  };
}
