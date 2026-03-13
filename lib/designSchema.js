"use strict";
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
exports.getQuestionText = getQuestionText;
exports.getQuestionsForDesign = getQuestionsForDesign;
exports.getVisibleFieldsForDesign = getVisibleFieldsForDesign;
exports.getSchemaSummary = getSchemaSummary;
var jewelryFlow_1 = require("./jewelryFlow");
var globalLeadQuestions = [
    {
        key: 'jewelryType',
        label: 'Jewelry Type',
        question: 'What type of jewelry would you like to create today? For example: ring, necklace, pendant, bracelet, bangle, earrings.',
    },
    {
        key: 'occasion',
        label: 'Occasion',
        question: 'What is the occasion for this piece? For example: engagement, anniversary, wedding, gift, festive, self purchase.',
    },
    {
        key: 'country',
        label: 'Country / Region',
        question: 'Which market should we design for: USA, India, or Dubai? You can also type another country if needed.',
    },
    {
        key: 'stateOrProvince',
        label: 'State / Province',
        question: 'If pricing should include local tax, what U.S. state should we estimate for? Example: New Jersey, California, Texas. If not needed, type N/A.',
        shouldAsk: function (data) { return (0, jewelryFlow_1.needsStateOrProvince)(data); },
    },
    {
        key: 'wearerGender',
        label: 'Wearer Gender',
        question: 'Is this piece for female, male, or unisex styling?',
    },
    {
        key: 'wearerStyle',
        label: 'Wearer Style',
        question: 'How would you describe the wearer’s style? For example: minimal, bold, elegant, royal, modern, traditional.',
    },
    {
        key: 'metal',
        label: 'Metal',
        question: 'Which metal do you prefer? For example: yellow gold, white gold, rose gold, platinum, silver.',
    },
    {
        key: 'metalPurity',
        label: 'Metal Purity',
        question: function (data) {
            var country = (0, jewelryFlow_1.normalizeCountry)(data.country);
            if (country === 'india')
                return 'What metal purity do you want? For India, common examples are 18K, 22K, 24K.';
            if (country === 'dubai')
                return 'What metal purity do you want? For Dubai, common examples are 18K, 21K, 22K, 24K.';
            return 'What metal purity do you want? For example: 10K, 14K, 18K, 22K, 24K.';
        },
        shouldAsk: function (data) { return (0, jewelryFlow_1.needsMetalPurity)(data); },
    },
    {
        key: 'stone',
        label: 'Main Stone',
        question: 'What main stone would you like? For example: diamond, moissanite, sapphire, emerald, ruby, no stone.',
    },
    {
        key: 'shape',
        label: 'Stone Shape',
        question: 'What stone shape do you prefer? For example: oval, round, pear, emerald, cushion.',
        shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); },
    },
];
var sharedCreativeQuestions = [
    {
        key: 'finishLevel',
        label: 'Finish Level',
        question: 'What finish level do you want? For example: matte, polished, mirror finish, satin.',
    },
    {
        key: 'styleMood',
        label: 'Style Mood',
        question: 'What mood should the piece express? For example: romantic, regal, minimal, soft luxury, modern glamour.',
    },
    {
        key: 'referenceInspiration',
        label: 'Reference Inspiration',
        question: 'Briefly describe the inspiration source. For example: Cartier style, vintage bridal, Pinterest luxury, celebrity look.',
    },
    {
        key: 'luxuryTone',
        label: 'Luxury Tone',
        question: function (data) {
            var country = (0, jewelryFlow_1.normalizeCountry)(data.country);
            if (country === 'india')
                return 'What luxury level should this feel like? For example: bridal luxury, heritage luxury, festive luxury, temple-inspired luxury.';
            if (country === 'dubai')
                return 'What luxury level should this feel like? For example: ultra luxury, statement glamour, gold-forward luxury, bridal glamour.';
            return 'What luxury level should this feel like? For example: ultra luxury, everyday luxury, statement piece, bridal luxury.';
        },
    },
    {
        key: 'backgroundStyle',
        label: 'Background Style',
        question: 'For the generated image, what background style do you prefer? For example: white studio, black luxury, soft pastel, editorial.',
    },
    {
        key: 'outfitType',
        label: 'Outfit Type',
        question: function (data) {
            var country = (0, jewelryFlow_1.normalizeCountry)(data.country);
            if (country === 'india')
                return 'What outfit would this jewelry be worn with? For example: bridal lehenga, saree, indo-western, festive outfit.';
            if (country === 'dubai')
                return 'What outfit would this jewelry be worn with? For example: abaya styling, couture gown, bridal wear, evening luxury.';
            return 'What outfit would this jewelry be worn with? For example: gown, cocktail dress, tuxedo, bridal dress, casual luxury.';
        },
    },
    {
        key: 'outfitColor',
        label: 'Outfit Color',
        question: 'What is the outfit color or color palette? For example: ivory and gold, emerald green, black tie monochrome, blush pink.',
    },
    {
        key: 'wantsModelPreview',
        label: 'Model Preview',
        question: 'Do you want a model preview image with the jewelry and outfit? Please answer yes or no.',
    },
    {
        key: 'budgetCurrency',
        label: 'Budget Currency',
        question: function (data) { return "What currency should we use for your budget? Default for ".concat(data.country || 'this market', " is ").concat((0, jewelryFlow_1.getCurrencyForCountry)(data.country), ". You can type the same or change it."); },
    },
    {
        key: 'budget',
        label: 'Budget',
        question: function (data) { return "What is your approximate budget in ".concat(data.budgetCurrency || (0, jewelryFlow_1.getCurrencyForCountry)(data.country), "?"); },
    },
    {
        key: 'finalCustomNote',
        label: 'Final Custom Note',
        multiline: true,
        question: 'Last step: describe everything in as much detail as possible. If you did not upload inspiration images, be very specific about pattern, proportions, stone layout, structure, finish, styling, and the exact feel you want.',
    },
];
var schemaByType = {
    ring: [
        { key: 'ringSize', label: 'Ring Size', question: 'What ring size do you want? Example: 6, 7, 8, 9. If unsure, type approximate size or say not sure.' },
        { key: 'centerStoneCarat', label: 'Center Stone Carat', question: 'What should the center stone weight be? Example: 1.0, 1.5, 2.0 carat. If there is no center stone, type 0.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'sideStoneTotalCarat', label: 'Side Stone Total Carat', question: 'If you want side stones, what should the total side-stone carat weight be? Example: 2.0. If no side stones, type 0.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'sideStoneCount', label: 'Side Stone Count', question: 'How many side stones do you want in total? Example: 8. If no side stones, type 0.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'prongCount', label: 'Prong Count', question: 'How many prongs should hold the center stone? Example: 4, 6, 8. If not applicable, type 0.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'bandWidthMm', label: 'Band Width', question: 'What should the band width be in millimeters? Example: 1.8, 2.2, 2.8.' },
        { key: 'settingStyle', label: 'Setting Style', question: 'What setting style do you prefer? For example: solitaire, halo, hidden halo, bezel, three stone.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'bandStyle', label: 'Band Style', question: 'Describe the band style you want. For example: thin band, pavé band, split shank, vintage band.' },
    ],
    pendant: [
        { key: 'pendantStyle', label: 'Pendant Style', question: 'What pendant style do you want? For example: solitaire pendant, symbolic pendant, initial pendant, drop pendant.' },
        { key: 'necklaceLength', label: 'Chain Length', question: 'Do you want to specify a chain length? Example: 16 inch, 18 inch, 20 inch. If pendant only, type pendant only.' },
        { key: 'chainStyle', label: 'Chain Style', question: 'If a chain is included, what chain style do you prefer? For example: cable chain, box chain, curb chain. If pendant only, type none.' },
        { key: 'settingStyle', label: 'Setting Style', question: 'What setting style should the pendant use? For example: bezel, halo, solitaire, cluster.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'bandStyle', label: 'Bail / Frame Style', question: 'Describe the bail, frame, or silhouette you want. For example: hidden bail, ornate frame, minimal frame, halo outline.' },
    ],
    necklace: [
        { key: 'necklaceLength', label: 'Necklace Length', question: 'What necklace length do you prefer? For example: 16 inch, 18 inch, 20 inch, choker, princess, opera.' },
        { key: 'chainStyle', label: 'Chain Style', question: 'What chain style do you prefer? For example: cable chain, box chain, curb chain, rope chain.' },
        { key: 'claspStyle', label: 'Clasp Style', question: 'What clasp style do you prefer? For example: lobster clasp, box clasp, hidden clasp.' },
        { key: 'pendantStyle', label: 'Center Motif / Drop', question: 'Does the necklace include a pendant, center motif, or drop? Describe it, or type none.' },
    ],
    bracelet: [
        { key: 'braceletStyle', label: 'Bracelet Style', question: 'What bracelet style do you want? For example: tennis bracelet, cuff, charm bracelet, chain bracelet.' },
        { key: 'wristSize', label: 'Wrist Size', question: 'What wrist size should we design for? Example: 6.5 inch, 7 inch, small, medium.' },
        { key: 'claspStyle', label: 'Clasp Style', question: 'What clasp style do you prefer? For example: lobster clasp, box clasp, magnetic clasp.' },
    ],
    bangle: [
        { key: 'bangleStyle', label: 'Bangle Style', question: 'What bangle style do you want? For example: plain gold bangle, diamond bangle, kada, open cuff bangle.' },
        { key: 'wristSize', label: 'Wrist Size', question: 'What wrist size should we design for? Example: 6.5 inch, 7 inch, 2.4 size, small, medium.' },
        { key: 'bangleInnerDiameterMm', label: 'Inner Diameter / Size', question: 'What should the bangle inner diameter be in mm, or what bangle size do you prefer? Example: 58 mm, 2.4, 2.6.' },
        { key: 'isOpenableBangle', label: 'Opening Style', question: 'Should the bangle be openable or fixed? Example: openable, fixed, hinge, screw, slip-on.' },
    ],
    earrings: [
        { key: 'earringStyle', label: 'Earring Style', question: 'What earring style do you want? For example: studs, hoops, drop earrings, chandelier earrings.' },
        { key: 'earringLengthMm', label: 'Earring Length / Size', question: 'What should the earring size or drop length be? Example: 8 mm stud, 25 mm hoop, 55 mm drop length.' },
        { key: 'earringBackingType', label: 'Backing Type', question: 'What backing type do you prefer? For example: push back, screw back, latch back, clip.' },
        { key: 'settingStyle', label: 'Stone Layout / Setting', question: 'How should the stones be arranged? For example: solitaire studs, halo studs, inside-out hoops, graduated drops.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
        { key: 'sideStoneCount', label: 'Stone Count / Pair Layout', question: 'How many total stones or major elements should the pair have? Example: 2 center stones, 24 pavé stones, or type not sure.', shouldAsk: function (data) { return (0, jewelryFlow_1.hasStone)(data); } },
    ],
    other: [
        { key: 'settingStyle', label: 'Structure / Setting', question: 'Describe the main construction or setting style you want.' },
        { key: 'bandStyle', label: 'Structure Details', question: 'Describe the structure, silhouette, and any functional details for this custom piece.' },
    ],
};
function getQuestionText(question, data) {
    return typeof question.question === 'function' ? question.question(data) : question.question;
}
function getQuestionsForDesign(data) {
    var type = (0, jewelryFlow_1.normalizeJewelryType)(data.jewelryType);
    var schema = schemaByType[type] || schemaByType.other;
    return __spreadArray(__spreadArray(__spreadArray([], globalLeadQuestions, true), schema, true), sharedCreativeQuestions, true).filter(function (q) {
        return q.shouldAsk ? q.shouldAsk(data) : true;
    });
}
function getVisibleFieldsForDesign(data) {
    return getQuestionsForDesign(data).map(function (q) { return ({ key: q.key, label: q.label, multiline: q.multiline }); });
}
function getSchemaSummary(typeValue) {
    var type = (0, jewelryFlow_1.normalizeJewelryType)(typeValue);
    if (type === 'ring')
        return 'Dynamic ring questionnaire activated: only ring-specific questions like ring size, center stone, prongs, and band design will be asked.';
    if (type === 'pendant')
        return 'Dynamic pendant questionnaire activated: only pendant-specific questions like pendant style, bail/frame details, and optional chain details will be asked.';
    if (type === 'necklace')
        return 'Dynamic necklace questionnaire activated: only necklace-specific questions like chain length, clasp, and center motif will be asked.';
    if (type === 'bracelet')
        return 'Dynamic bracelet questionnaire activated: only bracelet-specific questions like wrist size, bracelet style, and clasp will be asked.';
    if (type === 'bangle')
        return 'Dynamic bangle questionnaire activated: only bangle-specific questions like inner diameter, opening style, and bangle styling will be asked.';
    if (type === 'earrings')
        return 'Dynamic earring questionnaire activated: only earring-specific questions like earring style, backing, pair size, and stone layout will be asked.';
    return 'Dynamic custom-jewelry questionnaire activated: the flow will adapt to the product type you choose.';
}
