import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DesignData, Message, useDesign } from '../context/DesignContext';
import { getQuestionText, getQuestionsForDesign, getVisibleFieldsForDesign } from '../lib/designSchema';
import {
  getCurrencyForCountry,
  normalizeCountry,
  normalizeJewelryType,
} from '../lib/jewelryFlow';

type QuestionKey = keyof DesignData;

function getFieldValue(data: DesignData, key: QuestionKey) {
  return String(data[key] ?? '');
}

const TYPE_SPECIFIC_KEYS: QuestionKey[] = [
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

function getTypeHelp(type: string) {
  switch (normalizeJewelryType(type)) {
    case 'ring':
      return 'Ring flow activated: only ring-specific questions such as ring size, center stone, side stones, prongs, and band details will be asked.';
    case 'necklace':
      return 'Necklace flow activated: only necklace-specific questions such as chain length, clasp, center motif, and styling will be asked.';
    case 'pendant':
      return 'Pendant flow activated: only pendant-specific questions such as pendant style, chain pairing, and setting will be asked.';
    case 'bracelet':
      return 'Bracelet flow activated: only bracelet-specific questions such as wrist size, bracelet style, clasp, and stone layout will be asked.';
    case 'bangle':
      return 'Bangle flow activated: only bangle-specific questions such as inner diameter, opening style, and bangle styling will be asked.';
    case 'earrings':
      return 'Earring flow activated: only earring-specific questions such as style, backing, pair size, drop length, and stone layout will be asked.';
    default:
      return 'Dynamic questionnaire activated. The next questions will adapt to the jewelry type you selected.';
  }
}

function getCountryHelp(country: string) {
  switch (normalizeCountry(country)) {
    case 'india':
      return 'India market selected. Pricing defaults to INR and the flow supports bridal, festive, and heritage luxury cues.';
    case 'dubai':
      return 'Dubai / UAE market selected. Pricing defaults to AED and the flow supports high-luxury and gold-forward styling.';
    case 'usa':
      return 'USA market selected. Pricing defaults to USD and state-based tax can be applied in the estimate.';
    default:
      return 'A global market flow is active. You can still refine pricing and styling later.';
  }
}

export default function ChatScreen() {
  const {
    designData,
    setDesignData,
    messages,
    setMessages,
    inspirationImages,
    setInspirationImages,
    vendorInspirationItem,
  } = useDesign();

  const [input, setInput] = useState('');
  const [showInspirationPanel, setShowInspirationPanel] = useState(true);
  const [showAnswerEditor, setShowAnswerEditor] = useState(true);
  const [editingQuestionKey, setEditingQuestionKey] = useState<QuestionKey | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const hydratedVendorPrefillRef = useRef(false);

  const questions = useMemo(() => getQuestionsForDesign(designData), [designData]);

  const visibleFields = useMemo(() => {
    const fieldMap = new Map(getVisibleFieldsForDesign(designData).map((field) => [field.key, field.label]));
    return questions.map((question) => ({
      key: question.key,
      label: fieldMap.get(question.key) || question.label,
      prompt: getQuestionText(question, designData),
    }));
  }, [questions, designData]);

  const nextQuestion = useMemo(() => {
    return visibleFields.find((q) => !getFieldValue(designData, q.key).trim());
  }, [visibleFields, designData]);

  const answeredQuestions = useMemo(() => {
    return visibleFields.filter((q) => getFieldValue(designData, q.key).trim().length > 0);
  }, [visibleFields, designData]);

  const progressText = `${answeredQuestions.length}/${visibleFields.length} completed`;

  const rebuildMessagesFromData = (updatedData: DesignData) => {
    const rebuilt: Message[] = [
      {
        id: 'assistant-intro',
        role: 'assistant',
        text:
          'Hi! I’m your AI jewelry designer. Tell me the jewelry type and I will switch to that product’s dedicated questionnaire.',
      },
    ];

    const orderedQuestions = getQuestionsForDesign(updatedData);
    orderedQuestions.forEach((question) => {
      const value = getFieldValue(updatedData, question.key).trim();
      if (!value) return;

      rebuilt.push({
        id: `${question.key}-prompt`,
        role: 'assistant',
        text: getQuestionText(question, updatedData),
      });

      rebuilt.push({
        id: `${question.key}-answer`,
        role: 'user',
        text: value,
      });

      if (question.key === 'jewelryType') {
        rebuilt.push({
          id: `${question.key}-help`,
          role: 'assistant',
          text: getTypeHelp(value),
        });
      }

      if (question.key === 'country') {
        rebuilt.push({
          id: `${question.key}-country-help`,
          role: 'assistant',
          text: `${getCountryHelp(value)} Budget currency has been set to ${updatedData.budgetCurrency || getCurrencyForCountry(value)}.`,
        });
      }
    });

    const next = getQuestionsForDesign(updatedData).find((q) => !getFieldValue(updatedData, q.key).trim());
    if (next) {
      rebuilt.push({
        id: 'assistant-next',
        role: 'assistant',
        text: getQuestionText(next, updatedData),
      });
    } else {
      rebuilt.push({
        id: 'assistant-complete',
        role: 'assistant',
        text: 'Perfect — everything is captured. I’ll move you to the design summary now.',
      });
    }

    setMessages(rebuilt);
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'assistant-intro',
          role: 'assistant',
          text:
            'Hi! I’m your AI jewelry designer. Tell me the jewelry type and I will switch to that product’s dedicated questionnaire.',
        },
      ]);
    }
  }, [messages.length, setMessages]);

  useEffect(() => {
    if (!hydratedVendorPrefillRef.current && vendorInspirationItem && answeredQuestions.length > 0) {
      rebuildMessagesFromData(designData);
      hydratedVendorPrefillRef.current = true;
    }
  }, [vendorInspirationItem, answeredQuestions.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, showInspirationPanel, editingQuestionKey, showAnswerEditor]);

  const handlePickImages = async () => {
    try {
      if (inspirationImages.length >= 3) {
        Alert.alert('Limit reached', 'You can upload up to 3 inspiration images.');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to upload inspiration images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: Math.max(0, 3 - inspirationImages.length),
      });

      if (result.canceled) return;

      const uris = result.assets.map((asset) => asset.uri);
      setInspirationImages((prev) => [...prev, ...uris].slice(0, 3));
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Could not upload image.');
    }
  };

  const removeImage = (uriToRemove: string) => {
    setInspirationImages((prev) => prev.filter((uri) => uri !== uriToRemove));
  };

  const startEditingAnswer = (questionKey: QuestionKey) => {
    setEditingQuestionKey(questionKey);
    setShowAnswerEditor(true);
    setInput(getFieldValue(designData, questionKey));
  };

  const cancelEditingAnswer = () => {
    setEditingQuestionKey(null);
    setInput('');
  };

  const applyQuestionAnswer = (questionKey: QuestionKey, answer: string) => {
    const updated = { ...designData, [questionKey]: answer } as DesignData;

    if (questionKey === 'country') {
      updated.budgetCurrency = getCurrencyForCountry(answer);
      if (normalizeCountry(answer) !== 'usa') {
        updated.stateOrProvince = '';
      }
    }

    if (questionKey === 'jewelryType') {
      const nextType = normalizeJewelryType(answer);
      updated.jewelryType = nextType;
      TYPE_SPECIFIC_KEYS.forEach((key) => {
        updated[key] = '';
      });
    }

    setDesignData(updated);
    rebuildMessagesFromData(updated);

    const pending = getQuestionsForDesign(updated).find((q) => !getFieldValue(updated, q.key).trim());
    if (!pending) {
      setTimeout(() => router.push('/summary'), 500);
    }
  };

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;

    if (editingQuestionKey) {
      applyQuestionAnswer(editingQuestionKey, value);
      setEditingQuestionKey(null);
      setInput('');
      return;
    }

    if (!nextQuestion) {
      setInput('');
      return;
    }

    const updated = { ...designData, [nextQuestion.key]: value } as DesignData;

    if (nextQuestion.key === 'country') {
      updated.budgetCurrency = getCurrencyForCountry(value);
      if (normalizeCountry(value) !== 'usa') {
        updated.stateOrProvince = '';
      }
    }

    if (nextQuestion.key === 'jewelryType') {
      updated.jewelryType = normalizeJewelryType(value);
      TYPE_SPECIFIC_KEYS.forEach((key) => {
        updated[key] = '';
      });
    }

    setDesignData(updated);

    const newMessages: Message[] = [
      {
        id: `${Date.now()}-user`,
        role: 'user',
        text: value,
      },
    ];

    if (nextQuestion.key === 'jewelryType') {
      newMessages.push({
        id: `${Date.now()}-type-help`,
        role: 'assistant',
        text: getTypeHelp(value),
      });
    }

    if (nextQuestion.key === 'country') {
      newMessages.push({
        id: `${Date.now()}-country-help`,
        role: 'assistant',
        text: `${getCountryHelp(value)} Budget currency has been set to ${updated.budgetCurrency}.`,
      });
    }

    const upcomingQuestion = getQuestionsForDesign(updated).find((q) => !getFieldValue(updated, q.key).trim());

    if (upcomingQuestion) {
      newMessages.push({
        id: `${Date.now()}-assistant-next`,
        role: 'assistant',
        text: getQuestionText(upcomingQuestion, updated),
      });
    } else {
      newMessages.push({
        id: `${Date.now()}-assistant-complete`,
        role: 'assistant',
        text: 'Perfect — everything is captured. I’ll move you to the design summary now.',
      });
      setTimeout(() => router.push('/summary'), 500);
    }

    setMessages((prev) => [...prev, ...newMessages]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Design Chat</Text>
          <TouchableOpacity
            onPress={() => setShowAnswerEditor((prev) => !prev)}
            style={styles.headerEditButton}
          >
            <Text style={styles.headerEditButtonText}>
              {showAnswerEditor ? 'Hide Edit' : 'Edit Answers'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Text style={styles.progressText}>{progressText}</Text>

            <View style={styles.contextBanner}>
              <Text style={styles.contextBannerText}>
                {getTypeHelp(designData.jewelryType || '')}
              </Text>
            </View>

            <View style={styles.inspirationPanel}>
              <View style={styles.inspirationHeader}>
                <Text style={styles.inspirationTitle}>Inspiration Images</Text>
                <TouchableOpacity onPress={() => setShowInspirationPanel((prev) => !prev)}>
                  <Text style={styles.inspirationAction}>
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
                      {inspirationImages.map((uri, idx) => (
                        <View key={`${uri}-${idx}`} style={styles.imagePreviewWrap}>
                          <Image source={{ uri }} style={styles.imagePreview} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(uri)}
                          >
                            <Text style={styles.removeImageButtonText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noImageHelper}>No inspiration images uploaded yet.</Text>
                  )}
                </>
              ) : (
                <Text style={styles.noImageHelper}>
                  Inspiration panel minimized.{' '}
                  {inspirationImages.length > 0 ? `${inspirationImages.length} image(s) selected.` : ''}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.messagesContainer}>
            {messages.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.messageBubble,
                  item.role === 'assistant' ? styles.assistantBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.role === 'assistant'
                      ? styles.assistantMessageText
                      : styles.userMessageText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {answeredQuestions.length > 0 && showAnswerEditor ? (
          <View style={styles.answerEditorCard}>
            <View style={styles.answerEditorHeader}>
              <Text style={styles.answerEditorTitle}>Quick Edit in Chat</Text>
              {editingQuestionKey ? (
                <TouchableOpacity onPress={cancelEditingAnswer}>
                  <Text style={styles.answerEditorCancel}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.answerEditorHelper}>
              Tap any answered field below to edit it immediately. This works for both vendor-prefilled answers and normal typed answers.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.answerChipRow}>
              {answeredQuestions.map((question) => (
                <TouchableOpacity
                  key={String(question.key)}
                  style={[
                    styles.answerChip,
                    editingQuestionKey === question.key && styles.answerChipActive,
                  ]}
                  onPress={() => startEditingAnswer(question.key)}
                >
                  <View style={styles.answerChipTextWrap}>
                    <Text
                      style={[
                        styles.answerChipLabel,
                        editingQuestionKey === question.key && styles.answerChipLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {question.label}
                    </Text>
                    <Text
                      style={[
                        styles.answerChipValue,
                        editingQuestionKey === question.key && styles.answerChipValueActive,
                      ]}
                      numberOfLines={1}
                    >
                      {getFieldValue(designData, question.key)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.editBadge,
                      editingQuestionKey === question.key && styles.editBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.editBadgeText,
                        editingQuestionKey === question.key && styles.editBadgeTextActive,
                      ]}
                    >
                      Edit
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              editingQuestionKey
                ? `Edit ${visibleFields.find((q) => q.key === editingQuestionKey)?.label ?? 'answer'}...`
                : nextQuestion?.prompt || 'Type your answer...'
            }
            placeholderTextColor="#888"
            style={styles.input}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>{editingQuestionKey ? 'Update' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 22, color: '#111', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  headerEditButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerEditButtonText: { fontSize: 12, fontWeight: '700', color: '#111' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  topSection: { paddingTop: 12, paddingBottom: 8 },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },
  contextBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#f7f4ef',
    borderWidth: 1,
    borderColor: '#eee2cf',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contextBannerText: { fontSize: 13, lineHeight: 19, color: '#5e5244' },
  inspirationPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 18,
    backgroundColor: '#fafafa',
    padding: 14,
  },
  inspirationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inspirationTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  inspirationAction: { fontSize: 13, fontWeight: '700', color: '#111' },
  uploadButton: {
    marginTop: 12,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  uploadButtonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  imagePreviewWrap: { position: 'relative' },
  imagePreview: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f2f2f2' },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  noImageHelper: { marginTop: 10, fontSize: 13, color: '#666', lineHeight: 18, textAlign: 'center' },
  messagesContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  messageBubble: {
    maxWidth: '84%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  assistantBubble: { backgroundColor: '#f2f2f2', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#111', alignSelf: 'flex-end' },
  messageText: { fontSize: 15, lineHeight: 22 },
  assistantMessageText: { color: '#222' },
  userMessageText: { color: '#fff' },
  answerEditorCard: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fffaf5',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  answerEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  answerEditorTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  answerEditorCancel: { fontSize: 13, fontWeight: '600', color: '#666' },
  answerEditorHelper: { fontSize: 12, lineHeight: 17, color: '#666', marginBottom: 10 },
  answerChipRow: { paddingBottom: 4, paddingRight: 8 },
  answerChip: {
    minWidth: 170,
    maxWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  answerChipActive: { borderColor: '#111', backgroundColor: '#f3f3f3' },
  answerChipTextWrap: { flexShrink: 1, paddingRight: 8 },
  answerChipLabel: { fontSize: 12, fontWeight: '700', color: '#444' },
  answerChipLabelActive: { color: '#111' },
  answerChipValue: { marginTop: 3, fontSize: 13, color: '#222' },
  answerChipValueActive: { color: '#111', fontWeight: '600' },
  editBadge: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBadgeActive: { backgroundColor: '#111', borderColor: '#111' },
  editBadgeText: { fontSize: 12, fontWeight: '700', color: '#333' },
  editBadgeTextActive: { color: '#fff' },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 52,
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
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
