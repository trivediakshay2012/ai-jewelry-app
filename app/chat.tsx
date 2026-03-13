import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DesignData, Message, useDesign } from '../context/DesignContext';
import {
  getQuestionText,
  getQuestionsForDesign,
  getSchemaSummary,
} from '../lib/designSchema';
import {
  getCountryHelperText,
  getCurrencyForCountry,
  getJewelryTypeHelperText,
  hasStone,
  normalizeCountry,
  normalizeJewelryType,
} from '../lib/jewelryFlow';


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
  const listRef = useRef<FlatList<Message>>(null);

  const activeQuestions = useMemo(() => getQuestionsForDesign(designData), [designData]);

  const currentQuestionIndex = useMemo(() => {
    return activeQuestions.findIndex((item) => !designData[item.key]);
  }, [activeQuestions, designData]);

  const progressText = useMemo(() => {
    const answeredCount = activeQuestions.filter((item) => designData[item.key]).length;
    return `${answeredCount}/${activeQuestions.length} completed`;
  }, [activeQuestions, designData]);

  const answeredCount = useMemo(() => {
    return activeQuestions.filter((item) => designData[item.key]).length;
  }, [activeQuestions, designData]);

  const compactTop = answeredCount > 0;

  const jewelryTypeHint = useMemo(() => {
    const normalizedType = normalizeJewelryType(designData.jewelryType);
    return designData.jewelryType
      ? `${getJewelryTypeHelperText(normalizedType)} ${getSchemaSummary(designData.jewelryType)}`
      : '';
  }, [designData.jewelryType]);

  const countryHint = useMemo(() => {
    const normalizedCountry = normalizeCountry(designData.country);
    return designData.country ? getCountryHelperText(normalizedCountry) : '';
  }, [designData.country]);

  const [showInspirationPanel, setShowInspirationPanel] = useState(true);
  const [editingQuestionKey, setEditingQuestionKey] = useState<keyof DesignData | null>(null);

  const answeredQuestions = useMemo(() => {
    return activeQuestions.filter((item) => Boolean(designData[item.key]));
  }, [activeQuestions, designData]);

  const editingQuestion = useMemo(() => {
    return editingQuestionKey
      ? activeQuestions.find((item) => item.key === editingQuestionKey) || null
      : null;
  }, [activeQuestions, editingQuestionKey]);

  useEffect(() => {
    if (inspirationImages.length > 0) {
      setShowInspirationPanel(true);
    }
  }, [inspirationImages.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages]);

  const handlePickImages = async () => {
    try {
      if (inspirationImages.length >= 3) {
        Alert.alert('Limit reached', 'You can upload up to 3 inspiration images.');
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

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

  const getNextQuestions = (updatedData: DesignData) => getQuestionsForDesign(updatedData);

  const applyAnswerToDesignData = (
    currentData: DesignData,
    fieldKey: keyof DesignData,
    rawValue: string
  ) => {
    const trimmedValue = rawValue.trim();
    const updatedData: DesignData = {
      ...currentData,
      [fieldKey]: trimmedValue,
    };

    if (fieldKey === 'country') {
      updatedData.budgetCurrency = getCurrencyForCountry(trimmedValue);
    }

    if (fieldKey === 'jewelryType') {
      const normalizedType = normalizeJewelryType(trimmedValue);
      const clearKeys: (keyof DesignData)[] = [
        'ringSize',
        'centerStoneCarat',
        'sideStoneTotalCarat',
        'sideStoneCount',
        'prongCount',
        'bandWidthMm',
        'settingStyle',
        'bandStyle',
        'necklaceLength',
        'chainStyle',
        'pendantStyle',
        'braceletStyle',
        'claspStyle',
        'wristSize',
        'bangleStyle',
        'bangleInnerDiameterMm',
        'isOpenableBangle',
        'earringStyle',
        'earringLengthMm',
        'earringBackingType',
      ];
      clearKeys.forEach((key) => {
        updatedData[key] = '';
      });

      if (normalizedType === 'necklace') {
        updatedData.pendantStyle = '';
      }
    }

    if (fieldKey === 'stone' && !hasStone(updatedData)) {
      updatedData.shape = '';

      if (normalizeJewelryType(updatedData.jewelryType) === 'ring') {
        updatedData.centerStoneCarat = '0';
        updatedData.sideStoneTotalCarat = '0';
        updatedData.sideStoneCount = '0';
        updatedData.prongCount = '0';
        updatedData.settingStyle =
          updatedData.settingStyle || 'plain metal / no stone setting';
      }
    }

    return updatedData;
  };

  const startEditingAnswer = (questionKey: keyof DesignData) => {
    setEditingQuestionKey(questionKey);
    setInput(designData[questionKey] || '');
  };

  const cancelEditingAnswer = () => {
    setEditingQuestionKey(null);
    setInput('');
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const activeQuestion =
      currentQuestionIndex >= 0 ? activeQuestions[currentQuestionIndex] : null;
    const targetQuestion = editingQuestion || activeQuestion;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmedInput,
    };

    if (targetQuestion) {
      const fieldKey = targetQuestion.key;
      const updatedData = applyAnswerToDesignData(designData, fieldKey, trimmedInput);

      setDesignData(updatedData);

      const nextQuestions = getNextQuestions(updatedData);
      const nextIndex = nextQuestions.findIndex((item) => !updatedData[item.key]);

      const nextMessages: Message[] = editingQuestion
        ? [
            {
              id: `${Date.now()}-assistant-edit`,
              role: 'assistant',
              text: `${targetQuestion.label} updated to: ${trimmedInput}.`,
            },
          ]
        : [userMessage];

      if (fieldKey === 'jewelryType' && trimmedInput) {
        nextMessages.push({
          id: `${Date.now()}-assistant-type-hint`,
          role: 'assistant',
          text: `${getJewelryTypeHelperText(normalizeJewelryType(trimmedInput))} ${getSchemaSummary(trimmedInput)}`, 
        });
      }

      if (fieldKey === 'country' && trimmedInput) {
        nextMessages.push({
          id: `${Date.now()}-assistant-country-hint`,
          role: 'assistant',
          text: `${getCountryHelperText(normalizeCountry(trimmedInput))} Budget currency has been set to ${updatedData.budgetCurrency}.${normalizeCountry(trimmedInput) === 'usa' ? ' A state question will be asked next so pricing can include state sales tax.' : ''}`,
        });
      }

      if (nextIndex >= 0) {
        nextMessages.push({
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: getQuestionText(nextQuestions[nextIndex], updatedData),
        });
      } else {
        nextMessages.push({
          id: `${Date.now()}-complete`,
          role: 'assistant',
          text: 'Perfect — I now have your design preferences, jewelry-type-specific details, market context, budget currency, sizing details, styling details, and final note. I’ll create your design summary next.',
        });

        setTimeout(() => {
          router.push('/summary');
        }, 700);
      }

      setMessages((prev) => [...prev, ...nextMessages]);
      setEditingQuestionKey(null);
    } else {
      setMessages((prev) => [...prev, userMessage]);
    }

    setInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.topSection, compactTop && styles.topSectionCompact]}>
          <Text style={[styles.header, compactTop && styles.headerCompact]}>
            AI Jewelry Designer
          </Text>

          {!compactTop ? (
            <Text style={styles.subHeader}>
              The questionnaire is schema-driven: each jewelry type unlocks its own dedicated flow, pricing context, and technical fields.
            </Text>
          ) : null}

          <Text style={styles.progress}>{progressText}</Text>

          {jewelryTypeHint ? (
            <Text numberOfLines={compactTop ? 2 : 4} style={styles.helperPill}>
              {jewelryTypeHint}
            </Text>
          ) : null}

          {countryHint ? (
            <Text numberOfLines={compactTop ? 2 : 4} style={styles.helperPill}>
              {countryHint}
            </Text>
          ) : null}

          <View style={styles.inspirationPanel}>
            <View style={styles.inspirationPanelHeader}>
              <Text style={styles.inspirationPanelTitle}>Inspiration Images</Text>
              <TouchableOpacity
                style={styles.inspirationToggleButton}
                onPress={() => setShowInspirationPanel((prev) => !prev)}
              >
                <Text style={styles.inspirationToggleButtonText}>
                  {showInspirationPanel ? 'Minimize' : 'Expand'}
                </Text>
              </TouchableOpacity>
            </View>

            {showInspirationPanel ? (
              <>
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
              </>
            ) : (
              <Text style={styles.noImageHelper}>
                Inspiration panel minimized. {inspirationImages.length > 0 ? `${inspirationImages.length} image(s) selected.` : 'No images selected yet.'}
              </Text>
            )}
          </View>
        </View>

        {answeredQuestions.length > 0 ? (
          <View style={styles.answerEditorCard}>
            <View style={styles.answerEditorHeader}>
              <Text style={styles.answerEditorTitle}>Quick Edit in Chat</Text>
              {editingQuestion ? (
                <TouchableOpacity onPress={cancelEditingAnswer}>
                  <Text style={styles.answerEditorCancel}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.answerEditorHelper}>
              Tap any answered field to change it immediately without waiting for the full cycle.
            </Text>
            <View style={styles.answerChipRow}>
              {answeredQuestions.map((question) => (
                <TouchableOpacity
                  key={question.key}
                  style={[
                    styles.answerChip,
                    editingQuestionKey === question.key && styles.answerChipActive,
                  ]}
                  onPress={() => startEditingAnswer(question.key)}
                >
                  <Text
                    style={[
                      styles.answerChipLabel,
                      editingQuestionKey === question.key && styles.answerChipLabelActive,
                    ]}
                  >
                    {question.label}: {designData[question.key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          keyboardShouldPersistTaps="handled"
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
            placeholder={editingQuestion ? `Update ${editingQuestion.label}...` : "Type your answer..."}
            placeholderTextColor="#888"
            style={styles.input}
            multiline
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>{editingQuestion ? "Update" : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { flex: 1, backgroundColor: '#fff' },
  topSection: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  topSectionCompact: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerCompact: {
    fontSize: 20,
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
  helperPill: {
    marginTop: 8,
    backgroundColor: '#f3f3f3',
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  inspirationPanel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  inspirationPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  inspirationPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  inspirationToggleButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  inspirationToggleButtonText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadButton: {
    marginTop: 12,
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
  answerEditorCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ece7df',
  },
  answerEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  answerEditorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  answerEditorHelper: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6b7280',
    marginBottom: 12,
  },
  answerEditorCancel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  answerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  answerChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8f5f0',
  },
  answerChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  answerChipLabel: {
    fontSize: 12,
    color: '#171717',
    fontWeight: '600',
  },
  answerChipLabelActive: {
    color: '#fff',
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
    width: 64,
    height: 64,
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
    paddingTop: 12,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '84%',
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});