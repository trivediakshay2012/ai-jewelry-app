import React, { createContext, useContext, useState } from 'react';

export type DesignData = {
  jewelryType: string;
  occasion: string;
  country: string;
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
  finishLevel: string;
  styleMood: string;
  referenceInspiration: string;
  luxuryTone: string;
  backgroundStyle: string;
  outfitType: string;
  outfitColor: string;
  wantsModelPreview: string;
  finalCustomNote: string;
  budget: string;
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
  resetDesign: () => void;
};

const initialDesignData: DesignData = {
  jewelryType: '',
  occasion: '',
  country: '',
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
  finishLevel: '',
  styleMood: '',
  referenceInspiration: '',
  luxuryTone: '',
  backgroundStyle: '',
  outfitType: '',
  outfitColor: '',
  wantsModelPreview: '',
  finalCustomNote: '',
  budget: '',
};

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    text: 'Hi! I’m your AI jewelry designer. What type of jewelry would you like to create today? For example: ring, necklace, bracelet, pendant, earrings.',
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

  const resetDesign = () => {
    setDesignData(initialDesignData);
    setMessages(initialMessages);
    setGeneratedPrompt('');
    setInspirationImages([]);
    setUploadedInspirationUrls([]);
    setInspirationAnalysis('');
    setFacePhotoUri(null);
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