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

Critical sizing behavior:
- The center stone should visually read as the requested carat weight.
- Side stones should be proportioned correctly relative to total side-stone weight and stone count.
- If the user asked for 8 side stones and 2 carat total side-stone weight, the rendering should visually imply about 0.25 carat per side stone and distribute them evenly.
- Prongs should match the requested prong count visually.
- Band width should visually match the requested width as closely as possible.
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
- Setting style: ${safe(designData?.settingStyle)}
- Band style: ${safe(designData?.bandStyle)}
- Finish: ${safe(designData?.finishLevel, 'polished')}
- Mood: ${safe(designData?.styleMood, 'luxurious')}
- Background: ${safe(designData?.backgroundStyle, 'clean luxury studio')}
- Final note: ${safe(designData?.finalCustomNote, 'none')}

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

function buildLifestylePrompt(designData: any, inspirationAnalysis: string) {
  return `Transform the provided jewelry product image into a luxury model preview.

Rules:
- Keep the jewelry design exactly the same.
- Do not change the jewelry structure, stone count, proportions, or metal type.
- Show a realistic model naturally wearing the jewelry.
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
- Use the uploaded face photo as the primary facial identity source.
- Make the final face resemble the uploaded person as naturally as possible.
- Do not distort the person’s features.
- Do not change the jewelry design.
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
- Keep the jewelry clearly visible.
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
- Setting style: ${safe(designData?.settingStyle)}
- Finish: ${safe(designData?.finishLevel, 'polished')}

Rules:
- Preserve the same overall design family.
- Apply the change request strongly.
- Keep the result premium, realistic, and jewelry-catalog ready.`;
}

function buildTechnicalSheetData(designData: any) {
  const jewelryType = safe(designData?.jewelryType, 'ring');
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
    { label: 'Metal', value: safe(designData?.metal) },
    { label: 'Metal Purity', value: safe(designData?.metalPurity) },
    { label: 'Stone', value: safe(designData?.stone) },
    { label: 'Shape', value: safe(designData?.shape) },
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
    {
      label: 'Prongs',
      value: prongCount > 0 ? `${prongCount}` : 'Not specified',
    },
    {
      label: 'Band Width',
      value: bandWidthMm > 0 ? `${bandWidthMm} mm` : 'Not specified',
    },
    { label: 'Setting', value: safe(designData?.settingStyle) },
    { label: 'Finish', value: safe(designData?.finishLevel, 'polished') },
  ];

  return {
    title: 'Technical Specification Sheet',
    jewelryType,
    metal: safe(designData?.metal),
    metalPurity: safe(designData?.metalPurity),
    stone: safe(designData?.stone),
    shape: safe(designData?.shape),
    ringSize: safe(designData?.ringSize),
    centerStoneCarat,
    centerStoneDiameterMm,
    sideStoneTotalCarat,
    sideStoneCount,
    sideStonesPerSide,
    sideStoneEachCarat,
    prongCount,
    bandWidthMm,
    settingStyle: safe(designData?.settingStyle),
    finishLevel: safe(designData?.finishLevel, 'polished'),
    notes,
    specRows,
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
        JSON.stringify({
          technicalSheet,
        }),
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
- Clasp Style: ${designData?.claspStyle || 'not specified'}
- Finish Level: ${designData?.finishLevel || 'polished'}
- Style Mood: ${designData?.styleMood || 'luxurious'}
- Reference Inspiration: ${designData?.referenceInspiration || 'high jewelry editorial'}
- Luxury Tone: ${designData?.luxuryTone || 'high luxury'}
- Background Style: ${designData?.backgroundStyle || 'clean white studio'}
- Outfit Type: ${designData?.outfitType || 'luxury styling'}
- Outfit Color: ${designData?.outfitColor || 'refined palette'}
- Final Custom Note: ${designData?.finalCustomNote || 'none'}

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

      const lifestylePrompt = buildLifestylePrompt(
        designData || {},
        inspirationAnalysis || ''
      );

      const lifestyleResult = await callImageEdit({
        openaiApiKey,
        images: [selectedBaseImage],
        prompt: `${baseContext}\n\n${lifestylePrompt}`,
        size: '1024x1536',
        quality: 'medium',
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