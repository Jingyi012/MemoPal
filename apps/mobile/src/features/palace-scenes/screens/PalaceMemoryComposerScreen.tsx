import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { useMemorySetMutations } from '@/features/memory-sets';
import type { MemorySetUpsertRequest } from '@/features/memory-sets';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { PalaceAssociationEditor } from '@/features/palace-scenes/components/PalaceAssociationEditor';
import { PalaceLocusMap } from '@/features/palace-scenes/components/PalaceLocusMap';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { useGeneratePalaceAssociations } from '@/features/palace-scenes/hooks/useGeneratePalaceAssociations';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { getPalaceLocusDescription, getPalaceLocusName } from '@/features/palace-scenes/utils/palaceLocalization';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import {
  choosePalaceScene,
  getAvailablePalaceScenes,
  getPalaceCapacity,
  getPalaceLoci,
  getPalaceCapacityShortfall,
  getLargestPalaceCapacity,
  sceneFitsPalaceItems,
} from '@/features/palace-scenes/utils/palaceCapacity';
import {
  createPalaceAssociation,
  ensurePalaceAssociations,
  getAssociationText,
} from '@/features/palace-scenes/utils/palaceAuthoring';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, ChevronRight, ChevronUp, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { firstParam, parseComposerGoal, parseComposerItems, parseComposerOrigin, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import type { ComposerOrigin } from '@/features/memory-composer/utils/techniqueRecommendation';
import { ComposerProgress } from '@/features/memory-composer/components/ComposerProgress';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type ComposerStep = 'setup' | 'place';
const MAX_PALACE_ITEMS = 100;

export default function PalaceMemoryComposerScreen() {
  const { language, t } = useTranslation('palace');
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    items?: string | string[];
    goalType?: string | string[];
    sceneId?: string | string[];
    origin?: string | string[];
  }>();
  const scenesQuery = usePalaceScenes();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { createMemorySet } = useMemorySetMutations();
  const generatePalaceAssociations = useGeneratePalaceAssociations();
  const prefilledItems = useMemo(() => parseComposerItems(params.items), [params.items]);
  const fromSharedComposer = prefilledItems.length > 0;
  const [step, setStep] = useState<ComposerStep>('setup');
  const [title, setTitle] = useState(() => firstParam(params.title) ?? '');
  const [goalType] = useState(() => parseComposerGoal(params.goalType));
  const [newItem, setNewItem] = useState('');
  const [items, setItems] = useState<string[]>(() => prefilledItems);
  const [associations, setAssociations] = useState<string[]>([]);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [activeLocusIndex, setActiveLocusIndex] = useState(0);
  const [selectedSceneId, setSelectedSceneId] = useState(() => firstParam(params.sceneId) ?? '');
  const origin: ComposerOrigin = parseComposerOrigin(params.origin);
  const availableScenes = useMemo(
    () => getAvailablePalaceScenes(scenesQuery.data ?? [], Boolean(user?.isPremium)),
    [scenesQuery.data, user?.isPremium],
  );
  const sceneAvailabilityLoading = scenesQuery.isLoading || isUserLoading;
  const [message, setMessage] = useState<string | null>(null);
  const [showAllScenes, setShowAllScenes] = useState(false);
  const [sceneSearch, setSceneSearch] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const titleInputRef = useRef<TextInput>(null);
  const newItemInputRef = useRef<TextInput>(null);
  const scrollOffsetRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationVersionRef = useRef(0);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const returnToSharedComposer = (editContent = false) => {
    router.dismissTo({
      pathname: origin === 'global' ? '/create-memory' : '/palaces/create-memory',
      params: {
        title,
        goalType,
        items: JSON.stringify(items),
        editContent: editContent ? '1' : '0',
        ...(selectedSceneId ? { sceneId: selectedSceneId } : {}),
      },
    });
  };

  const keepFocusedInputVisible = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const input = focusedInputRef.current;
      const scrollView = scrollRef.current;
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
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardInset(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [keepFocusedInputVisible]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }, [step]);

  useEffect(() => {
    if (sceneAvailabilityLoading) return;
    if (!availableScenes.length) {
      if (selectedSceneId) setSelectedSceneId('');
      return;
    }
    const requestedSceneId = firstParam(params.sceneId);
    const selectedSceneIsValid = availableScenes.some(
      (scene) => scene.id === selectedSceneId && sceneFitsPalaceItems(scene, items.length),
    );
    if (selectedSceneIsValid) return;
    const suggestedScene = choosePalaceScene(availableScenes, items.length, requestedSceneId);
    if (suggestedScene) setSelectedSceneId(suggestedScene.id);
    else if (selectedSceneId) setSelectedSceneId('');
  }, [availableScenes, items.length, params.sceneId, sceneAvailabilityLoading, selectedSceneId]);

  const selectedScene = useMemo(
    () => availableScenes.find((scene) => scene.id === selectedSceneId && sceneFitsPalaceItems(scene, items.length)),
    [availableScenes, items.length, selectedSceneId]
  );
  const loci = useMemo(() => getPalaceLoci(selectedScene), [selectedScene]);
  // A scene may have more authored stops than this memory needs. During
  // placement, keep the route focused on the first locus for each item and
  // hide unused markers/cards instead of presenting empty locations.
  const placementLoci = useMemo(() => loci.slice(0, items.length), [items.length, loci]);
  const largestAvailableCapacity = getLargestPalaceCapacity(availableScenes);
  const noFittingScene = !sceneAvailabilityLoading && items.length > largestAvailableCapacity;
  const capacityMessage = noFittingScene
    ? t('noSceneFitsBody')
      .replace('{capacity}', String(largestAvailableCapacity))
      .replace('{needed}', String(getPalaceCapacityShortfall(items.length, largestAvailableCapacity)))
    : null;

  const matchingScenes = useMemo(() => {
    const query = sceneSearch.trim().toLocaleLowerCase();
    if (!query) return availableScenes;
    return availableScenes.filter((scene) =>
      `${scene.name} ${scene.description}`.toLocaleLowerCase().includes(query),
    );
  }, [availableScenes, sceneSearch]);

  const visibleScenes = useMemo(() => {
    if (showAllScenes || sceneSearch.trim()) return matchingScenes;
    const selected = matchingScenes.find((scene) => scene.id === selectedSceneId);
    const remaining = matchingScenes.filter((scene) => scene.id !== selectedSceneId);
    return selected ? [selected, ...remaining].slice(0, 4) : remaining.slice(0, 4);
  }, [matchingScenes, sceneSearch, selectedSceneId, showAllScenes]);

  const capacityHint = (scene: PalaceScene) => t('capacityReason')
    .replace('{capacity}', String(getPalaceCapacity(scene)))
    .replace('{needed}', String(getPalaceCapacityShortfall(items.length, getPalaceCapacity(scene))));

  useEffect(() => {
    if (!loci.length || !items.length) return;
    setAssociations((current) => ensurePalaceAssociations(items, loci, current));
    setActiveLocusIndex((current) => Math.min(current, items.length - 1));
  }, [items, loci]);

  useEffect(() => {
    // A request may finish after the user changes the list or scene. Ignore
    // that stale result instead of replacing newly edited associations.
    generationVersionRef.current += 1;
    setGenerationMessage(null);
  }, [items, selectedSceneId]);

  const generateAssociations = async () => {
    if (!selectedScene || !items.length || !placementLoci.length || generatePalaceAssociations.isPending) {
      return;
    }

    const generationVersion = generationVersionRef.current;
    const requestItems = [...items];
    const requestLoci = [...placementLoci];
    setGeneratingIndex(null);
    setGenerationMessage(null);
    try {
      const result = await generatePalaceAssociations.mutateAsync({
        locale: language === 'zh' ? 'zh' : 'en',
        style: 'vivid',
        chainMode: false,
        items: requestItems.map((word, index) => {
          const locus = requestLoci[index];
          return {
            position: index + 1,
            word,
            locusName: locus ? getPalaceLocusName(locus, language) : `${t('loci')} ${index + 1}`,
            locusDescription: locus
              ? getPalaceLocusDescription(locus, language, t('locusDescriptionFallback'))
              : t('locusDescriptionFallback'),
          };
        }),
      });
      if (generationVersion !== generationVersionRef.current) return;
      const suggestions = new Map(
        result.suggestions.map((suggestion) => [suggestion.position, suggestion.associationText]),
      );
      setAssociations((current) => requestItems.map((item, index) => {
        const locus = requestLoci[index];
        return suggestions.get(index + 1)
          ?? current[index]
          ?? createPalaceAssociation(item, locus ? getPalaceLocusName(locus, language) : `${t('loci')} ${index + 1}`);
      }));
      const messageKey = result.source === 'template'
        ? 'aiGeneratedTemplate'
        : result.source === 'mixed'
          ? 'aiGeneratedMixed'
          : 'aiGenerated';
      setGenerationMessage(t(messageKey).replace('{count}', String(result.generatedCount)));
    } catch {
      setGenerationMessage(t('aiGenerationFailed'));
    }
  };

  const generateCurrentAssociation = async () => {
    if (!selectedScene || !items.length || !placementLoci.length || generatePalaceAssociations.isPending) {
      return;
    }

    const index = Math.min(Math.max(activeLocusIndex, 0), items.length - 1);
    const locus = placementLoci[index];
    const generationVersion = generationVersionRef.current;
    const requestItem = items[index];
    setGeneratingIndex(index);
    setGenerationMessage(null);
    try {
      const result = await generatePalaceAssociations.mutateAsync({
        locale: language === 'zh' ? 'zh' : 'en',
        style: 'vivid',
        chainMode: false,
        items: [{
          position: index + 1,
          word: requestItem,
          locusName: locus ? getPalaceLocusName(locus, language) : `${t('loci')} ${index + 1}`,
          locusDescription: locus
            ? getPalaceLocusDescription(locus, language, t('locusDescriptionFallback'))
            : t('locusDescriptionFallback'),
        }],
      });
      if (generationVersion !== generationVersionRef.current) return;
      const suggestion = result.suggestions.find((entry) => entry.position === index + 1);
      if (!suggestion) {
        setGenerationMessage(t('aiGenerationFailed'));
        return;
      }
      setAssociations((current) => current.map((entry, entryIndex) => (
        entryIndex === index ? suggestion.associationText : entry
      )));
      const messageKey = result.source === 'template' ? 'aiGeneratedTemplate' : 'aiGenerated';
      setGenerationMessage(t(messageKey).replace('{count}', '1'));
    } catch {
      setGenerationMessage(t('aiGenerationFailed'));
    } finally {
      setGeneratingIndex(null);
    }
  };

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    if (items.length >= MAX_PALACE_ITEMS) {
      setMessage(t('maxItemsMessage'));
      return;
    }
    setItems((current) => [...current, value]);
    const locus = loci[items.length];
    setAssociations((current) => [
      ...current,
      createPalaceAssociation(value, locus ? getPalaceLocusName(locus, language) : `locus ${items.length + 1}`),
    ]);
    setActiveLocusIndex(items.length);
    setNewItem('');
    setMessage(null);
    createMemorySet.reset();
  };

  const continueToPlacement = () => {
    if (!items.length) {
      setMessage(t('addThingToRemember'));
      return;
    }
    if (!selectedScene) {
      setMessage(noFittingScene ? capacityMessage : t('chooseSceneBeforePlace'));
      return;
    }
    if (!sceneFitsPalaceItems(selectedScene, items.length)) {
      setMessage(
        capacityMessage ?? t('chooseSceneBeforePlace'),
      );
      return;
    }
    setMessage(null);
    setActiveLocusIndex(0);
    setStep('place');
  };

  const selectScene = (scene: PalaceScene) => {
    const fits = sceneFitsPalaceItems(scene, items.length);
    if (!fits) {
      setMessage(
        t('capacityReason')
          .replace('{capacity}', String(getPalaceCapacity(scene)))
          .replace('{needed}', String(getPalaceCapacityShortfall(items.length, getPalaceCapacity(scene)))),
      );
      return;
    }
    setSelectedSceneId(scene.id);
    const sceneLoci = getPalaceLoci(scene);
    setAssociations(items.map((item, index) => {
      const locus = sceneLoci[index];
      return createPalaceAssociation(item, locus ? getPalaceLocusName(locus, language) : `locus ${index + 1}`);
    }));
    setGenerationMessage(null);
    setActiveLocusIndex(0);
    setMessage(null);
  };

  const save = () => {
    if (!items.length) return setMessage(t('addThingToRemember'));
    if (!selectedScene) return setMessage(noFittingScene ? capacityMessage : t('chooseSceneForPalace'));
    if (!loci.length) return setMessage(t('sceneOnlyHas') + ' 0 ' + t('loci'));
    if (!sceneFitsPalaceItems(selectedScene, items.length)) {
      return setMessage(
        t('noSceneFitsBody')
          .replace('{capacity}', String(largestAvailableCapacity))
          .replace('{needed}', String(getPalaceCapacityShortfall(items.length, largestAvailableCapacity))),
      );
    }
    const normalizedTitle = title.trim() || suggestMemoryTitle('custom', items);
    if (!title.trim()) setTitle(normalizedTitle);

    setMessage(null);

    void (async () => {
      try {
        const request: MemorySetUpsertRequest = {
          title: normalizedTitle,
          goalType,
          techniqueKey: 'palace',
          status: 'ready',
          visibility: 'private',
          items: items.map((answer, index) => ({ position: index + 1, prompt: `Recall locus ${index + 1}`, answer })),
          techniquePlan: {
            schemaVersion: 1,
            palaceSceneId: selectedScene.id,
            pegBindings: [],
            palaceBindings: items.map((answer, index) => {
              const locus = loci[index];
              return {
                itemPosition: index + 1,
                locusId: locus.id,
                associationText: getAssociationText(associations, index, answer, locus),
                isCustomScene: true,
              };
            }),
          },
        };
        const created = await createMemorySet.mutateAsync(request);
        if (created) {
          const returnTo = fromSharedComposer ? 'practice' : 'palaces';
          router.replace(`/palaces/memory/${created.id}?returnTo=${returnTo}` as Href);
        }
      } catch {
        // Keep the authored items and associations visible so saving can be retried.
      }
    })();
  };

  const error = createMemorySet.isError
    ? getNumberPegErrorMessage(createMemorySet.error, t('couldNotSave'))
    : scenesQuery.isError
      ? getNumberPegErrorMessage(scenesQuery.error, t('couldNotLoad'))
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={step === 'setup' ? t('makePlace') : t('placeMemories')}
        description={t('description')}
        backAction={() => {
          if (step === 'place') {
            setMessage(null);
            setStep('setup');
            return;
          }
          if (fromSharedComposer) {
            returnToSharedComposer();
            return;
          }
          router.back();
        }}
      />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, keyboardInset > 0 && { paddingBottom: keyboardInset + 24 }]}>
        {step === 'setup' && <ComposerProgress currentStep={1} firstLabel={t('chooseRoom')} secondLabel={t('placeMemoriesStep')} />}
        {step === 'setup' && (
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>🏡</Text>
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{t('routeTitle')}</Text>
              <Text style={styles.infoText}>{t('routeBody')}</Text>
            </View>
          </View>
        )}

        {step === 'setup' && fromSharedComposer ? (
          <View style={styles.draftCard}>
            <Text style={styles.draftEyebrow}>{t('memoryReady')}</Text>
            <Text numberOfLines={1} style={styles.draftTitle}>{title || suggestMemoryTitle(goalType, items)}</Text>
            <Text style={styles.draftMeta}>{items.length} {t('items')} · {t('chooseSceneToPlace')}</Text>
          </View>
        ) : step === 'setup' ? (
          <>
            <Text style={styles.label}>{t('nameMemory')} <Text style={styles.optionalLabel}>{t('optional')}</Text></Text>
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={setTitle}
              onFocus={() => handleInputFocus(titleInputRef.current)}
              placeholder={t('titlePlaceholder')}
              placeholderTextColor="#AAA7B5"
              style={styles.input}
            />
          </>
         ) : null}

        {step === 'setup' && (
          <View style={styles.sceneHeadingRow}>
            <View style={styles.sceneHeadingCopy}>
              <Text style={[styles.label, styles.sceneLabel]}>{t('chooseScene')}</Text>
              {availableScenes.length ? <Text style={styles.sceneCount}>{availableScenes.length} {t('sceneCount')}</Text> : null}
            </View>
            {availableScenes.length > 4 ? (
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={showAllScenes ? t('hideScenes') : t('seeAllScenes')}
                onPress={() => {
                  if (showAllScenes) setSceneSearch('');
                  setShowAllScenes((current) => !current);
                }}
                style={styles.seeAllScenesButton}>
                <Text style={styles.seeAllScenesText}>{showAllScenes ? t('hideScenes') : t('seeAllScenes')}</Text>
                {showAllScenes ? (
                  <ChevronUp size={15} color={theme.violetDeep} />
                ) : (
                  <ChevronRight size={15} color={theme.violetDeep} />
                )}
              </AnimatedPressable>
            ) : null}
          </View>
        )}
        {step === 'setup' && (
          <>
        {sceneAvailabilityLoading ? (
          <Text style={styles.helper}>{t('loadingScenes')}</Text>
        ) : availableScenes.length ? (
          <>
            {showAllScenes && availableScenes.length > 4 ? (
              <View style={styles.sceneSearchWrap}>
                <Search size={17} color={theme.inkSoft} />
                <TextInput
                  accessibilityLabel={t('searchScenes')}
                  onChangeText={setSceneSearch}
                  placeholder={t('searchScenes')}
                  placeholderTextColor="#AAA7B5"
                  style={styles.sceneSearchInput}
                  value={sceneSearch}
                />
              </View>
            ) : null}
            {visibleScenes.length ? (
              showAllScenes || sceneSearch.trim() ? (
                <View style={styles.sceneGrid}>
                  {visibleScenes.map((scene) => {
                    const fits = sceneFitsPalaceItems(scene, items.length);
                    const active = scene.id === selectedSceneId && fits;
                    return (
                      <AnimatedPressable
                        key={scene.id}
                        accessibilityState={{ disabled: !fits }}
                        disabled={!fits}
                        onPress={() => selectScene(scene)}
                        style={[styles.sceneOption, styles.sceneOptionGrid, active && styles.sceneOptionActive, !fits && styles.sceneOptionLimited]}>
                        <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={styles.sceneThumb} />
                        <Text numberOfLines={1} style={styles.sceneName}>{scene.name}</Text>
                        <Text style={styles.sceneMeta}>
                          {scene.loci.length} {t('loci')}{scene.isPremium ? ` · ${t('premium')}` : ''}{!fits ? ` · ${capacityHint(scene)}` : ''}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sceneRail}>
                  {visibleScenes.map((scene) => {
                    const fits = sceneFitsPalaceItems(scene, items.length);
                    const active = scene.id === selectedSceneId && fits;
                    return (
                      <AnimatedPressable
                        key={scene.id}
                        accessibilityState={{ disabled: !fits }}
                        disabled={!fits}
                        onPress={() => selectScene(scene)}
                        style={[styles.sceneOption, active && styles.sceneOptionActive, !fits && styles.sceneOptionLimited]}>
                        <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={styles.sceneThumb} />
                        <Text numberOfLines={1} style={styles.sceneName}>{scene.name}</Text>
                        <Text style={styles.sceneMeta}>
                          {scene.loci.length} {t('loci')}{scene.isPremium ? ` · ${t('premium')}` : ''}{!fits ? ` · ${capacityHint(scene)}` : ''}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </ScrollView>
              )
            ) : (
              <Text style={styles.noMatchingScenes}>{t('noMatchingScenes')}</Text>
            )}
          </>
        ) : (
          <View style={styles.emptyScenes}>
            <Text style={styles.sceneImageEmoji}>🖼️</Text>
              <Text style={styles.helper}>{t('noPublishedScenes')}</Text>
              <AnimatedPressable onPress={() => scenesQuery.refetch()} style={styles.refreshButton}><RefreshCcw size={15} color={theme.ink} /><Text style={styles.refreshText}>{t('refresh')}</Text></AnimatedPressable>
          </View>
        )}
          </>
        )}

        {step === 'setup' && capacityMessage && (
          <View style={styles.capacityCard}>
            <Text style={styles.capacityTitle}>{t('capacity')}</Text>
            <Text style={styles.capacityText}>{capacityMessage}</Text>
          </View>
        )}

        {step === 'place' && selectedScene && (
          <>
            <PalaceLocusMap
              activeIndex={activeLocusIndex}
              loci={placementLoci}
              onSelect={setActiveLocusIndex}
              placedCount={placementLoci.length}
              scene={selectedScene}
            />
            <Text style={styles.canvasHint}>
              {t('canvasHint')}
            </Text>
            {capacityMessage && (
              <View style={styles.capacityCard}>
              <Text style={styles.capacityTitle}>{t('capacity')}</Text>
                <Text style={styles.capacityText}>{capacityMessage}</Text>
              </View>
            )}
            <PalaceAssociationEditor
              activeIndex={activeLocusIndex}
              associations={associations}
              items={items}
              loci={placementLoci}
              onChangeAssociation={(value) =>
                setAssociations((current) =>
                  current.map((entry, index) => (index === activeLocusIndex ? value : entry)),
                )
              }
              onGenerate={() => void generateAssociations()}
              isGenerating={generatePalaceAssociations.isPending}
              generationMessage={generationMessage}
              onGenerateCurrent={() => void generateCurrentAssociation()}
              isGeneratingAny={generatePalaceAssociations.isPending}
              isGeneratingCurrent={generatingIndex === activeLocusIndex && generatePalaceAssociations.isPending}
              onSelectIndex={setActiveLocusIndex}
            />
          </>
        )}

        {step === 'setup' ? (
          <>
            {!fromSharedComposer ? (
              <>
                <View style={styles.labelRow}><Text style={styles.label}>{t('addItems')}</Text><Text style={styles.counter}>{items.length}/{MAX_PALACE_ITEMS}</Text></View>
                <View style={styles.addRow}>
                  <TextInput
                    ref={newItemInputRef}
                    value={newItem}
                    onChangeText={setNewItem}
                    onFocus={() => handleInputFocus(newItemInputRef.current)}
                    onSubmitEditing={addItem}
                    returnKeyType="done"
                    placeholder={t('itemPlaceholder')}
                    placeholderTextColor="#AAA7B5"
                    style={[styles.input, { flex: 1 }]}
                  />
                  <AnimatedPressable accessibilityLabel={t('addItemAccessibility')} onPress={addItem} style={styles.addButton}><Plus size={21} color="white" /></AnimatedPressable>
                </View>
                {items.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.itemRow}>
                    <View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index + 1}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.itemText}>{item}</Text><Text style={styles.locusText}>{loci[index] ? getPalaceLocusName(loci[index], language) : t('chooseSceneAssignLocus')}</Text></View>
                    <AnimatedPressable
                      accessibilityLabel={`${t('removeAccessibility')} ${item}`}
                      onPress={() => {
                        setItems((current) => current.filter((_, i) => i !== index));
                        setAssociations((current) => current.filter((_, i) => i !== index));
                        setActiveLocusIndex((current) => Math.min(current, Math.max(0, items.length - 2)));
                      }}
                      style={styles.deleteButton}>
                      <Trash2 size={17} color={theme.inkSoft} />
                    </AnimatedPressable>
                  </View>
                ))}
              </>
            ) : null}
            <View style={styles.fullWidthButton}>
              <AnimatedPressable
                accessibilityState={{ disabled: noFittingScene }}
                disabled={noFittingScene}
                onPress={continueToPlacement}
                style={[styles.continueButton, noFittingScene && styles.continueButtonDisabled]}>
              <Text style={[styles.continueText, noFittingScene && styles.continueTextDisabled]}>{t('continuePlace')}</Text>
                <ArrowRight size={18} color={noFittingScene ? '#B8B3C5' : theme.ink} />
              </AnimatedPressable>
            </View>
          </>
        ) : (
          <View style={styles.fullWidthButton}>
            <AnimatedPressable onPress={() => setStep('setup')} style={styles.editSetupButton}>
              <Text style={styles.editSetupText}>{t('editSetup')}</Text>
              <ArrowLeft size={16} color={theme.violetDeep} />
            </AnimatedPressable>
          </View>
        )}

        {(message || error) && <View style={styles.errorCard}><Text style={styles.errorText}>{message ?? error}</Text></View>}
        {step === 'place' && (
          <View style={styles.fullWidthButton}>
            <AnimatedPressable disabled={createMemorySet.isPending} onPress={save} style={[styles.saveButton, createMemorySet.isPending && { opacity: 0.5 }]}>
              <Check size={19} color={theme.ink} /><Text style={styles.saveText}>{createMemorySet.isPending ? t('saving') : error ? t('trySavingAgain') : t('savePalace')}</Text><ArrowRight size={18} color={theme.ink} />
            </AnimatedPressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas }, content: { padding: 16, paddingBottom: 42 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 19, backgroundColor: '#EEE9FF', borderWidth: 1.5, borderColor: '#DCD4FF', padding: 14 },
  infoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  infoEmoji: { fontSize: 25, lineHeight: 30 }, infoCopy: { flex: 1, minWidth: 0 }, infoTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 19 }, infoText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sceneImageEmoji: { fontSize: 24 },
  draftCard: {
    marginTop: 16,
    marginBottom: 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE6A3',
    backgroundColor: '#FFF7E0',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  draftEyebrow: {
    color: theme.sunDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
  draftTitle: {
    color: theme.ink,
    fontFamily: typography.display,
    fontSize: 16,
    lineHeight: 21,
    marginTop: 5,
  },
  draftMeta: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  editContentButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    marginTop: 10,
    borderRadius: 11,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#DCD4FF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editContentText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 18, marginBottom: 8 }, optionalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 }, labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, counter: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 12, marginTop: 18 },
  sceneHeadingRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }, sceneHeadingCopy: { flex: 1 }, sceneLabel: { marginBottom: 2 }, sceneCount: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginBottom: 9 }, seeAllScenesButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 1, borderRadius: 999, backgroundColor: '#EEE9FF', marginBottom: 8, paddingLeft: 11, paddingRight: 7 }, seeAllScenesText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, sceneSearchWrap: { alignItems: 'center', backgroundColor: 'white', borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', gap: 8, marginBottom: 10, paddingHorizontal: 12 }, sceneSearchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 13, minHeight: 44 }, sceneGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, sceneOptionGrid: { marginRight: 0, marginBottom: 10, width: '48%' }, noMatchingScenes: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, paddingVertical: 16, textAlign: 'center' },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 14, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  sceneRail: { marginHorizontal: -16, paddingLeft: 16 }, sceneOption: { width: 172, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 8, marginRight: 10 }, sceneOptionActive: { borderColor: '#7A68E0', backgroundColor: '#F7F5FF' }, sceneOptionLimited: { opacity: 0.72 }, sceneThumb: { height: 92, borderRadius: 12 }, sceneName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 8 }, sceneMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginTop: 2 },
  canvasHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 8 }, capacityCard: { marginTop: 11, borderRadius: 14, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 12 }, capacityTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 }, capacityText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, marginTop: 3 },
  emptyScenes: { borderWidth: 2, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.paper, padding: 18, alignItems: 'center' }, helper: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, textAlign: 'center' }, refreshButton: { marginTop: 10, flexDirection: 'row', gap: 6, backgroundColor: theme.sun, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8 }, refreshText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  addRow: { flexDirection: 'row', gap: 9 }, addButton: { width: 50, height: 50, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  itemRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.line }, itemNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' }, itemNumberText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 11 }, itemText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginLeft: 11 }, locusText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginLeft: 11, marginTop: 2 }, deleteButton: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center' },
  errorCard: { marginTop: 14, borderRadius: 14, backgroundColor: '#FFF0F4', borderWidth: 1.5, borderColor: '#FFD2DC', padding: 12 }, errorText: { color: '#B53A5F', fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  fullWidthButton: { alignSelf: 'stretch' },
  continueButton: { width: '100%', minHeight: 53, marginTop: 20, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 5px 0px ${theme.sunDeep}` }, continueButtonDisabled: { backgroundColor: '#EDEAF4', boxShadow: 'none' }, continueText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 }, continueTextDisabled: { color: '#9C97AA' },
  editSetupButton: { width: '100%', minHeight: 45, marginTop: 18, borderRadius: 14, borderWidth: 1.5, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, editSetupText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  saveButton: { width: '100%', minHeight: 53, marginTop: 20, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 5px 0px ${theme.sunDeep}` }, saveText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
});
