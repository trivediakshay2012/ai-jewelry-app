import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TechnicalSheetCard, {
  TechnicalSheetData,
} from '../components/TechnicalSheetCard';
import { useDesign } from '../context/DesignContext';
import { imageUriToDataUrl, imageUriToPayload } from '../lib/imageUtils';
import { supabase } from '../lib/supabase';

type GeneratedImage = {
  id: string;
  label?: string;
  dataUrl: string;
};

type BudgetAwareChange = {
  title: string;
  detail: string;
};

type PricingEstimate = {
  country: string;
  stateOrProvince?: string;
  currency: string;
  metalWeightGrams: number;
  taxRatePercent: number;
  taxLabel: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  targetBudget: number | null;
  differenceToBudget: number | null;
  isWithinBudget: boolean | null;
  lines: { label: string; value: number }[];
  disclaimer: string;
};

type BudgetAwareReport = {
  title: string;
  targetBudget: string;
  protectedDesign: string;
  changeSummary: string;
  originalEstimate?: PricingEstimate;
  optimizedEstimate?: PricingEstimate;
  changes: BudgetAwareChange[];
};

export default function ImageResultScreen() {
  const {
    generatedPrompt,
    setGeneratedPrompt,
    designData,
    inspirationImages,
    uploadedInspirationUrls,
    setUploadedInspirationUrls,
    inspirationAnalysis,
    setInspirationAnalysis,
    facePhotoUri,
    setFacePhotoUri,
  } = useDesign();

  const [productImages, setProductImages] = useState<GeneratedImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lifestyleImages, setLifestyleImages] = useState<(GeneratedImage | null)[]>([]);
  const [personalPreviewImages, setPersonalPreviewImages] = useState<(GeneratedImage | null)[]>(
    []
  );
  const [budgetAwareImages, setBudgetAwareImages] = useState<(GeneratedImage | null)[]>([]);
  const [budgetAwareReports, setBudgetAwareReports] = useState<(BudgetAwareReport | null)[]>([]);
  const [technicalSheet, setTechnicalSheet] = useState<TechnicalSheetData | null>(null);
  const [pricingEstimate, setPricingEstimate] = useState<PricingEstimate | null>(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [lifestyleLoading, setLifestyleLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [personalPreviewLoading, setPersonalPreviewLoading] = useState(false);
  const [budgetAwareLoading, setBudgetAwareLoading] = useState(false);
  const [technicalLoading, setTechnicalLoading] = useState(false);

  const [editInstruction, setEditInstruction] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');

  useEffect(() => {
    setEditablePrompt(generatedPrompt || '');
  }, [generatedPrompt]);

  const isBusy =
    loading ||
    analyzing ||
    lifestyleLoading ||
    regenerating ||
    personalPreviewLoading ||
    budgetAwareLoading ||
    technicalLoading;

  const selectedImage = productImages[selectedIndex] || null;
  const selectedLifestyle = lifestyleImages[selectedIndex] || null;
  const selectedPersonalPreview = personalPreviewImages[selectedIndex] || null;
  const selectedBudgetAware = budgetAwareImages[selectedIndex] || null;
  const selectedBudgetAwareReport = budgetAwareReports[selectedIndex] || null;

  const hasBudget = Boolean(String(designData?.budget || '').trim());

  const handleFunctionError = async (error: unknown) => {
    if (error instanceof FunctionsHttpError) {
      const errorBody = await error.context.json();
      console.log('Function returned an error:', errorBody);
      Alert.alert('Function Error', JSON.stringify(errorBody, null, 2));
      return;
    }

    if (error instanceof FunctionsRelayError) {
      console.log('Relay error:', error.message);
      Alert.alert('Relay Error', error.message);
      return;
    }

    if (error instanceof FunctionsFetchError) {
      console.log('Fetch error:', error.message);
      Alert.alert('Fetch Error', error.message);
      return;
    }

    throw error;
  };

  const ensureInspirationAnalysis = async () => {
    if (inspirationImages.length === 0) {
      return {
        analysis: inspirationAnalysis,
        urls: uploadedInspirationUrls,
      };
    }

    if (inspirationAnalysis && uploadedInspirationUrls.length > 0) {
      return {
        analysis: inspirationAnalysis,
        urls: uploadedInspirationUrls,
      };
    }

    setAnalyzing(true);

    const imagePayloads = [];
    for (const uri of inspirationImages) {
      const payload = await imageUriToPayload(uri);
      imagePayloads.push(payload);
    }

    const { data, error } = await supabase.functions.invoke('analyze-inspiration', {
      body: {
        images: imagePayloads,
        designData,
      },
    });

    if (error) {
      await handleFunctionError(error);
      throw error;
    }

    const analysisText = data?.analysisSummary || '';
    const storageUrls = data?.storageUrls || [];

    setInspirationAnalysis(analysisText);
    setUploadedInspirationUrls(storageUrls);

    return {
      analysis: analysisText,
      urls: storageUrls,
    };
  };

  const resetDerivedImagesForOption = (index: number) => {
    setLifestyleImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    setPersonalPreviewImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    setBudgetAwareImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    setBudgetAwareReports((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleGenerateTechnicalSheet = async () => {
    try {
      setTechnicalLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-jewelry-image', {
        body: {
          designData,
          mode: 'technical-sheet',
        },
      });

      if (error) {
        await handleFunctionError(error);
        return;
      }

      if (!data?.technicalSheet) {
        Alert.alert('No Technical Sheet', 'No technical sheet data was returned.');
        return;
      }

      setTechnicalSheet(data.technicalSheet);
      setPricingEstimate(data?.pricingEstimate || null);
    } catch (err: any) {
      console.log('Unexpected technical sheet error:', err);
      Alert.alert(
        'Unexpected Error',
        err?.message || 'Something went wrong while generating the technical sheet.'
      );
    } finally {
      setTechnicalLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      setLoading(true);
      setGenerationStep('Preparing inspiration...');

      const inspirationResult = await ensureInspirationAnalysis();
      const generated: GeneratedImage[] = [];

      for (let optionIndex = 0; optionIndex < 4; optionIndex += 1) {
        setGenerationStep(`Generating Option ${optionIndex + 1} of 4...`);

        const { data, error } = await supabase.functions.invoke('generate-jewelry-image', {
          body: {
            prompt: editablePrompt || generatedPrompt,
            designData,
            inspirationAnalysis: inspirationResult.analysis,
            uploadedInspirationUrls: inspirationResult.urls,
            editInstruction,
            mode: 'product-single',
            optionIndex,
          },
        });

        if (error) {
          await handleFunctionError(error);
          return;
        }

        if (!data?.productImage) {
          Alert.alert('No Image', `No image returned for Option ${optionIndex + 1}.`);
          return;
        }

        generated.push(data.productImage);
        setProductImages([...generated]);

        if (data?.appliedPrompt) {
          setEditablePrompt(data.appliedPrompt);
          setGeneratedPrompt(data.appliedPrompt);
        }
      }

      setSelectedIndex(0);
      setLifestyleImages(new Array(generated.length).fill(null));
      setPersonalPreviewImages(new Array(generated.length).fill(null));
      setBudgetAwareImages(new Array(generated.length).fill(null));
      setBudgetAwareReports(new Array(generated.length).fill(null));

      await handleGenerateTechnicalSheet();
    } catch (err: any) {
      console.log('Unexpected image generation error:', err);
      Alert.alert(
        'Unexpected Error',
        err?.message || 'Something went wrong while generating the jewelry images.'
      );
    } finally {
      setLoading(false);
      setAnalyzing(false);
      setGenerationStep('');
    }
  };

  const handleGenerateMatchingModelPreview = async () => {
    try {
      if (!selectedImage) {
        Alert.alert('No Selected Image', 'Please generate and select a product image first.');
        return;
      }

      setLifestyleLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-jewelry-image', {
        body: {
          prompt: editablePrompt || generatedPrompt,
          designData,
          inspirationAnalysis,
          uploadedInspirationUrls,
          editInstruction,
          selectedBaseImage: selectedImage.dataUrl,
          mode: 'lifestyle',
          optionIndex: selectedIndex,
        },
      });

      if (error) {
        await handleFunctionError(error);
        return;
      }

      if (!data?.lifestyleImage) {
        Alert.alert('No Preview', 'No model preview image was returned.');
        return;
      }

      setLifestyleImages((prev) => {
        const next = [...prev];
        next[selectedIndex] = {
          id: `lifestyle-${selectedIndex + 1}`,
          label: `Option ${selectedIndex + 1}`,
          dataUrl: data.lifestyleImage,
        };
        return next;
      });
    } catch (err: any) {
      console.log('Unexpected lifestyle generation error:', err);
      Alert.alert(
        'Unexpected Error',
        err?.message || 'Something went wrong while generating the model preview.'
      );
    } finally {
      setLifestyleLoading(false);
    }
  };

  const handleRegenerateSelectedOption = async () => {
    try {
      if (!selectedImage) {
        Alert.alert('No Selected Image', 'Please generate and select a product image first.');
        return;
      }

      if (!editInstruction.trim()) {
        Alert.alert('Missing Edit Request', 'Please write what you want changed first.');
        return;
      }

      setRegenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-jewelry-image', {
        body: {
          prompt: editablePrompt || generatedPrompt,
          designData,
          inspirationAnalysis,
          uploadedInspirationUrls,
          editInstruction,
          selectedBaseImage: selectedImage.dataUrl,
          mode: 'regenerate-selected',
          optionIndex: selectedIndex,
        },
      });

      if (error) {
        await handleFunctionError(error);
        return;
      }

      if (!data?.regeneratedImage) {
        Alert.alert('No Image', 'No regenerated image was returned.');
        return;
      }

      setProductImages((prev) => {
        const next = [...prev];
        next[selectedIndex] = {
          ...next[selectedIndex],
          dataUrl: data.regeneratedImage,
        };
        return next;
      });

      if (data?.appliedPrompt) {
        setEditablePrompt(data.appliedPrompt);
        setGeneratedPrompt(data.appliedPrompt);
      }

      resetDerivedImagesForOption(selectedIndex);
    } catch (err: any) {
      console.log('Unexpected regeneration error:', err);
      Alert.alert(
        'Unexpected Error',
        err?.message || 'Something went wrong while regenerating the selected option.'
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handleGenerateBudgetAwareVersion = async () => {
    try {
      if (!selectedImage) {
        Alert.alert('No Selected Image', 'Please generate and select a product image first.');
        return;
      }

      if (!hasBudget) {
        Alert.alert('Missing Budget', 'Please add a budget in the Summary screen first.');
        return;
      }

      setBudgetAwareLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-jewelry-image', {
        body: {
          prompt: editablePrompt || generatedPrompt,
          designData,
          inspirationAnalysis,
          uploadedInspirationUrls,
          editInstruction,
          selectedBaseImage: selectedImage.dataUrl,
          mode: 'budget-aware',
          optionIndex: selectedIndex,
        },
      });

      if (error) {
        await handleFunctionError(error);
        return;
      }

      if (!data?.budgetAwareImage) {
        Alert.alert('No Image', 'No budget-aware image was returned.');
        return;
      }

      setBudgetAwareImages((prev) => {
        const next = [...prev];
        next[selectedIndex] = {
          id: `budget-aware-${selectedIndex + 1}`,
          label: `Budget-Aware ${selectedIndex + 1}`,
          dataUrl: data.budgetAwareImage,
        };
        return next;
      });

      setBudgetAwareReports((prev) => {
        const next = [...prev];
        next[selectedIndex] = data?.budgetAwareReport || null;
        return next;
      });
    } catch (err: any) {
      console.log('Unexpected budget-aware generation error:', err);
      Alert.alert(
        'Unexpected Error',
        err?.message || 'Something went wrong while generating the budget-aware version.'
      );
    } finally {
      setBudgetAwareLoading(false);
    }
  };

  const handlePickFacePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to upload your face photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      setFacePhotoUri(result.assets[0].uri);
    } catch (error) {
      console.log('Face photo picker error:', error);
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleGeneratePersonalPreview = async () => {
    try {
      if (!selectedImage) {
        Alert.alert('No Selected Image', 'Please generate and select a product image first.');
        return;
      }

      if (!facePhotoUri) {
        Alert.alert('Missing Face Photo', 'Please upload your face photo first.');
        return;
      }

      setPersonalPreviewLoading(true);

      const facePhotoDataUrl = await imageUriToDataUrl(facePhotoUri);

      const { data, error } = await supabase.functions.invoke('generate-jewelry-image', {
        body: {
          prompt: editablePrompt || generatedPrompt,
          designData,
          inspirationAnalysis,
          uploadedInspirationUrls,
          editInstruction,
          selectedBaseImage: selectedImage.dataUrl,
          facePhotoDataUrl,
          mode: 'personal-preview',
          optionIndex: selectedIndex,
        },
      });

      if (error) {
        await handleFunctionError(error);
        return;
      }

      if (!data?.personalPreviewImage) {
        Alert.alert('No Preview', 'No personal preview image was returned.');
        return;
      }

      setPersonalPreviewImages((prev) => {
        const next = [...prev];
        next[selectedIndex] = {
          id: `personal-${selectedIndex + 1}`,
          label: `Option ${selectedIndex + 1}`,
          dataUrl: data.personalPreviewImage,
        };
        return next;
      });
    } catch (err: any) {
      console.log('Unexpected personal preview error:', err);
      Alert.alert(
        'Unexpected Error',
        err?.message || 'Something went wrong while generating the personal preview.'
      );
    } finally {
      setPersonalPreviewLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Jewelry Image Engine</Text>

      <View style={styles.heroBox}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>
              {analyzing ? 'Analyzing inspiration images...' : generationStep || 'Generating...'}
            </Text>
          </View>
        ) : selectedImage ? (
          <Image source={{ uri: selectedImage.dataUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.placeholderText}>
              Your generated jewelry images will appear here
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isBusy && styles.disabledButton]}
        onPress={handleGenerateImages}
        disabled={isBusy}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Working...' : 'Generate 4 Product Designs'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButtonDark, (isBusy || !selectedImage) && styles.disabledButton]}
        onPress={handleGenerateMatchingModelPreview}
        disabled={isBusy || !selectedImage}
      >
        <Text style={styles.secondaryButtonDarkText}>
          {lifestyleLoading ? 'Generating Preview...' : 'Generate Matching Model Preview'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButtonOutline, (isBusy || !selectedImage) && styles.disabledButton]}
        onPress={handleGenerateBudgetAwareVersion}
        disabled={isBusy || !selectedImage}
      >
        <Text style={styles.secondaryButtonOutlineText}>
          {budgetAwareLoading
            ? 'Generating Budget-Aware Version...'
            : 'Generate Budget-Aware Version'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButtonOutline, (isBusy || !selectedImage) && styles.disabledButton]}
        onPress={handleRegenerateSelectedOption}
        disabled={isBusy || !selectedImage}
      >
        <Text style={styles.secondaryButtonOutlineText}>
          {regenerating ? 'Regenerating...' : 'Regenerate Selected Option'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButtonOutline, isBusy && styles.disabledButton]}
        onPress={handleGenerateTechnicalSheet}
        disabled={isBusy}
      >
        <Text style={styles.secondaryButtonOutlineText}>
          {technicalLoading ? 'Generating CAD Sheet...' : 'Generate CAD / Technical Sheet'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryNavButton} onPress={() => router.push('./summary')}>
        <Text style={styles.secondaryNavButtonText}>Edit Fields in Summary</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Editable Prompt</Text>
        <TextInput
          value={editablePrompt}
          onChangeText={setEditablePrompt}
          multiline
          style={styles.largeInput}
          placeholder="Edit the image prompt here..."
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Change Request</Text>
        <TextInput
          value={editInstruction}
          onChangeText={setEditInstruction}
          multiline
          style={styles.largeInput}
          placeholder="Example: keep the same concept but increase elegance, refine the prongs, and make the side stones more precise."
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <Text style={styles.promptText}>
          {hasBudget
            ? `Target budget: ${String(designData?.budget)}`
            : 'No budget entered yet. Add a budget in Summary to enable the budget-aware version.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inspiration Analysis</Text>
        <Text style={styles.promptText}>
          {inspirationAnalysis || 'No inspiration analysis yet.'}
        </Text>
      </View>

      {pricingEstimate ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Approximate Market Pricing</Text>
          <Text style={styles.helperText}>
            {pricingEstimate.country || 'Market'}{pricingEstimate.stateOrProvince ? ` / ${pricingEstimate.stateOrProvince}` : ''} · {pricingEstimate.taxLabel} · {pricingEstimate.taxRatePercent}%
          </Text>

          {pricingEstimate.lines.map((line, index) => (
            <View key={`${line.label}-${index}`} style={styles.priceRow}>
              <Text style={styles.priceLabel}>{line.label}</Text>
              <Text style={styles.priceValue}>
                {pricingEstimate.currency} {line.value.toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.priceDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabelStrong}>Subtotal</Text>
            <Text style={styles.priceValueStrong}>
              {pricingEstimate.currency} {pricingEstimate.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelStrong}>Tax</Text>
            <Text style={styles.priceValueStrong}>
              {pricingEstimate.currency} {pricingEstimate.taxAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelStrong}>Estimated Total</Text>
            <Text style={styles.priceValueStrong}>
              {pricingEstimate.currency} {pricingEstimate.total.toFixed(2)}
            </Text>
          </View>

          {pricingEstimate.targetBudget !== null ? (
            <Text style={styles.helperText}>
              Budget target: {pricingEstimate.currency} {pricingEstimate.targetBudget.toFixed(2)} · {pricingEstimate.isWithinBudget ? 'Within budget' : 'Above budget'}
              {pricingEstimate.differenceToBudget !== null
                ? ` by ${pricingEstimate.currency} ${Math.abs(pricingEstimate.differenceToBudget).toFixed(2)}`
                : ''}
            </Text>
          ) : null}

          <Text style={styles.disclaimerText}>{pricingEstimate.disclaimer}</Text>
        </View>
      ) : null}

      {productImages.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Generated Product Variations</Text>

          <View style={styles.grid}>
            {productImages.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[
                  styles.thumbWrapper,
                  selectedIndex === index && styles.thumbWrapperActive,
                ]}
                onPress={() => setSelectedIndex(index)}
              >
                <Image source={{ uri: image.dataUrl }} style={styles.thumbImage} />
                <Text style={styles.thumbLabel}>{image.label || `Option ${index + 1}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Face Photo</Text>

        <TouchableOpacity style={styles.secondaryButtonDark} onPress={handlePickFacePhoto}>
          <Text style={styles.secondaryButtonDarkText}>
            {facePhotoUri ? 'Change Face Photo' : 'Upload Face Photo'}
          </Text>
        </TouchableOpacity>

        {facePhotoUri ? (
          <>
            <Image source={{ uri: facePhotoUri }} style={styles.facePreview} />
            <TouchableOpacity
              style={[styles.primaryButton, (isBusy || !selectedImage) && styles.disabledButton]}
              onPress={handleGeneratePersonalPreview}
              disabled={isBusy || !selectedImage}
            >
              <Text style={styles.primaryButtonText}>
                {personalPreviewLoading
                  ? 'Generating Personal Preview...'
                  : 'Generate Personalized Styled Preview'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.helperText}>
            Upload a face photo, then generate the personal preview from the selected option.
          </Text>
        )}
      </View>

      {selectedLifestyle?.dataUrl ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Matching Model / Outfit Preview</Text>
          <Image source={{ uri: selectedLifestyle.dataUrl }} style={styles.lifestyleImage} />
          <Text style={styles.helperText}>
            This preview matches the currently selected jewelry option.
          </Text>
        </View>
      ) : null}

      {selectedPersonalPreview?.dataUrl ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personalized Preview</Text>
          <Image source={{ uri: selectedPersonalPreview.dataUrl }} style={styles.lifestyleImage} />
          <Text style={styles.helperText}>
            This preview uses your uploaded face photo with the selected jewelry option.
          </Text>
        </View>
      ) : null}

      {selectedBudgetAware?.dataUrl ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Budget-Aware Version</Text>
          <Image source={{ uri: selectedBudgetAware.dataUrl }} style={styles.lifestyleImage} />
          <Text style={styles.helperText}>
            This version is optimized to fit the entered budget while preserving the original
            design identity.
          </Text>

          {selectedBudgetAwareReport ? (
            <View style={styles.budgetReportBox}>
              <Text style={styles.budgetReportTitle}>{selectedBudgetAwareReport.title}</Text>
              <Text style={styles.budgetReportText}>
                Target budget: {selectedBudgetAwareReport.targetBudget}
              </Text>
              <Text style={styles.budgetReportText}>
                Protected design: {selectedBudgetAwareReport.protectedDesign}
              </Text>
              <Text style={styles.budgetReportText}>
                {selectedBudgetAwareReport.changeSummary}
              </Text>

              {selectedBudgetAwareReport.originalEstimate ? (
                <Text style={styles.budgetReportText}>
                  Original estimate: {selectedBudgetAwareReport.originalEstimate.currency} {selectedBudgetAwareReport.originalEstimate.total.toFixed(2)}
                </Text>
              ) : null}
              {selectedBudgetAwareReport.optimizedEstimate ? (
                <Text style={styles.budgetReportText}>
                  Optimized estimate: {selectedBudgetAwareReport.optimizedEstimate.currency} {selectedBudgetAwareReport.optimizedEstimate.total.toFixed(2)}
                </Text>
              ) : null}

              {selectedBudgetAwareReport.changes.map((change, index) => (
                <View key={`${change.title}-${index}`} style={styles.changeBulletRow}>
                  <Text style={styles.changeBulletIcon}>•</Text>
                  <View style={styles.changeBulletContent}>
                    <Text style={styles.changeBulletTitle}>{change.title}</Text>
                    <Text style={styles.changeBulletText}>{change.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {technicalSheet ? <TechnicalSheetCard sheet={technicalSheet} /> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Design Snapshot</Text>
        <Text style={styles.item}>Type: {designData.jewelryType || '—'}</Text>
        <Text style={styles.item}>Occasion: {designData.occasion || '—'}</Text>
        <Text style={styles.item}>Wearer Gender: {designData.wearerGender || '—'}</Text>
        <Text style={styles.item}>Wearer Style: {designData.wearerStyle || '—'}</Text>
        <Text style={styles.item}>Metal: {designData.metal || '—'}</Text>
        <Text style={styles.item}>Metal Purity: {designData.metalPurity || '—'}</Text>
        <Text style={styles.item}>Stone: {designData.stone || '—'}</Text>
        <Text style={styles.item}>Shape: {designData.shape || '—'}</Text>
        <Text style={styles.item}>Ring Size: {designData.ringSize || '—'}</Text>
        <Text style={styles.item}>Center Stone Carat: {designData.centerStoneCarat || '—'}</Text>
        <Text style={styles.item}>
          Side Stone Total Carat: {designData.sideStoneTotalCarat || '—'}
        </Text>
        <Text style={styles.item}>Side Stone Count: {designData.sideStoneCount || '—'}</Text>
        <Text style={styles.item}>Prong Count: {designData.prongCount || '—'}</Text>
        <Text style={styles.item}>Band Width (mm): {designData.bandWidthMm || '—'}</Text>
        <Text style={styles.item}>Setting Style: {designData.settingStyle || '—'}</Text>
        <Text style={styles.item}>Budget: {designData.budget || '—'}</Text>
        <Text style={styles.item}>Outfit Type: {designData.outfitType || '—'}</Text>
        <Text style={styles.item}>Outfit Color: {designData.outfitColor || '—'}</Text>
        <Text style={styles.item}>Model Preview: {designData.wantsModelPreview || '—'}</Text>
        <Text style={styles.item}>Final Note: {designData.finalCustomNote || '—'}</Text>
      </View>
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
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  heroBox: {
    height: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  lifestyleImage: {
    width: '100%',
    height: 420,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
  },
  facePreview: {
    width: 140,
    height: 140,
    borderRadius: 16,
    alignSelf: 'center',
    marginVertical: 14,
    backgroundColor: '#f2f2f2',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonDark: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonDarkText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondaryButtonOutline: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonOutlineText: {
    color: '#111',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondaryNavButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 18,
  },
  secondaryNavButtonText: {
    color: '#111',
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111',
  },
  promptText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  helperText: {
    marginTop: 10,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  item: {
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
    lineHeight: 22,
  },
  largeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  thumbWrapper: {
    width: '48%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#fff',
  },
  thumbWrapperActive: {
    borderColor: '#111',
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    marginBottom: 8,
  },
  thumbLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  priceLabel: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  priceValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  priceLabelStrong: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
  },
  priceValueStrong: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#ececec',
    marginVertical: 8,
  },
  disclaimerText: {
    marginTop: 12,
    fontSize: 12,
    color: '#777',
    lineHeight: 18,
  },
  budgetReportBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#ece7dc',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#faf7f1',
  },
  budgetReportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  budgetReportText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
    marginBottom: 6,
  },
  changeBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  changeBulletIcon: {
    fontSize: 18,
    lineHeight: 20,
    marginRight: 8,
    color: '#111',
  },
  changeBulletContent: {
    flex: 1,
  },
  changeBulletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  changeBulletText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
  },
});