import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import type { MemoryGoalType } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ClipboardList, Plus, ScanText } from '@/core/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { firstParam, parseBulkItems, parseComposerGoal, parseComposerItems, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { consumeOcrDraft, saveOcrDraft } from '@/features/memory-composer/utils/ocrDraftStore';
import { buildTechniqueRoute, recommendTechnique, type ComposerOrigin, type TechniqueChoice } from '@/features/memory-composer/utils/techniqueRecommendation';
import { useTranslation } from '@/core/i18n/useTranslation';
import { DraggableMemoryItemRow, MemoryItemReorderProvider } from '@/features/memory-composer/components/DraggableMemoryItemRow';
import { reorderItems } from '@/features/memory-composer/utils/reorderItems';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ComposerStep = 'content' | 'technique';
type ComposerItem = { id: string; value: string };

let nextComposerItemId = 0;
const makeComposerItem = (value: string): ComposerItem => ({
  id: `composer-item-${++nextComposerItemId}`,
  value,
});

const goals: { key: MemoryGoalType; translationKey: 'goalSpelling' | 'goalList' | 'goalFacts' | 'goalOther'; emoji: string }[] = [
  { key: 'spelling', translationKey: 'goalSpelling', emoji: '✏️' },
  { key: 'ordered-list', translationKey: 'goalList', emoji: '🛒' },
  { key: 'facts', translationKey: 'goalFacts', emoji: '💡' },
  { key: 'custom', translationKey: 'goalOther', emoji: '✨' },
];

type MemoryComposerProps = {
  /** Keep the shared content step while routing directly to one technique. */
  initialTechnique?: TechniqueChoice;
  /** Preserve a Palace scene selected before the content-first flow. */
  initialSceneId?: string;
};

