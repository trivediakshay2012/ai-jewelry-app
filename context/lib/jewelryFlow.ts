import { DesignData } from '../context/DesignContext';

export type SupportedJewelryType =
  | 'ring'
  | 'necklace'
  | 'pendant'
  | 'bracelet'
  | 'bangle'
  | 'earrings'
  | 'other';

export type SupportedCountry = 'usa' | 'india' | 'dubai' | 'other';

export function normalizeText(value?: string) {
  return (value || '').trim().toLowerCase();
}

export function normalizeJewelryType(value?: string): SupportedJewelryType {
  const v = normalizeText(value);

  if (
    v.includes('engagement ring') ||
    v.includes('wedding ring') ||
    v.includes('wedding band') ||
    v.includes('ring')
  ) {
    return 'ring';
  }

  if (v.includes('bangle') || v.includes('kada')) {
    return 'bangle';
  }

  if (v.includes('bracelet') || v.includes('cuff') || v.includes('tennis bracelet')) {
    return 'bracelet';
  }

  if (v.includes('pendant')) {
    return 'pendant';
  }

  if (v.includes('necklace') || v.includes('chain') || v.includes('mangalsutra')) {
    return 'necklace';
  }

  if (
    v.includes('earring') ||
    v.includes('stud') ||
    v.includes('hoop') ||
    v.includes('drop')
  ) {
    return 'earrings';
  }

  return 'other';
}

export function normalizeCountry(value?: string): SupportedCountry {
  const v = normalizeText(value);

  if (
    v.includes('usa') ||
    v.includes('united states') ||
    v.includes('us') ||
    v.includes('america')
  ) {
    return 'usa';
  }

  if (v.includes('india') || v.includes('indian')) {
    return 'india';
  }

  if (
    v.includes('dubai') ||
    v.includes('uae') ||
    v.includes('united arab emirates')
  ) {
    return 'dubai';
  }

  return 'other';
}

export function getCurrencyForCountry(value?: string) {
  const country = normalizeCountry(value);

  if (country === 'usa') return 'USD';
  if (country === 'india') return 'INR';
  if (country === 'dubai') return 'AED';
  return 'USD';
}

export function hasStone(designData: DesignData) {
  const stone = normalizeText(designData.stone);
  return stone !== '' && !stone.includes('no stone');
}

export function isRing(designData: DesignData) {
  return normalizeJewelryType(designData.jewelryType) === 'ring';
}

export function isBracelet(designData: DesignData) {
  return normalizeJewelryType(designData.jewelryType) === 'bracelet';
}

export function isBangle(designData: DesignData) {
  return normalizeJewelryType(designData.jewelryType) === 'bangle';
}

export function isNecklace(designData: DesignData) {
  return normalizeJewelryType(designData.jewelryType) === 'necklace';
}

export function isPendant(designData: DesignData) {
  return normalizeJewelryType(designData.jewelryType) === 'pendant';
}

export function isEarrings(designData: DesignData) {
  return normalizeJewelryType(designData.jewelryType) === 'earrings';
}

export function isNeckWear(designData: DesignData) {
  const type = normalizeJewelryType(designData.jewelryType);
  return type === 'necklace' || type === 'pendant';
}

export function isWristWear(designData: DesignData) {
  const type = normalizeJewelryType(designData.jewelryType);
  return type === 'bracelet' || type === 'bangle';
}

export function needsMetalPurity(designData: DesignData) {
  return normalizeText(designData.metal).includes('gold');
}

export function needsStateOrProvince(designData: DesignData) {
  return normalizeCountry(designData.country) === 'usa';
}

export function getJewelryTypeHelperText(type: SupportedJewelryType) {
  if (type === 'ring') {
    return 'Ring flow activated: ring size, center stone, side stones, prongs, and band details will be asked.';
  }

  if (type === 'necklace') {
    return 'Necklace flow activated: necklace length, chain style, clasp, and necklace structure details will be asked.';
  }

  if (type === 'pendant') {
    return 'Pendant flow activated: pendant style, chain style, necklace length, and clasp details will be asked.';
  }

  if (type === 'bracelet') {
    return 'Bracelet flow activated: bracelet style, wrist size, and clasp details will be asked.';
  }

  if (type === 'bangle') {
    return 'Bangle flow activated: bangle style, wrist sizing, inner diameter, and openable or fixed details will be asked.';
  }

  if (type === 'earrings') {
    return 'Earrings flow activated: earring style, size or length, and backing details will be asked.';
  }

  return 'Custom jewelry flow activated. General design questions will be asked.';
}

export function getCountryHelperText(country: SupportedCountry) {
  if (country === 'usa') {
    return 'Market set to USA. Budget will default to USD and pricing can include state-level sales tax when a state is provided.';
  }

  if (country === 'india') {
    return 'Market set to India. Budget will default to INR and styling can lean bridal, festive, heritage, or traditional luxury.';
  }

  if (country === 'dubai') {
    return 'Market set to Dubai. Budget will default to AED and styling can lean high luxury, gold-forward, bridal, or statement glamour.';
  }

  return 'Global market selected. Budget will default to USD unless edited later.';
}