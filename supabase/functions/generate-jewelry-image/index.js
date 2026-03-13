"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
require("jsr:@supabase/functions-js/edge-runtime.d.ts");
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
function safe(value, fallback) {
    if (fallback === void 0) { fallback = 'not specified'; }
    return (value === null || value === void 0 ? void 0 : value.trim()) ? value.trim() : fallback;
}
function normalizeText(value) {
    return (value || '').trim().toLowerCase();
}
function toNumber(value) {
    var n = parseFloat(value || '');
    return Number.isFinite(n) ? n : 0;
}
function normalizeJewelryCategory(value) {
    var v = normalizeText(value);
    if (v.includes('ring'))
        return 'ring';
    if (v.includes('bangle') || v.includes('kada'))
        return 'bangle';
    if (v.includes('bracelet') || v.includes('cuff'))
        return 'bracelet';
    if (v.includes('pendant'))
        return 'pendant';
    if (v.includes('necklace') || v.includes('chain') || v.includes('mangalsutra'))
        return 'necklace';
    if (v.includes('earring') || v.includes('stud') || v.includes('hoop') || v.includes('drop'))
        return 'earrings';
    return 'other';
}
function normalizeCountry(value) {
    var v = normalizeText(value);
    if (v.includes('india'))
        return 'india';
    if (v.includes('dubai') || v.includes('uae') || v.includes('united arab emirates'))
        return 'dubai';
    if (v.includes('usa') || v.includes('united states') || v.includes('america') || v === 'us')
        return 'usa';
    return 'other';
}
function normalizeState(value) {
    return normalizeText(value).replace(/\./g, '').replace(/\s+/g, ' ').trim();
}
function decodeBase64(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1)
        bytes[i] = binary.charCodeAt(i);
    return bytes;
}
function fileFromDataUrl(dataUrl, fileName, fallbackMime) {
    if (fallbackMime === void 0) { fallbackMime = 'image/png'; }
    var match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    var mimeType = (match === null || match === void 0 ? void 0 : match[1]) || fallbackMime;
    var base64 = (match === null || match === void 0 ? void 0 : match[2]) || dataUrl;
    var bytes = decodeBase64(base64);
    var arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return new File([arrayBuffer], fileName, { type: mimeType });
}
function getMimeExtension(mimeType) {
    if (mimeType.includes('png'))
        return 'png';
    if (mimeType.includes('webp'))
        return 'webp';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg'))
        return 'jpg';
    return 'png';
}
function sourceToFile(source, index) {
    return __awaiter(this, void 0, void 0, function () {
        var response, blob, mimeType, extension;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!source)
                        throw new Error("Missing image source at index ".concat(index));
                    if (source.startsWith('data:'))
                        return [2 /*return*/, fileFromDataUrl(source, "input-".concat(index, ".png"))];
                    return [4 /*yield*/, fetch(source)];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Could not fetch image source at index ".concat(index, ": ").concat(response.status));
                    return [4 /*yield*/, response.blob()];
                case 2:
                    blob = _a.sent();
                    mimeType = blob.type || 'image/png';
                    extension = getMimeExtension(mimeType);
                    return [2 /*return*/, new File([blob], "input-".concat(index, ".").concat(extension), { type: mimeType })];
            }
        });
    });
}
function callImageEdit(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var form, i, _c, _d, _e, response, json;
        var openaiApiKey = _b.openaiApiKey, images = _b.images, prompt = _b.prompt, _f = _b.size, size = _f === void 0 ? '1024x1024' : _f, _g = _b.quality, quality = _g === void 0 ? 'medium' : _g, _h = _b.inputFidelity, inputFidelity = _h === void 0 ? 'high' : _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    form = new FormData();
                    form.append('model', 'gpt-image-1');
                    form.append('prompt', prompt);
                    form.append('size', size);
                    form.append('quality', quality);
                    form.append('input_fidelity', inputFidelity);
                    form.append('output_format', 'png');
                    form.append('background', 'opaque');
                    form.append('n', '1');
                    i = 0;
                    _j.label = 1;
                case 1:
                    if (!(i < images.length)) return [3 /*break*/, 4];
                    _d = (_c = form).append;
                    _e = ['image[]'];
                    return [4 /*yield*/, sourceToFile(images[i], i)];
                case 2:
                    _d.apply(_c, _e.concat([_j.sent()]));
                    _j.label = 3;
                case 3:
                    i += 1;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, fetch('https://api.openai.com/v1/images/edits', {
                        method: 'POST',
                        headers: { Authorization: "Bearer ".concat(openaiApiKey) },
                        body: form,
                    })];
                case 5:
                    response = _j.sent();
                    return [4 /*yield*/, response.json()];
                case 6:
                    json = _j.sent();
                    if (!response.ok)
                        throw new Error(JSON.stringify(json));
                    return [2 /*return*/, json];
            }
        });
    });
}
function callImageGeneration(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var response, json;
        var openaiApiKey = _b.openaiApiKey, prompt = _b.prompt, _c = _b.size, size = _c === void 0 ? '1024x1024' : _c, _d = _b.quality, quality = _d === void 0 ? 'medium' : _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, fetch('https://api.openai.com/v1/images/generations', {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer ".concat(openaiApiKey),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'gpt-image-1',
                            prompt: prompt,
                            quality: quality,
                            output_format: 'png',
                            size: size,
                            n: 1,
                            background: 'opaque',
                        }),
                    })];
                case 1:
                    response = _e.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    json = _e.sent();
                    if (!response.ok)
                        throw new Error(JSON.stringify(json));
                    return [2 /*return*/, json];
            }
        });
    });
}
function extractBase64Image(json) {
    var _a, _b;
    return ((_b = (_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.b64_json) || null;
}
function getOptionDirection(optionIndex) {
    var directions = [
        'Closest premium interpretation with strongest fidelity to the requested design.',
        'Softer and more elegant interpretation with refined proportions.',
        'Richer luxury interpretation with stronger brilliance and elevated detail.',
        'Editorial hero-shot interpretation with elevated craftsmanship presence.',
    ];
    var safeIndex = Math.min(Math.max(optionIndex || 0, 0), directions.length - 1);
    return { label: "Option ".concat(safeIndex + 1), instruction: directions[safeIndex] };
}
function estimateCenterStoneDiameterMm(carat, shape) {
    if (!carat || carat <= 0)
        return 0;
    var lowerShape = normalizeText(shape);
    var roundMm = 6.5 * Math.cbrt(carat);
    if (lowerShape.includes('oval'))
        return Number((roundMm * 1.12).toFixed(2));
    if (lowerShape.includes('emerald'))
        return Number((roundMm * 1.15).toFixed(2));
    if (lowerShape.includes('pear'))
        return Number((roundMm * 1.1).toFixed(2));
    if (lowerShape.includes('marquise'))
        return Number((roundMm * 1.18).toFixed(2));
    if (lowerShape.includes('princess'))
        return Number((roundMm * 0.96).toFixed(2));
    return Number(roundMm.toFixed(2));
}
function buildSizingRules(designData) {
    var centerStoneCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat);
    var sideStoneTotalCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat);
    var sideStoneCount = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount);
    var prongCount = toNumber(designData === null || designData === void 0 ? void 0 : designData.prongCount);
    var bandWidthMm = toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm);
    var eachSideStone = sideStoneTotalCarat > 0 && sideStoneCount > 0 ? sideStoneTotalCarat / sideStoneCount : 0;
    return "\nSizing rules:\n- Center stone target visual weight: ".concat(centerStoneCarat || 0, " carat\n- Side stones total weight: ").concat(sideStoneTotalCarat || 0, " carat\n- Side stone count: ").concat(sideStoneCount || 0, "\n- Derived side stone weight per stone: ").concat(eachSideStone ? eachSideStone.toFixed(3) : 0, " carat\n- Prong count target: ").concat(prongCount || 0, "\n- Band width target: ").concat(bandWidthMm || 0, " mm\n");
}
var USD_TO_INR = 83;
var USD_TO_AED = 3.67;
var USA_STATE_TAX_RATES = {
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
function convertUsdToCurrency(amountUsd, currency) {
    if (currency === 'INR')
        return amountUsd * USD_TO_INR;
    if (currency === 'AED')
        return amountUsd * USD_TO_AED;
    return amountUsd;
}
function money(value) {
    return Number(value.toFixed(2));
}
function getCurrencyForPricing(designData) {
    var explicit = safe(designData === null || designData === void 0 ? void 0 : designData.budgetCurrency, '').toUpperCase();
    if (['USD', 'INR', 'AED'].includes(explicit))
        return explicit;
    var country = normalizeCountry(designData === null || designData === void 0 ? void 0 : designData.country);
    if (country === 'india')
        return 'INR';
    if (country === 'dubai')
        return 'AED';
    return 'USD';
}
function getTaxProfile(designData) {
    var _a;
    var country = normalizeCountry(designData === null || designData === void 0 ? void 0 : designData.country);
    if (country === 'india')
        return { rate: 0.03, label: 'India GST estimate' };
    if (country === 'dubai')
        return { rate: 0.05, label: 'Dubai / UAE VAT estimate' };
    if (country === 'usa') {
        var state = normalizeState(designData === null || designData === void 0 ? void 0 : designData.stateOrProvince);
        return {
            rate: (_a = USA_STATE_TAX_RATES[state]) !== null && _a !== void 0 ? _a : 0,
            label: state ? "USA sales tax estimate (".concat(designData === null || designData === void 0 ? void 0 : designData.stateOrProvince, ")") : 'USA sales tax estimate (state not specified)',
        };
    }
    return { rate: 0, label: 'Tax estimate unavailable' };
}
function estimateMetalWeightGrams(designData) {
    var category = normalizeJewelryCategory(designData === null || designData === void 0 ? void 0 : designData.jewelryType);
    var bandWidthMm = toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm);
    var centerStoneCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat);
    var sideStoneTotalCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat);
    var necklaceLength = toNumber((String((designData === null || designData === void 0 ? void 0 : designData.necklaceLength) || '').match(/\d+(\.\d+)?/) || [0])[0]);
    var earringLength = toNumber(designData === null || designData === void 0 ? void 0 : designData.earringLengthMm);
    if (category === 'ring')
        return Math.max(3.5, 3.2 + bandWidthMm * 1.35 + centerStoneCarat * 0.35 + sideStoneTotalCarat * 0.18);
    if (category === 'bracelet')
        return Math.max(9, 9 + sideStoneTotalCarat * 0.4);
    if (category === 'bangle')
        return Math.max(12, 12 + sideStoneTotalCarat * 0.45);
    if (category === 'necklace' || category === 'pendant')
        return Math.max(7, 6 + necklaceLength * 0.2 + centerStoneCarat * 0.2 + sideStoneTotalCarat * 0.2);
    if (category === 'earrings')
        return Math.max(4.5, 4.5 + earringLength * 0.08 + sideStoneTotalCarat * 0.22);
    return 7.5;
}
function getMetalUsdPerGram(designData) {
    var metal = normalizeText(designData === null || designData === void 0 ? void 0 : designData.metal);
    var purity = normalizeText(designData === null || designData === void 0 ? void 0 : designData.metalPurity);
    var country = normalizeCountry(designData === null || designData === void 0 ? void 0 : designData.country);
    var countryFactor = country === 'usa' ? 1.05 : country === 'india' ? 1 : country === 'dubai' ? 0.99 : 1.02;
    var base = 78;
    if (metal.includes('platinum'))
        base = 34;
    else if (metal.includes('silver'))
        base = 1.1;
    else if (purity.includes('24'))
        base = 86;
    else if (purity.includes('22'))
        base = 79;
    else if (purity.includes('21'))
        base = 75;
    else if (purity.includes('18'))
        base = 66;
    else if (purity.includes('14'))
        base = 52;
    else if (purity.includes('10'))
        base = 38;
    return base * countryFactor;
}
function getStoneUsdPerCarat(designData) {
    var stone = normalizeText(designData === null || designData === void 0 ? void 0 : designData.stone);
    if (!stone || stone.includes('no stone'))
        return 0;
    if (stone.includes('diamond'))
        return 5500;
    if (stone.includes('moissanite'))
        return 220;
    if (stone.includes('sapphire'))
        return 850;
    if (stone.includes('emerald'))
        return 1200;
    if (stone.includes('ruby'))
        return 1100;
    if (stone.includes('lab'))
        return 1200;
    return 450;
}
function getLaborUsdEstimate(designData) {
    var country = normalizeCountry(designData === null || designData === void 0 ? void 0 : designData.country);
    var category = normalizeJewelryCategory(designData === null || designData === void 0 ? void 0 : designData.jewelryType);
    var baseByCategory = {
        ring: 260,
        necklace: 340,
        pendant: 280,
        bracelet: 300,
        bangle: 320,
        earrings: 240,
        other: 260,
    };
    var countryFactor = country === 'usa' ? 1.25 : country === 'india' ? 0.72 : country === 'dubai' ? 0.95 : 1;
    return (baseByCategory[category] || baseByCategory.other) * countryFactor;
}
function buildPricingEstimate(designData) {
    var currency = getCurrencyForPricing(designData);
    var metalWeightGrams = estimateMetalWeightGrams(designData);
    var centerStoneCarat = Math.max(0, toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat));
    var sideStoneTotalCarat = Math.max(0, toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat));
    var metalUsd = metalWeightGrams * getMetalUsdPerGram(designData);
    var stoneUsd = centerStoneCarat * getStoneUsdPerCarat(designData) + sideStoneTotalCarat * getStoneUsdPerCarat(designData) * 0.55;
    var laborUsd = getLaborUsdEstimate(designData);
    var miscUsd = Math.max(85, metalUsd * 0.06);
    var complexityUsd = Math.max(65, stoneUsd * 0.04 + laborUsd * 0.12);
    var subtotalUsd = metalUsd + stoneUsd + laborUsd + miscUsd + complexityUsd;
    var taxProfile = getTaxProfile(designData);
    var taxUsd = subtotalUsd * taxProfile.rate;
    var totalUsd = subtotalUsd + taxUsd;
    var targetBudget = toNumber(designData === null || designData === void 0 ? void 0 : designData.budget);
    var subtotal = money(convertUsdToCurrency(subtotalUsd, currency));
    var taxAmount = money(convertUsdToCurrency(taxUsd, currency));
    var total = money(convertUsdToCurrency(totalUsd, currency));
    return {
        country: safe(designData === null || designData === void 0 ? void 0 : designData.country),
        stateOrProvince: safe(designData === null || designData === void 0 ? void 0 : designData.stateOrProvince, ''),
        currency: currency,
        metalWeightGrams: money(metalWeightGrams),
        taxRatePercent: money(taxProfile.rate * 100),
        taxLabel: taxProfile.label,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        targetBudget: targetBudget > 0 ? money(targetBudget) : null,
        differenceToBudget: targetBudget > 0 ? money(total - targetBudget) : null,
        isWithinBudget: targetBudget > 0 ? total <= targetBudget : null,
        lines: [
            { label: "Benchmark metal estimate \u00B7 ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.metalPurity, 'metal'), " ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metal, 'metal'), " (").concat(metalWeightGrams.toFixed(1), " g)"), value: money(convertUsdToCurrency(metalUsd, currency)) },
            { label: "".concat(safe(designData === null || designData === void 0 ? void 0 : designData.stone, 'Stone'), " benchmark estimate"), value: money(convertUsdToCurrency(stoneUsd, currency)) },
            { label: 'Making / labor estimate', value: money(convertUsdToCurrency(laborUsd, currency)) },
            { label: 'Setting / finishing / polish', value: money(convertUsdToCurrency(miscUsd, currency)) },
            { label: 'Complexity / craftsmanship', value: money(convertUsdToCurrency(complexityUsd, currency)) },
        ],
        disclaimer: 'Structured MVP estimate using benchmark-style metal and stone assumptions, making charges, craftsmanship, and country/state tax logic. Final live quotes can still vary by vendor, stone quality, and location.',
    };
}
function buildBudgetOptimizationPlan(designData) {
    var originalEstimate = buildPricingEstimate(designData);
    var budget = toNumber(designData === null || designData === void 0 ? void 0 : designData.budget);
    var currentTotal = originalEstimate.total;
    var ratio = budget > 0 ? Math.min(0.9, budget / Math.max(currentTotal, 1)) : 0.82;
    var optimized = __assign({}, designData);
    var changes = [];
    if (budget > 0 && currentTotal > budget) {
        var centerStoneCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat);
        if (centerStoneCarat > 0) {
            var newCarat = Math.max(0.3, Number((centerStoneCarat * Math.max(0.62, ratio)).toFixed(2)));
            optimized.centerStoneCarat = String(newCarat);
            changes.push({ title: 'Center stone resizing', detail: "Reduced center stone from about ".concat(centerStoneCarat, " ct to about ").concat(newCarat, " ct to protect the same overall look while cutting cost.") });
        }
        var sideStoneTotalCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat);
        if (sideStoneTotalCarat > 0) {
            var newSide = Math.max(0, Number((sideStoneTotalCarat * Math.max(0.55, ratio)).toFixed(2)));
            optimized.sideStoneTotalCarat = String(newSide);
            changes.push({ title: 'Accent stone balancing', detail: "Reduced side stones from about ".concat(sideStoneTotalCarat, " ct total to about ").concat(newSide, " ct total while keeping the same placement rhythm.") });
        }
        var bandWidth = toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm);
        if (bandWidth > 0) {
            var newBand = Math.max(1.6, Number((bandWidth * 0.9).toFixed(2)));
            optimized.bandWidthMm = String(newBand);
            changes.push({ title: 'Hidden metal reduction', detail: "Trimmed hidden structural metal and tuned the band from ".concat(bandWidth, " mm to about ").concat(newBand, " mm in less visible areas.") });
        }
        else {
            changes.push({ title: 'Structure simplification', detail: 'Reduced hidden mass, internal gallery thickness, and non-hero detailing to keep the same design identity at a lower cost.' });
        }
    }
    else {
        changes.push({ title: 'Budget already aligned', detail: 'The original estimate is already close to the entered budget, so only minimal hidden-structure optimization is needed.' });
    }
    changes.push({ title: 'Protected design identity', detail: 'The visible top view, motif language, silhouette, and overall luxury feel stay aligned with the original selected design.' });
    var optimizedEstimate = buildPricingEstimate(optimized);
    return { optimizedDesignData: optimized, originalEstimate: originalEstimate, optimizedEstimate: optimizedEstimate, changes: changes };
}
function buildBudgetAwareReport(designData) {
    var plan = buildBudgetOptimizationPlan(designData);
    return {
        title: 'Budget-Aware Optimization Summary',
        targetBudget: "".concat(plan.originalEstimate.currency, " ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.budget)),
        protectedDesign: 'Original silhouette, design family, and premium look preserved',
        changeSummary: plan.originalEstimate.targetBudget && plan.originalEstimate.isWithinBudget === false
            ? 'AI reduced hidden metal usage, tuned accent stones, and simplified non-hero structure to move the design closer to the target budget. To preserve the same look more closely, the customer can consider a modest budget increase, lower-karat gold, or lab-grown center stones where acceptable.'
            : 'AI kept the same design identity and only applied light efficiency changes because the estimate was already near budget.',
        originalEstimate: plan.originalEstimate,
        optimizedEstimate: plan.optimizedEstimate,
        changes: plan.changes,
    };
}
function buildTechnicalSheetData(designData) {
    var category = normalizeJewelryCategory(designData === null || designData === void 0 ? void 0 : designData.jewelryType);
    var jewelryType = safe(designData === null || designData === void 0 ? void 0 : designData.jewelryType, 'custom jewelry');
    var metal = safe(designData === null || designData === void 0 ? void 0 : designData.metal);
    var metalPurity = safe(designData === null || designData === void 0 ? void 0 : designData.metalPurity);
    var stone = safe(designData === null || designData === void 0 ? void 0 : designData.stone);
    var shape = safe(designData === null || designData === void 0 ? void 0 : designData.shape);
    var finishLevel = safe(designData === null || designData === void 0 ? void 0 : designData.finishLevel, 'polished');
    var centerStoneCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat);
    var centerStoneDiameterMm = estimateCenterStoneDiameterMm(centerStoneCarat, designData === null || designData === void 0 ? void 0 : designData.shape);
    var sideStoneTotalCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat);
    var sideStoneCount = Math.round(toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount));
    var sideStonesPerSide = sideStoneCount > 0 && sideStoneCount % 2 === 0 ? sideStoneCount / 2 : sideStoneCount;
    var sideStoneEachCarat = sideStoneCount > 0 ? Number((sideStoneTotalCarat / sideStoneCount).toFixed(3)) : 0;
    var prongCount = Math.round(toNumber(designData === null || designData === void 0 ? void 0 : designData.prongCount));
    var bandWidthMm = toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm);
    var categoryNotes = {
        ring: [
            centerStoneCarat > 0 ? "Center stone target visual size \u2248 ".concat(centerStoneDiameterMm, " mm.") : 'Center stone size not specified.',
            sideStoneCount > 0 ? "Side stones distributed as ".concat(sideStonesPerSide, " per side when symmetry is possible.") : 'No side stones specified.',
            bandWidthMm > 0 ? "Band width target is ".concat(bandWidthMm, " mm.") : 'Band width not specified.',
            prongCount > 0 ? "Prong configuration target is ".concat(prongCount, "-prong.") : 'Prong configuration not specified.',
        ],
        pendant: [
            "Pendant style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle), "."),
            "Chain detail: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle, 'pendant only'), "."),
            centerStoneCarat > 0 ? "Main stone target visual size \u2248 ".concat(centerStoneDiameterMm, " mm.") : 'Main stone size not specified.',
            "Frame / silhouette detail: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.bandStyle), "."),
        ],
        necklace: [
            "Necklace length target: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength), "."),
            "Chain style target: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle), "."),
            "Clasp detail: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle), "."),
            "Center motif: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle), "."),
        ],
        bracelet: [
            "Bracelet style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.braceletStyle), "."),
            "Wrist size target: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.wristSize), "."),
            "Clasp detail: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle), "."),
            "Finish level: ".concat(finishLevel, "."),
        ],
        bangle: [
            "Bangle style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.bangleStyle), "."),
            "Inner diameter / size: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.bangleInnerDiameterMm), "."),
            "Opening style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.isOpenableBangle), "."),
            "Wrist size target: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.wristSize), "."),
        ],
        earrings: [
            "Earring style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.earringStyle), "."),
            "Length / size target: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.earringLengthMm), "."),
            "Backing type: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.earringBackingType), "."),
            sideStoneCount > 0 ? "Pair layout includes ".concat(sideStoneCount, " total stones / elements.") : 'Stone count for the pair was not specified.',
        ],
        other: [
            "Primary structure detail: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle), "."),
            "Secondary structure detail: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.bandStyle), "."),
            "Finish level: ".concat(finishLevel, "."),
            "Final note: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.finalCustomNote), "."),
        ],
    };
    var baseRows = [
        { label: 'Jewelry Type', value: jewelryType },
        { label: 'Country / Market', value: "".concat(safe(designData === null || designData === void 0 ? void 0 : designData.country)).concat((designData === null || designData === void 0 ? void 0 : designData.stateOrProvince) ? " / ".concat(designData.stateOrProvince) : '') },
        { label: 'Metal', value: metal },
        { label: 'Metal Purity', value: metalPurity },
        { label: 'Stone', value: stone },
        { label: 'Shape', value: shape },
    ];
    var categoryRows = {
        ring: [
            { label: 'Ring Size', value: safe(designData === null || designData === void 0 ? void 0 : designData.ringSize) },
            { label: 'Center Stone', value: centerStoneCarat > 0 ? "".concat(centerStoneCarat, " ct / approx. ").concat(centerStoneDiameterMm, " mm") : 'Not specified' },
            { label: 'Side Stones', value: sideStoneCount > 0 ? "".concat(sideStoneCount, " total / ").concat(sideStoneTotalCarat, " ct total / ").concat(sideStoneEachCarat, " ct each") : 'Not specified' },
            { label: 'Prongs', value: prongCount > 0 ? "".concat(prongCount) : 'Not specified' },
            { label: 'Band Width', value: bandWidthMm > 0 ? "".concat(bandWidthMm, " mm") : 'Not specified' },
            { label: 'Setting', value: safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle) },
            { label: 'Band Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.bandStyle) },
        ],
        pendant: [
            { label: 'Pendant Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle) },
            { label: 'Chain Length', value: safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength, 'Pendant only') },
            { label: 'Chain Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle, 'Pendant only') },
            { label: 'Stone Setting', value: safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle) },
            { label: 'Frame / Bail', value: safe(designData === null || designData === void 0 ? void 0 : designData.bandStyle) },
        ],
        necklace: [
            { label: 'Necklace Length', value: safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength) },
            { label: 'Chain Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle) },
            { label: 'Clasp Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle) },
            { label: 'Center Motif', value: safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle) },
        ],
        bracelet: [
            { label: 'Bracelet Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.braceletStyle) },
            { label: 'Wrist Size', value: safe(designData === null || designData === void 0 ? void 0 : designData.wristSize) },
            { label: 'Clasp Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle) },
        ],
        bangle: [
            { label: 'Bangle Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.bangleStyle) },
            { label: 'Wrist Size', value: safe(designData === null || designData === void 0 ? void 0 : designData.wristSize) },
            { label: 'Inner Diameter / Size', value: safe(designData === null || designData === void 0 ? void 0 : designData.bangleInnerDiameterMm) },
            { label: 'Opening Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.isOpenableBangle) },
        ],
        earrings: [
            { label: 'Earring Style', value: safe(designData === null || designData === void 0 ? void 0 : designData.earringStyle) },
            { label: 'Length / Size', value: safe(designData === null || designData === void 0 ? void 0 : designData.earringLengthMm) },
            { label: 'Backing Type', value: safe(designData === null || designData === void 0 ? void 0 : designData.earringBackingType) },
            { label: 'Stone Layout', value: safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle) },
            { label: 'Pair Elements', value: sideStoneCount > 0 ? "".concat(sideStoneCount, " total") : 'Not specified' },
        ],
        other: [
            { label: 'Structure', value: safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle) },
            { label: 'Secondary Detail', value: safe(designData === null || designData === void 0 ? void 0 : designData.bandStyle) },
        ],
    };
    return {
        title: 'Technical Specification Sheet',
        jewelryType: jewelryType,
        normalizedType: category,
        metal: metal,
        metalPurity: metalPurity,
        stone: stone,
        shape: shape,
        ringSize: safe(designData === null || designData === void 0 ? void 0 : designData.ringSize),
        centerStoneCarat: centerStoneCarat,
        centerStoneDiameterMm: centerStoneDiameterMm,
        sideStoneTotalCarat: sideStoneTotalCarat,
        sideStoneCount: sideStoneCount,
        sideStonesPerSide: sideStonesPerSide,
        sideStoneEachCarat: sideStoneEachCarat,
        prongCount: prongCount,
        bandWidthMm: bandWidthMm,
        settingStyle: safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle),
        finishLevel: finishLevel,
        necklaceLength: safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength),
        chainStyle: safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle),
        pendantStyle: safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle),
        braceletStyle: safe(designData === null || designData === void 0 ? void 0 : designData.braceletStyle),
        claspStyle: safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle),
        wristSize: safe(designData === null || designData === void 0 ? void 0 : designData.wristSize),
        bangleStyle: safe(designData === null || designData === void 0 ? void 0 : designData.bangleStyle),
        bangleInnerDiameterMm: safe(designData === null || designData === void 0 ? void 0 : designData.bangleInnerDiameterMm),
        isOpenableBangle: safe(designData === null || designData === void 0 ? void 0 : designData.isOpenableBangle),
        earringStyle: safe(designData === null || designData === void 0 ? void 0 : designData.earringStyle),
        earringLengthMm: safe(designData === null || designData === void 0 ? void 0 : designData.earringLengthMm),
        earringBackingType: safe(designData === null || designData === void 0 ? void 0 : designData.earringBackingType),
        notes: categoryNotes[category] || categoryNotes.other,
        specRows: __spreadArray(__spreadArray(__spreadArray([], baseRows, true), (categoryRows[category] || categoryRows.other), true), [{ label: 'Finish', value: finishLevel }], false),
    };
}
function buildBeautyPrompt(designData, basePrompt, inspirationAnalysis, optionIndex) {
    var option = getOptionDirection(optionIndex);
    return "".concat(basePrompt, "\n\nReference inspiration analysis: ").concat(inspirationAnalysis || 'No inspiration analysis provided.', "\n\nMode: Product image only.\nVariation direction: ").concat(option.instruction, "\n\nCritical instructions:\n- Keep the jewelry itself as the hero.\n- Preserve the requested structure, size, stone count, and proportions.\n- Make the output look like high-end luxury jewelry campaign photography.\n- No random extra stones or extra structures.\n- Ultra realistic, premium lighting, macro detail, sharp reflections, photorealistic.\n- Return a single product image on a studio background.");
}
function buildLifestylePrompt(designData, inspirationAnalysis) {
    return "Transform the provided jewelry product image into a luxury model preview.\n\nRules:\n- Keep the jewelry design exactly the same as the selected option image.\n- Do not change the jewelry structure, engraving pattern, silhouette, stone count, proportions, or metal type.\n- Show a realistic model naturally wearing THIS exact jewelry piece.\n- Premium editorial jewelry photography.\n- Jewelry must remain clearly visible.\n\nWearer styling:\n- Gender / style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerGender, 'female'), " with ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerStyle, 'refined luxury styling'), "\n- Outfit: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitType, 'luxury editorial outfit'), "\n- Outfit color: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitColor, 'neutral luxury palette'), "\n- Occasion: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.occasion, 'special occasion'), "\n- Mood: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.styleMood, 'luxurious'), "\n\nReference inspiration analysis: ").concat(inspirationAnalysis || 'No inspiration analysis provided.', "\nPhotorealistic only.");
}
function buildPersonalPreviewPrompt(designData, inspirationAnalysis) {
    return "Create a personal jewelry preview using the provided jewelry image and uploaded customer face photo.\n\nGoals:\n- Keep the jewelry exactly the same as in the base image.\n- The base image is the locked selected jewelry option and must remain visually identical.\n- Use the uploaded face photo as the primary facial identity source.\n- Make the final face resemble the uploaded person as naturally as possible.\n- Do not change the jewelry design.\n- Maintain high-end editorial jewelry photography quality.\n\nWearer styling:\n- Gender / style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerGender, 'female'), " with ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerStyle, 'luxury styling'), "\n- Outfit: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitType, 'luxury outfit'), "\n- Outfit color: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitColor, 'neutral refined palette'), "\n- Mood: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.styleMood, 'luxurious'), "\n\nReference inspiration analysis: ").concat(inspirationAnalysis || 'No inspiration analysis provided.', "\nPrioritize preserving the uploaded face identity strongly. Photorealistic only.");
}
function buildRegenerationPrompt(designData, editInstruction) {
    return "Edit the provided jewelry image.\n\nKeep the same jewelry category and same core design identity.\nThe selected input image is locked and must remain the primary blueprint.\n\nRequested change:\n".concat(safe(editInstruction, 'Refine the selected option while preserving the original design identity.'), "\n\nOriginal constraints:\n- Metal: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metal), "\n- Stone: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.stone), "\n- Shape: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.shape), "\n- Ring size: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.ringSize), "\n- Center stone carat: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat, '0'), "\n- Side stone total: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat, '0'), "\n- Side stone count: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount, '0'), "\n- Prong count: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.prongCount, '0'), "\n- Band width: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm, '0'), " mm\n- Finish: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.finishLevel, 'polished'), "\n\nRules:\n- Preserve the same overall design family.\n- Apply the change request strongly and visibly.\n- Do not ignore the edit request.\n- Keep the result premium, realistic, and jewelry-catalog ready.");
}
function buildBudgetAwarePrompt(designData, plan) {
    return "Edit the provided jewelry image into a budget-aware version.\n\nPrimary goal:\n- Keep the same visible design identity as the selected jewelry piece.\n- This is an optimization pass, NOT a redesign pass.\n- The base selected image is the locked blueprint and must remain visually recognizable.\n\nHard rules:\n- Preserve the same overall silhouette, motif placement, center concept, and jewelry category.\n- Do not make the result look like a different design.\n- Keep the same metal color family unless absolutely necessary.\n- Keep the same center-stone shape unless absolutely necessary.\n- Preserve the emotional appeal and recognizability of the original design.\n- Any reduction must happen through hidden engineering, efficient stone sizing, or non-hero structural simplification.\n\nBudget target: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.budget), " ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.budgetCurrency, ''), "\nCurrent estimated total: ").concat(plan.originalEstimate.currency, " ").concat(plan.originalEstimate.total, "\nOptimized target estimate: ").concat(plan.optimizedEstimate.currency, " ").concat(plan.optimizedEstimate.total, "\nCountry / market: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.country), " ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.stateOrProvince, ''), "\n\nApply these specific optimization moves strongly:\n").concat(plan.changes.map(function (change, index) { return "".concat(index + 1, ". ").concat(change.title, ": ").concat(change.detail); }).join('\n'), "\n\nOutput requirement:\n- The result should look like the same design optimized for budget, not a newly invented piece.\n- Photorealistic, premium jewelry product render only.");
}
Deno.serve(function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, prompt_1, designData, inspirationAnalysis, uploadedInspirationUrls, editInstruction, selectedBaseImage, facePhotoDataUrl, mode, optionIndex, technicalSheet, pricingEstimate, openaiApiKey, inspirationSources, hasInspiration, option, sizingRules, baseContext, lifestyleResult, lifestyleB64, personalResult, personalB64, regeneratePrompt, regenImages, regeneratedResult, regeneratedB64, budgetPlan, budgetAwarePrompt, budgetImages, budgetResult, budgetB64, productPrompt, productResult, _b, productB64, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (req.method === 'OPTIONS')
                    return [2 /*return*/, new Response('ok', { headers: corsHeaders })];
                _c.label = 1;
            case 1:
                _c.trys.push([1, 16, , 17]);
                return [4 /*yield*/, req.json()];
            case 2:
                _a = _c.sent(), prompt_1 = _a.prompt, designData = _a.designData, inspirationAnalysis = _a.inspirationAnalysis, uploadedInspirationUrls = _a.uploadedInspirationUrls, editInstruction = _a.editInstruction, selectedBaseImage = _a.selectedBaseImage, facePhotoDataUrl = _a.facePhotoDataUrl, mode = _a.mode, optionIndex = _a.optionIndex;
                if (mode === 'technical-sheet') {
                    technicalSheet = buildTechnicalSheetData(designData || {});
                    pricingEstimate = buildPricingEstimate(designData || {});
                    return [2 /*return*/, new Response(JSON.stringify({ technicalSheet: technicalSheet, pricingEstimate: pricingEstimate }), {
                            status: 200,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                openaiApiKey = Deno.env.get('OPENAI_API_KEY');
                if (!openaiApiKey) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY secret in Supabase' }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                if (!prompt_1) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing prompt' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                inspirationSources = Array.isArray(uploadedInspirationUrls)
                    ? uploadedInspirationUrls.filter(Boolean)
                    : [];
                hasInspiration = inspirationSources.length > 0;
                option = getOptionDirection(optionIndex !== null && optionIndex !== void 0 ? optionIndex : 0);
                sizingRules = buildSizingRules(designData || {});
                baseContext = "\nYou are designing original luxury jewelry.\n\nCore user prompt:\n".concat(prompt_1, "\n\nDesign data:\n- Jewelry Type: ").concat((designData === null || designData === void 0 ? void 0 : designData.jewelryType) || 'fine jewelry piece', "\n- Occasion: ").concat((designData === null || designData === void 0 ? void 0 : designData.occasion) || 'special occasion', "\n- Country / Region: ").concat((designData === null || designData === void 0 ? void 0 : designData.country) || 'global luxury taste', "\n- State / Province / Emirate: ").concat((designData === null || designData === void 0 ? void 0 : designData.stateOrProvince) || 'not specified', "\n- Wearer Gender: ").concat((designData === null || designData === void 0 ? void 0 : designData.wearerGender) || 'wearer', "\n- Wearer Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.wearerStyle) || 'refined', "\n- Metal: ").concat((designData === null || designData === void 0 ? void 0 : designData.metal) || 'premium metal', "\n- Metal Purity: ").concat((designData === null || designData === void 0 ? void 0 : designData.metalPurity) || 'premium purity', "\n- Stone: ").concat((designData === null || designData === void 0 ? void 0 : designData.stone) || 'gemstone', "\n- Shape: ").concat((designData === null || designData === void 0 ? void 0 : designData.shape) || 'elegant cut', "\n- Ring Size: ").concat((designData === null || designData === void 0 ? void 0 : designData.ringSize) || 'not specified', "\n- Setting Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.settingStyle) || 'high-end setting', "\n- Band Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.bandStyle) || 'luxury band', "\n- Necklace Length: ").concat((designData === null || designData === void 0 ? void 0 : designData.necklaceLength) || 'not specified', "\n- Chain Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.chainStyle) || 'not specified', "\n- Pendant Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.pendantStyle) || 'not specified', "\n- Bracelet Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.braceletStyle) || 'not specified', "\n- Wrist Size: ").concat((designData === null || designData === void 0 ? void 0 : designData.wristSize) || 'not specified', "\n- Bangle Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.bangleStyle) || 'not specified', "\n- Bangle Inner Diameter: ").concat((designData === null || designData === void 0 ? void 0 : designData.bangleInnerDiameterMm) || 'not specified', "\n- Bangle Opening: ").concat((designData === null || designData === void 0 ? void 0 : designData.isOpenableBangle) || 'not specified', "\n- Clasp Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.claspStyle) || 'not specified', "\n- Earring Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.earringStyle) || 'not specified', "\n- Earring Length: ").concat((designData === null || designData === void 0 ? void 0 : designData.earringLengthMm) || 'not specified', "\n- Earring Backing: ").concat((designData === null || designData === void 0 ? void 0 : designData.earringBackingType) || 'not specified', "\n- Finish Level: ").concat((designData === null || designData === void 0 ? void 0 : designData.finishLevel) || 'polished', "\n- Style Mood: ").concat((designData === null || designData === void 0 ? void 0 : designData.styleMood) || 'luxurious', "\n- Reference Inspiration: ").concat((designData === null || designData === void 0 ? void 0 : designData.referenceInspiration) || 'high jewelry editorial', "\n- Luxury Tone: ").concat((designData === null || designData === void 0 ? void 0 : designData.luxuryTone) || 'high luxury', "\n- Background Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.backgroundStyle) || 'clean white studio', "\n- Outfit Type: ").concat((designData === null || designData === void 0 ? void 0 : designData.outfitType) || 'luxury styling', "\n- Outfit Color: ").concat((designData === null || designData === void 0 ? void 0 : designData.outfitColor) || 'refined palette', "\n- Budget: ").concat((designData === null || designData === void 0 ? void 0 : designData.budget) || 'not specified', " ").concat((designData === null || designData === void 0 ? void 0 : designData.budgetCurrency) || '', "\n- Final Custom Note: ").concat((designData === null || designData === void 0 ? void 0 : designData.finalCustomNote) || 'none', "\n\n").concat(sizingRules, "\n\nInspiration analysis:\n").concat(inspirationAnalysis || 'No inspiration analysis was provided.', "\n\nRequested edit from user:\n").concat(editInstruction || 'No additional change request.', "\n\nSelected option direction:\n").concat(option.label, ": ").concat(option.instruction, "\n\nCritical source behavior:\n").concat(hasInspiration
                    ? '- Use the uploaded inspiration images heavily. Preserve pattern language, ornament density, silhouette logic, motif repetition, and cultural styling from the source images. The result must feel strongly inspired by the uploaded references while remaining original.'
                    : '- No inspiration images were uploaded. Use the answered fields and the final custom note as the primary design source. Follow the final custom note heavily and do not drift into generic jewelry.', "\n");
                if (!(mode === 'lifestyle')) return [3 /*break*/, 4];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for lifestyle mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: [selectedBaseImage],
                        prompt: "".concat(baseContext, "\n\n").concat(buildLifestylePrompt(designData || {}, inspirationAnalysis || '')),
                        size: '1024x1536',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 3:
                lifestyleResult = _c.sent();
                lifestyleB64 = extractBase64Image(lifestyleResult);
                if (!lifestyleB64)
                    throw new Error('No lifestyle image returned');
                return [2 /*return*/, new Response(JSON.stringify({ lifestyleImage: "data:image/png;base64,".concat(lifestyleB64) }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 4:
                if (!(mode === 'personal-preview')) return [3 /*break*/, 6];
                if (!selectedBaseImage || !facePhotoDataUrl) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage or facePhotoDataUrl for personal-preview mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: [selectedBaseImage, facePhotoDataUrl],
                        prompt: "".concat(baseContext, "\n\n").concat(buildPersonalPreviewPrompt(designData || {}, inspirationAnalysis || '')),
                        size: '1024x1536',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 5:
                personalResult = _c.sent();
                personalB64 = extractBase64Image(personalResult);
                if (!personalB64)
                    throw new Error('No personal preview image returned');
                return [2 /*return*/, new Response(JSON.stringify({ personalPreviewImage: "data:image/png;base64,".concat(personalB64) }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 6:
                if (!(mode === 'regenerate-selected')) return [3 /*break*/, 8];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for regenerate-selected mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                regeneratePrompt = buildRegenerationPrompt(designData || {}, editInstruction || '');
                regenImages = hasInspiration ? __spreadArray([selectedBaseImage], inspirationSources, true) : [selectedBaseImage];
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: regenImages,
                        prompt: "".concat(baseContext, "\n\n").concat(regeneratePrompt),
                        size: '1024x1024',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 7:
                regeneratedResult = _c.sent();
                regeneratedB64 = extractBase64Image(regeneratedResult);
                if (!regeneratedB64)
                    throw new Error('No regenerated image returned');
                return [2 /*return*/, new Response(JSON.stringify({
                        regeneratedImage: "data:image/png;base64,".concat(regeneratedB64),
                        appliedPrompt: "".concat(baseContext, "\n\n").concat(regeneratePrompt),
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 8:
                if (!(mode === 'budget-aware')) return [3 /*break*/, 10];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for budget-aware mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                if (!(designData === null || designData === void 0 ? void 0 : designData.budget) || !String(designData.budget).trim()) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing designData.budget for budget-aware mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                budgetPlan = buildBudgetOptimizationPlan(designData || {});
                budgetAwarePrompt = buildBudgetAwarePrompt(designData || {}, budgetPlan);
                budgetImages = hasInspiration ? __spreadArray([selectedBaseImage], inspirationSources, true) : [selectedBaseImage];
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: budgetImages,
                        prompt: "".concat(baseContext, "\n\n").concat(budgetAwarePrompt),
                        size: '1024x1024',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 9:
                budgetResult = _c.sent();
                budgetB64 = extractBase64Image(budgetResult);
                if (!budgetB64)
                    throw new Error('No budget-aware image returned');
                return [2 /*return*/, new Response(JSON.stringify({
                        budgetAwareImage: "data:image/png;base64,".concat(budgetB64),
                        budgetAwareReport: buildBudgetAwareReport(designData || {}),
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 10:
                if (!(mode === 'product-single')) return [3 /*break*/, 15];
                productPrompt = buildBeautyPrompt(designData || {}, baseContext, inspirationAnalysis || '', optionIndex !== null && optionIndex !== void 0 ? optionIndex : 0);
                if (!hasInspiration) return [3 /*break*/, 12];
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: inspirationSources,
                        prompt: productPrompt,
                        size: '1024x1024',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 11:
                _b = _c.sent();
                return [3 /*break*/, 14];
            case 12: return [4 /*yield*/, callImageGeneration({
                    openaiApiKey: openaiApiKey,
                    prompt: productPrompt,
                    size: '1024x1024',
                    quality: 'high',
                })];
            case 13:
                _b = _c.sent();
                _c.label = 14;
            case 14:
                productResult = _b;
                productB64 = extractBase64Image(productResult);
                if (!productB64)
                    throw new Error("No product image returned for ".concat(option.label));
                return [2 /*return*/, new Response(JSON.stringify({
                        productImage: {
                            id: "product-".concat((optionIndex !== null && optionIndex !== void 0 ? optionIndex : 0) + 1),
                            label: option.label,
                            dataUrl: "data:image/png;base64,".concat(productB64),
                        },
                        appliedPrompt: productPrompt,
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 15: return [2 /*return*/, new Response(JSON.stringify({ error: 'Unsupported mode' }), {
                    status: 400,
                    headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                })];
            case 16:
                error_1 = _c.sent();
                console.error('generate-jewelry-image error:', error_1);
                return [2 /*return*/, new Response(JSON.stringify({
                        error: 'Unexpected generate-jewelry-image error',
                        details: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || String(error_1),
                    }), {
                        status: 500,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 17: return [2 /*return*/];
        }
    });
}); });