export default function MemoryComposerScreen({ initialTechnique, initialSceneId }: MemoryComposerProps = {}) {
  const { styles, theme } = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    items?: string | string[];
    goalType?: string | string[];
    sceneId?: string | string[];
    editContent?: string | string[];
    ocrDraftId?: string | string[];
    memoryFolderId?: string | string[];
    memorySetId?: string | string[];
    expectedVersion?: string | string[];
    description?: string | string[];
    predefinedLessonId?: string | string[];
  }>();
  const { t } = useTranslation('memoryComposer');
  const initialItems = useMemo(() => parseComposerItems(params.items), [params.items]);
  const sceneId = initialSceneId ?? firstParam(params.sceneId);
  const origin: ComposerOrigin = initialTechnique === 'palace' ? 'palace' : 'global';
  const [step, setStep] = useState<ComposerStep>('content');
  const [title, setTitle] = useState(() => firstParam(params.title) ?? '');
  const [goalType, setGoalType] = useState<MemoryGoalType>(() => parseComposerGoal(params.goalType));
  const [newItem, setNewItem] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [items, setItems] = useState<ComposerItem[]>(() => initialItems.map(makeComposerItem));
  const [message, setMessage] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [isReordering, setIsReordering] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const scrollOffsetRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<TextInput>(null);
  const bulkInputRef = useRef<TextInput>(null);
  const newItemInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const draft = consumeOcrDraft(firstParam(params.ocrDraftId));
    if (!draft?.items.length) return;

    setItems((current) => {
      const seen = new Set<string>();
      return [
        ...current.map((item) => ({ ...item, value: item.value.trim() })),
        ...draft.items.map((item) => makeComposerItem(item.trim())),
      ]
        .filter((item) => {
          const key = item.value.normalize('NFKC').toLocaleLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 100);
    });
    if (draft.title) setTitle((current) => current || draft.title!);
    if (draft.goalType) setGoalType(parseComposerGoal(draft.goalType));
    setMessage(t('scanAddedMessage').replace('{count}', String(draft.items.length)));
  }, [params.ocrDraftId, t]);

  useEffect(() => {
    if (firstParam(params.editContent) === '1') setStep('content');
  }, [params.editContent]);

  const itemValues = useMemo(() => items.map((item) => item.value), [items]);
  const recommendation = useMemo(() => recommendTechnique(goalType, items.length), [goalType, items.length]);

  const keepFocusedInputVisible = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const input = focusedInputRef.current;
      const scrollView = scrollViewRef.current;
      if (!input || !scrollView) return;

      scrollView.getNativeScrollRef()?.measureInWindow((_scrollX, scrollY, _scrollWidth, scrollHeight) => {
        input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
          const keyboardTop = Keyboard.metrics?.()?.screenY ?? scrollY + scrollHeight;
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
    setItems((current) => [...current, makeComposerItem(value)]);
    setNewItem('');
    setMessage(null);
  };

  const addBulkItems = () => {
    const pastedItems = parseBulkItems(bulkInput, 100 - items.length);
    if (!pastedItems.length) {
      setMessage(t('pasteManyMessage'));
      return;
    }
    setItems((current) => [...current, ...pastedItems.map(makeComposerItem)]);
    setBulkInput('');
    setBulkMode(false);
    setMessage(null);
  };

  const moveItem = useCallback((from: number, to: number) => {
    setItems((current) => reorderItems(current, from, to));
  }, []);

  const continueToTechniques = () => {
    if (!items.length) {
      setMessage(t('addThingMessage'));
      return;
    }
    const resolvedTitle = title.trim() || suggestMemoryTitle(goalType, itemValues);
    if (!title.trim()) setTitle(resolvedTitle);
    setMessage(null);

    if (initialTechnique) {
      openTechnique(initialTechnique, resolvedTitle);
      return;
    }

    setStep('technique');
  };

  const openTechnique = (technique: TechniqueChoice, routeTitle = title.trim()) => {
    const memorySetId = firstParam(params.memorySetId);
    router.push(buildTechniqueRoute(technique, routeTitle, goalType, itemValues, sceneId, origin, firstParam(params.memoryFolderId),
      memorySetId ? { memorySetId, expectedVersion: firstParam(params.expectedVersion) ?? '', description: firstParam(params.description) } : undefined,
      firstParam(params.predefinedLessonId)) as Href);
  };

  const handleBack = () => {
    if (step === 'technique') {
      setStep('content');
      return;
    }

    // The composer can be opened directly from a deep link. In that case
    // there is no stack entry for router.back() to pop.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as Href);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader
        eyebrow={initialTechnique ? t(initialTechnique === 'palace' ? 'memoryPalaceName' : 'numberPegName') : t('eyebrow')}
        title={step === 'content' ? t('addContent') : t('pickTechnique')}
        description={step === 'content' ? t('contentDescription') : t('techniqueDescription')}
        backAction={handleBack}
      />

      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        scrollEnabled={!isReordering}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => { scrollOffsetRef.current = event.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, keyboardInset > 0 && { paddingBottom: 24 }]}>
        <View style={styles.progressRow}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, step === 'content' && styles.progressDotActive]}>
              <Text style={[styles.progressNumber, step === 'content' && styles.progressNumberActive]}>1</Text>
            </View>
            <Text style={[styles.progressLabel, step === 'content' && styles.progressLabelActive]}>{t('contentStepLabel')}</Text>
          </View>
          <View style={[styles.progressLine, step === 'technique' && styles.progressLineActive]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, step === 'technique' && styles.progressDotActive]}>
              <Text style={[styles.progressNumber, step === 'technique' && styles.progressNumberActive]}>2</Text>
            </View>
            <Text style={[styles.progressLabel, step === 'technique' && styles.progressLabelActive]}>{t('techniqueStepLabel')}</Text>
          </View>
        </View>

        {step === 'content' ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeadingRow}>
                <View>
                  <Text style={styles.sectionTitle}>{t('whatFor')}</Text>
                  <Text style={styles.sectionSubtitle}>{t('goalSelectionHint')}</Text>
                </View>
              </View>
              <View style={styles.goalGrid}>
                {goals.map((goal) => {
                  const selected = goal.key === goalType;
                  return (
                    <AnimatedPressable
                      key={goal.key}
                      onPress={() => { setGoalType(goal.key); setMessage(null); }}
                      style={[styles.goalChip, selected && styles.goalChipSelected]}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                      <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>{t(goal.translationKey)}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeadingRow}>
                <View>
                  <Text style={styles.sectionTitle}>{t('addItems')}</Text>
                  <Text style={styles.sectionSubtitle}>{t('addContentHint')}</Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{t('itemCount').replace('{count}', String(items.length))}</Text>
                </View>
              </View>
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
                  placeholderTextColor={theme.inkSoft}
                  selectionColor={theme.violetDeep}
                  cursorColor={theme.violetDeep}
                  style={[styles.input, styles.addInput]}
                />
                <AnimatedPressable accessibilityLabel={t('addItemAccessibility')} onPress={addItem} pressOnIn containerStyle={styles.addButtonContainer} style={styles.addButton}>
                  <Plus size={21} color="white" />
                </AnimatedPressable>
              </View>
              <View style={styles.importActions}>
                <AnimatedPressable
                  accessibilityLabel={bulkMode ? t('hidePasteMany') : t('pasteManyAccessibility')}
                  onPress={() => { setBulkMode((current) => !current); setMessage(null); }}
                  style={[styles.importAction, bulkMode && styles.importActionSelected]}>
                  <ClipboardList size={16} color={theme.violetDeep} strokeWidth={2.2} />
                  <Text style={styles.importActionText}>{bulkMode ? t('addOne') : t('pasteMany')}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  accessibilityLabel={t('scanFromPhotoAccessibility')}
                  onPress={() => {
                    const draftId = saveOcrDraft(itemValues, {
                      title: title.trim() || undefined,
                      goalType,
                    });
                    router.push(`/scan-memory?sourceDraftId=${encodeURIComponent(draftId)}` as Href);
                  }}
                  style={styles.importAction}>
                  <ScanText size={16} color={theme.violetDeep} strokeWidth={2.2} />
                  <Text style={styles.importActionText}>{t('scanFromPhoto')}</Text>
                </AnimatedPressable>
              </View>
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
                    placeholder={t('bulkPlaceholder')}
                    placeholderTextColor={theme.inkSoft}
                    selectionColor={theme.violetDeep}
                    cursorColor={theme.violetDeep}
                    style={[styles.input, styles.bulkInput]}
                  />
                  <AnimatedPressable onPress={addBulkItems} style={styles.bulkButton}>
                    <Text style={styles.bulkButtonText}>{t('addLines')}</Text>
                    <ArrowRight size={16} color={theme.onSun} />
                  </AnimatedPressable>
                </View>
              ) : null}
              <MemoryItemReorderProvider>
                <View style={styles.chipRow}>
                  {items.length ? items.map((item, index) => (
                    <DraggableMemoryItemRow
                      key={item.id}
                      item={{ value: item.value, needsReview: false }}
                      index={index}
                      itemCount={items.length}
                      placeholder={t('itemPlaceholder')}
                      removeLabel={t('removeAccessibility')}
                      reorderLabel={t('scanReorderItem')}
                      reorderHint={t('scanReorderHint')}
                      onChange={(value) => setItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, value } : currentItem))}
                      onRemove={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      onMove={moveItem}
                      onDragStateChange={setIsReordering}
                    />
                  )) : (
                    <View style={styles.emptyItems}>
                      <Text style={styles.emptyItemsText}>{t('emptyItemsHint')}</Text>
                    </View>
                  )}
                </View>
              </MemoryItemReorderProvider>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('memoryName')} <Text style={styles.optionalLabel}>{t('optional')}</Text></Text>
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={(value) => { setTitle(value); setMessage(null); }}
                onFocus={() => handleInputFocus(titleInputRef.current)}
                maxLength={200}
                placeholder={t('memoryPlaceholder')}
                placeholderTextColor={theme.inkSoft}
                selectionColor={theme.violetDeep}
                cursorColor={theme.violetDeep}
                style={styles.input}
              />
            </View>

            {message && <MessageCard message={message} />}
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
      {step === 'content' && keyboardInset === 0 ? (
        <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <AnimatedPressable
            disabled={!items.length || isReordering}
            onPress={continueToTechniques}
            style={[styles.primaryButton, (!items.length || isReordering) && styles.primaryButtonDisabled]}>
            <Text style={[styles.primaryButtonText, (!items.length || isReordering) && styles.primaryButtonTextDisabled]}>
              {items.length ? t('continueWithItems').replace('{count}', String(items.length)) : t('addFirstItem')}
            </Text>
            <ArrowRight size={18} color={!items.length || isReordering ? theme.inkSoft : theme.onSun} />
          </AnimatedPressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function TechniqueCard({ technique, recommended, onPress }: { technique: TechniqueChoice; recommended: boolean; onPress: () => void }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('memoryComposer');
  const isPeg = technique === 'number-peg';
  const bestFor = isPeg
    ? [t('pegShortLists'), t('pegSpellingWords'), t('pegUpToTen')]
    : [t('palaceLongerLists'), t('palaceSequences'), t('palaceNoFixedLimit')];
  return (
    <AnimatedPressable onPress={onPress} style={[styles.techniqueCard, isPeg ? styles.techniqueCardPeg : styles.techniqueCardPalace, recommended && styles.techniqueCardRecommended]}>
      {recommended && <View style={styles.ribbon}><Text style={styles.ribbonText}>{t('recommended')}</Text></View>}
      <View style={styles.techniqueHead}>
        <View style={[styles.techniqueIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>
          <Text style={styles.techniqueIconEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
        </View>
        <View style={styles.techniqueMeta}>
          <Text style={styles.techniqueName}>{isPeg ? t('numberPegName') : t('memoryPalaceName')}</Text>
          <Text style={styles.techniqueTag}>{isPeg ? t('numberPegTag') : t('memoryPalaceTag')}</Text>
        </View>
        <View style={[styles.techniqueArrow, isPeg ? styles.pegArrow : styles.palaceArrow]}>
          <ArrowRight size={17} color={isPeg ? theme.berryDeep : theme.violetDeep} />
        </View>
      </View>
      <View style={[styles.descriptionBox, isPeg ? styles.pegDescriptionBox : styles.palaceDescriptionBox]}>
        <Text style={styles.descriptionLabel}>{t('whyItFits')}</Text>
        <Text style={[styles.techniqueDescription, isPeg ? styles.pegDescription : styles.palaceDescription]}>
          {isPeg ? t('numberPegDescription') : t('memoryPalaceDescription')}
        </Text>
      </View>
      <View style={styles.bestForHeader}><Text style={styles.bestForLabel}>{t('bestFor')}</Text></View>
      <View style={styles.bestForRow}>
        {bestFor.map((label) => (
          <Text key={label} style={[styles.bestFor, isPeg ? styles.pegBestFor : styles.palaceBestFor]}>{label}</Text>
        ))}
      </View>
    </AnimatedPressable>
  );
}

function MessageCard({ message }: { message: string }) {
  const { styles } = useStyles();
  return <View style={styles.messageCard}><Text style={styles.messageText}>{message}</Text></View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 124, gap: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  progressStep: { alignItems: 'center', gap: 5 },
  progressDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: theme.violetDeep },
  progressNumber: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  progressNumberActive: { color: theme.paper },
  progressLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  progressLabelActive: { color: theme.violetDeep },
  progressLine: { flex: 1, height: 2, backgroundColor: theme.line, marginHorizontal: 12, marginBottom: 16 },
  progressLineActive: { backgroundColor: theme.violetDeep },
  section: { gap: 10 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16, lineHeight: 21 },
  sectionSubtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 15, marginTop: 2 },
  countPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.violetTint },
  countText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  cardIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.berryTint },
  cardIconEmoji: { fontSize: 21 },
  cardTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17, marginTop: 10 },
  cardBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4 },
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 18, marginBottom: 8 },
  importActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importActionContainer: { flex: 1, minWidth: 0 },
  importAction: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 8 },
  importActionSelected: { borderColor: theme.berry, backgroundColor: theme.berryTint },
  importActionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pasteIcon: { backgroundColor: theme.berryTint },
  scanIcon: { backgroundColor: theme.violetTint },
  importActionText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11, lineHeight: 15, flexShrink: 1, textAlign: 'center' },
  bulkCard: { borderRadius: 15, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint, padding: 10, marginBottom: 10 },
  bulkTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12, marginBottom: 7 },
  bulkInput: { minHeight: 105, paddingTop: 12, textAlignVertical: 'top', backgroundColor: theme.paper },
  bulkButton: { minHeight: 44, borderRadius: 11, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  bulkButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  optionalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  input: { minHeight: 49, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 12, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: { flexBasis: '48%', flexGrow: 1, minHeight: 58, borderRadius: 15, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 9 },
  goalChipSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
  goalEmoji: { fontSize: 22 },
  goalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12.5 },
  goalLabelSelected: { color: theme.ink },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1 },
  addButtonContainer: { width: 52, minHeight: 52 },
  addButton: { width: '100%', minHeight: 52, borderRadius: 15, borderWidth: 1.5, borderColor: theme.violetDeep, backgroundColor: theme.violetDeep, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: 8 },
  emptyItems: { minHeight: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.line, backgroundColor: theme.paper },
  emptyItemsText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },
  hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  bottomDock: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.canvas, borderTopWidth: 1, borderTopColor: theme.line },
  primaryButton: { minHeight: 53, borderRadius: 15, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0px 4px 0px ${theme.sunDeep}` },
  primaryButtonDisabled: { backgroundColor: theme.line, boxShadow: 'none' },
  primaryButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  primaryButtonTextDisabled: { color: theme.inkSoft },
  messageCard: { marginTop: 13, borderRadius: 13, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint, padding: 11 },
  messageText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  recommendationBanner: { flexDirection: 'row', gap: 11, borderRadius: 18, borderWidth: 1.5, borderColor: theme.sunLine, backgroundColor: theme.sunTint, padding: 14, marginBottom: 16 },
  recommendationEmoji: { fontSize: 27 },
  recommendationTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  recommendationBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17, marginTop: 3 },
  techniqueCard: { position: 'relative', borderWidth: 1.5, borderColor: theme.line, borderRadius: 22, backgroundColor: theme.paper, padding: 16, marginBottom: 13, shadowColor: theme.ink, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  techniqueCardPeg: { borderColor: theme.berryLine, backgroundColor: theme.berryTint },
  techniqueCardPalace: { borderColor: theme.violetLine, backgroundColor: theme.violetTint },
  techniqueCardRecommended: { borderColor: theme.sunDeep, borderWidth: 2.5 },
  ribbon: { position: 'absolute', right: 13, top: -11, borderRadius: 999, backgroundColor: theme.sun, paddingHorizontal: 10, paddingVertical: 4, boxShadow: '0px 2px 4px rgba(43, 42, 61, 0.15)' },
  ribbonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.4 },
  techniqueHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  techniqueIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  pegIcon: { backgroundColor: theme.paper, borderColor: theme.berryLine },
  palaceIcon: { backgroundColor: theme.paper, borderColor: theme.violetLine },
  techniqueIconEmoji: { fontSize: 27 },
  techniqueMeta: { flex: 1, minWidth: 0, paddingTop: 2 },
  techniqueName: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17, lineHeight: 22 },
  techniqueTag: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11, lineHeight: 16, marginTop: 3, opacity: 0.7 },
  techniqueArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pegArrow: { backgroundColor: theme.berryTint },
  palaceArrow: { backgroundColor: theme.violetTint },
  descriptionBox: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9, marginTop: 14 },
  pegDescriptionBox: { backgroundColor: theme.paper, borderColor: theme.berryLine },
  palaceDescriptionBox: { backgroundColor: theme.paper, borderColor: theme.violetLine },
  descriptionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 3 },
  techniqueDescription: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17 },
  pegDescription: { color: theme.berryDeep },
  palaceDescription: { color: theme.violetDeep },
  bestForHeader: { marginTop: 11 },
  bestForLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase' },
  bestForRow: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  bestFor: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodyBold, fontSize: 10.5, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pegBestFor: { color: theme.berryDeep, borderColor: theme.berryLine },
  palaceBestFor: { color: theme.violetDeep, borderColor: theme.violetLine },
  changeButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  changeButtonText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
}));
