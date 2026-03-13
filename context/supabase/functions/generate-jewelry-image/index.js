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
function normalizeJewelryCategory(value) {
    var v = normalizeText(value);
    if (v.includes('ring') || v.includes('rings'))
        return 'ring';
    if (v.includes('bangle') || v.includes('bangles') || v.includes('kada'))
        return 'bangle';
    if (v.includes('bracelet') || v.includes('bracelets') || v.includes('cuff'))
        return 'bracelet';
    if (v.includes('pendant') || v.includes('pendants'))
        return 'pendant';
    if (v.includes('necklace') || v.includes('necklaces') || v.includes('chain') || v.includes('chains') || v.includes('mangalsutra'))
        return 'necklace';
    if (v.includes('earring') || v.includes('earrings') || v.includes('stud') || v.includes('hoop') || v.includes('drop'))
        return 'earrings';
    return 'other';
}
function toNumber(value) {
    var n = parseFloat(value || '');
    return Number.isFinite(n) ? n : 0;
}
function decodeBase64(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
function fileFromDataUrl(dataUrl, fileName, fallbackMime) {
    if (fallbackMime === void 0) { fallbackMime = 'image/png'; }
    var match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    var mimeType = (match === null || match === void 0 ? void 0 : match[1]) || fallbackMime;
    var base64 = (match === null || match === void 0 ? void 0 : match[2]) || dataUrl;
    var bytes = decodeBase64(base64);
    return new File([bytes], fileName, { type: mimeType });
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
                    if (!source) {
                        throw new Error("Missing image source at index ".concat(index));
                    }
                    if (source.startsWith('data:')) {
                        return [2 /*return*/, fileFromDataUrl(source, "input-".concat(index, ".png"))];
                    }
                    return [4 /*yield*/, fetch(source)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Could not fetch image source at index ".concat(index, ": ").concat(response.status));
                    }
                    return [4 /*yield*/, response.blob()];
                case 2:
                    blob = _a.sent();
                    mimeType = blob.type || 'image/png';
                    extension = getMimeExtension(mimeType);
                    return [2 /*return*/, new File([blob], "input-".concat(index, ".").concat(extension), {
                            type: mimeType,
                        })];
            }
        });
    });
}
function callImageEdit(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var form, i, file, response, json;
        var openaiApiKey = _b.openaiApiKey, images = _b.images, prompt = _b.prompt, _c = _b.size, size = _c === void 0 ? '1024x1024' : _c, _d = _b.quality, quality = _d === void 0 ? 'medium' : _d, _e = _b.inputFidelity, inputFidelity = _e === void 0 ? 'high' : _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
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
                    _f.label = 1;
                case 1:
                    if (!(i < images.length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, sourceToFile(images[i], i)];
                case 2:
                    file = _f.sent();
                    form.append('image[]', file);
                    _f.label = 3;
                case 3:
                    i += 1;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, fetch('https://api.openai.com/v1/images/edits', {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer ".concat(openaiApiKey),
                        },
                        body: form,
                    })];
                case 5:
                    response = _f.sent();
                    return [4 /*yield*/, response.json()];
                case 6:
                    json = _f.sent();
                    if (!response.ok) {
                        throw new Error(JSON.stringify(json));
                    }
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
                    if (!response.ok) {
                        throw new Error(JSON.stringify(json));
                    }
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
        'Create the closest premium reinterpretation of the design source.',
        'Create a subtler reinterpretation with slightly softer visual weight.',
        'Create a richer and more luxurious reinterpretation with more detail.',
        'Create a cleaner but still strongly inspired reinterpretation with modern elegance.',
    ];
    var safeIndex = Math.min(Math.max(optionIndex || 0, 0), directions.length - 1);
    return {
        label: "Option ".concat(safeIndex + 1),
        instruction: directions[safeIndex],
    };
}
function isInvalidImageError(error) {
    var message = String(error || '');
    return message.includes('invalid_image_file') || message.toLowerCase().includes('invalid image file or mode');
}
function estimateCenterStoneDiameterMm(carat, shape) {
    if (!carat || carat <= 0)
        return 0;
    var lowerShape = (shape || '').toLowerCase();
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
function parseBudgetValue(value) {
    if (!value)
        return 0;
    var cleaned = String(value).replace(/[^0-9.]/g, '');
    var n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
}
function getBudgetThresholds(currency, category) {
    var usdMap = {
        ring: [1500, 3500, 7000],
        necklace: [2200, 5000, 9000],
        pendant: [1000, 2500, 5000],
        bracelet: [1800, 4200, 8000],
        bangle: [2500, 6000, 12000],
        earrings: [1200, 3000, 6000],
        other: [1500, 3500, 7000],
    };
    var inrMap = {
        ring: [100000, 250000, 500000],
        necklace: [150000, 400000, 900000],
        pendant: [60000, 150000, 300000],
        bracelet: [90000, 220000, 450000],
        bangle: [150000, 350000, 700000],
        earrings: [70000, 180000, 350000],
        other: [100000, 250000, 500000],
    };
    var aedMap = {
        ring: [5000, 12000, 25000],
        necklace: [8000, 18000, 35000],
        pendant: [3500, 9000, 18000],
        bracelet: [4500, 11000, 22000],
        bangle: [7000, 16000, 32000],
        earrings: [4000, 9500, 18000],
        other: [5000, 12000, 25000],
    };
    var normalizedCurrency = normalizeText(currency || 'usd').toUpperCase();
    var map = normalizedCurrency === 'INR' ? inrMap : normalizedCurrency === 'AED' ? aedMap : usdMap;
    return map[category] || map.other;
}
function buildBudgetAwarePlan(designData) {
    var category = normalizeJewelryCategory(designData === null || designData === void 0 ? void 0 : designData.jewelryType);
    var currency = ((designData === null || designData === void 0 ? void 0 : designData.budgetCurrency) || 'USD').toUpperCase();
    var budgetValue = parseBudgetValue(designData === null || designData === void 0 ? void 0 : designData.budget);
    var _a = getBudgetThresholds(currency, category), entry = _a[0], mid = _a[1], premium = _a[2];
    var tier = budgetValue > 0 && budgetValue <= entry ? 'tight' : budgetValue > 0 && budgetValue <= mid ? 'value' : budgetValue > 0 && budgetValue <= premium ? 'balanced' : 'premium';
    var changes = [];
    var protectedDesign = category === 'ring'
        ? 'center silhouette, setting position, stone layout, and ring identity are preserved'
        : category === 'necklace' || category === 'pendant'
            ? 'front-facing silhouette, motif layout, and necklace / pendant identity are preserved'
            : category === 'bracelet' || category === 'bangle'
                ? 'overall wrist profile, visual top view, and bracelet / bangle identity are preserved'
                : category === 'earrings'
                    ? 'front-facing silhouette, stone arrangement, and earring identity are preserved'
                    : 'overall visible design identity is preserved';
    if (category === 'ring') {
        changes.push({
            title: 'Reduce hidden metal mass',
            detail: tier === 'tight'
                ? 'Use a lighter underside, open gallery, and more hollow interior where it is not visible from the hero angle.'
                : 'Trim excess metal from the interior and gallery while keeping the same visible ring shape.'
        });
        if (toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount) > 0 || toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat) > 0) {
            changes.push({
                title: 'Lower side-stone weight',
                detail: tier === 'tight'
                    ? 'Keep the same side-stone layout but reduce the individual side-stone size / total carat.'
                    : 'Slightly tighten side-stone sizing while keeping the same distribution pattern.'
            });
        }
        if (toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm) > 0) {
            changes.push({
                title: 'Refine band thickness',
                detail: 'Keep the same band style but make the band slightly lighter in thickness and metal volume.'
            });
        }
    }
    else if (category === 'necklace' || category === 'pendant') {
        changes.push({
            title: 'Lighten back structure',
            detail: 'Keep the same front motif and drape, but reduce hidden metal thickness at the back and underside.'
        });
        changes.push({
            title: 'Optimize accent stones',
            detail: 'Preserve the same visual pattern while slightly reducing accent-stone size or density where possible.'
        });
    }
    else if (category === 'bracelet' || category === 'bangle') {
        changes.push({
            title: 'Reduce interior metal weight',
            detail: 'Keep the same top-view look while making the inner wall or underside lighter and less bulky.'
        });
        changes.push({
            title: 'Simplify hidden construction',
            detail: 'Keep the visible profile, but simplify internal structure, hinge mass, or clasp bulk where possible.'
        });
    }
    else if (category === 'earrings') {
        changes.push({
            title: 'Reduce hidden metal and support weight',
            detail: 'Keep the same visible earring shape while making the back structure lighter.'
        });
        changes.push({
            title: 'Tighten accent-stone sizing',
            detail: 'Preserve the same layout but slightly reduce accent-stone size if needed for budget control.'
        });
    }
    else {
        changes.push({
            title: 'Optimize hidden material use',
            detail: 'Preserve the same visible design while reducing non-visible metal mass and internal bulk.'
        });
    }
    if (tier === 'tight') {
        changes.push({
            title: 'Apply strongest budget fit',
            detail: 'Prioritize budget compliance through interior hollowing, lighter supporting geometry, and controlled secondary stone weight.'
        });
    }
    else if (tier === 'value') {
        changes.push({
            title: 'Apply moderate cost optimization',
            detail: 'Use a balanced mix of lighter metal volume and slightly reduced accent detailing.'
        });
    }
    else if (tier === 'balanced') {
        changes.push({
            title: 'Apply light optimization only',
            detail: 'Keep the premium look and make only subtle efficiency adjustments.'
        });
    }
    else {
        changes.push({
            title: 'Protect premium appearance',
            detail: 'Only very light structural optimization is allowed because the budget can support the design well.'
        });
    }
    var changeSummary = changes.map(function (change) { return "".concat(change.title, ": ").concat(change.detail); }).join(' ');
    var targetBudget = budgetValue > 0 ? "".concat(currency, " ").concat(budgetValue) : "".concat(currency, " ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.budget, 'not specified'));
    var promptBlock = "Budget-aware conversion rules:\n- The selected base image is locked as the design master.\n- Preserve the same visible design identity, silhouette, stone layout, and top-view look.\n- Do not redesign the piece into a different style.\n- Reduce cost only through these controlled changes: ".concat(changes.map(function (change) { return change.title.toLowerCase(); }).join(', '), ".\n- Keep the final image premium and realistic.\n- The customer should feel it is the same design, just engineered to fit the target budget better.\n- Target budget: ").concat(targetBudget, ".\n- Protected design: ").concat(protectedDesign, ".\n");
    return {
        category: category,
        currency: currency,
        budgetValue: budgetValue,
        tier: tier,
        targetBudget: targetBudget,
        protectedDesign: protectedDesign,
        changes: changes,
        changeSummary: changeSummary,
        promptBlock: promptBlock,
    };
}
function buildBudgetAwarePrompt(designData, plan) {
    return "Create a budget-aware version of the provided jewelry image.\n\nRules:\n- Keep the design visibly the same from the customer point of view.\n- Preserve the same front-facing design language, silhouette, and stone arrangement.\n- Do not change the product category.\n- Do not create a new design.\n- The result must still look luxurious and production-ready.\n- Apply only these approved cost-saving modifications: ".concat(plan.changes.map(function (change) { return "".concat(change.title, " (").concat(change.detail, ")"); }).join('; '), "\n\nDesign context:\n- Jewelry type: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.jewelryType), "\n- Metal: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metal), "\n- Metal purity: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metalPurity), "\n- Stone: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.stone), "\n- Shape: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.shape), "\n- Setting style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle), "\n- Final note: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.finalCustomNote, 'none'), "\n\nTarget budget: ").concat(plan.targetBudget, ".\nProtected design: ").concat(plan.protectedDesign, ".\n\nCritical: the design itself must not visually change in the model preview or the budget-aware output. Keep the same jewelry identity and only make subtle engineering / material-efficiency adjustments.");
}
function buildSizingRules(designData) {
    var centerStoneCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat);
    var sideStoneTotalCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat);
    var sideStoneCount = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount);
    var prongCount = toNumber(designData === null || designData === void 0 ? void 0 : designData.prongCount);
    var bandWidthMm = toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm);
    var eachSideStone = sideStoneTotalCarat > 0 && sideStoneCount > 0
        ? sideStoneTotalCarat / sideStoneCount
        : 0;
    var sideSplitText = sideStoneCount > 0 && sideStoneCount % 2 === 0
        ? "".concat(sideStoneCount / 2, " side stones on each side")
        : sideStoneCount > 0
            ? "".concat(sideStoneCount, " side stones total")
            : 'no side stones';
    return "\nSizing rules:\n- Center stone target visual weight: ".concat(centerStoneCarat || 0, " carat\n- Side stones total weight: ").concat(sideStoneTotalCarat || 0, " carat\n- Side stone count: ").concat(sideStoneCount || 0, "\n- Derived side stone weight per stone: ").concat(eachSideStone ? eachSideStone.toFixed(3) : 0, " carat\n- Side stone distribution: ").concat(sideSplitText, "\n- Prong count target: ").concat(prongCount || 0, "\n- Band width target: ").concat(bandWidthMm || 0, " mm\n");
}
function buildBeautyPrompt(designData, basePrompt, inspirationAnalysis, optionIndex) {
    var optionStyles = [
        'Option 1: closest premium interpretation with strong fidelity to the requested design.',
        'Option 2: slightly softer and more elegant interpretation with refined proportions.',
        'Option 3: richer luxury interpretation with stronger brilliance and premium detailing.',
        'Option 4: editorial hero-shot interpretation with elevated craftsmanship presence.',
    ];
    return "".concat(basePrompt, "\n\nUse these design details exactly:\n- Jewelry type: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.jewelryType), "\n- Occasion: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.occasion), "\n- Metal: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metal), "\n- Metal purity: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metalPurity), "\n- Stone: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.stone), "\n- Shape: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.shape), "\n- Ring size: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.ringSize), "\n- Center stone carat: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat, '0'), "\n- Side stones total carat: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat, '0'), "\n- Side stone count: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount, '0'), "\n- Prong count: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.prongCount, '0'), "\n- Band width: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm, '0'), " mm\n- Necklace length: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength), "\n- Chain style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle), "\n- Pendant style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle), "\n- Bracelet style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.braceletStyle), "\n- Bangle style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.bangleStyle), "\n- Wrist size: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.wristSize), "\n- Earring style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.earringStyle), "\n- Earring length: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.earringLengthMm), "\n- Setting style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle), "\n- Finish: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.finishLevel, 'polished'), "\n- Mood: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.styleMood, 'luxurious'), "\n- Background: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.backgroundStyle, 'clean luxury studio'), "\n- Final note: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.finalCustomNote, 'none'), "\n\n").concat(inspirationAnalysis ? "Reference inspiration analysis: ".concat(inspirationAnalysis) : '', "\n\n").concat(optionStyles[optionIndex] || optionStyles[0], "\n\nCritical instructions:\n- Keep the jewelry itself as the hero.\n- Preserve the requested structure, size, distribution, and proportions.\n- Make the output look like high-end luxury jewelry campaign photography.\n- No random extra stones.\n- No random extra structures.\n- Ultra realistic, premium lighting, macro detail, sharp reflections, photorealistic.");
}
function buildLifestylePrompt(designData, inspirationAnalysis) {
    return "Transform the provided jewelry product image into a luxury model preview.\n\nRules:\n- Keep the jewelry design exactly the same as the selected option image.\n- Do not change the jewelry structure, engraving pattern, silhouette, stone count, proportions, or metal type.\n- Do not redesign the jewelry or substitute a similar item.\n- Show a realistic model naturally wearing THIS exact jewelry piece.\n- Premium editorial jewelry photography.\n- Jewelry must remain clearly visible.\n- Elegant pose, realistic skin texture, luxury styling.\n\nWearer styling:\n- Gender / style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerGender, 'female'), " with ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerStyle, 'refined luxury styling'), "\n- Outfit: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitType, 'luxury editorial outfit'), "\n- Outfit color: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitColor, 'neutral luxury palette'), "\n- Occasion: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.occasion, 'special occasion'), "\n- Mood: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.styleMood, 'luxurious'), "\n\n").concat(inspirationAnalysis ? "Reference inspiration analysis: ".concat(inspirationAnalysis) : '', "\n\nPhotorealistic only. No cartoon or illustration.");
}
function buildPersonalPreviewPrompt(designData, inspirationAnalysis) {
    return "Create a personal jewelry preview using the provided jewelry image and uploaded customer face photo.\n\nGoals:\n- Keep the jewelry exactly the same as in the base image.\n- The base image is the locked selected jewelry option and must remain visually identical.\n- Use the uploaded face photo as the primary facial identity source.\n- Make the final face resemble the uploaded person as naturally as possible.\n- Do not distort the person\u2019s features.\n- Do not change the jewelry design.\n- Do not swap the jewelry for a different design, even if it is similar.\n- Maintain high-end editorial jewelry photography quality.\n- The result should feel like a premium try-on preview.\n\nWearer styling:\n- Gender / style: ".concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerGender, 'female'), " with ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.wearerStyle, 'luxury styling'), "\n- Outfit: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitType, 'luxury outfit'), "\n- Outfit color: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.outfitColor, 'neutral refined palette'), "\n- Mood: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.styleMood, 'luxurious'), "\n\n").concat(inspirationAnalysis ? "Reference inspiration analysis: ".concat(inspirationAnalysis) : '', "\n\nImportant:\n- Prioritize preserving the uploaded face identity strongly.\n- Keep the jewelry clearly visible and unchanged from the selected option image.\n- Keep the styling elegant and premium.\n- Photorealistic only.");
}
function buildRegenerationPrompt(designData, editInstruction) {
    return "Edit the provided jewelry image.\n\nKeep the same jewelry category and same core design identity.\nDo not turn it into a different product.\n\nRequested change:\n".concat(safe(editInstruction, 'Refine the selected option while preserving the original design identity.'), "\n\nOriginal constraints:\n- Metal: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.metal), "\n- Stone: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.stone), "\n- Shape: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.shape), "\n- Ring size: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.ringSize), "\n- Center stone carat: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat, '0'), "\n- Side stone total: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat, '0'), "\n- Side stone count: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount, '0'), "\n- Prong count: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.prongCount, '0'), "\n- Band width: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm, '0'), " mm\n- Necklace length: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength), "\n- Chain style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle), "\n- Bracelet style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.braceletStyle), "\n- Bangle style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.bangleStyle), "\n- Earring style: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.earringStyle), "\n- Finish: ").concat(safe(designData === null || designData === void 0 ? void 0 : designData.finishLevel, 'polished'), "\n\nRules:\n- Preserve the same overall design family.\n- Apply the change request strongly.\n- Keep the result premium, realistic, and jewelry-catalog ready.");
}
function buildTechnicalSheetData(designData) {
    var category = normalizeJewelryCategory(designData === null || designData === void 0 ? void 0 : designData.jewelryType);
    var jewelryType = safe(designData === null || designData === void 0 ? void 0 : designData.jewelryType, 'custom jewelry');
    var metal = safe(designData === null || designData === void 0 ? void 0 : designData.metal);
    var metalPurity = safe(designData === null || designData === void 0 ? void 0 : designData.metalPurity);
    var stone = safe(designData === null || designData === void 0 ? void 0 : designData.stone);
    var shape = safe(designData === null || designData === void 0 ? void 0 : designData.shape);
    var finish = safe(designData === null || designData === void 0 ? void 0 : designData.finishLevel, 'polished');
    if (category === 'ring') {
        var centerStoneCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.centerStoneCarat);
        var sideStoneTotalCarat = toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneTotalCarat);
        var sideStoneCount = Math.round(toNumber(designData === null || designData === void 0 ? void 0 : designData.sideStoneCount));
        var prongCount = Math.round(toNumber(designData === null || designData === void 0 ? void 0 : designData.prongCount));
        var bandWidthMm = toNumber(designData === null || designData === void 0 ? void 0 : designData.bandWidthMm);
        var centerStoneDiameterMm = estimateCenterStoneDiameterMm(centerStoneCarat, designData === null || designData === void 0 ? void 0 : designData.shape);
        var sideStonesPerSide = sideStoneCount > 0 && sideStoneCount % 2 === 0 ? sideStoneCount / 2 : sideStoneCount;
        var sideStoneEachCarat = sideStoneCount > 0 ? Number((sideStoneTotalCarat / sideStoneCount).toFixed(3)) : 0;
        return {
            title: 'Technical Specification Sheet',
            subtitle: "CAD-style technical layout for ".concat(jewelryType),
            category: category,
            normalizedType: category,
            notes: [
                centerStoneCarat > 0
                    ? "Center stone target visual size \u2248 ".concat(centerStoneDiameterMm, " mm.")
                    : 'Center stone size not specified.',
                sideStoneCount > 0
                    ? "Side stones distributed as ".concat(sideStonesPerSide, " per side when symmetry is possible.")
                    : 'No side stones specified.',
                bandWidthMm > 0 ? "Band width target is ".concat(bandWidthMm, " mm.") : 'Band width not specified.',
                prongCount > 0
                    ? "Prong configuration target is ".concat(prongCount, "-prong.")
                    : 'Prong configuration not specified.',
            ],
            drawing: {
                measureA: "".concat(centerStoneDiameterMm || 0, " mm"),
                measureB: "".concat(bandWidthMm || 0, " mm"),
                measureC: "".concat(prongCount || 0, " prongs"),
                measureD: "".concat(sideStoneCount || 0, " side stones"),
            },
            specRows: [
                { label: 'Jewelry Type', value: jewelryType },
                { label: 'Metal', value: metal },
                { label: 'Metal Purity', value: metalPurity },
                { label: 'Stone', value: stone },
                { label: 'Shape', value: shape },
                { label: 'Ring Size', value: safe(designData === null || designData === void 0 ? void 0 : designData.ringSize) },
                {
                    label: 'Center Stone',
                    value: centerStoneCarat > 0
                        ? "".concat(centerStoneCarat, " ct / approx. ").concat(centerStoneDiameterMm, " mm")
                        : 'Not specified',
                },
                {
                    label: 'Side Stones',
                    value: sideStoneCount > 0
                        ? "".concat(sideStoneCount, " total / ").concat(sideStoneTotalCarat, " ct total / ").concat(sideStoneEachCarat, " ct each")
                        : 'Not specified',
                },
                { label: 'Prongs', value: prongCount > 0 ? "".concat(prongCount) : 'Not specified' },
                { label: 'Band Width', value: bandWidthMm > 0 ? "".concat(bandWidthMm, " mm") : 'Not specified' },
                { label: 'Setting', value: safe(designData === null || designData === void 0 ? void 0 : designData.settingStyle) },
                { label: 'Finish', value: finish },
            ],
        };
    }
    if (category === 'necklace' || category === 'pendant') {
        var necklaceLength = safe(designData === null || designData === void 0 ? void 0 : designData.necklaceLength);
        var chainStyle = safe(designData === null || designData === void 0 ? void 0 : designData.chainStyle);
        var pendantStyle = safe(designData === null || designData === void 0 ? void 0 : designData.pendantStyle);
        var claspStyle = safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle);
        return {
            title: 'Technical Specification Sheet',
            subtitle: "CAD-style technical layout for ".concat(jewelryType),
            category: category,
            normalizedType: category,
            notes: [
                necklaceLength !== 'not specified'
                    ? "Neckwear length target is ".concat(necklaceLength, ".")
                    : 'Neckwear length not specified.',
                chainStyle !== 'not specified'
                    ? "Chain style target is ".concat(chainStyle, ".")
                    : 'Chain style not specified.',
                pendantStyle !== 'not specified'
                    ? "Pendant style target is ".concat(pendantStyle, ".")
                    : 'Pendant style not specified.',
                claspStyle !== 'not specified'
                    ? "Clasp style target is ".concat(claspStyle, ".")
                    : 'Clasp style not specified.',
            ],
            drawing: {
                measureA: necklaceLength,
                measureB: chainStyle,
                measureC: claspStyle,
                measureD: pendantStyle,
            },
            specRows: [
                { label: 'Jewelry Type', value: jewelryType },
                { label: 'Metal', value: metal },
                { label: 'Metal Purity', value: metalPurity },
                { label: 'Stone', value: stone },
                { label: 'Shape', value: shape },
                { label: 'Necklace Length', value: necklaceLength },
                { label: 'Chain Style', value: chainStyle },
                { label: 'Pendant Style', value: pendantStyle },
                { label: 'Clasp Style', value: claspStyle },
                { label: 'Finish', value: finish },
            ],
        };
    }
    if (category === 'bracelet' || category === 'bangle') {
        var wristSize = safe(designData === null || designData === void 0 ? void 0 : designData.wristSize);
        var braceletStyle = safe(designData === null || designData === void 0 ? void 0 : designData.braceletStyle);
        var bangleStyle = safe(designData === null || designData === void 0 ? void 0 : designData.bangleStyle);
        var innerDiameter = safe(designData === null || designData === void 0 ? void 0 : designData.bangleInnerDiameterMm);
        var opening = safe(designData === null || designData === void 0 ? void 0 : designData.isOpenableBangle);
        var claspStyle = safe(designData === null || designData === void 0 ? void 0 : designData.claspStyle);
        return {
            title: 'Technical Specification Sheet',
            subtitle: "CAD-style technical layout for ".concat(jewelryType),
            category: category,
            normalizedType: category,
            notes: [
                wristSize !== 'not specified' ? "Wrist size target is ".concat(wristSize, ".") : 'Wrist size not specified.',
                innerDiameter !== 'not specified'
                    ? "Inner diameter / bangle size target is ".concat(innerDiameter, ".")
                    : 'Inner diameter / bangle size not specified.',
                opening !== 'not specified' ? "Opening style target is ".concat(opening, ".") : 'Opening style not specified.',
                claspStyle !== 'not specified' ? "Clasp style target is ".concat(claspStyle, ".") : 'Clasp style not specified.',
            ],
            drawing: {
                measureA: wristSize,
                measureB: innerDiameter,
                measureC: opening,
                measureD: claspStyle,
            },
            specRows: [
                { label: 'Jewelry Type', value: jewelryType },
                { label: 'Metal', value: metal },
                { label: 'Metal Purity', value: metalPurity },
                { label: 'Stone', value: stone },
                { label: 'Shape', value: shape },
                { label: 'Wrist Size', value: wristSize },
                { label: 'Bracelet Style', value: braceletStyle },
                { label: 'Bangle Style', value: bangleStyle },
                { label: 'Inner Diameter / Size', value: innerDiameter },
                { label: 'Opening Style', value: opening },
                { label: 'Clasp Style', value: claspStyle },
                { label: 'Finish', value: finish },
            ],
        };
    }
    if (category === 'earrings') {
        var earringStyle = safe(designData === null || designData === void 0 ? void 0 : designData.earringStyle);
        var earringLengthMm = safe(designData === null || designData === void 0 ? void 0 : designData.earringLengthMm);
        var earringBackingType = safe(designData === null || designData === void 0 ? void 0 : designData.earringBackingType);
        return {
            title: 'Technical Specification Sheet',
            subtitle: "CAD-style technical layout for ".concat(jewelryType),
            category: category,
            normalizedType: category,
            notes: [
                earringStyle !== 'not specified' ? "Earring style target is ".concat(earringStyle, ".") : 'Earring style not specified.',
                earringLengthMm !== 'not specified'
                    ? "Earring size / length target is ".concat(earringLengthMm, ".")
                    : 'Earring size / length not specified.',
                earringBackingType !== 'not specified'
                    ? "Backing type target is ".concat(earringBackingType, ".")
                    : 'Backing type not specified.',
            ],
            drawing: {
                measureA: earringLengthMm,
                measureB: earringBackingType,
                measureC: earringStyle,
                measureD: stone,
            },
            specRows: [
                { label: 'Jewelry Type', value: jewelryType },
                { label: 'Metal', value: metal },
                { label: 'Metal Purity', value: metalPurity },
                { label: 'Stone', value: stone },
                { label: 'Shape', value: shape },
                { label: 'Earring Style', value: earringStyle },
                { label: 'Size / Length', value: earringLengthMm },
                { label: 'Backing Type', value: earringBackingType },
                { label: 'Finish', value: finish },
            ],
        };
    }
    return {
        title: 'Technical Specification Sheet',
        subtitle: "CAD-style technical layout for ".concat(jewelryType),
        category: 'other',
        notes: ['This custom jewelry type uses a general technical specification summary.'],
        drawing: {
            measureA: safe(designData === null || designData === void 0 ? void 0 : designData.jewelryType),
            measureB: metal,
            measureC: stone,
            measureD: finish,
        },
        specRows: [
            { label: 'Jewelry Type', value: jewelryType },
            { label: 'Metal', value: metal },
            { label: 'Metal Purity', value: metalPurity },
            { label: 'Stone', value: stone },
            { label: 'Shape', value: shape },
            { label: 'Finish', value: finish },
        ],
    };
}
Deno.serve(function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, prompt_1, designData, inspirationAnalysis, uploadedInspirationUrls, editInstruction, selectedBaseImage, facePhotoDataUrl, mode, optionIndex, technicalSheet, openaiApiKey, inspirationSources, _i, uploadedInspirationUrls_1, url, optionDirection, sizingRules, hasInspiration, baseContext, plan, budgetAwarePrompt, budgetAwareResult, budgetAwareB64, lifestylePrompt, lifestyleResult, lifestyleB64, personalPrompt, personalPreviewResult, personalPreviewB64, regeneratePrompt, regeneratedResult, _b, regeneratedB64, productPrompt, productResult, _c, productB64, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (req.method === 'OPTIONS') {
                    return [2 /*return*/, new Response('ok', { headers: corsHeaders })];
                }
                _d.label = 1;
            case 1:
                _d.trys.push([1, 19, , 20]);
                return [4 /*yield*/, req.json()];
            case 2:
                _a = _d.sent(), prompt_1 = _a.prompt, designData = _a.designData, inspirationAnalysis = _a.inspirationAnalysis, uploadedInspirationUrls = _a.uploadedInspirationUrls, editInstruction = _a.editInstruction, selectedBaseImage = _a.selectedBaseImage, facePhotoDataUrl = _a.facePhotoDataUrl, mode = _a.mode, optionIndex = _a.optionIndex;
                if (mode === 'technical-sheet') {
                    technicalSheet = buildTechnicalSheetData(designData || {});
                    return [2 /*return*/, new Response(JSON.stringify({ technicalSheet: technicalSheet }), {
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
                inspirationSources = [];
                if (uploadedInspirationUrls === null || uploadedInspirationUrls === void 0 ? void 0 : uploadedInspirationUrls.length) {
                    for (_i = 0, uploadedInspirationUrls_1 = uploadedInspirationUrls; _i < uploadedInspirationUrls_1.length; _i++) {
                        url = uploadedInspirationUrls_1[_i];
                        if (url)
                            inspirationSources.push(url);
                    }
                }
                optionDirection = getOptionDirection(optionIndex !== null && optionIndex !== void 0 ? optionIndex : 0);
                sizingRules = buildSizingRules(designData);
                hasInspiration = inspirationSources.length > 0;
                baseContext = "\nYou are designing original luxury jewelry.\n\nCore user prompt:\n".concat(prompt_1, "\n\nDesign data:\n- Jewelry Type: ").concat((designData === null || designData === void 0 ? void 0 : designData.jewelryType) || 'fine jewelry piece', "\n- Occasion: ").concat((designData === null || designData === void 0 ? void 0 : designData.occasion) || 'special occasion', "\n- Country / Region: ").concat((designData === null || designData === void 0 ? void 0 : designData.country) || 'global luxury taste', "\n- Wearer Gender: ").concat((designData === null || designData === void 0 ? void 0 : designData.wearerGender) || 'wearer', "\n- Wearer Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.wearerStyle) || 'refined', "\n- Metal: ").concat((designData === null || designData === void 0 ? void 0 : designData.metal) || 'premium metal', "\n- Metal Purity: ").concat((designData === null || designData === void 0 ? void 0 : designData.metalPurity) || 'premium purity', "\n- Stone: ").concat((designData === null || designData === void 0 ? void 0 : designData.stone) || 'gemstone', "\n- Shape: ").concat((designData === null || designData === void 0 ? void 0 : designData.shape) || 'elegant cut', "\n- Ring Size: ").concat((designData === null || designData === void 0 ? void 0 : designData.ringSize) || 'not specified', "\n- Setting Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.settingStyle) || 'high-end setting', "\n- Band Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.bandStyle) || 'luxury band', "\n- Necklace Length: ").concat((designData === null || designData === void 0 ? void 0 : designData.necklaceLength) || 'not specified', "\n- Chain Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.chainStyle) || 'not specified', "\n- Pendant Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.pendantStyle) || 'not specified', "\n- Bracelet Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.braceletStyle) || 'not specified', "\n- Wrist Size: ").concat((designData === null || designData === void 0 ? void 0 : designData.wristSize) || 'not specified', "\n- Bangle Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.bangleStyle) || 'not specified', "\n- Bangle Inner Diameter: ").concat((designData === null || designData === void 0 ? void 0 : designData.bangleInnerDiameterMm) || 'not specified', "\n- Bangle Opening: ").concat((designData === null || designData === void 0 ? void 0 : designData.isOpenableBangle) || 'not specified', "\n- Clasp Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.claspStyle) || 'not specified', "\n- Earring Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.earringStyle) || 'not specified', "\n- Earring Length: ").concat((designData === null || designData === void 0 ? void 0 : designData.earringLengthMm) || 'not specified', "\n- Earring Backing: ").concat((designData === null || designData === void 0 ? void 0 : designData.earringBackingType) || 'not specified', "\n- Finish Level: ").concat((designData === null || designData === void 0 ? void 0 : designData.finishLevel) || 'polished', "\n- Style Mood: ").concat((designData === null || designData === void 0 ? void 0 : designData.styleMood) || 'luxurious', "\n- Reference Inspiration: ").concat((designData === null || designData === void 0 ? void 0 : designData.referenceInspiration) || 'high jewelry editorial', "\n- Luxury Tone: ").concat((designData === null || designData === void 0 ? void 0 : designData.luxuryTone) || 'high luxury', "\n- Background Style: ").concat((designData === null || designData === void 0 ? void 0 : designData.backgroundStyle) || 'clean white studio', "\n- Outfit Type: ").concat((designData === null || designData === void 0 ? void 0 : designData.outfitType) || 'luxury styling', "\n- Outfit Color: ").concat((designData === null || designData === void 0 ? void 0 : designData.outfitColor) || 'refined palette', "\n- Final Custom Note: ").concat((designData === null || designData === void 0 ? void 0 : designData.finalCustomNote) || 'none', "\n- Budget Currency: ").concat((designData === null || designData === void 0 ? void 0 : designData.budgetCurrency) || 'USD', "\n- Budget: ").concat((designData === null || designData === void 0 ? void 0 : designData.budget) || 'not specified', "\n\n").concat(sizingRules, "\n\nInspiration analysis:\n").concat(inspirationAnalysis || 'No inspiration analysis was provided.', "\n\nRequested edit from user:\n").concat(editInstruction || 'No additional change request.', "\n\nSelected option direction:\n").concat(optionDirection.label, ": ").concat(optionDirection.instruction, "\n\nCritical source behavior:\n").concat(hasInspiration
                    ? '- Use the uploaded inspiration images heavily.\n- Preserve pattern language, ornament density, silhouette logic, motif repetition, and cultural styling from the source images.\n- The result must feel strongly inspired by the uploaded references while remaining original.'
                    : '- No inspiration images were uploaded.\n- Use the answered fields and the final custom note as the primary design source.\n- Follow the final custom note heavily and do not drift into generic jewelry.\n- The result should feel custom-designed from the written specification.', "\n");
                if (!(mode === 'budget-aware')) return [3 /*break*/, 4];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for budget-aware mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                plan = buildBudgetAwarePlan(designData || {});
                budgetAwarePrompt = buildBudgetAwarePrompt(designData || {}, plan);
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: [selectedBaseImage],
                        prompt: "".concat(baseContext, "\n\n").concat(plan.promptBlock, "\n\n").concat(budgetAwarePrompt),
                        size: '1024x1024',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 3:
                budgetAwareResult = _d.sent();
                budgetAwareB64 = extractBase64Image(budgetAwareResult);
                if (!budgetAwareB64) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'No budget-aware image returned' }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [2 /*return*/, new Response(JSON.stringify({
                        budgetAwareImage: "data:image/png;base64,".concat(budgetAwareB64),
                        budgetAwareReport: {
                            title: 'Budget-fit modification summary',
                            targetBudget: plan.targetBudget,
                            protectedDesign: plan.protectedDesign,
                            changeSummary: plan.changeSummary,
                            changes: plan.changes,
                        },
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 4:
                if (!(mode === 'lifestyle')) return [3 /*break*/, 6];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for lifestyle mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                lifestylePrompt = buildLifestylePrompt(designData || {}, inspirationAnalysis || '');
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: [selectedBaseImage],
                        prompt: "".concat(baseContext, "\n\n").concat(lifestylePrompt),
                        size: '1024x1536',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 5:
                lifestyleResult = _d.sent();
                lifestyleB64 = extractBase64Image(lifestyleResult);
                if (!lifestyleB64) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'No lifestyle image returned' }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [2 /*return*/, new Response(JSON.stringify({
                        lifestyleImage: "data:image/png;base64,".concat(lifestyleB64),
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 6:
                if (!(mode === 'personal-preview')) return [3 /*break*/, 8];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for personal-preview mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                if (!facePhotoDataUrl) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing facePhotoDataUrl for personal-preview mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                personalPrompt = buildPersonalPreviewPrompt(designData || {}, inspirationAnalysis || '');
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: [selectedBaseImage, facePhotoDataUrl],
                        prompt: "".concat(baseContext, "\n\n").concat(personalPrompt),
                        size: '1024x1536',
                        quality: 'high',
                        inputFidelity: 'high',
                    })];
            case 7:
                personalPreviewResult = _d.sent();
                personalPreviewB64 = extractBase64Image(personalPreviewResult);
                if (!personalPreviewB64) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'No personal preview image returned' }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [2 /*return*/, new Response(JSON.stringify({
                        personalPreviewImage: "data:image/png;base64,".concat(personalPreviewB64),
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 8:
                if (!(mode === 'regenerate-selected')) return [3 /*break*/, 13];
                if (!selectedBaseImage) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing selectedBaseImage for regenerate-selected mode' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                regeneratePrompt = buildRegenerationPrompt(designData || {}, editInstruction || '');
                if (!hasInspiration) return [3 /*break*/, 10];
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: __spreadArray([selectedBaseImage], inspirationSources, true),
                        prompt: "".concat(baseContext, "\n\n").concat(regeneratePrompt),
                        size: '1024x1024',
                        quality: 'medium',
                        inputFidelity: 'high',
                    })];
            case 9:
                _b = _d.sent();
                return [3 /*break*/, 12];
            case 10: return [4 /*yield*/, callImageEdit({
                    openaiApiKey: openaiApiKey,
                    images: [selectedBaseImage],
                    prompt: "".concat(baseContext, "\n\n").concat(regeneratePrompt),
                    size: '1024x1024',
                    quality: 'medium',
                    inputFidelity: 'high',
                })];
            case 11:
                _b = _d.sent();
                _d.label = 12;
            case 12:
                regeneratedResult = _b;
                regeneratedB64 = extractBase64Image(regeneratedResult);
                if (!regeneratedB64) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'No regenerated image returned' }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [2 /*return*/, new Response(JSON.stringify({
                        regeneratedImage: "data:image/png;base64,".concat(regeneratedB64),
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 13:
                if (!(mode === 'product-single')) return [3 /*break*/, 18];
                productPrompt = buildBeautyPrompt(designData || {}, baseContext, inspirationAnalysis || '', optionIndex !== null && optionIndex !== void 0 ? optionIndex : 0);
                if (!hasInspiration) return [3 /*break*/, 15];
                return [4 /*yield*/, callImageEdit({
                        openaiApiKey: openaiApiKey,
                        images: inspirationSources,
                        prompt: productPrompt,
                        size: '1024x1024',
                        quality: 'medium',
                        inputFidelity: 'high',
                    })];
            case 14:
                _c = _d.sent();
                return [3 /*break*/, 17];
            case 15: return [4 /*yield*/, callImageGeneration({
                    openaiApiKey: openaiApiKey,
                    prompt: productPrompt,
                    size: '1024x1024',
                    quality: 'medium',
                })];
            case 16:
                _c = _d.sent();
                _d.label = 17;
            case 17:
                productResult = _c;
                productB64 = extractBase64Image(productResult);
                if (!productB64) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: "No product image returned for ".concat(optionDirection.label) }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                return [2 /*return*/, new Response(JSON.stringify({
                        productImage: {
                            id: "product-".concat((optionIndex !== null && optionIndex !== void 0 ? optionIndex : 0) + 1),
                            label: optionDirection.label,
                            dataUrl: "data:image/png;base64,".concat(productB64),
                        },
                        appliedPrompt: productPrompt,
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 18: return [2 /*return*/, new Response(JSON.stringify({ error: 'Unsupported mode' }), {
                    status: 400,
                    headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                })];
            case 19:
                error_1 = _d.sent();
                console.error('generate-jewelry-image error:', error_1);
                return [2 /*return*/, new Response(JSON.stringify({
                        error: 'Unexpected generate-jewelry-image error',
                        details: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || String(error_1),
                    }), {
                        status: 500,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 20: return [2 /*return*/];
        }
    });
}); });
