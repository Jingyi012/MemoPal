import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import type { MemoryGoalType } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { parseBulkItems, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { buildTechniqueRoute, recommendTechnique, type TechniqueChoice } from '@/features/memory-composer/utils/techniqueRecommendation';
import { useTranslation } from '@/core/i18n/useTranslation';

type ComposerStep = 'content' | 'technique';

const goals: { key: MemoryGoalType; translationKey: 'goalSpelling' | 'goalList' | 'goalFacts' | 'goalOther'; emoji: string }[] = [
  { key: 'spelling', translationKey: 'goalSpelling', emoji: '✏️' },
  { key: 'ordered-list', translationKey: 'goalList', emoji: '🛒' },
  { key: 'facts', translationKey: 'goalFacts', emoji: '💡' },
  { key: 'custom', translationKey: 'goalOther', emoji: '✨' },
];

type MemoryComposerProps = {
  /** Keep the shared content step while routing directly to one technique. */
  initialTechnique?: TechniqueChoice;
};

export default function MemoryComposerScreen({ initialTechnique }: MemoryComposerProps = {}) {
  const router = useRouter();
  const { t } = useTranslation('memoryComposer');
  const [step, setStep] = useState<ComposerStep>('content');
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<MemoryGoalType>('spelling');
  const [newItem, setNewItem] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const scrollOffsetRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<TextInput>(null);
  const bulkInputRef = useRef<TextInput>(null);
  const newItemInputRef = useRef<TextInput>(null);

  const recommendation = useMemo(() => recommendTechnique(goalType, items.length), [goalType, items.length]);

  const keepFocusedInputVisible = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const input = focusedInputRef.current;
      const scrollView = scrollViewRef.current;
      if (!input || !scrollView) return;

      scrollView.getNativeScrollRef()?.measureInWindow((_scrollX, scrollY, _scrollWidth, scrollHeight) => {
        input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
          const keyboardTop = Keyboard.metrics()?.screenY ?? scrollY + scrollHeight;
          const visibleBottom = Math.min(scrollY + scrollHeight, keyboardTop) - 16;
          const overlap = inputY + inputHeight - visibleBottom;

          if (overlap > 0) {
            scrollView.scrollTo({ y: scrollOffsetRef.current + overlap, animated: true });
          }
        });
      });
    }, 80);
  }, []);

  const handleInputFocus = useCallback((input: TextInput | null) => {
    focusedInputRef.current = input;
    keepFocusedInputVisible();
  }, [keepFocusedInputVisible]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardInset(event.endCoordinates.height);
      keepFocusedInputVisible();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [keepFocusedInputVisible]);

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    if (items.length >= 100) {
      setMessage(t('maxItemsMessage'));
      return;
    }
    setItems((current) => [...current, value]);
    setNewItem('');
    setMessage(null);
  };

  const addBulkItems = () => {
    const pastedItems = parseBulkItems(bulkInput, 100 - items.length);
    if (!pastedItems.length) {
      setMessage(t('pasteManyMessage'));
      return;
    }
    setItems((current) => [...current, ...pastedItems]);
    setBulkInput('');
    setBulkMode(false);
    setMessage(null);
  };

  const continueToTechniques = () => {
    if (!items.length) {
      setMessage(t('addThingMessage'));
      return;
    }
    const resolvedTitle = title.trim() || suggestMemoryTitle(goalType, items);
    if (!title.trim()) setTitle(resolvedTitle);
    setMessage(null);

    if (initialTechnique) {
      openTechnique(initialTechnique, resolvedTitle);
      return;
    }

    setStep('technique');
  };

  const openTechnique = (technique: TechniqueChoice, routeTitle = title.trim()) => {
    router.push(buildTechniqueRoute(technique, routeTitle, goalType, items) as Href);
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={step === 'content' ? t('addContent') : t('pickTechnique')}
        description={step === 'content' ? t('contentDescription') : t('techniqueDescription')}
        backAction={() => (step === 'technique' ? setStep('content') : router.back())}
      />

      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        onScroll={(event) => { scrollOffsetRef.current = event.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, keyboardInset > 0 && { paddingBottom: keyboardInset + 24 }]}>
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, step === 'content' && styles.progressDotActive]} />
          <View style={[styles.progressLine, step === 'technique' && styles.progressLineActive]} />
          <View style={[styles.progressDot, step === 'technique' && styles.progressDotActive]} />
        </View>

        {step === 'content' ? (
          <>
            <View style={styles.inputCard}>
              <View style={styles.cardIcon}><Text style={styles.cardIconEmoji}>🧠</Text></View>
              <Text style={styles.cardTitle}>{t('startUseful')}</Text>
              <Text style={styles.cardBody}>{t('startUsefulBody')}</Text>

              <Text style={styles.label}>{t('memoryName')} <Text style={styles.optionalLabel}>{t('optional')}</Text></Text>
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={(value) => { setTitle(value); setMessage(null); }}
                onFocus={() => handleInputFocus(titleInputRef.current)}
                maxLength={200}
                placeholder={t('memoryPlaceholder')}
                placeholderTextColor="#AAA7B5"
                style={styles.input}
              />

              <Text style={styles.label}>{t('whatFor')}</Text>
              <View style={styles.goalGrid}>
                {goals.map((goal) => {
                  const selected = goal.key === goalType;
                  return (
                    <AnimatedPressable
                      key={goal.key}
                      onPress={() => setGoalType(goal.key)}
                      style={[styles.goalChip, selected && styles.goalChipSelected]}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                      <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>{t(goal.translationKey)}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <Text style={styles.label}>{t('addItems')}</Text>
              <AnimatedPressable
                accessibilityLabel={bulkMode ? t('hidePasteMany') : t('pasteManyAccessibility')}
                onPress={() => { setBulkMode((current) => !current); setMessage(null); }}
                style={styles.bulkToggle}>
                <Text style={styles.bulkToggleEmoji}>📋</Text>
                <Text style={styles.bulkToggleText}>{bulkMode ? t('addOne') : t('pasteMany')}</Text>
              </AnimatedPressable>
              {bulkMode ? (
                <View style={styles.bulkCard}>
                  <Text style={styles.bulkTitle}>{t('onePerLine')}</Text>
                  <TextInput
                    ref={bulkInputRef}
                    value={bulkInput}
                    onChangeText={setBulkInput}
                    onFocus={() => handleInputFocus(bulkInputRef.current)}
                    multiline
                    maxLength={6000}
                    placeholder={'rhythm\nseparate\ncalendar'}
                    placeholderTextColor="#AAA7B5"
                    style={[styles.input, styles.bulkInput]}
                  />
                  <AnimatedPressable onPress={addBulkItems} style={styles.bulkButton}>
                    <Text style={styles.bulkButtonText}>{t('addLines')}</Text>
                    <ArrowRight size={16} color={theme.ink} />
                  </AnimatedPressable>
                </View>
              ) : null}
              <View style={styles.addRow}>
                <TextInput
                  ref={newItemInputRef}
                  value={newItem}
                  onChangeText={setNewItem}
                  onFocus={() => handleInputFocus(newItemInputRef.current)}
                  onSubmitEditing={addItem}
                  returnKeyType="done"
                  maxLength={500}
                  placeholder={t('itemPlaceholder')}
                  placeholderTextColor="#AAA7B5"
                  style={[styles.input, styles.addInput]}
                />
                <AnimatedPressable accessibilityLabel={t('addItemAccessibility')} onPress={addItem} style={styles.addButton}>
                  <Plus size={21} color="white" />
                </AnimatedPressable>
              </View>

              <View style={styles.chipRow}>
                {items.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.itemChip}>
                    <View style={styles.itemChipNumber}><Text style={styles.itemChipNumberText}>{index + 1}</Text></View>
                    <Text numberOfLines={1} style={styles.itemChipText}>{item}</Text>
                    <AnimatedPressable
                      accessibilityLabel={`${t('removeAccessibility')} ${item}`}
                      onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      style={styles.itemChipRemove}>
                      <Trash2 size={13} color={theme.inkSoft} />
                    </AnimatedPressable>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>{t('techniqueDescription')}</Text>
            </View>

            {message && <MessageCard message={message} />}
            <AnimatedPressable onPress={continueToTechniques} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t('continue')}</Text>
              <ArrowRight size={18} color={theme.ink} />
            </AnimatedPressable>
          </>
        ) : (
          <>
            <View style={styles.recommendationBanner}>
              <Text style={styles.recommendationEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendationTitle}>{t('suggestedPath')}</Text>
                <Text style={styles.recommendationBody}>{t('suggestedBody')}</Text>
              </View>
            </View>

            <TechniqueCard
              technique="number-peg"
              recommended={recommendation === 'number-peg'}
              onPress={() => openTechnique('number-peg')}
            />
            <TechniqueCard
              technique="palace"
              recommended={recommendation === 'palace'}
              onPress={() => openTechnique('palace')}
            />

            <AnimatedPressable onPress={() => setStep('content')} style={styles.changeButton}>
              <ArrowLeft size={16} color={theme.inkSoft} />
              <Text style={styles.changeButtonText}>{t('changeList')}</Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TechniqueCard({ technique, recommended, onPress }: { technique: TechniqueChoice; recommended: boolean; onPress: () => void }) {
  const { t } = useTranslation('memoryComposer');
  const isPeg = technique === 'number-peg';
  const bestFor = isPeg
    ? [t('pegShortLists'), t('pegSpellingWords'), t('pegUpToTen')]
    : [t('palaceLongerLists'), t('palaceSequences'), t('palaceNoFixedLimit')];
  return (
    <AnimatedPressable onPress={onPress} style={[styles.techniqueCard, recommended && styles.techniqueCardRecommended]}>
      {recommended && <View style={styles.ribbon}><Text style={styles.ribbonText}>{t('recommended')}</Text></View>}
      <View style={styles.techniqueHead}>
        <View style={[styles.techniqueIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>
          <Text style={styles.techniqueIconEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
        </View>
        <View style={styles.techniqueMeta}>
          <Text style={styles.techniqueName}>{isPeg ? t('numberPegName') : t('memoryPalaceName')}</Text>
          <Text style={styles.techniqueTag}>{isPeg ? t('numberPegTag') : t('memoryPalaceTag')}</Text>
        </View>
        <ArrowRight size={18} color={theme.inkSoft} />
      </View>
      <Text style={styles.techniqueDescription}>
        {isPeg ? t('numberPegDescription') : t('memoryPalaceDescription')}
      </Text>
      <View style={styles.bestForRow}>
        {bestFor.map((label) => (
          <Text key={label} style={styles.bestFor}>{label}</Text>
        ))}
      </View>
    </AnimatedPressable>
  );
}

function MessageCard({ message }: { message: string }) {
  return <View style={styles.messageCard}><Text style={styles.messageText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 42 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.line },
  progressDotActive: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.2 }] },
  progressLine: { width: 70, height: 2, backgroundColor: theme.line, marginHorizontal: 7 },
  progressLineActive: { backgroundColor: theme.sunDeep },
  inputCard: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 20, padding: 16, boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.08)' },
  cardIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F4' },
  cardIconEmoji: { fontSize: 21 },
  cardTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17, marginTop: 10 },
  cardBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4 },
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 18, marginBottom: 8 },
  bulkToggle: { alignSelf: 'flex-start', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -2, marginBottom: 8, paddingHorizontal: 2 },
  bulkToggleText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  bulkToggleEmoji: { fontSize: 15 },
  bulkCard: { borderRadius: 15, borderWidth: 1.5, borderColor: '#FFD2DC', backgroundColor: '#FFF7F9', padding: 10, marginBottom: 10 },
  bulkTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12, marginBottom: 7 },
  bulkInput: { minHeight: 105, paddingTop: 12, textAlignVertical: 'top', backgroundColor: 'white' },
  bulkButton: { minHeight: 40, borderRadius: 11, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  bulkButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  optionalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  input: { minHeight: 49, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 12, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  goalChip: { minWidth: '47%', flexGrow: 1, minHeight: 43, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  goalChipSelected: { borderColor: theme.sunDeep, backgroundColor: '#FFF7E0' },
  goalEmoji: { fontSize: 17 },
  goalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  goalLabelSelected: { color: theme.ink },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1 },
  addButton: { width: 49, minHeight: 49, borderRadius: 13, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: 7, marginTop: 12 },
  itemChip: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: theme.line, borderRadius: 12, backgroundColor: 'white', paddingHorizontal: 8 },
  itemChipNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center' },
  itemChipNumberText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  itemChipText: { flex: 1, color: theme.ink, fontFamily: typography.bodyBold, fontSize: 13 },
  itemChipRemove: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  primaryButton: { minHeight: 53, marginTop: 16, borderRadius: 15, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  primaryButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  messageCard: { marginTop: 13, borderRadius: 13, borderWidth: 1.5, borderColor: '#FFD2DC', backgroundColor: '#FFF0F4', padding: 11 },
  messageText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  recommendationBanner: { flexDirection: 'row', gap: 11, borderRadius: 18, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 14, marginBottom: 16 },
  recommendationEmoji: { fontSize: 27 },
  recommendationTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  recommendationBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17, marginTop: 3 },
  techniqueCard: { position: 'relative', borderWidth: 2, borderColor: theme.line, borderRadius: 20, backgroundColor: theme.paper, padding: 15, marginBottom: 13 },
  techniqueCardRecommended: { borderColor: theme.sunDeep, borderWidth: 2.5 },
  ribbon: { position: 'absolute', right: 13, top: -11, borderRadius: 999, backgroundColor: theme.sun, paddingHorizontal: 10, paddingVertical: 4, boxShadow: '0px 2px 4px rgba(43, 42, 61, 0.15)' },
  ribbonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.4 },
  techniqueHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  techniqueIcon: { width: 47, height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  techniqueIconEmoji: { fontSize: 25 },
  techniqueMeta: { flex: 1, minWidth: 0, paddingTop: 2 },
  techniqueName: { color: theme.ink, fontFamily: typography.display, fontSize: 16, lineHeight: 21 },
  techniqueTag: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, marginTop: 2 },
  techniqueDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  bestForRow: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  bestFor: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodyBold, fontSize: 10.5, backgroundColor: 'white', borderWidth: 1.5, borderColor: theme.line, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  changeButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  changeButtonText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
});
