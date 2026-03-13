// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { images, designData } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No inspiration images provided' }),
        {
          status: 400,
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const bucketName = 'inspiration-images';

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!exists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: '10MB',
      });
    }

    const uploadedUrls: string[] = [];

    for (const image of images) {
      const extension = image.extension || 'jpg';
      const mimeType = image.mimeType || 'image/jpeg';
      const path = `public/${crypto.randomUUID()}.${extension}`;

      const binary = Uint8Array.from(atob(image.base64), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(path, binary, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        return new Response(
          JSON.stringify({
            error: 'Failed to upload inspiration image to storage',
            details: uploadError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: publicData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(path);

      uploadedUrls.push(publicData.publicUrl);
    }

    const inputContent = [
      {
        type: 'input_text',
        text: `You are analyzing jewelry inspiration images for an AI jewelry design app.

User context:
- Jewelry type: ${designData?.jewelryType || 'unknown'}
- Occasion: ${designData?.occasion || 'unknown'}
- Country / region: ${designData?.country || 'unknown'}
- Wearer gender: ${designData?.wearerGender || 'unknown'}
- Wearer style: ${designData?.wearerStyle || 'unknown'}
- Metal: ${designData?.metal || 'unknown'}
- Metal purity: ${designData?.metalPurity || 'unknown'}
- Stone: ${designData?.stone || 'unknown'}
- Shape: ${designData?.shape || 'unknown'}
- Final custom note: ${designData?.finalCustomNote || 'none'}

Analyze the uploaded inspiration images and return strict JSON with these exact keys:
{
  "style_family": string,
  "motif_language": string,
  "silhouette": string,
  "detail_density": string,
  "layering_behavior": string,
  "cultural_cues": string,
  "materials_impression": string,
  "what_must_be_preserved": string,
  "what_can_be_softened": string,
  "how_to_keep_it_unique": string,
  "product_option_directions": [string, string, string, string],
  "design_summary": string
}

Your job is to help image generation strongly follow the uploaded references.
Focus on:
- pattern repetition
- bridal / ceremonial styling cues
- layering
- ornament density
- drape and silhouette
- motif structure
- how to preserve the visual DNA while making the result original

Return JSON only.`
      },
      ...uploadedUrls.map((url) => ({
        type: 'input_image',
        image_url: url,
      })),
    ];

    const analysisResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'user',
            content: inputContent,
          },
        ],
      }),
    });

    const analysisJson = await analysisResponse.json();

    if (!analysisResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI inspiration analysis failed',
          details: analysisJson,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const outputText = analysisJson.output_text || '';
    const parsed = safeJsonParse(outputText);

    const analysisSummary = parsed
      ? `Style family: ${parsed.style_family}. Motif language: ${parsed.motif_language}. Silhouette: ${parsed.silhouette}. Detail density: ${parsed.detail_density}. Layering behavior: ${parsed.layering_behavior}. Cultural cues: ${parsed.cultural_cues}. Materials impression: ${parsed.materials_impression}. Must preserve: ${parsed.what_must_be_preserved}. Can be softened: ${parsed.what_can_be_softened}. Keep it unique by: ${parsed.how_to_keep_it_unique}. Design summary: ${parsed.design_summary}.`
      : outputText;

    return new Response(
      JSON.stringify({
        storageUrls: uploadedUrls,
        analysisSummary,
        rawAnalysis: parsed || outputText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Unexpected analyze-inspiration error',
        details: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});