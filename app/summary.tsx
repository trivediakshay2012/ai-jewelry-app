import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DesignData, useDesign } from '../context/DesignContext';
import { getVisibleFieldsForDesign } from '../lib/designSchema';
import {
  getCurrencyForCountry,
  normalizeCountry,
  normalizeJewelryType,
} from '../lib/jewelryFlow';

const baseEditableFields: { key: keyof DesignData; label: string; multiline?: boolean }[] = [
  { key: 'jewelryType', label: 'Jewelry Type' },
  { key: 'occasion', label: 'Occasion' },
  { key: 'country', label: 'Country / Region' },
  { key: 'stateOrProvince', label: 'State / Province (for tax if applicable)' },
  { key: 'wearerGender', label: 'Wearer Gender' },
  { key: 'wearerStyle', label: 'Wearer Style' },
  { key: 'metal', label: 'Metal' },
  { key: 'metalPurity', label: 'Metal Purity' },
  { key: 'stone', label: 'Stone' },
  { key: 'shape', label: 'Shape' },

  { key: 'ringSize', label: 'Ring Size' },
  { key: 'centerStoneCarat', label: 'Center Stone Carat' },
  { key: 'sideStoneTotalCarat', label: 'Side Stone Total Carat' },
  { key: 'sideStoneCount', label: 'Side Stone Count' },
  { key: 'prongCount', label: 'Prong Count' },
  { key: 'bandWidthMm', label: 'Band Width (mm)' },

  { key: 'settingStyle', label: 'Setting Style' },
  { key: 'bandStyle', label: 'Band Style' },

  { key: 'necklaceLength', label: 'Necklace Length' },
  { key: 'chainStyle', label: 'Chain Style' },
  { key: 'pendantStyle', label: 'Pendant Style' },

  { key: 'braceletStyle', label: 'Bracelet Style' },
  { key: 'claspStyle', label: 'Clasp Style' },
  { key: 'wristSize', label: 'Wrist Size' },
  { key: 'bangleStyle', label: 'Bangle Style' },
  { key: 'bangleInnerDiameterMm', label: 'Bangle Inner Diameter / Size' },
  { key: 'isOpenableBangle', label: 'Bangle Opening Style' },

  { key: 'earringStyle', label: 'Earring Style' },
  { key: 'earringLengthMm', label: 'Earring Length / Size' },
  { key: 'earringBackingType', label: 'Earring Backing Type' },

  { key: 'finishLevel', label: 'Finish Level' },
  { key: 'styleMood', label: 'Style Mood' },
  { key: 'referenceInspiration', label: 'Reference Inspiration' },
  { key: 'luxuryTone', label: 'Luxury Tone' },
  { key: 'backgroundStyle', label: 'Background Style' },
  { key: 'outfitType', label: 'Outfit Type' },
  { key: 'outfitColor', label: 'Outfit Color' },
  { key: 'wantsModelPreview', label: 'Model Preview Requested' },
  { key: 'budgetCurrency', label: 'Budget Currency' },
  { key: 'budget', label: 'Budget' },
  { key: 'finalCustomNote', label: 'Final Custom Note', multiline: true },
];

