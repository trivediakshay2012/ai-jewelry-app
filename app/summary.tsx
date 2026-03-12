import { router } from 'expo-router';
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

const editableFields: { key: keyof DesignData; label: string; multiline?: boolean }[] = [
  { key: 'jewelryType', label: 'Jewelry Type' },
  { key: 'occasion', label: 'Occasion' },
  { key: 'country', label: 'Country / Region' },
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
  { key: 'finishLevel', label: 'Finish Level' },
  { key: 'styleMood', label: 'Style Mood' },
  { key: 'referenceInspiration', label: 'Reference Inspiration' },
  { key: 'luxuryTone', label: 'Luxury Tone' },
  { key: 'backgroundStyle', label: 'Background Style' },
  { key: 'outfitType', label: 'Outfit Type' },
  { key: 'outfitColor', label: 'Outfit Color' },
  { key: 'wantsModelPreview', label: 'Model Preview Requested' },
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
    resetDesign,
    inspirationImages,
    inspirationAnalysis,
  } = useDesign();

  const updateField = (key: keyof DesignData, value: string) => {
    setDesignData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

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

    const parts = [
      designData.ringSize
        ? `Ring size target: ${designData.ringSize}.`
        : 'Ring size not specified yet.',
      centerStoneCarat > 0
        ? `Center stone should visually read close to ${centerStoneCarat} carat.`
        : 'No center stone carat specified.',
      sideStoneTotalCarat > 0
        ? `Total side stone carat weight: ${sideStoneTotalCarat} carat.`
        : 'No side stones requested.',
      sideStoneCount > 0
        ? `Side stone count: ${sideStoneCount}, approximately ${eachSideStone.toFixed(3)} carat per side stone if evenly distributed.`
        : 'No side stone count specified.',
      prongCount > 0
        ? `Prong count target: ${prongCount}.`
        : 'Prong count not specified.',
      bandWidthMm > 0
        ? `Band width target: ${bandWidthMm} mm.`
        : 'Band width not specified.',
    ];

    return parts.join(' ');
  }, [designData]);

  const designBrief = useMemo(() => {
    const inspirationText = inspirationAnalysis
      ? `Inspiration analysis: ${inspirationAnalysis}.`
      : inspirationImages.length > 0
      ? `Inspiration images were uploaded and should strongly influence the final structure, motif language, and style.`
      : `No inspiration images were uploaded. The final custom note should be treated as the main design driver.`;

    return `Create a ${designData.jewelryType || 'fine jewelry'} piece for ${
      designData.occasion || 'a special occasion'
    }. Market/style context: ${designData.country || 'global luxury'}. Wearer: ${
      designData.wearerGender || 'not specified'
    }, style: ${designData.wearerStyle || 'not specified'}. Material: ${
      designData.metalPurity ? `${designData.metalPurity} ` : ''
    }${designData.metal || 'premium metal'}. Stone: ${
      designData.shape ? `${designData.shape} ` : ''
    }${designData.stone || 'premium gemstone'}. ${derivedSizingText} Setting: ${
      designData.settingStyle || 'not specified'
    }. Band/structure: ${
      designData.bandStyle ||
      designData.chainStyle ||
      designData.braceletStyle ||
      'not specified'
    }. Finish: ${designData.finishLevel || 'polished'}. Mood: ${
      designData.styleMood || 'luxurious'
    }. Outfit context: ${designData.outfitType || 'luxury styling'} in ${
      designData.outfitColor || 'a refined palette'
    }. ${inspirationText} Final custom note: ${
      designData.finalCustomNote || 'None'
    }. Budget: ${designData.budget || 'to be decided'}.`;
  }, [designData, inspirationImages, inspirationAnalysis, derivedSizingText]);

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
      ? `The uploaded inspiration images should strongly influence the final design's structure, motif language, detailing density, and styling, while keeping the final piece original.`
      : `No inspiration images were uploaded. Use the customer’s final detailed note and all answered fields as the primary design source.`;

    return `Luxury jewelry product photography of a ${designData.jewelryType || 'fine jewelry piece'}, designed for ${
      designData.occasion || 'a special occasion'
    }, influenced by ${designData.country || 'global luxury taste'}, for ${
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
    }. Band width target: ${bandWidthMm || 0} mm. The prongs, center stone size, side stone proportions, ring scale, and band width should visually match the requested sizing as closely as possible. Setting: ${
      designData.settingStyle || 'not specified'
    }. Band or structure: ${
      designData.bandStyle ||
      designData.chainStyle ||
      designData.braceletStyle ||
      'not specified'
    }. Finish: ${designData.finishLevel || 'polished'}. Mood: ${
      designData.styleMood || 'elegant and luxurious'
    }. Outfit styling reference: ${designData.outfitType || 'luxury styling'} in ${
      designData.outfitColor || 'a refined palette'
    }. ${inspirationText} Final custom note: ${
      designData.finalCustomNote || 'None'
    }. Ultra realistic, premium studio lighting, macro detail, elegant reflections, sharp focus, photorealistic, high-end jewelry advertisement, catalog-quality photoshoot, extremely refined craftsmanship.`;
  }, [designData, inspirationImages, inspirationAnalysis]);

  useEffect(() => {
    setGeneratedPrompt(imagePrompt);
  }, [imagePrompt, setGeneratedPrompt]);

  const handleStartOver = () => {
    resetDesign();
    router.replace('/chat');
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

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/image-result')}>
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