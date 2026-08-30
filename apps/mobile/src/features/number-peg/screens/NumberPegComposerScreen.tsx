import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  AccessibilityInfo,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  PencilLine,
  Play,
  RefreshCw,
} from 'lucide-react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@/core/i18n/useTranslation';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import type {
  MemoryGoalType,
  MemorySetUpsertRequest,
  PegSceneRecipe,
} from '@/features/memory-sets';
import { useMemorySetMutations } from '@/features/memory-sets';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import {
  buildAllNumberPegItems,
  getNumberPegCatalogueVersion,
  getUnlockedPegCount,
  MAX_NUMBER_PEGS,
} from '@/features/number-peg/utils/numberPegMap';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import {
  firstParam,
  parseComposerGoal,
  parseComposerItems,
  suggestMemoryTitle,
} from '@/features/memory-composer/utils/composerParams';
import { typography } from '@/theme/typography';
import {
  buildInitialSceneCandidates,
  buildSceneCandidates,
  buildSceneCaption,
  getBoosterPresentation,
  getCandidateSetForAction,
  type BoosterKey,
  type SceneAnchor,
  type SceneCandidate,
} from '@/features/number-peg/utils/numberPegMovie';
import { NumberPegMovieStage } from '@/features/number-peg/components/NumberPegMovieStage';
import { useOnboardingMutations } from '@/features/onboarding/hooks/useOnboardingMutations';