function toNumber(value: string) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function SummaryScreen() {
  const {
    designData,
    setDesignData,
    generatedPrompt,
    setGeneratedPrompt,
    refreshLockedDesign,
    resetDesign,
    inspirationImages,
    inspirationAnalysis,
  } = useDesign();

  const params = useLocalSearchParams<{ vendorId?: string | string[]; vendorName?: string | string[]; inviteCode?: string | string[] }>();
  const vendorId = Array.isArray(params.vendorId) ? params.vendorId[0] || '' : params.vendorId || '';
  const vendorName = Array.isArray(params.vendorName) ? params.vendorName[0] || '' : params.vendorName || '';
  const inviteCode = Array.isArray(params.inviteCode) ? params.inviteCode[0] || '' : params.inviteCode || '';

  const updateField = (key: keyof DesignData, value: string) => {
    setDesignData((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === 'country') {
        next.budgetCurrency = getCurrencyForCountry(value);
        if (normalizeCountry(value) !== 'usa') {
          next.stateOrProvince = '';
        }
      }

      return next;
    });
  };

  const normalizedType = useMemo(
    () => normalizeJewelryType(designData.jewelryType),
    [designData.jewelryType]
  );

  const normalizedCountry = useMemo(
    () => normalizeCountry(designData.country),
    [designData.country]
  );


  const editableFields = useMemo(() => {
    const fieldMap = new Map(baseEditableFields.map((field) => [field.key, field]));
    return getVisibleFieldsForDesign(designData)
      .map((field) => fieldMap.get(field.key) || field)
      .filter(Boolean) as { key: keyof DesignData; label: string; multiline?: boolean }[];
  }, [designData]);

  const derivedSizingText = useMemo(() => {
    const centerStoneCarat = toNumber(designData.centerStoneCarat);
    const sideStoneTotalCarat = toNumber(designData.sideStoneTotalCarat);
    const sideStoneCount = toNumber(designData.sideStoneCount);
    const prongCount = toNumber(designData.prongCount);
    const bandWidthMm = toNumber(designData.bandWidthMm);

    const eachSideStone =
      sideStoneTotalCarat > 0 && sideStoneCount > 0
        ? sideStoneTotalCarat / sideStoneCount
        : 0;

    if (normalizedType === 'ring') {
      return `Ring size: ${designData.ringSize || 'not specified'}. Center stone target: ${
        centerStoneCarat || 0
      } ct. Side stones total: ${sideStoneTotalCarat || 0} ct across ${
        sideStoneCount || 0
      } stones (${eachSideStone ? eachSideStone.toFixed(3) : 0} ct each when evenly split). Prongs: ${
        prongCount || 0
      }. Band width target: ${bandWidthMm || 0} mm.`;
    }

    if (normalizedType === 'bangle') {
      return `Bangle size details: wrist size ${designData.wristSize || 'not specified'}, inner diameter / size ${
        designData.bangleInnerDiameterMm || 'not specified'
      }, opening style ${designData.isOpenableBangle || 'not specified'}.`;
    }

    if (normalizedType === 'bracelet') {
      return `Bracelet sizing details: wrist size ${designData.wristSize || 'not specified'}, style ${
        designData.braceletStyle || 'not specified'
      }, clasp ${designData.claspStyle || 'not specified'}.`;
    }

    if (normalizedType === 'necklace' || normalizedType === 'pendant') {
      return `Neckwear sizing details: necklace length ${
        designData.necklaceLength || 'not specified'
      }, chain style ${designData.chainStyle || 'not specified'}, pendant style ${
        designData.pendantStyle || 'not specified'
      }.`;
    }

    if (normalizedType === 'earrings') {
      return `Earring details: style ${designData.earringStyle || 'not specified'}, size/length ${
        designData.earringLengthMm || 'not specified'
      }, backing ${designData.earringBackingType || 'not specified'}.`;
    }

    return 'General custom-jewelry flow selected. Add more details in the final custom note if needed.';
  }, [designData, normalizedType]);

  const marketText = useMemo(() => {
    if (normalizedCountry === 'india') {
      return 'India market context: INR budget, bridal/festive/traditional styling supported.';
    }

    if (normalizedCountry === 'dubai') {
      return 'Dubai market context: AED budget, high-luxury and gold-forward styling supported.';
    }

    if (normalizedCountry === 'usa') {
      return 'USA market context: USD budget, bridal/fashion/modern luxury styling supported.';
    }

    return 'Global market context with flexible styling and currency.';
  }, [normalizedCountry]);

  const designBrief = useMemo(() => {
    const inspirationText = inspirationAnalysis
      ? `Inspiration analysis: ${inspirationAnalysis}.`
      : inspirationImages.length > 0
      ? 'Use uploaded inspiration images as design guidance and keep the final piece unique.'
      : 'No inspiration images were uploaded. Use the customer’s answers and final custom note as the primary design source, and follow the detailed written specification strongly.';

    const structureText =
      designData.bandStyle ||
      designData.chainStyle ||
      designData.braceletStyle ||
      designData.bangleStyle ||
      designData.earringStyle ||
      'not specified';

    const budgetCurrency =
      designData.budgetCurrency || getCurrencyForCountry(designData.country);

    return `A custom ${designData.jewelryType || 'jewelry piece'} created for ${
      designData.occasion || 'a special occasion'
    }, designed for the ${designData.country || 'target'} market and intended for ${
      designData.wearerGender || 'the wearer'
    } with a ${designData.wearerStyle || 'refined'} aesthetic. Metal: ${
      designData.metalPurity ? `${designData.metalPurity} ` : ''
    }${designData.metal || 'premium metal'}. Stone: ${
      designData.shape ? `${designData.shape} ` : ''
    }${designData.stone || 'premium gemstone'}. ${derivedSizingText} Setting: ${
      designData.settingStyle || 'not specified'
    }. Structure / style: ${structureText}. Finish: ${
      designData.finishLevel || 'polished'
    }. Mood: ${designData.styleMood || 'luxurious'}. Outfit context: ${
      designData.outfitType || 'luxury styling'
    } in ${designData.outfitColor || 'a refined palette'}. ${marketText} ${inspirationText} Final custom note: ${
      designData.finalCustomNote || 'None'
    }. Budget: ${budgetCurrency} ${designData.budget || 'to be decided'}.`;
  }, [designData, inspirationImages, inspirationAnalysis, derivedSizingText, marketText]);

  const imagePrompt = useMemo(() => {
    const centerStoneCarat = toNumber(designData.centerStoneCarat);
    const sideStoneTotalCarat = toNumber(designData.sideStoneTotalCarat);
    const sideStoneCount = toNumber(designData.sideStoneCount);
    const prongCount = toNumber(designData.prongCount);
    const bandWidthMm = toNumber(designData.bandWidthMm);

    const eachSideStone =
      sideStoneTotalCarat > 0 && sideStoneCount > 0
        ? sideStoneTotalCarat / sideStoneCount
        : 0;

    const inspirationText = inspirationAnalysis
      ? `Use this inspiration analysis strongly: ${inspirationAnalysis}.`
      : inspirationImages.length > 0
      ? `The uploaded inspiration images should strongly influence the final design's structure, motif language, detailing density, and cultural styling, while keeping the final piece original.`
      : `No inspiration images were uploaded. Use the customer’s final detailed note and all answered fields as the primary design source. Follow the written specification heavily and do not drift into generic jewelry.`;

    const marketText =
      normalizedCountry === 'india'
        ? 'Design for the India market with support for bridal, festive, and heritage luxury cues when relevant.'
        : normalizedCountry === 'dubai'
        ? 'Design for the Dubai market with support for gold-forward, glamorous, high-luxury styling when relevant.'
        : normalizedCountry === 'usa'
        ? 'Design for the USA market with support for bridal, modern, and fashion-luxury styling when relevant.'
        : 'Design for a global luxury market.';

    return `Luxury jewelry product photography of a ${designData.jewelryType || 'fine jewelry piece'}, designed for ${
      designData.occasion || 'a special occasion'
    }, for the ${designData.country || 'global'} market${designData.stateOrProvince ? ` in ${designData.stateOrProvince}` : ''}, for ${
      designData.wearerGender || 'the wearer'
    } with a ${designData.wearerStyle || 'refined'} aesthetic. Crafted in ${
      designData.metalPurity ? `${designData.metalPurity} ` : ''
    }${designData.metal || 'premium metal'}, featuring ${
      designData.shape ? `${designData.shape} ` : ''
    }${designData.stone || 'gemstone'}. Ring size: ${
      designData.ringSize || 'not specified'
    }. Center stone must visually read as approximately ${
      centerStoneCarat || 0
    } carat. Side stones total: ${sideStoneTotalCarat || 0} carat across ${
      sideStoneCount || 0
    } stones, visually divided proportionally with approximately ${
      eachSideStone ? eachSideStone.toFixed(3) : 0
    } carat per stone when side stones are present. Prong count: ${
      prongCount || 0
    }. Band width target: ${bandWidthMm || 0} mm. Necklace length: ${
      designData.necklaceLength || 'not specified'
    }. Bracelet style: ${designData.braceletStyle || 'not specified'}. Bangle style: ${
      designData.bangleStyle || 'not specified'
    }. Wrist size: ${designData.wristSize || 'not specified'}. Earring style: ${
      designData.earringStyle || 'not specified'
    }. Earring size/length: ${designData.earringLengthMm || 'not specified'}. Setting: ${
      designData.settingStyle || 'not specified'
    }. Structure: ${
      designData.bandStyle ||
      designData.chainStyle ||
      designData.braceletStyle ||
      designData.bangleStyle ||
      designData.earringStyle ||
      'not specified'
    }. Finish: ${designData.finishLevel || 'polished'}. Mood: ${
      designData.styleMood || 'elegant and luxurious'
    }. Outfit styling reference: ${designData.outfitType || 'luxury styling'} in ${
      designData.outfitColor || 'a refined palette'
    }. ${marketText} ${inspirationText} Final custom note: ${
      designData.finalCustomNote || 'None'
    }. Ultra realistic, premium studio lighting, macro detail, elegant reflections, sharp focus, photorealistic, high-end jewelry advertisement, catalog-quality photoshoot, extremely refined craftsmanship.`;
  }, [designData, inspirationImages, inspirationAnalysis, normalizedCountry]);

  useEffect(() => {
    setGeneratedPrompt(imagePrompt);
    refreshLockedDesign(designData);
  }, [imagePrompt, setGeneratedPrompt, refreshLockedDesign, designData]);

  const handleStartOver = () => {
    resetDesign();
    router.replace('/chat');
  };

  const handleRequestQuote = () => {
    router.push({
      pathname: '/request-quote',
      params: {
        vendorId,
        vendorName,
        inviteCode,
        designTitle: `${designData.jewelryType || 'Custom Jewelry'} Design`,
        designSummary: designBrief,
        designImages: JSON.stringify([designData.designImage, designData.generatedImage, designData.cadImage].filter(Boolean)),
        selectedSpecs: JSON.stringify(designData),
        jewelryType: designData.jewelryType || '',
        metal: `${designData.metalPurity ? `${designData.metalPurity} ` : ''}${designData.metal || ''}`.trim(),
        stone: `${designData.shape ? `${designData.shape} ` : ''}${designData.stone || ''}`.trim(),
        budget: designData.budget || '',
        source: vendorId ? 'invite_link' : 'custom_design_direct_quote',
        leadSourceDetail: vendorId ? 'summary_direct_vendor_quote' : 'summary_auto_route_quote',
      },
    } as any);
  };

  const handleChooseVendorFromCatalog = () => {
    router.push({
      pathname: '/vendor-catalog',
      params: {
        returnToQuote: '1',
        vendorId,
        vendorName,
        inviteCode,
        designTitle: `${designData.jewelryType || 'Custom Jewelry'} Design`,
        designSummary: designBrief,
        designImages: JSON.stringify([designData.designImage, designData.generatedImage, designData.cadImage].filter(Boolean)),
        selectedSpecs: JSON.stringify(designData),
        jewelryType: designData.jewelryType || '',
        metal: `${designData.metalPurity ? `${designData.metalPurity} ` : ''}${designData.metal || ''}`.trim(),
        stone: `${designData.shape ? `${designData.shape} ` : ''}${designData.stone || ''}`.trim(),
        budget: designData.budget || '',
        source: 'custom_design_vendor_selection',
        leadSourceDetail: 'summary_choose_vendor_from_catalog',
      },
    } as any);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editable Design Summary</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Edit Design Fields</Text>

        {editableFields.map((field) => (
          <View key={field.key} style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              value={designData[field.key]}
              onChangeText={(text) => updateField(field.key, text)}
              multiline={field.multiline}
              style={[styles.input, field.multiline ? styles.multilineInput : undefined]}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor="#888"
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dynamic Flow Summary</Text>
        <Text style={styles.description}>
          Normalized jewelry type: {normalizedType}
          {'\n'}
          Market: {designData.country || 'not specified'}{designData.stateOrProvince ? ` / ${designData.stateOrProvince}` : ''}
          {'\n'}
          Budget currency: {designData.budgetCurrency || getCurrencyForCountry(designData.country)}
          {'\n'}
          {marketText}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Derived Sizing Rules</Text>
        <Text style={styles.description}>{derivedSizingText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Uploaded Inspiration Images</Text>

        {inspirationImages.length > 0 ? (
          <View style={styles.imageRow}>
            {inspirationImages.map((uri, index) => (
              <Image key={`${uri}-${index}`} source={{ uri }} style={styles.previewImage} />
            ))}
          </View>
        ) : (
          <Text style={styles.description}>No inspiration images uploaded.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inspiration Analysis</Text>
        <Text style={styles.description}>
          {inspirationAnalysis ||
            'Not analyzed yet. If no inspiration images are uploaded, the final custom note becomes the main design driver.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Design Brief</Text>
        <Text style={styles.description}>{designBrief}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Generated Prompt Preview</Text>
        <Text style={styles.promptText}>{generatedPrompt || 'No prompt generated yet.'}</Text>
      </View>


      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quote Options</Text>
        <Text style={styles.description}>
          {vendorId
            ? `This design can be sent directly to ${vendorName || 'your jeweler'} for a quote right now.`
            : 'You can request a quote for this custom design right now with platform priority routing, or choose a vendor from catalog yourself first.'}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRequestQuote}>
          <Text style={styles.primaryButtonText}>{vendorId ? 'Request Quote for This Design' : 'Request Quote for This Design'}</Text>
        </TouchableOpacity>
        {!vendorId ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleChooseVendorFromCatalog}>
            <Text style={styles.secondaryButtonText}>Choose Vendor from Catalog Instead</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/image-result', params: { vendorId, vendorName, inviteCode } } as any)}>
        <Text style={styles.primaryButtonText}>Continue to Image Generation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleStartOver}>
        <Text style={styles.secondaryButtonText}>Start Over</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111',
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  promptText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewImage: {
    width: 96,
    height: 96,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  secondaryButtonText: {
    color: '#111',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
});