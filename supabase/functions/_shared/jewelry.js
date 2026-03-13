"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
exports.safe = safe;
exports.decodeBase64 = decodeBase64;
exports.fileFromDataUrl = fileFromDataUrl;
exports.getMimeExtension = getMimeExtension;
exports.estimateCenterStoneDiameterMm = estimateCenterStoneDiameterMm;
exports.buildBeautyPrompt = buildBeautyPrompt;
exports.buildLifestylePrompt = buildLifestylePrompt;
exports.buildPersonalPreviewPrompt = buildPersonalPreviewPrompt;
exports.buildRegenerationPrompt = buildRegenerationPrompt;
exports.buildTechnicalSheetData = buildTechnicalSheetData;
function toNumber(value) {
    var n = parseFloat(value || '');
    return Number.isFinite(n) ? n : 0;
}
function safe(value, fallback) {
    if (fallback === void 0) { fallback = 'not specified'; }
    return (value === null || value === void 0 ? void 0 : value.trim()) ? value.trim() : fallback;
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
function estimateCenterStoneDiameterMm(carat, shape) {
    if (!carat || carat <= 0)
        return 0;
    var lowerShape = (shape || '').toLowerCase();
    // Round-diamond style approximation:
    // anchored roughly around 1 ct ≈ 6.5 mm
    var roundMm = 6.5 * Math.cbrt(carat);
    if (lowerShape.includes('oval'))
        return Number((roundMm * 1.12).toFixed(2));
    if (lowerShape.includes('emerald'))
        return Number((roundMm * 1.15).toFixed(2));
    if (lowerShape.includes('pear'))
        return Number((roundMm * 1.10).toFixed(2));
    if (lowerShape.includes('marquise'))
        return Number((roundMm * 1.18).toFixed(2));
    if (lowerShape.includes('princess'))
        return Number((roundMm * 0.96).toFixed(2));
    return Number(roundMm.toFixed(2));
}
function buildBeautyPrompt(designData, basePrompt, inspirationAnalysis, optionIndex) {
    var optionStyles = [
        'Option 1: closest premium interpretation with strong fidelity to the requested design.',
        'Option 2: slightly softer and more elegant interpretation with refined proportions.',
        'Option 3: richer luxury interpretation with stronger brilliance and premium detailing.',
        'Option 4: editorial hero-shot interpretation with elevated craftsmanship presence.',
    ];
    return "".concat(basePrompt, "\n  \n  Use these design details exactly:\n  - Jewelry type: ").concat(safe(designData.jewelryType), "\n  - Occasion: ").concat(safe(designData.occasion), "\n  - Metal: ").concat(safe(designData.metal), "\n  - Metal purity: ").concat(safe(designData.metalPurity), "\n  - Stone: ").concat(safe(designData.stone), "\n  - Shape: ").concat(safe(designData.shape), "\n  - Ring size: ").concat(safe(designData.ringSize), "\n  - Center stone carat: ").concat(safe(designData.centerStoneCarat, '0'), "\n  - Side stones total carat: ").concat(safe(designData.sideStoneTotalCarat, '0'), "\n  - Side stone count: ").concat(safe(designData.sideStoneCount, '0'), "\n  - Prong count: ").concat(safe(designData.prongCount, '0'), "\n  - Band width: ").concat(safe(designData.bandWidthMm, '0'), " mm\n  - Setting style: ").concat(safe(designData.settingStyle), "\n  - Band style: ").concat(safe(designData.bandStyle), "\n  - Finish: ").concat(safe(designData.finishLevel, 'polished'), "\n  - Mood: ").concat(safe(designData.styleMood, 'luxurious'), "\n  - Background: ").concat(safe(designData.backgroundStyle, 'clean luxury studio'), "\n  - Final note: ").concat(safe(designData.finalCustomNote, 'none'), "\n  \n  ").concat(inspirationAnalysis ? "Reference inspiration analysis: ".concat(inspirationAnalysis) : '', "\n  \n  ").concat(optionStyles[optionIndex] || optionStyles[0], "\n  \n  Critical instructions:\n  - Keep the jewelry itself as the hero.\n  - Preserve the requested center-stone proportions, side-stone distribution, prong count, and band width.\n  - Make the output look like high-end luxury jewelry campaign photography.\n  - No random extra stones.\n  - No random extra structures.\n  - Ultra realistic, premium lighting, macro detail, sharp reflections, photorealistic.");
}
function buildLifestylePrompt(designData, inspirationAnalysis) {
    return "Transform the provided jewelry product image into a luxury model preview.\n  \n  Rules:\n  - Keep the jewelry design exactly the same.\n  - Do not change the jewelry structure, stone count, proportions, or metal type.\n  - Show a realistic model naturally wearing the jewelry.\n  - Premium editorial jewelry photography.\n  - Jewelry must remain clearly visible.\n  - Elegant pose, realistic skin texture, luxury styling.\n  \n  Wearer styling:\n  - Gender / style: ".concat(safe(designData.wearerGender, 'female'), " with ").concat(safe(designData.wearerStyle, 'refined luxury styling'), "\n  - Outfit: ").concat(safe(designData.outfitType, 'luxury editorial outfit'), "\n  - Outfit color: ").concat(safe(designData.outfitColor, 'neutral luxury palette'), "\n  - Occasion: ").concat(safe(designData.occasion, 'special occasion'), "\n  - Mood: ").concat(safe(designData.styleMood, 'luxurious'), "\n  \n  ").concat(inspirationAnalysis ? "Reference inspiration analysis: ".concat(inspirationAnalysis) : '', "\n  \n  Photorealistic only. No cartoon or illustration.");
}
function buildPersonalPreviewPrompt(designData, inspirationAnalysis) {
    return "Create a personal jewelry preview using the provided jewelry image and uploaded customer face photo.\n  \n  Goals:\n  - Keep the jewelry exactly the same as in the base image.\n  - Use the uploaded face photo as the primary facial identity source.\n  - Make the final face resemble the uploaded person as naturally as possible.\n  - Do not distort the person\u2019s features.\n  - Do not change the jewelry design.\n  - Maintain high-end editorial jewelry photography quality.\n  - The result should feel like a premium try-on preview.\n  \n  Wearer styling:\n  - Gender / style: ".concat(safe(designData.wearerGender, 'female'), " with ").concat(safe(designData.wearerStyle, 'luxury styling'), "\n  - Outfit: ").concat(safe(designData.outfitType, 'luxury outfit'), "\n  - Outfit color: ").concat(safe(designData.outfitColor, 'neutral refined palette'), "\n  - Mood: ").concat(safe(designData.styleMood, 'luxurious'), "\n  \n  ").concat(inspirationAnalysis ? "Reference inspiration analysis: ".concat(inspirationAnalysis) : '', "\n  \n  Important:\n  - Prioritize preserving the uploaded face identity strongly.\n  - Keep the jewelry clearly visible.\n  - Keep the styling elegant and premium.\n  - Photorealistic only.");
}
function buildRegenerationPrompt(designData, editInstruction) {
    return "Edit the provided jewelry image.\n  \n  Keep the same jewelry category and same core design identity.\n  Do not turn it into a different product.\n  \n  Requested change:\n  ".concat(safe(editInstruction, 'Refine the selected option while preserving the original design identity.'), "\n  \n  Original constraints:\n  - Metal: ").concat(safe(designData.metal), "\n  - Stone: ").concat(safe(designData.stone), "\n  - Shape: ").concat(safe(designData.shape), "\n  - Ring size: ").concat(safe(designData.ringSize), "\n  - Center stone carat: ").concat(safe(designData.centerStoneCarat, '0'), "\n  - Side stone total: ").concat(safe(designData.sideStoneTotalCarat, '0'), "\n  - Side stone count: ").concat(safe(designData.sideStoneCount, '0'), "\n  - Prong count: ").concat(safe(designData.prongCount, '0'), "\n  - Band width: ").concat(safe(designData.bandWidthMm, '0'), " mm\n  - Setting style: ").concat(safe(designData.settingStyle), "\n  - Finish: ").concat(safe(designData.finishLevel, 'polished'), "\n  \n  Rules:\n  - Preserve the same overall design family.\n  - Apply the change request strongly.\n  - Keep the result premium, realistic, and jewelry-catalog ready.");
}
function buildTechnicalSheetData(designData) {
    var jewelryType = safe(designData.jewelryType, 'ring');
    var centerStoneCarat = toNumber(designData.centerStoneCarat);
    var sideStoneTotalCarat = toNumber(designData.sideStoneTotalCarat);
    var sideStoneCount = Math.round(toNumber(designData.sideStoneCount));
    var prongCount = Math.round(toNumber(designData.prongCount));
    var bandWidthMm = toNumber(designData.bandWidthMm);
    var centerStoneDiameterMm = estimateCenterStoneDiameterMm(centerStoneCarat, designData.shape);
    var sideStonesPerSide = sideStoneCount > 0 && sideStoneCount % 2 === 0
        ? sideStoneCount / 2
        : sideStoneCount;
    var sideStoneEachCarat = sideStoneCount > 0 ? Number((sideStoneTotalCarat / sideStoneCount).toFixed(3)) : 0;
    var notes = [
        centerStoneCarat > 0
            ? "Center stone target visual size \u2248 ".concat(centerStoneDiameterMm, " mm.")
            : 'Center stone size not specified.',
        sideStoneCount > 0
            ? "Side stones distributed as ".concat(sideStonesPerSide, " per side when symmetry is possible.")
            : 'No side stones specified.',
        bandWidthMm > 0
            ? "Band width target is ".concat(bandWidthMm, " mm.")
            : 'Band width not specified.',
        prongCount > 0
            ? "Prong configuration target is ".concat(prongCount, "-prong.")
            : 'Prong configuration not specified.',
    ];
    var specRows = [
        { label: 'Jewelry Type', value: jewelryType },
        { label: 'Metal', value: safe(designData.metal) },
        { label: 'Metal Purity', value: safe(designData.metalPurity) },
        { label: 'Stone', value: safe(designData.stone) },
        { label: 'Shape', value: safe(designData.shape) },
        { label: 'Ring Size', value: safe(designData.ringSize) },
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
        {
            label: 'Prongs',
            value: prongCount > 0 ? "".concat(prongCount) : 'Not specified',
        },
        {
            label: 'Band Width',
            value: bandWidthMm > 0 ? "".concat(bandWidthMm, " mm") : 'Not specified',
        },
        { label: 'Setting', value: safe(designData.settingStyle) },
        { label: 'Finish', value: safe(designData.finishLevel, 'polished') },
    ];
    return {
        title: 'Technical Specification Sheet',
        jewelryType: jewelryType,
        metal: safe(designData.metal),
        metalPurity: safe(designData.metalPurity),
        stone: safe(designData.stone),
        shape: safe(designData.shape),
        ringSize: safe(designData.ringSize),
        centerStoneCarat: centerStoneCarat,
        centerStoneDiameterMm: centerStoneDiameterMm,
        sideStoneTotalCarat: sideStoneTotalCarat,
        sideStoneCount: sideStoneCount,
        sideStonesPerSide: sideStonesPerSide,
        sideStoneEachCarat: sideStoneEachCarat,
        prongCount: prongCount,
        bandWidthMm: bandWidthMm,
        settingStyle: safe(designData.settingStyle),
        finishLevel: safe(designData.finishLevel, 'polished'),
        notes: notes,
        specRows: specRows,
    };
}
