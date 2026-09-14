import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import type { MemoryGoalType } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ClipboardList, Plus, ScanText } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { firstParam, parseBulkItems, parseComposerGoal, parseComposerItems, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { consumeOcrDraft, saveOcrDraft } from '@/features/memory-composer/utils/ocrDraftStore';
import { buildTechniqueRoute, recommendTechnique, type ComposerOrigin, type TechniqueChoice } from '@/features/memory-composer/utils/techniqueRecommendation';
import { useTranslation } from '@/core/i18n/useTranslation';
import { DraggableMemoryItemRow } from '@/features/memory-composer/components/DraggableMemoryItemRow';
import { reorderItems } from '@/features/memory-composer/utils/reorderItems';

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
      memorySetId ? { memorySetId, expectedVersion: firstParam(params.expectedVersion) ?? '', description: firstParam(params.description) } : undefined) as Href);
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
                placeholderTextColor={theme.inkSoft}
                selectionColor={theme.violetDeep}
                cursorColor={theme.violetDeep}
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
              <View style={styles.importActions}>
                <AnimatedPressable
                  accessibilityLabel={bulkMode ? t('hidePasteMany') : t('pasteManyAccessibility')}
                  onPress={() => { setBulkMode((current) => !current); setMessage(null); }}
                  containerStyle={styles.importActionContainer}
                  style={[styles.importAction, bulkMode && styles.importActionSelected]}>
                  <View style={[styles.importActionIcon, styles.pasteIcon]}>
                    <ClipboardList size={17} color={theme.berryDeep} strokeWidth={2.3} />
                  </View>
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
                  containerStyle={styles.importActionContainer}
                  style={styles.importAction}>
                  <View style={[styles.importActionIcon, styles.scanIcon]}>
                    <ScanText size={17} color={theme.violetDeep} strokeWidth={2.3} />
                  </View>
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
                    placeholder={'rhythm\nseparate\ncalendar'}
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
                <AnimatedPressable accessibilityLabel={t('addItemAccessibility')} onPress={addItem} containerStyle={styles.addButtonContainer} style={styles.addButton}>
                  <Plus size={21} color="white" />
                </AnimatedPressable>
              </View>

              <View style={styles.chipRow}>
                {items.map((item, index) => (
                  <DraggableMemoryItemRow
                    key={item.id}
                    item={{ value: item.value, needsReview: false }}
                    index={index}
                    itemCount={items.length}
                    placeholder={t('itemPlaceholder')}
                    removeLabel={t('removeAccessibility')}
                    reorderLabel={t('scanReorderItem')}
                    reorderHint={t('scanReorderHint')}
                    onChange={(value) =>
                      setItems((current) =>
                        current.map((currentItem, itemIndex) =>
                          itemIndex === index ? { ...currentItem, value } : currentItem
                        )
                      )
                    }
                    onRemove={() =>
                      setItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    onMove={moveItem}
                    onDragStateChange={setIsReordering}
                  />
                ))}
              </View>
              <Text style={styles.hint}>{t('techniqueDescription')}</Text>
            </View>

            {message && <MessageCard message={message} />}
            <AnimatedPressable onPress={continueToTechniques} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t('continue')}</Text>
              <ArrowRight size={18} color={theme.onSun} />
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
  const { styles, theme } = useStyles();
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
  const { styles } = useStyles();
  return <View style={styles.messageCard}><Text style={styles.messageText}>{message}</Text></View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 42 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.line },
  progressDotActive: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.2 }] },
  progressLine: { width: 70, height: 2, backgroundColor: theme.line, marginHorizontal: 7 },
  progressLineActive: { backgroundColor: theme.sunDeep },
  inputCard: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 20, padding: 16, boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.08)' },
  cardIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.berryTint },
  cardIconEmoji: { fontSize: 21 },
  cardTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17, marginTop: 10 },
  cardBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4 },
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 18, marginBottom: 8 },
  importActions: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: -2, marginBottom: 10 },
  importActionContainer: { flex: 1, minWidth: 0 },
  importAction: { width: '100%', minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 10, boxShadow: '0px 2px 8px rgba(43, 42, 61, 0.06)' },
  importActionSelected: { borderColor: theme.berry, backgroundColor: theme.berryTint },
  importActionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pasteIcon: { backgroundColor: theme.berryTint },
  scanIcon: { backgroundColor: theme.violetTint },
  importActionText: { flex: 1, color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11.5, lineHeight: 15 },
  bulkCard: { borderRadius: 15, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint, padding: 10, marginBottom: 10 },
  bulkTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12, marginBottom: 7 },
  bulkInput: { minHeight: 105, paddingTop: 12, textAlignVertical: 'top', backgroundColor: theme.paper },
  bulkButton: { minHeight: 44, borderRadius: 11, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  bulkButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  optionalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  input: { minHeight: 49, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 12, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  goalChip: { minWidth: '47%', flexGrow: 1, minHeight: 44, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  goalChipSelected: { borderColor: theme.sunDeep, backgroundColor: theme.sunTint },
  goalEmoji: { fontSize: 17 },
  goalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  goalLabelSelected: { color: theme.ink },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1 },
  addButtonContainer: { width: 52, minHeight: 52 },
  addButton: { width: '100%', minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.night, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: 7, marginTop: 12 },
  hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  primaryButton: { minHeight: 53, marginTop: 16, borderRadius: 15, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  primaryButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  messageCard: { marginTop: 13, borderRadius: 13, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint, padding: 11 },
  messageText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  recommendationBanner: { flexDirection: 'row', gap: 11, borderRadius: 18, borderWidth: 1.5, borderColor: theme.sunLine, backgroundColor: theme.sunTint, padding: 14, marginBottom: 16 },
  recommendationEmoji: { fontSize: 27 },
  recommendationTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  recommendationBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17, marginTop: 3 },
  techniqueCard: { position: 'relative', borderWidth: 2, borderColor: theme.line, borderRadius: 20, backgroundColor: theme.paper, padding: 15, marginBottom: 13 },
  techniqueCardRecommended: { borderColor: theme.sunDeep, borderWidth: 2.5 },
  ribbon: { position: 'absolute', right: 13, top: -11, borderRadius: 999, backgroundColor: theme.sun, paddingHorizontal: 10, paddingVertical: 4, boxShadow: '0px 2px 4px rgba(43, 42, 61, 0.15)' },
  ribbonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.4 },
  techniqueHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  techniqueIcon: { width: 47, height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pegIcon: { backgroundColor: theme.berryTint },
  palaceIcon: { backgroundColor: theme.violetTint },
  techniqueIconEmoji: { fontSize: 25 },
  techniqueMeta: { flex: 1, minWidth: 0, paddingTop: 2 },
  techniqueName: { color: theme.ink, fontFamily: typography.display, fontSize: 16, lineHeight: 21 },
  techniqueTag: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, marginTop: 2 },
  techniqueDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  bestForRow: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  bestFor: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodyBold, fontSize: 10.5, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  changeButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  changeButtonText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
}));
