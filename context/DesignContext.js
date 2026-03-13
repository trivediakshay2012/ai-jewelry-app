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
exports.DesignProvider = DesignProvider;
exports.useDesign = useDesign;
var react_1 = require("react");
var designSchema_1 = require("../lib/designSchema");
var initialDesignData = {
    jewelryType: '',
    occasion: '',
    country: '',
    stateOrProvince: '',
    wearerGender: '',
    wearerStyle: '',
    metal: '',
    metalPurity: '',
    stone: '',
    shape: '',
    ringSize: '',
    centerStoneCarat: '',
    sideStoneTotalCarat: '',
    sideStoneCount: '',
    prongCount: '',
    bandWidthMm: '',
    settingStyle: '',
    bandStyle: '',
    necklaceLength: '',
    chainStyle: '',
    pendantStyle: '',
    braceletStyle: '',
    claspStyle: '',
    wristSize: '',
    bangleStyle: '',
    bangleInnerDiameterMm: '',
    isOpenableBangle: '',
    earringStyle: '',
    earringLengthMm: '',
    earringBackingType: '',
    finishLevel: '',
    styleMood: '',
    referenceInspiration: '',
    luxuryTone: '',
    backgroundStyle: '',
    outfitType: '',
    outfitColor: '',
    wantsModelPreview: '',
    budget: '',
    budgetCurrency: '',
    finalCustomNote: '',
};
var initialMessages = [
    {
        id: '1',
        role: 'assistant',
        text: 'Hi! I’m your AI jewelry designer. Tell me the jewelry type and I will switch to that product’s dedicated questionnaire.',
    },
];
var DesignContext = (0, react_1.createContext)(undefined);
function DesignProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(initialDesignData), designData = _b[0], setDesignData = _b[1];
    var _c = (0, react_1.useState)(initialMessages), messages = _c[0], setMessages = _c[1];
    var _d = (0, react_1.useState)(''), generatedPrompt = _d[0], setGeneratedPrompt = _d[1];
    var _e = (0, react_1.useState)([]), inspirationImages = _e[0], setInspirationImages = _e[1];
    var _f = (0, react_1.useState)([]), uploadedInspirationUrls = _f[0], setUploadedInspirationUrls = _f[1];
    var _g = (0, react_1.useState)(''), inspirationAnalysis = _g[0], setInspirationAnalysis = _g[1];
    var _h = (0, react_1.useState)(null), facePhotoUri = _h[0], setFacePhotoUri = _h[1];
    var _j = (0, react_1.useState)([]), cartItems = _j[0], setCartItems = _j[1];
    var _k = (0, react_1.useState)(null), vendorInspirationItem = _k[0], setVendorInspirationItem = _k[1];
    var addToCart = function (item) {
        setCartItems(function (prev) { return (prev.find(function (entry) { return entry.id === item.id; }) ? prev : __spreadArray(__spreadArray([], prev, true), [item], false)); });
    };
    var applyVendorInspiration = function (item) {
        var nextData = __assign(__assign(__assign({}, initialDesignData), { jewelryType: item.category, country: item.market, budgetCurrency: item.currency, metal: item.metal, metalPurity: item.metalPurity, stone: item.stone, shape: item.shape, styleMood: item.styleMood, referenceInspiration: "".concat(item.vendorName, " inventory piece: ").concat(item.title), finalCustomNote: "".concat(item.description, " Use this vendor stock piece as the core inspiration and evolve it only when necessary.") }), item.specs);
        var nextQuestions = (0, designSchema_1.getQuestionsForDesign)(nextData);
        var nextIndex = nextQuestions.findIndex(function (itemQuestion) { return !nextData[itemQuestion.key]; });
        setVendorInspirationItem(item);
        setDesignData(nextData);
        setMessages([
            {
                id: 'vendor-seed-1',
                role: 'assistant',
                text: "Loaded inspiration from ".concat(item.vendorName, ": ").concat(item.title, ". I have prefilled the design flow with the product\u2019s category, metal, stone, and styling."),
            },
            {
                id: 'vendor-seed-2',
                role: 'assistant',
                text: nextIndex >= 0
                    ? (0, designSchema_1.getQuestionText)(nextQuestions[nextIndex], nextData)
                    : 'Everything is already filled. You can move straight to the summary.',
            },
        ]);
        setInspirationImages(item.imageUrl ? [item.imageUrl] : []);
        setUploadedInspirationUrls(item.imageUrl ? [item.imageUrl] : []);
        setInspirationAnalysis("".concat(item.title, ". ").concat(item.description));
        setGeneratedPrompt('');
        setFacePhotoUri(null);
    };
    var resetDesign = function () {
        setDesignData(initialDesignData);
        setMessages(initialMessages);
        setGeneratedPrompt('');
        setInspirationImages([]);
        setUploadedInspirationUrls([]);
        setInspirationAnalysis('');
        setFacePhotoUri(null);
        setVendorInspirationItem(null);
    };
    return (<DesignContext.Provider value={{
            designData: designData,
            setDesignData: setDesignData,
            messages: messages,
            setMessages: setMessages,
            generatedPrompt: generatedPrompt,
            setGeneratedPrompt: setGeneratedPrompt,
            inspirationImages: inspirationImages,
            setInspirationImages: setInspirationImages,
            uploadedInspirationUrls: uploadedInspirationUrls,
            setUploadedInspirationUrls: setUploadedInspirationUrls,
            inspirationAnalysis: inspirationAnalysis,
            setInspirationAnalysis: setInspirationAnalysis,
            facePhotoUri: facePhotoUri,
            setFacePhotoUri: setFacePhotoUri,
            cartItems: cartItems,
            setCartItems: setCartItems,
            vendorInspirationItem: vendorInspirationItem,
            setVendorInspirationItem: setVendorInspirationItem,
            applyVendorInspiration: applyVendorInspiration,
            addToCart: addToCart,
            resetDesign: resetDesign,
        }}>
      {children}
    </DesignContext.Provider>);
}
function useDesign() {
    var context = (0, react_1.useContext)(DesignContext);
    if (!context) {
        throw new Error('useDesign must be used within DesignProvider');
    }
    return context;
}
