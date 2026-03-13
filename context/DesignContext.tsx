import React, { createContext, useContext, useState } from 'react';
import { getQuestionText, getQuestionsForDesign } from '../lib/designSchema';
import { getCurrencyForCountry } from '../lib/jewelryFlow';
import { VendorStockItem } from '../lib/vendorInventory';

export type DesignData = {
  jewelryType: string;
  occasion: string;
  country: string;
  stateOrProvince: string;
  wearerGender: string;
  wearerStyle: string;
  metal: string;
  metalPurity: string;
  stone: string;
  shape: string;

  ringSize: string;
  centerStoneCarat: string;
  sideStoneTotalCarat: string;
  sideStoneCount: string;
  prongCount: string;
  bandWidthMm: string;

  settingStyle: string;
  bandStyle: string;

  necklaceLength: string;
  chainStyle: string;
  pendantStyle: string;

  braceletStyle: string;
  claspStyle: string;
  wristSize: string;
  bangleStyle: string;
  bangleInnerDiameterMm: string;
  isOpenableBangle: string;

  earringStyle: string;
  earringLengthMm: string;
  earringBackingType: string;

  finishLevel: string;
  styleMood: string;
  referenceInspiration: string;
  luxuryTone: string;
  backgroundStyle: string;
  outfitType: string;
  outfitColor: string;
  wantsModelPreview: string;

  budget: string;
  budgetCurrency: string;

  finalCustomNote: string;
};

export type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

type DesignContextType = {
  designData: DesignData;
  setDesignData: React.Dispatch<React.SetStateAction<DesignData>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  generatedPrompt: string;
  setGeneratedPrompt: React.Dispatch<React.SetStateAction<string>>;
  inspirationImages: string[];
  setInspirationImages: React.Dispatch<React.SetStateAction<string[]>>;
  uploadedInspirationUrls: string[];
  setUploadedInspirationUrls: React.Dispatch<React.SetStateAction<string[]>>;
  inspirationAnalysis: string;
  setInspirationAnalysis: React.Dispatch<React.SetStateAction<string>>;
  facePhotoUri: string | null;
  setFacePhotoUri: React.Dispatch<React.SetStateAction<string | null>>;
  cartItems: VendorStockItem[];
  setCartItems: React.Dispatch<React.SetStateAction<VendorStockItem[]>>;
  vendorInspirationItem: VendorStockItem | null;
  setVendorInspirationItem: React.Dispatch<React.SetStateAction<VendorStockItem | null>>;
  applyVendorInspiration: (item: VendorStockItem) => void;
  addToCart: (item: VendorStockItem) => void;
  resetDesign: () => void;
};

const initialDesignData: DesignData = {
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

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    text: 'Hi! I’m your AI jewelry designer. Tell me the jewelry type and I will switch to that product’s dedicated questionnaire.',
  },
];

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [designData, setDesignData] = useState<DesignData>(initialDesignData);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [uploadedInspirationUrls, setUploadedInspirationUrls] = useState<string[]>([]);
  const [inspirationAnalysis, setInspirationAnalysis] = useState('');
  const [facePhotoUri, setFacePhotoUri] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<VendorStockItem[]>([]);
  const [vendorInspirationItem, setVendorInspirationItem] = useState<VendorStockItem | null>(null);

  const addToCart = (item: VendorStockItem) => {
    setCartItems((prev) => (prev.find((entry) => entry.id === item.id) ? prev : [...prev, item]));
  };

  const applyVendorInspiration = (item: VendorStockItem) => {
    const nextData: DesignData = {
      ...initialDesignData,
      jewelryType: item.category,
      country: item.market,
      budgetCurrency: item.currency,
      metal: item.metal,
      metalPurity: item.metalPurity,
      stone: item.stone,
      shape: item.shape,
      styleMood: item.styleMood,
      referenceInspiration: `${item.vendorName} inventory piece: ${item.title}`,
      finalCustomNote: `${item.description} Use this vendor stock piece as the core inspiration and evolve it only when necessary.`,
      backgroundStyle: '',
      outfitType: '',
      outfitColor: '',
      wantsModelPreview: '',
      ...(item.specs as Partial<DesignData>),
    };

    const nextQuestions = getQuestionsForDesign(nextData);
    const nextIndex = nextQuestions.findIndex((itemQuestion) => !nextData[itemQuestion.key]);
    setVendorInspirationItem(item);
    setDesignData(nextData);
    setMessages([
      {
        id: 'vendor-seed-1',
        role: 'assistant',
        text: `Loaded inspiration from ${item.vendorName}: ${item.title}. I have prefilled the design flow with the product’s category, metal, stone, and styling.`,
      },
      {
        id: 'vendor-seed-2',
        role: 'assistant',
        text:
          nextIndex >= 0
            ? getQuestionText(nextQuestions[nextIndex], nextData)
            : 'Everything is already filled. You can move straight to the summary.',
      },
    ]);
    setInspirationImages(item.imageUrl ? [item.imageUrl] : []);
    setUploadedInspirationUrls(item.imageUrl ? [item.imageUrl] : []);
    setInspirationAnalysis(`${item.title}. ${item.description}`);
    setGeneratedPrompt('');
    setFacePhotoUri(null);
  };

  const resetDesign = () => {
    setDesignData(initialDesignData);
    setMessages(initialMessages);
    setGeneratedPrompt('');
    setInspirationImages([]);
    setUploadedInspirationUrls([]);
    setInspirationAnalysis('');
    setFacePhotoUri(null);
    setVendorInspirationItem(null);
  };

  return (
    <DesignContext.Provider
      value={{
        designData,
        setDesignData,
        messages,
        setMessages,
        generatedPrompt,
        setGeneratedPrompt,
        inspirationImages,
        setInspirationImages,
        uploadedInspirationUrls,
        setUploadedInspirationUrls,
        inspirationAnalysis,
        setInspirationAnalysis,
        facePhotoUri,
        setFacePhotoUri,
        cartItems,
        setCartItems,
        vendorInspirationItem,
        setVendorInspirationItem,
        applyVendorInspiration,
        addToCart,
        resetDesign,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);

  if (!context) {
    throw new Error('useDesign must be used within DesignProvider');
  }

  return context;
}
