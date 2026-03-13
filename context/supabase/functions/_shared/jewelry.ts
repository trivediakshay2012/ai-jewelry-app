// @ts-nocheck
export type DesignData = {
    jewelryType?: string;
    occasion?: string;
    country?: string;
    wearerGender?: string;
    wearerStyle?: string;
    metal?: string;
    metalPurity?: string;
    stone?: string;
    shape?: string;
    ringSize?: string;
    centerStoneCarat?: string;
    sideStoneTotalCarat?: string;
    sideStoneCount?: string;
    prongCount?: string;
    bandWidthMm?: string;
    settingStyle?: string;
    bandStyle?: string;
    necklaceLength?: string;
    chainStyle?: string;
    pendantStyle?: string;
    braceletStyle?: string;
    claspStyle?: string;
    finishLevel?: string;
    styleMood?: string;
    referenceInspiration?: string;
    luxuryTone?: string;
    backgroundStyle?: string;
    outfitType?: string;
    outfitColor?: string;
    wantsModelPreview?: string;
    finalCustomNote?: string;
    budget?: string;
  };
  
  export type TechnicalSheetData = {
    title: string;
    jewelryType: string;
    metal: string;
    metalPurity: string;
    stone: string;
    shape: string;
    ringSize: string;
    centerStoneCarat: number;
    centerStoneDiameterMm: number;
    sideStoneTotalCarat: number;
    sideStoneCount: number;
    sideStonesPerSide: number;
    sideStoneEachCarat: number;
    prongCount: number;
    bandWidthMm: number;
    settingStyle: string;
    finishLevel: string;
    notes: string[];
    specRows: { label: string; value: string }[];
  };
  
  export function toNumber(value?: string) {
    const n = parseFloat(value || '');
    return Number.isFinite(n) ? n : 0;
  }
  
  export function safe(value?: string, fallback = 'not specified') {
    return value?.trim() ? value.trim() : fallback;
  }
  
  export function decodeBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
  
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
  
    return bytes;
  }
  
  export function fileFromDataUrl(
    dataUrl: string,
    fileName: string,
    fallbackMime = 'image/png'
  ) {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    const mimeType = match?.[1] || fallbackMime;
    const base64 = match?.[2] || dataUrl;
    const bytes = decodeBase64(base64);
    return new File([bytes], fileName, { type: mimeType });
  }
  
  export function getMimeExtension(mimeType: string) {
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    return 'png';
  }
  
  export function estimateCenterStoneDiameterMm(
    carat: number,
    shape?: string
  ): number {
    if (!carat || carat <= 0) return 0;
  
    const lowerShape = (shape || '').toLowerCase();
  
    // Round-diamond style approximation:
    // anchored roughly around 1 ct ≈ 6.5 mm
    const roundMm = 6.5 * Math.cbrt(carat);
  
    if (lowerShape.includes('oval')) return Number((roundMm * 1.12).toFixed(2));
    if (lowerShape.includes('emerald')) return Number((roundMm * 1.15).toFixed(2));
    if (lowerShape.includes('pear')) return Number((roundMm * 1.10).toFixed(2));
    if (lowerShape.includes('marquise')) return Number((roundMm * 1.18).toFixed(2));
    if (lowerShape.includes('princess')) return Number((roundMm * 0.96).toFixed(2));
  
    return Number(roundMm.toFixed(2));
  }
  
  export function buildBeautyPrompt(
    designData: DesignData,
    basePrompt: string,
    inspirationAnalysis: string,
    optionIndex: number
  ) {
    const optionStyles = [
      'Option 1: closest premium interpretation with strong fidelity to the requested design.',
      'Option 2: slightly softer and more elegant interpretation with refined proportions.',
      'Option 3: richer luxury interpretation with stronger brilliance and premium detailing.',
      'Option 4: editorial hero-shot interpretation with elevated craftsmanship presence.',
    ];
  
    return `${basePrompt}
  
  Use these design details exactly:
  - Jewelry type: ${safe(designData.jewelryType)}
  - Occasion: ${safe(designData.occasion)}
  - Metal: ${safe(designData.metal)}
  - Metal purity: ${safe(designData.metalPurity)}
  - Stone: ${safe(designData.stone)}
  - Shape: ${safe(designData.shape)}
  - Ring size: ${safe(designData.ringSize)}
  - Center stone carat: ${safe(designData.centerStoneCarat, '0')}
  - Side stones total carat: ${safe(designData.sideStoneTotalCarat, '0')}
  - Side stone count: ${safe(designData.sideStoneCount, '0')}
  - Prong count: ${safe(designData.prongCount, '0')}
  - Band width: ${safe(designData.bandWidthMm, '0')} mm
  - Setting style: ${safe(designData.settingStyle)}
  - Band style: ${safe(designData.bandStyle)}
  - Finish: ${safe(designData.finishLevel, 'polished')}
  - Mood: ${safe(designData.styleMood, 'luxurious')}
  - Background: ${safe(designData.backgroundStyle, 'clean luxury studio')}
  - Final note: ${safe(designData.finalCustomNote, 'none')}
  
  ${inspirationAnalysis ? `Reference inspiration analysis: ${inspirationAnalysis}` : ''}
  
  ${optionStyles[optionIndex] || optionStyles[0]}
  
  Critical instructions:
  - Keep the jewelry itself as the hero.
  - Preserve the requested center-stone proportions, side-stone distribution, prong count, and band width.
  - Make the output look like high-end luxury jewelry campaign photography.
  - No random extra stones.
  - No random extra structures.
  - Ultra realistic, premium lighting, macro detail, sharp reflections, photorealistic.`;
  }
  
  export function buildLifestylePrompt(
    designData: DesignData,
    inspirationAnalysis: string
  ) {
    return `Transform the provided jewelry product image into a luxury model preview.
  
  Rules:
  - Keep the jewelry design exactly the same.
  - Do not change the jewelry structure, stone count, proportions, or metal type.
  - Show a realistic model naturally wearing the jewelry.
  - Premium editorial jewelry photography.
  - Jewelry must remain clearly visible.
  - Elegant pose, realistic skin texture, luxury styling.
  
  Wearer styling:
  - Gender / style: ${safe(designData.wearerGender, 'female')} with ${safe(
      designData.wearerStyle,
      'refined luxury styling'
    )}
  - Outfit: ${safe(designData.outfitType, 'luxury editorial outfit')}
  - Outfit color: ${safe(designData.outfitColor, 'neutral luxury palette')}
  - Occasion: ${safe(designData.occasion, 'special occasion')}
  - Mood: ${safe(designData.styleMood, 'luxurious')}
  
  ${inspirationAnalysis ? `Reference inspiration analysis: ${inspirationAnalysis}` : ''}
  
  Photorealistic only. No cartoon or illustration.`;
  }
  
  export function buildPersonalPreviewPrompt(
    designData: DesignData,
    inspirationAnalysis: string
  ) {
    return `Create a personal jewelry preview using the provided jewelry image and uploaded customer face photo.
  
  Goals:
  - Keep the jewelry exactly the same as in the base image.
  - Use the uploaded face photo as the primary facial identity source.
  - Make the final face resemble the uploaded person as naturally as possible.
  - Do not distort the person’s features.
  - Do not change the jewelry design.
  - Maintain high-end editorial jewelry photography quality.
  - The result should feel like a premium try-on preview.
  
  Wearer styling:
  - Gender / style: ${safe(designData.wearerGender, 'female')} with ${safe(
      designData.wearerStyle,
      'luxury styling'
    )}
  - Outfit: ${safe(designData.outfitType, 'luxury outfit')}
  - Outfit color: ${safe(designData.outfitColor, 'neutral refined palette')}
  - Mood: ${safe(designData.styleMood, 'luxurious')}
  
  ${inspirationAnalysis ? `Reference inspiration analysis: ${inspirationAnalysis}` : ''}
  
  Important:
  - Prioritize preserving the uploaded face identity strongly.
  - Keep the jewelry clearly visible.
  - Keep the styling elegant and premium.
  - Photorealistic only.`;
  }
  
  export function buildRegenerationPrompt(
    designData: DesignData,
    editInstruction: string
  ) {
    return `Edit the provided jewelry image.
  
  Keep the same jewelry category and same core design identity.
  Do not turn it into a different product.
  
  Requested change:
  ${safe(editInstruction, 'Refine the selected option while preserving the original design identity.')}
  
  Original constraints:
  - Metal: ${safe(designData.metal)}
  - Stone: ${safe(designData.stone)}
  - Shape: ${safe(designData.shape)}
  - Ring size: ${safe(designData.ringSize)}
  - Center stone carat: ${safe(designData.centerStoneCarat, '0')}
  - Side stone total: ${safe(designData.sideStoneTotalCarat, '0')}
  - Side stone count: ${safe(designData.sideStoneCount, '0')}
  - Prong count: ${safe(designData.prongCount, '0')}
  - Band width: ${safe(designData.bandWidthMm, '0')} mm
  - Setting style: ${safe(designData.settingStyle)}
  - Finish: ${safe(designData.finishLevel, 'polished')}
  
  Rules:
  - Preserve the same overall design family.
  - Apply the change request strongly.
  - Keep the result premium, realistic, and jewelry-catalog ready.`;
  }
  
  export function buildTechnicalSheetData(
    designData: DesignData
  ): TechnicalSheetData {
    const jewelryType = safe(designData.jewelryType, 'ring');
    const centerStoneCarat = toNumber(designData.centerStoneCarat);
    const sideStoneTotalCarat = toNumber(designData.sideStoneTotalCarat);
    const sideStoneCount = Math.round(toNumber(designData.sideStoneCount));
    const prongCount = Math.round(toNumber(designData.prongCount));
    const bandWidthMm = toNumber(designData.bandWidthMm);
    const centerStoneDiameterMm = estimateCenterStoneDiameterMm(
      centerStoneCarat,
      designData.shape
    );
  
    const sideStonesPerSide =
      sideStoneCount > 0 && sideStoneCount % 2 === 0
        ? sideStoneCount / 2
        : sideStoneCount;
  
    const sideStoneEachCarat =
      sideStoneCount > 0 ? Number((sideStoneTotalCarat / sideStoneCount).toFixed(3)) : 0;
  
    const notes = [
      centerStoneCarat > 0
        ? `Center stone target visual size ≈ ${centerStoneDiameterMm} mm.`
        : 'Center stone size not specified.',
      sideStoneCount > 0
        ? `Side stones distributed as ${sideStonesPerSide} per side when symmetry is possible.`
        : 'No side stones specified.',
      bandWidthMm > 0
        ? `Band width target is ${bandWidthMm} mm.`
        : 'Band width not specified.',
      prongCount > 0
        ? `Prong configuration target is ${prongCount}-prong.`
        : 'Prong configuration not specified.',
    ];
  
    const specRows = [
      { label: 'Jewelry Type', value: jewelryType },
      { label: 'Metal', value: safe(designData.metal) },
      { label: 'Metal Purity', value: safe(designData.metalPurity) },
      { label: 'Stone', value: safe(designData.stone) },
      { label: 'Shape', value: safe(designData.shape) },
      { label: 'Ring Size', value: safe(designData.ringSize) },
      {
        label: 'Center Stone',
        value:
          centerStoneCarat > 0
            ? `${centerStoneCarat} ct / approx. ${centerStoneDiameterMm} mm`
            : 'Not specified',
      },
      {
        label: 'Side Stones',
        value:
          sideStoneCount > 0
            ? `${sideStoneCount} total / ${sideStoneTotalCarat} ct total / ${sideStoneEachCarat} ct each`
            : 'Not specified',
      },
      {
        label: 'Prongs',
        value: prongCount > 0 ? `${prongCount}` : 'Not specified',
      },
      {
        label: 'Band Width',
        value: bandWidthMm > 0 ? `${bandWidthMm} mm` : 'Not specified',
      },
      { label: 'Setting', value: safe(designData.settingStyle) },
      { label: 'Finish', value: safe(designData.finishLevel, 'polished') },
    ];
  
    return {
      title: 'Technical Specification Sheet',
      jewelryType,
      metal: safe(designData.metal),
      metalPurity: safe(designData.metalPurity),
      stone: safe(designData.stone),
      shape: safe(designData.shape),
      ringSize: safe(designData.ringSize),
      centerStoneCarat,
      centerStoneDiameterMm,
      sideStoneTotalCarat,
      sideStoneCount,
      sideStonesPerSide,
      sideStoneEachCarat,
      prongCount,
      bandWidthMm,
      settingStyle: safe(designData.settingStyle),
      finishLevel: safe(designData.finishLevel, 'polished'),
      notes,
      specRows,
    };
  }