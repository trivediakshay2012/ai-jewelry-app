"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignProvider = DesignProvider;
exports.useDesign = useDesign;
var react_1 = require("react");
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
        text: 'Hi! I’m your AI jewelry designer. What type of jewelry would you like to create today? For example: ring, necklace, pendant, bracelet, bangle, earrings.',
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
    var resetDesign = function () {
        setDesignData(initialDesignData);
        setMessages(initialMessages);
        setGeneratedPrompt('');
        setInspirationImages([]);
        setUploadedInspirationUrls([]);
        setInspirationAnalysis('');
        setFacePhotoUri(null);
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
