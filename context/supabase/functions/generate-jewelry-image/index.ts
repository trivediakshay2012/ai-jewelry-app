// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ImageEditSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
type ImageQuality = 'high' | 'medium' | 'low' | 'auto';
type InputFidelity = 'high' | 'low';

function safe(value?: string, fallback = 'not specified') {
  return value?.trim() ? value.trim() : fallback;
}

function normalizeText(value?: string) {
  return (value || '').trim().toLowerCase();
}

function normalizeJewelryCategory(value?: string) {
  const v = normalizeText(value);

  if (v.includes('ring') || v.includes('rings')) return 'ring';
  if (v.includes('bangle') || v.includes('bangles') || v.includes('kada')) return 'bangle';
  if (v.includes('bracelet') || v.includes('bracelets') || v.includes('cuff')) return 'bracelet';
  if (v.includes('pendant') || v.includes('pendants')) return 'pendant';
  if (v.includes('necklace') || v.includes('necklaces') || v.includes('chain') || v.includes('chains') || v.includes('mangalsutra')) return 'necklace';
  if (v.includes('earring') || v.includes('earrings') || v.includes('stud') || v.includes('hoop') || v.includes('drop')) return 'earrings';

  return 'other';
}

function toNumber(value?: string) {
  const n = parseFloat(value || '');
  return Number.isFinite(n) ? n : 0;
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function fileFromDataUrl(
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

function getMimeExtension(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'png';
}

async function sourceToFile(source: string, index: number): Promise<File> {
  if (!source) {
    throw new Error(`Missing image source at index ${index}`);
  }

  if (source.startsWith('data:')) {
    return fileFromDataUrl(source, `input-${index}.png`);
  }

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Could not fetch image source at index ${index}: ${response.status}`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || 'image/png';
  const extension = getMimeExtension(mimeType);

  return new File([blob], `input-${index}.${extension}`, {
    type: mimeType,
  });
}

async function callImageEdit({
  openaiApiKey,
  images,
  prompt,
  size = '1024x1024',
  quality = 'medium',
  inputFidelity = 'high',
}: {
  openaiApiKey: string;
  images: string[];
  prompt: string;
  size?: ImageEditSize;
  quality?: ImageQuality;
  inputFidelity?: InputFidelity;
}) {
  const form = new FormData();

  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('quality', quality);
  form.append('input_fidelity', inputFidelity);
  form.append('output_format', 'png');
  form.append('background', 'opaque');
  form.append('n', '1');

  for (let i = 0; i < images.length; i += 1) {
    const file = await sourceToFile(images[i], i);
    form.append('image[]', file);
  }

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: form,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(json));
  }

  return json;
}

async function callImageGeneration({
  openaiApiKey,
  prompt,
  size = '1024x1024',
  quality = 'medium',
}: {
  openaiApiKey: string;
  prompt: string;
  size?: ImageEditSize;
  quality?: ImageQuality;
}) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      quality,
      output_format: 'png',
      size,
      n: 1,
      background: 'opaque',
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(json));
  }

  return json;
}

function extractBase64Image(json: any) {
  return json?.data?.[0]?.b64_json || null;
}

function getOptionDirection(optionIndex: number) {
  const directions = [
    'Create the closest premium reinterpretation of the design source.',
    'Create a subtler reinterpretation with slightly softer visual weight.',
    'Create a richer and more luxurious reinterpretation with more detail.',
    'Create a cleaner but still strongly inspired reinterpretation with modern elegance.',
  ];

  const safeIndex = Math.min(Math.max(optionIndex || 0, 0), directions.length - 1);

  return {
    label: `Option ${safeIndex + 1}`,
    instruction: directions[safeIndex],
  };
}


function isInvalidImageError(error: unknown) {
  const message = String(error || '');
  return message.includes('invalid_image_file') || message.toLowerCase().includes('invalid image file or mode');
}

function estimateCenterStoneDiameterMm(carat: number, shape?: string): number {
  if (!carat || carat <= 0) return 0;

  const lowerShape = (shape || '').toLowerCase();
  const roundMm = 6.5 * Math.cbrt(carat);

  if (lowerShape.includes('oval')) return Number((roundMm * 1.12).toFixed(2));
  if (lowerShape.includes('emerald')) return Number((roundMm * 1.15).toFixed(2));
  if (lowerShape.includes('pear')) return Number((roundMm * 1.1).toFixed(2));
  if (lowerShape.includes('marquise')) return Number((roundMm * 1.18).toFixed(2));
  if (lowerShape.includes('princess')) return Number((roundMm * 0.96).toFixed(2));

  return Number(roundMm.toFixed(2));
}

function parseBudgetValue(value?: string) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function getBudgetThresholds(currency: string, category: string) {
  const usdMap: Record<string, [number, number, number]> = {
    ring: [1500, 3500, 7000],
    necklace: [2200, 5000, 9000],
    pendant: [1000, 2500, 5000],
    bracelet: [1800, 4200, 8000],
    bangle: [2500, 6000, 12000],
    earrings: [1200, 3000, 6000],
    other: [1500, 3500, 7000],
  };

  const inrMap: Record<string, [number, number, number]> = {
    ring: [100000, 250000, 500000],
    necklace: [150000, 400000, 900000],
    pendant: [60000, 150000, 300000],
    bracelet: [90000, 220000, 450000],
    bangle: [150000, 350000, 700000],
    earrings: [70000, 180000, 350000],
    other: [100000, 250000, 500000],
  };

  const aedMap: Record<string, [number, number, number]> = {
    ring: [5000, 12000, 25000],
    necklace: [8000, 18000, 35000],
    pendant: [3500, 9000, 18000],
    bracelet: [4500, 11000, 22000],
    bangle: [7000, 16000, 32000],
    earrings: [4000, 9500, 18000],
    other: [5000, 12000, 25000],
  };

  const normalizedCurrency = normalizeText(currency || 'usd').toUpperCase();
  const map = normalizedCurrency === 'INR' ? inrMap : normalizedCurrency === 'AED' ? aedMap : usdMap;
  return map[category] || map.other;
}

function buildBudgetAwarePlan(designData: any) {
  const category = normalizeJewelryCategory(designData?.jewelryType);
  const currency = (designData?.budgetCurrency || 'USD').toUpperCase();
  const budgetValue = parseBudgetValue(designData?.budget);
  const [entry, mid, premium] = getBudgetThresholds(currency, category);

  const tier = budgetValue > 0 && budgetValue <= entry ? 'tight' : budgetValue > 0 && budgetValue <= mid ? 'value' : budgetValue > 0 && budgetValue <= premium ? 'balanced' : 'premium';

  const changes: { title: string; detail: string }[] = [];
  const protectedDesign = category === 'ring'
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

    if (toNumber(designData?.sideStoneCount) > 0 || toNumber(designData?.sideStoneTotalCarat) > 0) {
      changes.push({
        title: 'Lower side-stone weight',
        detail: tier === 'tight'
          ? 'Keep the same side-stone layout but reduce the individual side-stone size / total carat.'
          : 'Slightly tighten side-stone sizing while keeping the same distribution pattern.'
      });
    }

    if (toNumber(designData?.bandWidthMm) > 0) {
      changes.push({
        title: 'Refine band thickness',
        detail: 'Keep the same band style but make the band slightly lighter in thickness and metal volume.'
      });
    }
  } else if (category === 'necklace' || category === 'pendant') {
    changes.push({
      title: 'Lighten back structure',
      detail: 'Keep the same front motif and drape, but reduce hidden metal thickness at the back and underside.'
    });
    changes.push({
      title: 'Optimize accent stones',
      detail: 'Preserve the same visual pattern while slightly reducing accent-stone size or density where possible.'
    });
  } else if (category === 'bracelet' || category === 'bangle') {
    changes.push({
      title: 'Reduce interior metal weight',
      detail: 'Keep the same top-view look while making the inner wall or underside lighter and less bulky.'
    });
    changes.push({
      title: 'Simplify hidden construction',
      detail: 'Keep the visible profile, but simplify internal structure, hinge mass, or clasp bulk where possible.'
    });
  } else if (category === 'earrings') {
    changes.push({
      title: 'Reduce hidden metal and support weight',
      detail: 'Keep the same visible earring shape while making the back structure lighter.'
    });
    changes.push({
      title: 'Tighten accent-stone sizing',
      detail: 'Preserve the same layout but slightly reduce accent-stone size if needed for budget control.'
    });
  } else {
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
  } else if (tier === 'value') {
    changes.push({
      title: 'Apply moderate cost optimization',
      detail: 'Use a balanced mix of lighter metal volume and slightly reduced accent detailing.'
    });
  } else if (tier === 'balanced') {
    changes.push({
      title: 'Apply light optimization only',
      detail: 'Keep the premium look and make only subtle efficiency adjustments.'
    });
  } else {
    changes.push({
      title: 'Protect premium appearance',
      detail: 'Only very light structural optimization is allowed because the budget can support the design well.'
    });
  }

  const changeSummary = changes.map((change) => `${change.title}: ${change.detail}`).join(' ');
  const targetBudget = budgetValue > 0 ? `${currency} ${budgetValue}` : `${currency} ${safe(designData?.budget, 'not specified')}`;

  const promptBlock = `Budget-aware conversion rules:
- The selected base image is locked as the design master.
- Preserve the same visible design identity, silhouette, stone layout, and top-view look.
- Do not redesign the piece into a different style.
- Reduce cost only through these controlled changes: ${changes.map((change) => change.title.toLowerCase()).join(', ')}.
- Keep the final image premium and realistic.
- The customer should feel it is the same design, just engineered to fit the target budget better.
- Target budget: ${targetBudget}.
- Protected design: ${protectedDesign}.
`;

  return {
    category,
    currency,
    budgetValue,
    tier,
    targetBudget,
    protectedDesign,
    changes,
    changeSummary,
    promptBlock,
  };
}

function buildBudgetAwarePrompt(designData: any, plan: any) {
  return `Create a budget-aware version of the provided jewelry image.

Rules:
- Keep the design visibly the same from the customer point of view.
- Preserve the same front-facing design language, silhouette, and stone arrangement.
- Do not change the product category.
- Do not create a new design.
- The result must still look luxurious and production-ready.
- Apply only these approved cost-saving modifications: ${plan.changes.map((change: any) => `${change.title} (${change.detail})`).join('; ')}

Design context:
- Jewelry type: ${safe(designData?.jewelryType)}
- Metal: ${safe(designData?.metal)}
- Metal purity: ${safe(designData?.metalPurity)}
- Stone: ${safe(designData?.stone)}
- Shape: ${safe(designData?.shape)}
- Setting style: ${safe(designData?.settingStyle)}
- Final note: ${safe(designData?.finalCustomNote, 'none')}

Target budget: ${plan.targetBudget}.
Protected design: ${plan.protectedDesign}.

Critical: the design itself must not visually change in the model preview or the budget-aware output. Keep the same jewelry identity and only make subtle engineering / material-efficiency adjustments.`;
}

function buildSizingRules(designData: any) {
  const centerStoneCarat = toNumber(designData?.centerStoneCarat);
  const sideStoneTotalCarat = toNumber(designData?.sideStoneTotalCarat);
  const sideStoneCount = toNumber(designData?.sideStoneCount);
  const prongCount = toNumber(designData?.prongCount);
  const bandWidthMm = toNumber(designData?.bandWidthMm);

  const eachSideStone =
    sideStoneTotalCarat > 0 && sideStoneCount > 0
      ? sideStoneTotalCarat / sideStoneCount
      : 0;

  const sideSplitText =
    sideStoneCount > 0 && sideStoneCount % 2 === 0
      ? `${sideStoneCount / 2} side stones on each side`
      : sideStoneCount > 0
      ? `${sideStoneCount} side stones total`
      : 'no side stones';

  return `
Sizing rules:
- Center stone target visual weight: ${centerStoneCarat || 0} carat
- Side stones total weight: ${sideStoneTotalCarat || 0} carat
- Side stone count: ${sideStoneCount || 0}
- Derived side stone weight per stone: ${eachSideStone ? eachSideStone.toFixed(3) : 0} carat
- Side stone distribution: ${sideSplitText}
- Prong count target: ${prongCount || 0}
- Band width target: ${bandWidthMm || 0} mm
`;
}

function buildBeautyPrompt(
  designData: any,
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
- Jewelry type: ${safe(designData?.jewelryType)}
- Occasion: ${safe(designData?.occasion)}
- Metal: ${safe(designData?.metal)}
- Metal purity: ${safe(designData?.metalPurity)}
- Stone: ${safe(designData?.stone)}
- Shape: ${safe(designData?.shape)}
- Ring size: ${safe(designData?.ringSize)}
- Center stone carat: ${safe(designData?.centerStoneCarat, '0')}
- Side stones total carat: ${safe(designData?.sideStoneTotalCarat, '0')}
- Side stone count: ${safe(designData?.sideStoneCount, '0')}
- Prong count: ${safe(designData?.prongCount, '0')}
- Band width: ${safe(designData?.bandWidthMm, '0')} mm
- Necklace length: ${safe(designData?.necklaceLength)}
- Chain style: ${safe(designData?.chainStyle)}
- Pendant style: ${safe(designData?.pendantStyle)}
- Bracelet style: ${safe(designData?.braceletStyle)}
- Bangle style: ${safe(designData?.bangleStyle)}
- Wrist size: ${safe(designData?.wristSize)}
- Earring style: ${safe(designData?.earringStyle)}
- Earring length: ${safe(designData?.earringLengthMm)}
- Setting style: ${safe(designData?.settingStyle)}
- Finish: ${safe(designData?.finishLevel, 'polished')}
- Mood: ${safe(designData?.styleMood, 'luxurious')}
- Background: ${safe(designData?.backgroundStyle, 'clean luxury studio')}
- Final note: ${safe(designData?.finalCustomNote, 'none')}

${inspirationAnalysis ? `Reference inspiration analysis: ${inspirationAnalysis}` : ''}

${optionStyles[optionIndex] || optionStyles[0]}

Critical instructions:
- Keep the jewelry itself as the hero.
- Preserve the requested structure, size, distribution, and proportions.
- Make the output look like high-end luxury jewelry campaign photography.
- No random extra stones.
- No random extra structures.
- Ultra realistic, premium lighting, macro detail, sharp reflections, photorealistic.`;
}

function buildLifestylePrompt(designData: any, inspirationAnalysis: string) {
  return `Transform the provided jewelry product image into a luxury model preview.

Rules:
- Keep the jewelry design exactly the same as the selected option image.
- Do not change the jewelry structure, engraving pattern, silhouette, stone count, proportions, or metal type.
- Do not redesign the jewelry or substitute a similar item.
- Show a realistic model naturally wearing THIS exact jewelry piece.
- Premium editorial jewelry photography.
- Jewelry must remain clearly visible.
- Elegant pose, realistic skin texture, luxury styling.

Wearer styling:
- Gender / style: ${safe(designData?.wearerGender, 'female')} with ${safe(
    designData?.wearerStyle,
    'refined luxury styling'
  )}
- Outfit: ${safe(designData?.outfitType, 'luxury editorial outfit')}
- Outfit color: ${safe(designData?.outfitColor, 'neutral luxury palette')}
- Occasion: ${safe(designData?.occasion, 'special occasion')}
- Mood: ${safe(designData?.styleMood, 'luxurious')}

${inspirationAnalysis ? `Reference inspiration analysis: ${inspirationAnalysis}` : ''}

Photorealistic only. No cartoon or illustration.`;
}

function buildPersonalPreviewPrompt(designData: any, inspirationAnalysis: string) {
  return `Create a personal jewelry preview using the provided jewelry image and uploaded customer face photo.

Goals:
- Keep the jewelry exactly the same as in the base image.
- The base image is the locked selected jewelry option and must remain visually identical.
- Use the uploaded face photo as the primary facial identity source.
- Make the final face resemble the uploaded person as naturally as possible.
- Do not distort the person’s features.
- Do not change the jewelry design.
- Do not swap the jewelry for a different design, even if it is similar.
- Maintain high-end editorial jewelry photography quality.
- The result should feel like a premium try-on preview.

Wearer styling:
- Gender / style: ${safe(designData?.wearerGender, 'female')} with ${safe(
    designData?.wearerStyle,
    'luxury styling'
  )}
- Outfit: ${safe(designData?.outfitType, 'luxury outfit')}
- Outfit color: ${safe(designData?.outfitColor, 'neutral refined palette')}
- Mood: ${safe(designData?.styleMood, 'luxurious')}

${inspirationAnalysis ? `Reference inspiration analysis: ${inspirationAnalysis}` : ''}

Important:
- Prioritize preserving the uploaded face identity strongly.
- Keep the jewelry clearly visible and unchanged from the selected option image.
- Keep the styling elegant and premium.
- Photorealistic only.`;
}

function buildRegenerationPrompt(designData: any, editInstruction: string) {
  return `Edit the provided jewelry image.

Keep the same jewelry category and same core design identity.
Do not turn it into a different product.

Requested change:
${safe(editInstruction, 'Refine the selected option while preserving the original design identity.')}

Original constraints:
- Metal: ${safe(designData?.metal)}
- Stone: ${safe(designData?.stone)}
- Shape: ${safe(designData?.shape)}
- Ring size: ${safe(designData?.ringSize)}
- Center stone carat: ${safe(designData?.centerStoneCarat, '0')}
- Side stone total: ${safe(designData?.sideStoneTotalCarat, '0')}
- Side stone count: ${safe(designData?.sideStoneCount, '0')}
- Prong count: ${safe(designData?.prongCount, '0')}
- Band width: ${safe(designData?.bandWidthMm, '0')} mm
- Necklace length: ${safe(designData?.necklaceLength)}
- Chain style: ${safe(designData?.chainStyle)}
- Bracelet style: ${safe(designData?.braceletStyle)}
- Bangle style: ${safe(designData?.bangleStyle)}
- Earring style: ${safe(designData?.earringStyle)}
- Finish: ${safe(designData?.finishLevel, 'polished')}

Rules:
- Preserve the same overall design family.
- Apply the change request strongly.
- Keep the result premium, realistic, and jewelry-catalog ready.`;
}

function buildTechnicalSheetData(designData: any) {
  const category = normalizeJewelryCategory(designData?.jewelryType);
  const jewelryType = safe(designData?.jewelryType, 'custom jewelry');
  const metal = safe(designData?.metal);
  const metalPurity = safe(designData?.metalPurity);
  const stone = safe(designData?.stone);
  const shape = safe(designData?.shape);
  const finish = safe(designData?.finishLevel, 'polished');

  if (category === 'ring') {
    const centerStoneCarat = toNumber(designData?.centerStoneCarat);
    const sideStoneTotalCarat = toNumber(designData?.sideStoneTotalCarat);
    const sideStoneCount = Math.round(toNumber(designData?.sideStoneCount));
    const prongCount = Math.round(toNumber(designData?.prongCount));
    const bandWidthMm = toNumber(designData?.bandWidthMm);
    const centerStoneDiameterMm = estimateCenterStoneDiameterMm(
      centerStoneCarat,
      designData?.shape
    );
    const sideStonesPerSide =
      sideStoneCount > 0 && sideStoneCount % 2 === 0 ? sideStoneCount / 2 : sideStoneCount;
    const sideStoneEachCarat =
      sideStoneCount > 0 ? Number((sideStoneTotalCarat / sideStoneCount).toFixed(3)) : 0;

    return {
      title: 'Technical Specification Sheet',
      subtitle: `CAD-style technical layout for ${jewelryType}`,
      category,
      normalizedType: category,
      notes: [
        centerStoneCarat > 0
          ? `Center stone target visual size ≈ ${centerStoneDiameterMm} mm.`
          : 'Center stone size not specified.',
        sideStoneCount > 0
          ? `Side stones distributed as ${sideStonesPerSide} per side when symmetry is possible.`
          : 'No side stones specified.',
        bandWidthMm > 0 ? `Band width target is ${bandWidthMm} mm.` : 'Band width not specified.',
        prongCount > 0
          ? `Prong configuration target is ${prongCount}-prong.`
          : 'Prong configuration not specified.',
      ],
      drawing: {
        measureA: `${centerStoneDiameterMm || 0} mm`,
        measureB: `${bandWidthMm || 0} mm`,
        measureC: `${prongCount || 0} prongs`,
        measureD: `${sideStoneCount || 0} side stones`,
      },
      specRows: [
        { label: 'Jewelry Type', value: jewelryType },
        { label: 'Metal', value: metal },
        { label: 'Metal Purity', value: metalPurity },
        { label: 'Stone', value: stone },
        { label: 'Shape', value: shape },
        { label: 'Ring Size', value: safe(designData?.ringSize) },
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
        { label: 'Prongs', value: prongCount > 0 ? `${prongCount}` : 'Not specified' },
        { label: 'Band Width', value: bandWidthMm > 0 ? `${bandWidthMm} mm` : 'Not specified' },
        { label: 'Setting', value: safe(designData?.settingStyle) },
        { label: 'Finish', value: finish },
      ],
    };
  }

  if (category === 'necklace' || category === 'pendant') {
    const necklaceLength = safe(designData?.necklaceLength);
    const chainStyle = safe(designData?.chainStyle);
    const pendantStyle = safe(designData?.pendantStyle);
    const claspStyle = safe(designData?.claspStyle);

    return {
      title: 'Technical Specification Sheet',
      subtitle: `CAD-style technical layout for ${jewelryType}`,
      category,
      normalizedType: category,
      notes: [
        necklaceLength !== 'not specified'
          ? `Neckwear length target is ${necklaceLength}.`
          : 'Neckwear length not specified.',
        chainStyle !== 'not specified'
          ? `Chain style target is ${chainStyle}.`
          : 'Chain style not specified.',
        pendantStyle !== 'not specified'
          ? `Pendant style target is ${pendantStyle}.`
          : 'Pendant style not specified.',
        claspStyle !== 'not specified'
          ? `Clasp style target is ${claspStyle}.`
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
    const wristSize = safe(designData?.wristSize);
    const braceletStyle = safe(designData?.braceletStyle);
    const bangleStyle = safe(designData?.bangleStyle);
    const innerDiameter = safe(designData?.bangleInnerDiameterMm);
    const opening = safe(designData?.isOpenableBangle);
    const claspStyle = safe(designData?.claspStyle);

    return {
      title: 'Technical Specification Sheet',
      subtitle: `CAD-style technical layout for ${jewelryType}`,
      category,
      normalizedType: category,
      notes: [
        wristSize !== 'not specified' ? `Wrist size target is ${wristSize}.` : 'Wrist size not specified.',
        innerDiameter !== 'not specified'
          ? `Inner diameter / bangle size target is ${innerDiameter}.`
          : 'Inner diameter / bangle size not specified.',
        opening !== 'not specified' ? `Opening style target is ${opening}.` : 'Opening style not specified.',
        claspStyle !== 'not specified' ? `Clasp style target is ${claspStyle}.` : 'Clasp style not specified.',
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
    const earringStyle = safe(designData?.earringStyle);
    const earringLengthMm = safe(designData?.earringLengthMm);
    const earringBackingType = safe(designData?.earringBackingType);

    return {
      title: 'Technical Specification Sheet',
      subtitle: `CAD-style technical layout for ${jewelryType}`,
      category,
      normalizedType: category,
      notes: [
        earringStyle !== 'not specified' ? `Earring style target is ${earringStyle}.` : 'Earring style not specified.',
        earringLengthMm !== 'not specified'
          ? `Earring size / length target is ${earringLengthMm}.`
          : 'Earring size / length not specified.',
        earringBackingType !== 'not specified'
          ? `Backing type target is ${earringBackingType}.`
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
    subtitle: `CAD-style technical layout for ${jewelryType}`,
    category: 'other',
    notes: ['This custom jewelry type uses a general technical specification summary.'],
    drawing: {
      measureA: safe(designData?.jewelryType),
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      prompt,
      designData,
      inspirationAnalysis,
      uploadedInspirationUrls,
      editInstruction,
      selectedBaseImage,
      facePhotoDataUrl,
      mode,
      optionIndex,
    } = await req.json();

    if (mode === 'technical-sheet') {
      const technicalSheet = buildTechnicalSheetData(designData || {});

      return new Response(
        JSON.stringify({ technicalSheet }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing OPENAI_API_KEY secret in Supabase' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const inspirationSources: string[] = [];
    if (uploadedInspirationUrls?.length) {
      for (const url of uploadedInspirationUrls) {
        if (url) inspirationSources.push(url);
      }
    }

    const optionDirection = getOptionDirection(optionIndex ?? 0);
    const sizingRules = buildSizingRules(designData);
    const hasInspiration = inspirationSources.length > 0;

    const baseContext = `
You are designing original luxury jewelry.

Core user prompt:
${prompt}

Design data:
- Jewelry Type: ${designData?.jewelryType || 'fine jewelry piece'}
- Occasion: ${designData?.occasion || 'special occasion'}
- Country / Region: ${designData?.country || 'global luxury taste'}
- Wearer Gender: ${designData?.wearerGender || 'wearer'}
- Wearer Style: ${designData?.wearerStyle || 'refined'}
- Metal: ${designData?.metal || 'premium metal'}
- Metal Purity: ${designData?.metalPurity || 'premium purity'}
- Stone: ${designData?.stone || 'gemstone'}
- Shape: ${designData?.shape || 'elegant cut'}
- Ring Size: ${designData?.ringSize || 'not specified'}
- Setting Style: ${designData?.settingStyle || 'high-end setting'}
- Band Style: ${designData?.bandStyle || 'luxury band'}
- Necklace Length: ${designData?.necklaceLength || 'not specified'}
- Chain Style: ${designData?.chainStyle || 'not specified'}
- Pendant Style: ${designData?.pendantStyle || 'not specified'}
- Bracelet Style: ${designData?.braceletStyle || 'not specified'}
- Wrist Size: ${designData?.wristSize || 'not specified'}
- Bangle Style: ${designData?.bangleStyle || 'not specified'}
- Bangle Inner Diameter: ${designData?.bangleInnerDiameterMm || 'not specified'}
- Bangle Opening: ${designData?.isOpenableBangle || 'not specified'}
- Clasp Style: ${designData?.claspStyle || 'not specified'}
- Earring Style: ${designData?.earringStyle || 'not specified'}
- Earring Length: ${designData?.earringLengthMm || 'not specified'}
- Earring Backing: ${designData?.earringBackingType || 'not specified'}
- Finish Level: ${designData?.finishLevel || 'polished'}
- Style Mood: ${designData?.styleMood || 'luxurious'}
- Reference Inspiration: ${designData?.referenceInspiration || 'high jewelry editorial'}
- Luxury Tone: ${designData?.luxuryTone || 'high luxury'}
- Background Style: ${designData?.backgroundStyle || 'clean white studio'}
- Outfit Type: ${designData?.outfitType || 'luxury styling'}
- Outfit Color: ${designData?.outfitColor || 'refined palette'}
- Final Custom Note: ${designData?.finalCustomNote || 'none'}
- Budget Currency: ${designData?.budgetCurrency || 'USD'}
- Budget: ${designData?.budget || 'not specified'}

${sizingRules}

Inspiration analysis:
${inspirationAnalysis || 'No inspiration analysis was provided.'}

Requested edit from user:
${editInstruction || 'No additional change request.'}

Selected option direction:
${optionDirection.label}: ${optionDirection.instruction}

Critical source behavior:
${
  hasInspiration
    ? '- Use the uploaded inspiration images heavily.\n- Preserve pattern language, ornament density, silhouette logic, motif repetition, and cultural styling from the source images.\n- The result must feel strongly inspired by the uploaded references while remaining original.'
    : '- No inspiration images were uploaded.\n- Use the answered fields and the final custom note as the primary design source.\n- Follow the final custom note heavily and do not drift into generic jewelry.\n- The result should feel custom-designed from the written specification.'
}
`;

    if (mode === 'budget-aware') {
      if (!selectedBaseImage) {
        return new Response(
          JSON.stringify({ error: 'Missing selectedBaseImage for budget-aware mode' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const plan = buildBudgetAwarePlan(designData || {});
      const budgetAwarePrompt = buildBudgetAwarePrompt(designData || {}, plan);

      const budgetAwareResult = await callImageEdit({
        openaiApiKey,
        images: [selectedBaseImage],
        prompt: `${baseContext}

${plan.promptBlock}

${budgetAwarePrompt}`,
        size: '1024x1024',
        quality: 'high',
        inputFidelity: 'high',
      });

      const budgetAwareB64 = extractBase64Image(budgetAwareResult);

      if (!budgetAwareB64) {
        return new Response(
          JSON.stringify({ error: 'No budget-aware image returned' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          budgetAwareImage: `data:image/png;base64,${budgetAwareB64}`,
          budgetAwareReport: {
            title: 'Budget-fit modification summary',
            targetBudget: plan.targetBudget,
            protectedDesign: plan.protectedDesign,
            changeSummary: plan.changeSummary,
            changes: plan.changes,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (mode === 'lifestyle') {
      if (!selectedBaseImage) {
        return new Response(
          JSON.stringify({ error: 'Missing selectedBaseImage for lifestyle mode' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const lifestylePrompt = buildLifestylePrompt(designData || {}, inspirationAnalysis || '');

      const lifestyleResult = await callImageEdit({
        openaiApiKey,
        images: [selectedBaseImage],
        prompt: `${baseContext}\n\n${lifestylePrompt}`,
        size: '1024x1536',
        quality: 'high',
        inputFidelity: 'high',
      });

      const lifestyleB64 = extractBase64Image(lifestyleResult);

      if (!lifestyleB64) {
        return new Response(
          JSON.stringify({ error: 'No lifestyle image returned' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          lifestyleImage: `data:image/png;base64,${lifestyleB64}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (mode === 'personal-preview') {
      if (!selectedBaseImage) {
        return new Response(
          JSON.stringify({ error: 'Missing selectedBaseImage for personal-preview mode' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!facePhotoDataUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing facePhotoDataUrl for personal-preview mode' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const personalPrompt = buildPersonalPreviewPrompt(
        designData || {},
        inspirationAnalysis || ''
      );

      const personalPreviewResult = await callImageEdit({
        openaiApiKey,
        images: [selectedBaseImage, facePhotoDataUrl],
        prompt: `${baseContext}\n\n${personalPrompt}`,
        size: '1024x1536',
        quality: 'high',
        inputFidelity: 'high',
      });

      const personalPreviewB64 = extractBase64Image(personalPreviewResult);

      if (!personalPreviewB64) {
        return new Response(
          JSON.stringify({ error: 'No personal preview image returned' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          personalPreviewImage: `data:image/png;base64,${personalPreviewB64}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (mode === 'regenerate-selected') {
      if (!selectedBaseImage) {
        return new Response(
          JSON.stringify({ error: 'Missing selectedBaseImage for regenerate-selected mode' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const regeneratePrompt = buildRegenerationPrompt(
        designData || {},
        editInstruction || ''
      );

      const regeneratedResult = hasInspiration
        ? await callImageEdit({
            openaiApiKey,
            images: [selectedBaseImage, ...inspirationSources],
            prompt: `${baseContext}\n\n${regeneratePrompt}`,
            size: '1024x1024',
            quality: 'medium',
            inputFidelity: 'high',
          })
        : await callImageEdit({
            openaiApiKey,
            images: [selectedBaseImage],
            prompt: `${baseContext}\n\n${regeneratePrompt}`,
            size: '1024x1024',
            quality: 'medium',
            inputFidelity: 'high',
          });

      const regeneratedB64 = extractBase64Image(regeneratedResult);

      if (!regeneratedB64) {
        return new Response(
          JSON.stringify({ error: 'No regenerated image returned' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          regeneratedImage: `data:image/png;base64,${regeneratedB64}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (mode === 'product-single') {
      const productPrompt = buildBeautyPrompt(
        designData || {},
        baseContext,
        inspirationAnalysis || '',
        optionIndex ?? 0
      );

      const productResult = hasInspiration
        ? await callImageEdit({
            openaiApiKey,
            images: inspirationSources,
            prompt: productPrompt,
            size: '1024x1024',
            quality: 'medium',
            inputFidelity: 'high',
          })
        : await callImageGeneration({
            openaiApiKey,
            prompt: productPrompt,
            size: '1024x1024',
            quality: 'medium',
          });

      const productB64 = extractBase64Image(productResult);

      if (!productB64) {
        return new Response(
          JSON.stringify({ error: `No product image returned for ${optionDirection.label}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          productImage: {
            id: `product-${(optionIndex ?? 0) + 1}`,
            label: optionDirection.label,
            dataUrl: `data:image/png;base64,${productB64}`,
          },
          appliedPrompt: productPrompt,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported mode' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('generate-jewelry-image error:', error);

    return new Response(
      JSON.stringify({
        error: 'Unexpected generate-jewelry-image error',
        details: error?.message || String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});