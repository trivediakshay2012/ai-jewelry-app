"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.normalizeJewelryType = normalizeJewelryType;
exports.normalizeCountry = normalizeCountry;
exports.getCurrencyForCountry = getCurrencyForCountry;
exports.hasStone = hasStone;
exports.isRing = isRing;
exports.isBracelet = isBracelet;
exports.isBangle = isBangle;
exports.isNecklace = isNecklace;
exports.isPendant = isPendant;
exports.isEarrings = isEarrings;
exports.isNeckWear = isNeckWear;
exports.isWristWear = isWristWear;
exports.needsMetalPurity = needsMetalPurity;
exports.needsStateOrProvince = needsStateOrProvince;
exports.getJewelryTypeHelperText = getJewelryTypeHelperText;
exports.getCountryHelperText = getCountryHelperText;
function normalizeText(value) {
    return (value || '').trim().toLowerCase();
}
function normalizeJewelryType(value) {
    var v = normalizeText(value);
    if (v.includes('engagement ring') ||
        v.includes('wedding ring') ||
        v.includes('wedding band') ||
        v.includes('ring')) {
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
    if (v.includes('earring') ||
        v.includes('stud') ||
        v.includes('hoop') ||
        v.includes('drop')) {
        return 'earrings';
    }
    return 'other';
}
function normalizeCountry(value) {
    var v = normalizeText(value);
    if (v.includes('usa') ||
        v.includes('united states') ||
        v.includes('us') ||
        v.includes('america')) {
        return 'usa';
    }
    if (v.includes('india') || v.includes('indian')) {
        return 'india';
    }
    if (v.includes('dubai') ||
        v.includes('uae') ||
        v.includes('united arab emirates')) {
        return 'dubai';
    }
    return 'other';
}
function getCurrencyForCountry(value) {
    var country = normalizeCountry(value);
    if (country === 'usa')
        return 'USD';
    if (country === 'india')
        return 'INR';
    if (country === 'dubai')
        return 'AED';
    return 'USD';
}
function hasStone(designData) {
    var stone = normalizeText(designData.stone);
    return stone !== '' && !stone.includes('no stone');
}
function isRing(designData) {
    return normalizeJewelryType(designData.jewelryType) === 'ring';
}
function isBracelet(designData) {
    return normalizeJewelryType(designData.jewelryType) === 'bracelet';
}
function isBangle(designData) {
    return normalizeJewelryType(designData.jewelryType) === 'bangle';
}
function isNecklace(designData) {
    return normalizeJewelryType(designData.jewelryType) === 'necklace';
}
function isPendant(designData) {
    return normalizeJewelryType(designData.jewelryType) === 'pendant';
}
function isEarrings(designData) {
    return normalizeJewelryType(designData.jewelryType) === 'earrings';
}
function isNeckWear(designData) {
    var type = normalizeJewelryType(designData.jewelryType);
    return type === 'necklace' || type === 'pendant';
}
function isWristWear(designData) {
    var type = normalizeJewelryType(designData.jewelryType);
    return type === 'bracelet' || type === 'bangle';
}
function needsMetalPurity(designData) {
    return normalizeText(designData.metal).includes('gold');
}
function needsStateOrProvince(designData) {
    return normalizeCountry(designData.country) === 'usa';
}
function getJewelryTypeHelperText(type) {
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
function getCountryHelperText(country) {
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
