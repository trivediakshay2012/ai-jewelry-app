import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DesignData, useDesign } from '../context/DesignContext';

type QuestionKey = keyof DesignData;

type Question = {
  key: QuestionKey;
  question: string;
  shouldAsk?: (data: DesignData) => boolean;
};

const allQuestions: Question[] = [
  {
    key: 'jewelryType',
    question:
      'What type of jewelry would you like to create today? For example: ring, necklace, bracelet, pendant, earrings.',
  },
  {
    key: 'occasion',
    question:
      'What is the occasion for this piece? For example: engagement, anniversary, wedding, gift, self purchase.',
  },
  {
    key: 'country',
    question:
      'Which country or region is the wearer from? This helps tailor the design style.',
  },
  {
    key: 'wearerGender',
    question: 'Is this piece for female, male, or unisex styling?',
  },
  {
    key: 'wearerStyle',
    question:
      'How would you describe the wearer’s style? For example: minimal, bold, elegant, royal, modern, traditional.',
  },
  {
    key: 'metal',
    question:
      'Which metal do you prefer? For example: yellow gold, white gold, rose gold, platinum, silver.',
  },
  {
    key: 'metalPurity',
    question:
      'What metal purity do you want? For example: 10K, 14K, 18K, 22K, 24K.',
    shouldAsk: (data) => data.metal.toLowerCase().includes('gold'),
  },
  {
    key: 'stone',
    question:
      'What main stone would you like? For example: diamond, moissanite, sapphire, emerald, ruby, no stone.',
  },
  {
    key: 'shape',
    question:
      'What stone shape do you prefer? For example: oval, round, pear, emerald, cushion.',
    shouldAsk: (data) => !data.stone.toLowerCase().includes('no stone'),
  },
  {
    key: 'centerStoneCarat',
    question:
      'What should the center stone weight be? Example: 1.0, 1.5, 2.0 carat. If there is no center stone, type 0.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('ring') &&
      !data.stone.toLowerCase().includes('no stone'),
  },
  {
    key: 'sideStoneTotalCarat',
    question:
      'If you want side stones, what should the total side-stone carat weight be? Example: 2.0. If no side stones, type 0.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('ring') &&
      !data.stone.toLowerCase().includes('no stone'),
  },
  {
    key: 'sideStoneCount',
    question:
      'How many side stones do you want in total? Example: 8. If no side stones, type 0.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('ring') &&
      !data.stone.toLowerCase().includes('no stone'),
  },
  {
    key: 'prongCount',
    question:
      'How many prongs should hold the center stone? Example: 4, 6, 8. If not applicable, type 0.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('ring') &&
      !data.stone.toLowerCase().includes('no stone'),
  },
  {
    key: 'bandWidthMm',
    question:
      'What should the band width be in millimeters? Example: 1.8, 2.2, 2.8. If not applicable, type 0.',
    shouldAsk: (data) => data.jewelryType.toLowerCase().includes('ring'),
  },
  {
    key: 'settingStyle',
    question:
      'What setting style do you prefer? For example: solitaire, halo, hidden halo, bezel, three stone.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('ring') &&
      !data.stone.toLowerCase().includes('no stone'),
  },
  {
    key: 'bandStyle',
    question:
      'Describe the band style you want. For example: thin band, pavé band, split shank, vintage band.',
    shouldAsk: (data) => data.jewelryType.toLowerCase().includes('ring'),
  },
  {
    key: 'necklaceLength',
    question:
      'What necklace length do you prefer? For example: 16 inch, 18 inch, 20 inch, choker, long layered.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('necklace') ||
      data.jewelryType.toLowerCase().includes('pendant'),
  },
  {
    key: 'chainStyle',
    question:
      'What chain style do you prefer? For example: cable chain, box chain, curb chain, rope chain.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('necklace') ||
      data.jewelryType.toLowerCase().includes('pendant'),
  },
  {
    key: 'pendantStyle',
    question:
      'What pendant style do you want? For example: solitaire pendant, name pendant, drop pendant, symbolic pendant.',
    shouldAsk: (data) => data.jewelryType.toLowerCase().includes('pendant'),
  },
  {
    key: 'braceletStyle',
    question:
      'What bracelet style do you want? For example: tennis bracelet, bangle, cuff, charm bracelet.',
    shouldAsk: (data) => data.jewelryType.toLowerCase().includes('bracelet'),
  },
  {
    key: 'claspStyle',
    question:
      'What clasp style do you prefer? For example: lobster clasp, box clasp, magnetic clasp.',
    shouldAsk: (data) =>
      data.jewelryType.toLowerCase().includes('bracelet') ||
      data.jewelryType.toLowerCase().includes('necklace'),
  },
  {
    key: 'finishLevel',
    question:
      'What finish level do you want? For example: matte, polished, mirror finish, satin.',
  },
  {
    key: 'styleMood',
    question:
      'What mood should the piece express? For example: romantic, regal, minimal, soft luxury, modern glamour.',
  },
  {
    key: 'referenceInspiration',
    question:
      'Briefly describe the inspiration source. For example: Cartier style, vintage bridal, Pinterest luxury, celebrity look.',
  },
  {
    key: 'luxuryTone',
    question:
      'What luxury level should this feel like? For example: ultra luxury, everyday luxury, statement piece, bridal luxury.',
  },
  {
    key: 'backgroundStyle',
    question:
      'For the generated image, what background style do you prefer? For example: white studio, black luxury, soft pastel, editorial.',
  },
  {
    key: 'outfitType',
    question:
      'What outfit would this jewelry be worn with? For example: bridal lehenga, saree, tuxedo, gown, cocktail dress, casual luxury.',
  },
  {
    key: 'outfitColor',
    question:
      'What is the outfit color or color palette? For example: ivory and gold, emerald green, black tie monochrome, blush pink.',
  },
  {
    key: 'wantsModelPreview',
    question:
      'Do you want a model preview image with the jewelry and outfit? Please answer yes or no.',
  },
  {
    key: 'budget',
    question: 'What is your approximate budget for this piece?',
  },
  {
    key: 'finalCustomNote',
    question:
      'Last step: describe everything in as much detail as possible. If you did not upload inspiration images, be very specific about pattern, proportions, stone layout, prongs, symmetry, silhouette, and the exact feel you want.',
  },
];