type SceneDraft = { answer: string; sceneText: string; recipe: PegSceneRecipe };
type StudioDraft = {
  schemaVersion: 1;
  kind: 'number-peg-studio';
  step: 'items' | 'studio';
  title: string;
  goalType: MemoryGoalType;
  items: string[];
  scenes: SceneDraft[];
  index: number;
};
const BOOSTERS: BoosterKey[] = [
  'loud',
  'sticky',
  'hot',
  'icy',
  'giant',
  'tiny',
  'smelly',
  'funny',
  'surprising',
] as const;
const GOALS: {
  key: MemoryGoalType;
  label: 'goalSpelling' | 'goalList' | 'goalFacts' | 'goalOther';
  emoji: string;
}[] = [
  { key: 'spelling', label: 'goalSpelling', emoji: '✏️' },
  { key: 'ordered-list', label: 'goalList', emoji: '🛒' },
  { key: 'facts', label: 'goalFacts', emoji: '💡' },
  { key: 'custom', label: 'goalOther', emoji: '✨' },
];
export default function NumberPegComposerScreen() {
  const { t } = useTranslation('numberPeg');
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    items?: string | string[];
    goalType?: string | string[];
    onboardingLessonId?: string | string[];
  }>();
  const { createMemorySet } = useMemorySetMutations();
  const { linkMemory: linkOnboardingMemory } = useOnboardingMutations();
  const { user } = useCurrentUser();
  const { playSound, feedbackEnabled } = useSoundEffects();
  const unlocked = getUnlockedPegCount(user?.level ?? 1);
  const pegs = useMemo(() => buildAllNumberPegItems(), []);
  const anchors = useMemo<SceneAnchor[]>(
    () =>
      pegs.map((peg) => {
        const localized = localizeNumberPeg(peg, t);
        return {
          pegNumber: peg.number,
          catalogueVersion: getNumberPegCatalogueVersion(),
          keyword: localized.keyword,
          image: localized.image,
          description: localized.description,
        };
      }),
    [pegs, t]
  );
  const initialItems = useMemo(
    () => parseComposerItems(params.items).slice(0, MAX_NUMBER_PEGS),
    [params.items]
  );
  const fromShared = initialItems.length > 0;
  const onboardingLessonId = firstParam(params.onboardingLessonId);
  const isOnboarding = Boolean(onboardingLessonId);
  const onboardingMemoryIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState(() => firstParam(params.title) ?? '');
  const [goalType, setGoalType] = useState<MemoryGoalType>(() =>
    parseComposerGoal(params.goalType)
  );
  const [newItem, setNewItem] = useState('');
  const [step, setStep] = useState<'items' | 'studio'>(() =>
    initialItems.length ? 'studio' : 'items'
  );
  const [items, setItems] = useState(initialItems);
  const [scenes, setScenes] = useState<SceneDraft[]>(() =>
    initialScenes(initialItems, unlocked, anchors, t)
  );
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [playSignal, setPlaySignal] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [candidateSet, setCandidateSet] = useState(0);
  const progressScrollRef = useRef<ScrollView>(null);
  const autoPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = useMemo(
    () =>
      `@memopal:number-peg-studio:${user?.id ?? 'local'}:${fromShared ? `${firstParam(params.title) ?? ''}:${initialItems.join('|')}` : 'direct'}`,
    [fromShared, initialItems, params.title, user?.id]
  );
  const current = scenes[index];
  const pegNumber = (index % Math.max(1, unlocked)) + 1;
  const currentAnchor = current?.recipe.anchorSnapshot ?? anchors[pegNumber - 1];
  const candidates = useMemo(
    () =>
      buildSceneCandidates(currentAnchor, current?.answer ?? '', candidateSet, (key) =>
        t(key as any)
      ),
    [candidateSet, current?.answer, currentAnchor, t]
  );
  const currentSoundPreset = current?.recipe.soundPreset ?? 'complete';
  const currentHapticPreset = current?.recipe.hapticPreset;
  const hasCurrentScene = Boolean(current);
  const previewScene = useCallback(
    (withFeedback = true) => {
      setMessage(null);
      setPlaySignal((signal) => signal + 1);
      if (withFeedback) {
        playSound(currentSoundPreset);
        if (feedbackEnabled && currentHapticPreset)
          void Haptics.impactAsync(
            currentHapticPreset === 'success'
              ? Haptics.ImpactFeedbackStyle.Light
              : Haptics.ImpactFeedbackStyle.Medium
          ).catch(() => undefined);
      }
    },
    [currentHapticPreset, currentSoundPreset, feedbackEnabled, playSound]
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducedMotion)
      .catch(() => undefined);
    const s = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => s.remove();
  }, []);
  useEffect(() => {
    progressScrollRef.current?.scrollTo({
      x: Math.max(0, index * 32 - 112),
      animated: true,
    });
  }, [index]);
  useEffect(() => {
    if (loaded) return;
    void AsyncStorage.getItem(draftKey).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw) as StudioDraft;
          if (
            isValidStudioDraft(d) &&
            (fromShared
              ? JSON.stringify(d.items) === JSON.stringify(initialItems)
              : d.items.length > 0)
          ) {
            setTitle(d.title);
            setGoalType(d.goalType);
            setItems(d.items);
            setScenes(d.scenes);
            setIndex(Math.min(d.index, d.items.length - 1));
            setStep(d.step);
          }
        } catch {
          /* Ignore an invalid local draft. */
        }
      }
      setLoaded(true);
    });
  }, [draftKey, fromShared, initialItems, loaded]);
  useEffect(() => {
    if (loaded && items.length)
      void AsyncStorage.setItem(
        draftKey,
        JSON.stringify({
          schemaVersion: 1,
          kind: 'number-peg-studio',
          step,
          title,
          goalType,
          items,
          scenes,
          index,
        } satisfies StudioDraft)
      );
  }, [draftKey, goalType, index, items, loaded, scenes, step, title]);
  useEffect(() => {
    if (!loaded || step !== 'studio' || !hasCurrentScene) return;
    if (autoPreviewTimerRef.current) clearTimeout(autoPreviewTimerRef.current);
    const interaction = InteractionManager.runAfterInteractions(() => {
      autoPreviewTimerRef.current = setTimeout(() => {
        autoPreviewTimerRef.current = null;
        previewScene();
      }, 120);
    });
    return () => {
      interaction.cancel();
      if (autoPreviewTimerRef.current) {
        clearTimeout(autoPreviewTimerRef.current);
        autoPreviewTimerRef.current = null;
      }
    };
  }, [
    current?.answer,
    current?.recipe.actionPreset,
    current?.recipe.sensoryBoosters,
    hasCurrentScene,
    index,
    loaded,
    previewScene,
    step,
  ]);
  if (step === 'items' || !current) {
    const addItem = () => {
      const value = newItem.trim();
      if (!value) return;
      if (items.length >= MAX_NUMBER_PEGS) {
        setMessage(t('maxItemsMessage'));
        return;
      }
      setItems((all) => [...all, value]);
      setNewItem('');
      setMessage(null);
    };
    const removeItem = (removeIndex: number) =>
      setItems((all) => all.filter((_, i) => i !== removeIndex));
    const buildScenes = () => {
      if (!items.length) {
        setMessage(t('addThingMessage'));
        return;
      }
      const generatedScenes = initialScenes(items, unlocked, anchors, t);
      setScenes((all) =>
        items.map((value, i) => (all[i]?.answer === value ? all[i] : generatedScenes[i]))
      );
      setIndex(0);
      setCandidateSet(0);
      setStep('studio');
      setMessage(null);
    };
    return (
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <CommonHeader
          compact
          eyebrow={t('eyebrow')}
          title={t('addItems')}
          description={t('itemsStepDescription')}
          backAction={() => router.back()}
        />
        <ScrollView
          contentContainerStyle={styles.emptyComposer}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, styles.formHeading]}>{t('nameMemory')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('namePlaceholder')}
            placeholderTextColor="#AAA7B5"
            style={styles.input}
          />
          <Text style={[styles.heading, styles.formHeading]}>{t('whatFor')}</Text>
          <View style={styles.goalRow}>
            {GOALS.map((goal) => (
              <AnimatedPressable
                key={goal.key}
                onPress={() => setGoalType(goal.key)}
                style={[styles.goal, goalType === goal.key && styles.goalSelected]}>
                <Text>{goal.emoji}</Text>
                <Text style={styles.itemText}>{t(goal.label)}</Text>
              </AnimatedPressable>
            ))}
          </View>
          <Text style={[styles.heading, styles.formHeading]}>{t('addItems')}</Text>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            placeholder={t('itemPlaceholder')}
            placeholderTextColor="#AAA7B5"
            style={styles.input}
          />
          <AnimatedPressable onPress={addItem} style={styles.next}>
            <Text style={styles.buttonText}>{t('addItem')}</Text>
            <ArrowRight size={17} color={theme.ink} />
          </AnimatedPressable>
          <View style={styles.itemList}>
            {items.map((item, i) => (
              <View key={`${item}-${i}`} style={styles.itemRow}>
                <Text style={styles.itemNumber}>{i + 1}</Text>
                <Text style={styles.itemText}>{item}</Text>
                <AnimatedPressable onPress={() => removeItem(i)} style={styles.remove}>
                  <Text>×</Text>
                </AnimatedPressable>
              </View>
            ))}
          </View>
          {items.length > unlocked ? (
            <View style={styles.capacityCard}>
              <Text style={styles.capacityTitle}>{t('splitMemoryTitle')}</Text>
              <Text style={styles.capacityBody}>
                {t('splitMemoryBody')
                  .replace('{count}', String(unlocked))
                  .replace('{parts}', String(Math.ceil(items.length / unlocked)))}
              </Text>
            </View>
          ) : null}
          {message ? (
            <View style={styles.message}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
          <AnimatedPressable onPress={buildScenes} style={styles.next}>
            <Text style={styles.buttonText}>{t('buildScenes')}</Text>
            <ArrowRight size={17} color={theme.ink} />
          </AnimatedPressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  const choose = (scene: SceneCandidate) => {
    setScenes((all) =>
      all.map((s, i) =>
        i === index
          ? {
              answer: current.answer,
              sceneText: scene.sceneText,
              recipe: scene.recipe,
            }
          : s
      )
    );
    setCustomMode(false);
    setMessage(null);
  };
  const booster = (value: BoosterKey) => {
    const selectedBooster = current.recipe.sensoryBoosters[0] === value ? undefined : value;
    const presentation = getBoosterPresentation(selectedBooster);
    const caption =
      current.recipe.associationSource === 'user-written'
        ? current.sceneText
        : buildSceneCaption(
            currentAnchor.keyword,
            current.answer,
            current.recipe.actionPreset,
            (key) => t(key as any),
            selectedBooster
          );
    setScenes((all) =>
      all.map((s, i) =>
        i === index
          ? {
              ...s,
              sceneText: caption,
              recipe: {
                ...s.recipe,
                caption,
                associationSource:
                  s.recipe.associationSource === 'user-written' ? 'user-written' : 'customized',
                sensoryBoosters: selectedBooster ? [selectedBooster] : [],
                soundPreset: presentation.soundPreset,
                hapticPreset: presentation.hapticPreset,
              },
            }
          : s
      )
    );
    setMessage(null);
  };
  const updateCustomScene = (sceneText: string) => {
    setScenes((all) =>
      all.map((scene, sceneIndex) =>
        sceneIndex === index
          ? {
              ...scene,
              sceneText,
              recipe: {
                ...scene.recipe,
                caption: sceneText,
                associationSource: 'user-written',
              },
            }
          : scene
      )
    );
    setMessage(null);
  };
  const playScene = () => {
    if (!current.sceneText.trim()) {
      setMessage(t('sceneRequiredMessage'));
      return;
    }
    previewScene(true);
  };
  const openScene = (sceneIndex: number) => {
    setIndex(sceneIndex);
    setCandidateSet(getCandidateSetForAction(scenes[sceneIndex].recipe.actionPreset));
    setCustomMode(false);
    setMessage(null);
  };
  const advance = () => {
    if (index === items.length - 1) {
      void save();
      return;
    }
    setIndex((v) => v + 1);
    setCandidateSet(getCandidateSetForAction(scenes[index + 1].recipe.actionPreset));
    setCustomMode(false);
    setMessage(null);
  };
  async function save() {
    if (savingRef.current) return;
    if (!items.length) {
      setMessage(t('addThingMessage'));
      return;
    }
    const incompleteSceneIndex = scenes.findIndex((scene) => !scene.sceneText.trim());
    if (incompleteSceneIndex >= 0) {
      openScene(incompleteSceneIndex);
      setMessage(t('sceneRequiredMessage'));
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      if (onboardingLessonId && onboardingMemoryIdRef.current) {
        await linkOnboardingMemory.mutateAsync(onboardingMemoryIdRef.current);
        router.replace(`/number-peg/${onboardingMemoryIdRef.current}?returnTo=practice&mode=recall` as Href);
        return;
      }
      const size = Math.max(1, Math.min(unlocked, MAX_NUMBER_PEGS));
      const chunks = Array.from({ length: Math.ceil(items.length / size) }, (_, n) => ({
        n,
        values: items.slice(n * size, (n + 1) * size),
        scenes: scenes.slice(n * size, (n + 1) * size),
      }));
      const created = [];
      for (const chunk of chunks) {
        const suffix = chunks.length > 1 ? ` · ${chunk.n + 1}/${chunks.length}` : '';
        const req: MemorySetUpsertRequest = {
          title: `${(title.trim() || suggestMemoryTitle(goalType, items)).slice(0, 200 - suffix.length)}${suffix}`,
          goalType,
          techniqueKey: 'number-peg',
          status: 'ready',
          visibility: 'private',
          items: chunk.values.map((value, i) => ({
            position: i + 1,
            prompt: goalType === 'spelling' ? `Spell item ${i + 1}` : `Recall item ${i + 1}`,
            answer: value,
          })),
          techniquePlan: {
            schemaVersion: 1,
            palaceBindings: [],
            pegBindings: chunk.scenes.map((s, i) => ({
              itemPosition: i + 1,
              pegNumber: i + 1,
              sceneText: s.sceneText,
              sceneRecipe: s.recipe,
              isCustomScene: s.recipe.associationSource !== 'suggested',
            })),
          },
        };
        created.push(await createMemorySet.mutateAsync(req));
      }
      await AsyncStorage.removeItem(draftKey);
      if (created[0]) {
        if (onboardingLessonId) {
          onboardingMemoryIdRef.current = created[0].id;
          await linkOnboardingMemory.mutateAsync(created[0].id);
        }
        router.replace(
          `/number-peg/${created[0].id}?returnTo=${fromShared ? 'practice' : 'number-peg'}${isOnboarding ? '&mode=recall' : ''}` as Href
        );
      }
    } catch {
      setMessage(t('saveError'));
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader
        compact
        eyebrow={t('eyebrow')}
        title={t('memoryMovies')}
        description={`${t('sceneOf')} ${index + 1} ${t('of')} ${items.length}`}
        backAction={() => (fromShared ? router.back() : setStep('items'))}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        contentContainerStyle={styles.content}>
        <ScrollView
          ref={progressScrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progress}>
          {items.map((item, i) => (
            <AnimatedPressable
              key={`${item}-${i}`}
              accessibilityLabel={`${t('sceneFor')} ${item}`}
              accessibilityState={{ selected: i === index }}
              onPress={() => openScene(i)}
              style={[styles.dot, i === index && styles.activeDot]}>
              <Text style={styles.dotLabel}>{i + 1}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
        {isOnboarding ? (
          <View style={styles.guidedCard}>
            <Text style={styles.guidedTitle}>{t('guidedMovieTitle')}</Text>
            <Text style={styles.guidedBody}>{t('guidedMovieBody')}</Text>
          </View>
        ) : null}
        {index === 0 && items.length > unlocked ? (
          <View style={styles.capacityCard}>
            <Text style={styles.capacityTitle}>{t('splitMemoryTitle')}</Text>
            <Text style={styles.capacityBody}>
              {t('splitMemoryBody')
                .replace('{count}', String(unlocked))
                .replace('{parts}', String(Math.ceil(items.length / unlocked)))}
            </Text>
          </View>
        ) : null}
        <View style={styles.stageCard}>
          <View style={styles.stageTopRow}>
            <View style={styles.anchorPill}>
              <Text style={styles.anchorPillEmoji}>{currentAnchor.image}</Text>
              <Text numberOfLines={1} style={styles.anchorPillText}>
                {t('pegLabel')} {pegNumber} · {currentAnchor.keyword}
              </Text>
            </View>
            <View style={styles.autoPill}>
              <View style={styles.liveDot} />
              <Text style={styles.autoPillText}>{t('autoPreview')}</Text>
            </View>
          </View>
          <NumberPegMovieStage
            pegNumber={pegNumber}
            pegImage={currentAnchor.image}
            pegKeyword={currentAnchor.keyword}
            targetLabel={current.answer}
            recipe={current.recipe}
            playSignal={playSignal}
            reducedMotion={reducedMotion}
          />
          <View style={styles.captionPanel}>
            <Text style={styles.caption}>{current.sceneText}</Text>
            <AnimatedPressable
              accessibilityLabel={t('replayScene')}
              onPress={playScene}
              style={styles.replay}>
              <Play size={14} color={theme.berryDeep} />
              <Text style={styles.replayText}>{t('replayScene')}</Text>
            </AnimatedPressable>
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>{t('chooseAction')}</Text>
          <Text style={styles.sectionHint}>{t('tapToPreview')}</Text>
        </View>
        <View style={styles.choices}>
          {candidates.map((candidate) => (
            <AnimatedPressable
              key={candidate.recipe.actionPreset}
              containerStyle={styles.equalSlot}
              accessibilityState={{
                selected: current.recipe.actionPreset === candidate.recipe.actionPreset,
              }}
              onPress={() => choose(candidate)}
              style={[
                styles.choice,
                current.recipe.actionPreset === candidate.recipe.actionPreset && styles.selected,
              ]}>
              <Text style={styles.choiceEmoji}>{candidate.emoji}</Text>
              <Text numberOfLines={2} style={styles.choiceTitle}>
                {t(candidate.titleKey)}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
        {!isOnboarding ? (
          <View style={styles.ideaActions}>
            <AnimatedPressable
              containerStyle={styles.equalSlot}
              onPress={() => {
                const nextSet = candidateSet + 1;
                setCandidateSet(nextSet);
                const next = buildSceneCandidates(currentAnchor, current.answer, nextSet, (key) =>
                  t(key as any)
                )[0];
                choose(next);
              }}
              style={styles.another}>
              <RefreshCw size={15} color={theme.berryDeep} />
              <Text style={styles.anotherText}>{t('anotherIdea')}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              containerStyle={styles.equalSlot}
              onPress={() => setCustomMode((visible) => !visible)}
              style={[styles.customToggle, customMode && styles.customToggleActive]}>
              <PencilLine size={15} color={theme.berryDeep} />
              <Text numberOfLines={1} style={styles.anotherText}>
                {customMode ? t('hideCustomScene') : t('writeMyOwn')}
              </Text>
            </AnimatedPressable>
          </View>
        ) : null}
        {!isOnboarding && customMode ? (
          <View style={styles.customEditor}>
            <Text style={styles.customEditorLabel}>{t('customScenePrompt')}</Text>
            <TextInput
              value={current.sceneText}
              onChangeText={updateCustomScene}
              multiline
              maxLength={1000}
              placeholder={t('associationPlaceholder')}
              placeholderTextColor="#AAA7B5"
              textAlignVertical="top"
              style={[styles.input, styles.customInput]}
            />
          </View>
        ) : null}
        {!isOnboarding ? (
          <View style={styles.sectionHeader}>
            <Text style={styles.heading}>{t('addBooster')}</Text>
            <Text style={styles.sectionHint}>{t('optional')}</Text>
          </View>
        ) : null}
        {!isOnboarding ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.boosters}>
            {BOOSTERS.map((boosterKey) => (
              <AnimatedPressable
                key={boosterKey}
                onPress={() => booster(boosterKey)}
                style={[
                  styles.booster,
                  current.recipe.sensoryBoosters[0] === boosterKey && styles.boosterSelected,
                ]}>
                <Text style={styles.boosterEmoji}>{getBoosterPresentation(boosterKey).emoji}</Text>
                <Text style={styles.boosterText}>{t(`booster_${boosterKey}` as any)}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        ) : null}
        {message && (
          <View style={styles.message}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}
        {createMemorySet.isError && (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              {getNumberPegErrorMessage(createMemorySet.error, t('saveError'))}
            </Text>
          </View>
        )}
        <View style={styles.actions}>
          <AnimatedPressable
            containerStyle={styles.equalSlot}
            disabled={!index || isSaving}
            onPress={() => openScene(Math.max(0, index - 1))}
            style={[styles.back, (!index || isSaving) && styles.disabled]}>
            <ArrowLeft size={17} color={theme.ink} />
            <Text numberOfLines={1} style={[styles.buttonText, styles.navigationButtonText]}>
              {t('previousScene')}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            containerStyle={styles.equalSlot}
            disabled={isSaving}
            onPress={advance}
            accessibilityState={{ disabled: isSaving }}
            style={[styles.next, isSaving && styles.disabled]}>
            <Text numberOfLines={1} style={[styles.buttonText, styles.navigationButtonText]}>
              {isSaving
                ? t('saving')
                : index === items.length - 1
                  ? isOnboarding
                    ? t('startRecall')
                    : t('saveMemory')
                  : t('nextScene')}
            </Text>
            <ArrowRight size={17} color={theme.ink} />
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function initialScenes(
  items: string[],
  unlocked: number,
  anchors: SceneAnchor[],
  t: (key: any) => string
) {
  return buildInitialSceneCandidates(items, anchors, unlocked, (key) => t(key as any)).map(
    (candidate, index) => {
      const answer = items[index];
      return {
        answer,
        sceneText: candidate.sceneText,
        recipe: candidate.recipe,
      };
    }
  );
}

function isValidStudioDraft(value: unknown): value is StudioDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<StudioDraft>;
  if (
    draft.schemaVersion !== 1 ||
    draft.kind !== 'number-peg-studio' ||
    !Array.isArray(draft.items) ||
    !Array.isArray(draft.scenes)
  )
    return false;
  const items = draft.items;
  const scenes = draft.scenes;
  if (items.length < 1 || items.length > MAX_NUMBER_PEGS || scenes.length > items.length)
    return false;
  if (draft.step !== 'items' && draft.step !== 'studio') return false;
  if (draft.step === 'studio' && scenes.length !== items.length) return false;
  if (
    !items.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 500)
  )
    return false;
  return scenes.every(
    (scene, index) =>
      Boolean(scene) &&
      scene.answer === items[index] &&
      scene.sceneText.length <= 1000 &&
      isValidRecipe(scene.recipe)
  );
}

function isValidRecipe(recipe: unknown): recipe is PegSceneRecipe {
  if (!recipe || typeof recipe !== 'object') return false;
  const value = recipe as PegSceneRecipe;
  const snapshot = value.anchorSnapshot;
  const validSnapshot =
    snapshot !== null &&
    snapshot !== undefined &&
    Number.isInteger(snapshot.pegNumber) &&
    snapshot.pegNumber >= 1 &&
    snapshot.pegNumber <= MAX_NUMBER_PEGS &&
    typeof snapshot.catalogueVersion === 'string' &&
    snapshot.catalogueVersion.length > 0 &&
    typeof snapshot.keyword === 'string' &&
    snapshot.keyword.length > 0 &&
    typeof snapshot.image === 'string' &&
    snapshot.image.length > 0 &&
    typeof snapshot.description === 'string';
  return (
    value.schemaVersion === 1 &&
    ['suggested', 'customized', 'user-written'].includes(value.associationSource) &&
    typeof value.caption === 'string' &&
    value.caption.length <= 1000 &&
    [
      'crash',
      'bounce',
      'wrap',
      'explode',
      'melt',
      'chase',
      'swallow',
      'stretch',
      'spin',
      'launch',
    ].includes(value.actionPreset) &&
    Array.isArray(value.sensoryBoosters) &&
    value.sensoryBoosters.length <= 1 &&
    validSnapshot
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: {
    width: '100%',
    alignItems: 'stretch',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 48,
  },
  emptyComposer: { padding: 16 },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  goal: {
    minHeight: 42,
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  goalSelected: { borderColor: theme.sunDeep, backgroundColor: '#FFF7E0' },
  itemList: { gap: 7, marginTop: 12 },
  itemRow: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 9,
  },
  itemNumber: {
    color: theme.berryDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
    width: 20,
  },
  itemText: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 13 },
  remove: { minWidth: 34, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  capacityCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE09A',
    backgroundColor: '#FFF8E6',
    padding: 12,
  },
  capacityTitle: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
  },
  capacityBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  activeDot: { backgroundColor: theme.sun, borderColor: theme.sunDeep },
  guidedCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DCD4FF',
    backgroundColor: '#F6F3FF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  guidedTitle: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12.5,
  },
  guidedBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 3,
  },
  stageCard: {
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 10,
    boxShadow: '0px 8px 0px rgba(43,42,61,0.07)',
  },
  stageTopRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 3,
    paddingBottom: 8,
  },
  anchorPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anchorPillEmoji: { fontSize: 18 },
  anchorPillText: {
    flex: 1,
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
  },
  autoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#EEE9FF',
    paddingHorizontal: 9,
    minHeight: 28,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.berry,
  },
  autoPillText: {
    color: theme.berryDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 9,
  },
  captionPanel: {
    borderRadius: 16,
    backgroundColor: '#F8F6FF',
    borderWidth: 1.5,
    borderColor: '#E4DEFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 9,
  },
  caption: {
    color: theme.ink,
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  replay: {
    minHeight: 32,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 10,
  },
  replayText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  buttonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
    marginBottom: 9,
    paddingHorizontal: 2,
  },
  heading: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 14,
  },
  formHeading: { marginTop: 18, marginBottom: 9 },
  sectionHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  choices: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  equalSlot: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  choice: {
    width: '100%',
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: 'white',
    borderRadius: 17,
    paddingHorizontal: 6,
    paddingVertical: 10,
    height: 102,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  selected: {
    borderColor: theme.sunDeep,
    backgroundColor: '#FFF7E0',
    boxShadow: '0px 5px 0px rgba(255,190,45,0.18)',
  },
  choiceEmoji: { fontSize: 25 },
  choiceTitle: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
    lineHeight: 15,
    minHeight: 30,
    textAlign: 'center',
  },
  ideaActions: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  another: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: 'white',
    paddingHorizontal: 8,
  },
  anotherText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  customToggle: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: 'white',
    paddingHorizontal: 8,
  },
  customToggleActive: { backgroundColor: '#EEE9FF', borderColor: '#CFC3FF' },
  customEditor: {
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#DCD2FF',
    backgroundColor: '#F8F5FF',
    padding: 11,
    marginBottom: 4,
  },
  customEditorLabel: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
    marginBottom: 8,
  },
  customInput: { minHeight: 92, paddingTop: 12 },
  boosters: { gap: 7, paddingHorizontal: 2, paddingBottom: 4 },
  booster: {
    minHeight: 56,
    minWidth: 70,
    borderWidth: 1.5,
    borderColor: theme.line,
    borderRadius: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    gap: 2,
  },
  boosterSelected: { borderColor: theme.berry, backgroundColor: '#FFF0F4' },
  boosterEmoji: { fontSize: 18 },
  boosterText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  input: {
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: 'white',
    color: theme.ink,
    paddingHorizontal: 12,
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    marginTop: 10,
  },
  message: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F4',
    borderWidth: 1.5,
    borderColor: '#FFD2DC',
    padding: 11,
  },
  messageText: {
    color: theme.berryDeep,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    width: '100%',
    alignSelf: 'stretch',
  },
  back: {
    width: '100%',
    minHeight: 49,
    borderRadius: 13,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: theme.line,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  next: {
    width: '100%',
    minHeight: 49,
    borderRadius: 13,
    backgroundColor: theme.sun,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navigationButtonText: { flexShrink: 1, textAlign: 'center', fontSize: 12 },
  disabled: { opacity: 0.35 },
});
