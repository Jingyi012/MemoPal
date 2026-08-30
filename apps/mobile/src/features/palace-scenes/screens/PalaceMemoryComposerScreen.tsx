import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { useMemorySetMutations } from '@/features/memory-sets';
import type { MemorySetUpsertRequest } from '@/features/memory-sets';
import { PalaceAssociationEditor } from '@/features/palace-scenes/components/PalaceAssociationEditor';
import { PalaceLocusMap } from '@/features/palace-scenes/components/PalaceLocusMap';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { useTranslation } from '@/core/i18n/useTranslation';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import {
  choosePalaceScene,
  getPalaceCapacity,
  getPalaceLoci,
  sceneFitsPalaceItems,
} from '@/features/palace-scenes/utils/palaceCapacity';
import {
  createPalaceAssociation,
  ensurePalaceAssociations,
  getAssociationText,
} from '@/features/palace-scenes/utils/palaceAuthoring';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { firstParam, parseComposerItems, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { ComposerProgress } from '@/features/memory-composer/components/ComposerProgress';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type ComposerStep = 'setup' | 'place';
const MAX_PALACE_ITEMS = 100;

export default function PalaceMemoryComposerScreen() {
  const { t } = useTranslation('palace');
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    items?: string | string[];
    sceneId?: string | string[];
  }>();
  const scenesQuery = usePalaceScenes();
  const { createMemorySet } = useMemorySetMutations();
  const prefilledItems = useMemo(() => parseComposerItems(params.items), [params.items]);
  const fromSharedComposer = prefilledItems.length > 0;
  const [step, setStep] = useState<ComposerStep>('setup');
  const [title, setTitle] = useState(() => firstParam(params.title) ?? '');
  const [newItem, setNewItem] = useState('');
  const [items, setItems] = useState<string[]>(() => prefilledItems);
  const [associations, setAssociations] = useState<string[]>([]);
  const [activeLocusIndex, setActiveLocusIndex] = useState(0);
  const [selectedSceneId, setSelectedSceneId] = useState(() => firstParam(params.sceneId) ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [showAllScenes, setShowAllScenes] = useState(false);
  const [sceneSearch, setSceneSearch] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }, [step]);

  useEffect(() => {
    if (!scenesQuery.data?.length) return;
    const requestedSceneId = firstParam(params.sceneId);
    const selectedSceneIsValid = scenesQuery.data.some((scene) => scene.id === selectedSceneId);
    if (selectedSceneIsValid) return;
    const suggestedScene = choosePalaceScene(scenesQuery.data, items.length, requestedSceneId);
    if (suggestedScene) setSelectedSceneId(suggestedScene.id);
  }, [items.length, params.sceneId, scenesQuery.data, selectedSceneId]);

  const selectedScene = useMemo(
    () => scenesQuery.data?.find((scene) => scene.id === selectedSceneId),
    [scenesQuery.data, selectedSceneId]
  );
  const loci = useMemo(() => getPalaceLoci(selectedScene), [selectedScene]);
  const selectedSceneCapacity = getPalaceCapacity(selectedScene);
  const overflowCount = Math.max(0, items.length - selectedSceneCapacity);
  const capacityMessage = selectedScene && overflowCount > 0
    ? t('splitMemoryBody').replace('{capacity}', String(selectedSceneCapacity)).replace('{parts}', String(Math.ceil(items.length / Math.max(1, selectedSceneCapacity))))
    : null;

  const matchingScenes = useMemo(() => {
    const query = sceneSearch.trim().toLocaleLowerCase();
    if (!query) return scenesQuery.data ?? [];
    return (scenesQuery.data ?? []).filter((scene) =>
      `${scene.name} ${scene.description}`.toLocaleLowerCase().includes(query),
    );
  }, [sceneSearch, scenesQuery.data]);

  const visibleScenes = useMemo(() => {
    if (showAllScenes || sceneSearch.trim()) return matchingScenes;
    const selected = matchingScenes.find((scene) => scene.id === selectedSceneId);
    const remaining = matchingScenes.filter((scene) => scene.id !== selectedSceneId);
    return selected ? [selected, ...remaining].slice(0, 4) : remaining.slice(0, 4);
  }, [matchingScenes, sceneSearch, selectedSceneId, showAllScenes]);

  useEffect(() => {
    if (!loci.length || !items.length) return;
    setAssociations((current) => ensurePalaceAssociations(items, loci, current));
    setActiveLocusIndex((current) => Math.min(current, items.length - 1));
  }, [items, loci]);

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    if (items.length >= MAX_PALACE_ITEMS) {
      setMessage(t('maxItemsMessage'));
      return;
    }
    setItems((current) => [...current, value]);
    const locus = loci.length ? loci[items.length % loci.length] : undefined;
    setAssociations((current) => [
      ...current,
      createPalaceAssociation(value, locus?.name ?? `locus ${(items.length % Math.max(1, loci.length)) + 1}`),
    ]);
    setActiveLocusIndex(items.length);
    setNewItem('');
    setMessage(null);
    createMemorySet.reset();
  };

  const continueToPlacement = () => {
    if (!selectedScene) {
      setMessage(t('chooseSceneBeforePlace'));
      return;
    }
    if (!items.length) {
      setMessage(t('addThingToRemember'));
      return;
    }
    setMessage(null);
    setActiveLocusIndex(0);
    setStep('place');
  };

  const selectScene = (scene: PalaceScene) => {
    const fits = sceneFitsPalaceItems(scene, items.length);
    setSelectedSceneId(scene.id);
    const sceneLoci = getPalaceLoci(scene);
    setAssociations(items.map((item, index) => {
      const locus = sceneLoci.length ? sceneLoci[index % sceneLoci.length] : undefined;
      return createPalaceAssociation(item, locus?.name ?? `locus ${(index % Math.max(1, sceneLoci.length)) + 1}`);
    }));
    setActiveLocusIndex(0);
    setMessage(
      fits
        ? null
        : `${t('sceneHas')} ${scene.loci.length} ${t('loci')}. ${t('removeItemsOrChoose')}`
    );
  };

  const save = () => {
    if (!selectedScene) return setMessage(t('chooseSceneForPalace'));
    if (!items.length) return setMessage(t('addThingToRemember'));
    if (!loci.length) return setMessage(t('sceneOnlyHas') + ' 0 ' + t('loci'));
    const normalizedTitle = title.trim() || suggestMemoryTitle('custom', items);
    if (!title.trim()) setTitle(normalizedTitle);

    setMessage(null);
    const chunkSize = Math.max(1, selectedSceneCapacity);
    const chunks = Array.from({ length: Math.ceil(items.length / chunkSize) }, (_, chunkIndex) => {
      const start = chunkIndex * chunkSize;
      return { chunkIndex, answers: items.slice(start, start + chunkSize), associationOffset: start };
    });

    void (async () => {
      try {
        const createdSets = [];
        for (const chunk of chunks) {
          const suffix = chunks.length > 1 ? ` · ${chunk.chunkIndex + 1}/${chunks.length}` : '';
          const chunkTitle = suffix
            ? `${normalizedTitle.slice(0, Math.max(1, 200 - suffix.length))}${suffix}`
            : normalizedTitle;
          const request: MemorySetUpsertRequest = {
            title: chunkTitle,
            goalType: items.length > 10 ? 'facts' : 'ordered-list',
            techniqueKey: 'palace',
            status: 'ready',
            visibility: 'private',
            items: chunk.answers.map((answer, index) => ({ position: index + 1, prompt: `Recall locus ${index + 1}`, answer })),
            techniquePlan: {
              schemaVersion: 1,
              palaceSceneId: selectedScene.id,
              pegBindings: [],
              palaceBindings: chunk.answers.map((answer, index) => {
                const locus = loci[index];
                return {
                  itemPosition: index + 1,
                  locusId: locus.id,
                  associationText: getAssociationText(associations, chunk.associationOffset + index, answer, locus),
                  isCustomScene: true,
                };
              }),
            },
          };
          createdSets.push(await createMemorySet.mutateAsync(request));
        }
        const first = createdSets[0];
        if (first) {
          const returnTo = fromSharedComposer ? 'practice' : 'palaces';
          router.replace(`/palaces/memory/${first.id}?returnTo=${returnTo}` as Href);
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
    <View style={styles.page}>
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
          router.back();
        }}
      />
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
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

        {step === 'setup' && fromSharedComposer && title.trim() ? (
          <View style={styles.draftCard}>
            <Text style={styles.draftEyebrow}>{t('memoryReady')}</Text>
            <Text numberOfLines={1} style={styles.draftTitle}>{title}</Text>
            <Text style={styles.draftMeta}>{items.length} {t('items')} · {t('chooseSceneToPlace')}</Text>
          </View>
        ) : step === 'setup' ? (
          <>
            <Text style={styles.label}>{t('nameMemory')} <Text style={styles.optionalLabel}>{t('optional')}</Text></Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t('titlePlaceholder')} placeholderTextColor="#AAA7B5" style={styles.input} />
          </>
         ) : null}

        {step === 'setup' && (
          <View style={styles.sceneHeadingRow}>
            <View style={styles.sceneHeadingCopy}>
              <Text style={[styles.label, styles.sceneLabel]}>{t('chooseScene')}</Text>
              {scenesQuery.data?.length ? <Text style={styles.sceneCount}>{scenesQuery.data.length} {t('sceneCount')}</Text> : null}
            </View>
            {scenesQuery.data && scenesQuery.data.length > 4 ? (
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={showAllScenes ? t('hideScenes') : t('seeAllScenes')}
                onPress={() => {
                  if (showAllScenes) setSceneSearch('');
                  setShowAllScenes((current) => !current);
                }}
                style={styles.seeAllScenesButton}>
                <Text style={styles.seeAllScenesText}>{showAllScenes ? t('hideScenes') : t('seeAllScenes')}</Text>
              </AnimatedPressable>
            ) : null}
          </View>
        )}
        {step === 'setup' && (
          <>
        {scenesQuery.isLoading ? (
          <Text style={styles.helper}>{t('loadingScenes')}</Text>
        ) : scenesQuery.data?.length ? (
          <>
            {showAllScenes && scenesQuery.data.length > 4 ? (
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
                    const active = scene.id === selectedSceneId;
                    const fits = sceneFitsPalaceItems(scene, items.length);
                    return (
                      <AnimatedPressable
                        key={scene.id}
                        onPress={() => selectScene(scene)}
                        style={[styles.sceneOption, styles.sceneOptionGrid, active && styles.sceneOptionActive, !fits && styles.sceneOptionLimited]}>
                        <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={styles.sceneThumb} />
                        <Text numberOfLines={1} style={styles.sceneName}>{scene.name}</Text>
                        <Text style={styles.sceneMeta}>
                          {scene.loci.length} {t('loci')}{scene.isPremium ? ` · ${t('premium')}` : ''}{!fits ? ` · ${t('tooSmall')}` : ''}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sceneRail}>
                  {visibleScenes.map((scene) => {
                    const active = scene.id === selectedSceneId;
                    const fits = sceneFitsPalaceItems(scene, items.length);
                    return (
                      <AnimatedPressable
                        key={scene.id}
                        onPress={() => selectScene(scene)}
                        style={[styles.sceneOption, active && styles.sceneOptionActive, !fits && styles.sceneOptionLimited]}>
                        <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={styles.sceneThumb} />
                        <Text numberOfLines={1} style={styles.sceneName}>{scene.name}</Text>
                        <Text style={styles.sceneMeta}>
                          {scene.loci.length} {t('loci')}{scene.isPremium ? ` · ${t('premium')}` : ''}{!fits ? ` · ${t('tooSmall')}` : ''}
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

        {step === 'place' && selectedScene && (
          <>
            <PalaceLocusMap
              activeIndex={loci.length ? activeLocusIndex % loci.length : 0}
              loci={loci}
              onSelect={(index) => {
                if (index < items.length) setActiveLocusIndex(index);
              }}
              placedCount={items.length}
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
              loci={loci}
              onChangeAssociation={(value) =>
                setAssociations((current) =>
                  current.map((entry, index) => (index === activeLocusIndex ? value : entry)),
                )
              }
              onSelectIndex={setActiveLocusIndex}
            />
          </>
        )}

        {step === 'setup' ? (
          <>
            <View style={styles.labelRow}><Text style={styles.label}>{t('addItems')}</Text><Text style={styles.counter}>{items.length}/{MAX_PALACE_ITEMS}</Text></View>
            <View style={styles.addRow}>
              <TextInput value={newItem} onChangeText={setNewItem} onSubmitEditing={addItem} placeholder={t('itemPlaceholder')} placeholderTextColor="#AAA7B5" style={[styles.input, { flex: 1 }]} />
              <AnimatedPressable accessibilityLabel={t('addItemAccessibility')} onPress={addItem} style={styles.addButton}><Plus size={21} color="white" /></AnimatedPressable>
            </View>
            {items.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.itemRow}>
                <View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.itemText}>{item}</Text><Text style={styles.locusText}>{loci.length ? loci[index % loci.length]?.name : t('chooseSceneAssignLocus')}</Text></View>
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
            <View style={styles.fullWidthButton}>
              <AnimatedPressable onPress={continueToPlacement} style={styles.continueButton}>
              <Text style={styles.continueText}>{t('continuePlace')}</Text>
                <ArrowRight size={18} color={theme.ink} />
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
              <Check size={19} color={theme.ink} /><Text style={styles.saveText}>{createMemorySet.isPending ? t('saving') : error ? t('trySavingAgain') : overflowCount > 0 ? t('saveAsMultiple') : t('savePalace')}</Text><ArrowRight size={18} color={theme.ink} />
            </AnimatedPressable>
          </View>
        )}
      </ScrollView>
    </View>
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
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 18, marginBottom: 8 }, optionalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 }, labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, counter: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 12, marginTop: 18 },
  sceneHeadingRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }, sceneHeadingCopy: { flex: 1 }, sceneLabel: { marginBottom: 2 }, sceneCount: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginBottom: 9 }, seeAllScenesButton: { alignItems: 'center', backgroundColor: '#EEE9FF', borderRadius: 999, marginBottom: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 11 }, seeAllScenesText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 }, sceneSearchWrap: { alignItems: 'center', backgroundColor: 'white', borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', gap: 8, marginBottom: 10, paddingHorizontal: 12 }, sceneSearchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 13, minHeight: 44 }, sceneGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, sceneOptionGrid: { marginRight: 0, marginBottom: 10, width: '48%' }, noMatchingScenes: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, paddingVertical: 16, textAlign: 'center' },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 14, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  sceneRail: { marginHorizontal: -16, paddingLeft: 16 }, sceneOption: { width: 172, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 8, marginRight: 10 }, sceneOptionActive: { borderColor: '#7A68E0', backgroundColor: '#F7F5FF' }, sceneOptionLimited: { opacity: 0.72 }, sceneThumb: { height: 92, borderRadius: 12 }, sceneName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 8 }, sceneMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginTop: 2 },
  canvasHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 8 }, capacityCard: { marginTop: 11, borderRadius: 14, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 12 }, capacityTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 }, capacityText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, marginTop: 3 },
  emptyScenes: { borderWidth: 2, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.paper, padding: 18, alignItems: 'center' }, helper: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, textAlign: 'center' }, refreshButton: { marginTop: 10, flexDirection: 'row', gap: 6, backgroundColor: theme.sun, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8 }, refreshText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  addRow: { flexDirection: 'row', gap: 9 }, addButton: { width: 50, height: 50, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  itemRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.line }, itemNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' }, itemNumberText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 11 }, itemText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginLeft: 11 }, locusText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginLeft: 11, marginTop: 2 }, deleteButton: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center' },
  errorCard: { marginTop: 14, borderRadius: 14, backgroundColor: '#FFF0F4', borderWidth: 1.5, borderColor: '#FFD2DC', padding: 12 }, errorText: { color: '#B53A5F', fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  fullWidthButton: { alignSelf: 'stretch' },
  continueButton: { width: '100%', minHeight: 53, marginTop: 20, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 5px 0px ${theme.sunDeep}` }, continueText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  editSetupButton: { width: '100%', minHeight: 45, marginTop: 18, borderRadius: 14, borderWidth: 1.5, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, editSetupText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  saveButton: { width: '100%', minHeight: 53, marginTop: 20, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 5px 0px ${theme.sunDeep}` }, saveText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
});