export default function ChatScreen() {
  const {
    designData,
    setDesignData,
    messages,
    setMessages,
    inspirationImages,
    setInspirationImages,
  } = useDesign();

  const [input, setInput] = useState('');

  const activeQuestions = useMemo(() => {
    return allQuestions.filter((q) => (q.shouldAsk ? q.shouldAsk(designData) : true));
  }, [designData]);

  const currentQuestionIndex = useMemo(() => {
    return activeQuestions.findIndex((item) => !designData[item.key]);
  }, [activeQuestions, designData]);

  const progressText = useMemo(() => {
    const answeredCount = activeQuestions.filter((item) => designData[item.key]).length;
    return `${answeredCount}/${activeQuestions.length} completed`;
  }, [activeQuestions, designData]);

  const handlePickImages = async () => {
    try {
      if (inspirationImages.length >= 3) {
        Alert.alert('Limit reached', 'You can upload up to 3 inspiration images.');
        return;
      }

      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to upload inspiration images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 3 - inspirationImages.length,
      });

      if (result.canceled) return;

      const newUris = result.assets.map((asset) => asset.uri);
      const merged = [...inspirationImages, ...newUris].slice(0, 3);
      setInspirationImages(merged);
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const removeImage = (uriToRemove: string) => {
    setInspirationImages((prev) => prev.filter((uri) => uri !== uriToRemove));
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const activeQuestion =
      currentQuestionIndex >= 0 ? activeQuestions[currentQuestionIndex] : null;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user' as const,
      text: trimmedInput,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (activeQuestion) {
      const fieldKey = activeQuestion.key;

      const updatedData = {
        ...designData,
        [fieldKey]: trimmedInput,
      };

      setDesignData(updatedData);

      const nextQuestions = allQuestions.filter((q) =>
        q.shouldAsk ? q.shouldAsk(updatedData) : true
      );

      const nextIndex = nextQuestions.findIndex((item) => !updatedData[item.key]);

      if (nextIndex >= 0) {
        const nextQuestionMessage = {
          id: `${Date.now()}-assistant`,
          role: 'assistant' as const,
          text: nextQuestions[nextIndex].question,
        };

        setMessages((prev) => [...prev, nextQuestionMessage]);
      } else {
        const completionMessage = {
          id: `${Date.now()}-complete`,
          role: 'assistant' as const,
          text: 'Perfect — I now have your design preferences, sizing details, styling details, and final note. I’ll create your design summary next.',
        };

        setMessages((prev) => [...prev, completionMessage]);

        setTimeout(() => {
          router.push('/summary');
        }, 700);
      }
    }

    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.topSection}>
        <Text style={styles.header}>AI Jewelry Designer</Text>
        <Text style={styles.subHeader}>
          Answer the questions, upload inspiration if you want, and describe your design in detail at the end.
        </Text>
        <Text style={styles.progress}>{progressText}</Text>

        <TouchableOpacity style={styles.uploadButton} onPress={handlePickImages}>
          <Text style={styles.uploadButtonText}>
            Upload Inspiration Images ({inspirationImages.length}/3)
          </Text>
        </TouchableOpacity>

        {inspirationImages.length > 0 ? (
          <View style={styles.imageRow}>
            {inspirationImages.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imagePreviewWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(uri)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noImageHelper}>
            No inspiration images uploaded. The final detailed note will be weighted heavily.
          </Text>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === 'assistant' ? styles.assistantBubble : styles.userBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.role === 'user'
                  ? styles.userMessageText
                  : styles.assistantMessageText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer..."
          placeholderTextColor="#888"
          style={styles.input}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  progress: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  uploadButton: {
    marginTop: 14,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  uploadButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  noImageHelper: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  imageRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
    gap: 10,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 16,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
  },
  assistantBubble: {
    backgroundColor: '#f3f3f3',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#111',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  assistantMessageText: {
    color: '#222',
  },
  userMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 10,
    color: '#111',
  },
  sendButton: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});