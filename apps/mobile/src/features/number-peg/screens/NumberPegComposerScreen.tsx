import {
  SpotlightTarget,
  usePageTour,
} from '@/features/onboarding/components/SpotlightTourProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from '@/core/icons';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { CommonHeader } from '@/components/CommonHeader';
import type {
  MemoryGoalType,
  MemorySetUpsertRequest,
  PegSceneRecipe,
} from '@/features/memory-sets';
import { useMemorySetMutations } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
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
  type SceneAnchor,
} from '@/features/number-peg/utils/numberPegMovie';
import { useOnboardingMutations } from '@/features/onboarding/hooks/useOnboardingMutations';
import { guidedStarterSessionHref } from '@/features/onboarding/utils/onboardingRoutes';
import { useGenerateNumberPegStories } from '@/features/number-peg/hooks/useGenerateNumberPegStories';
import { NumberPegImageEditor } from '../components/NumberPegImageEditor';
import { useAiCredits } from '@/features/ai-credits/hooks/useAiCredits';
import { usePredefinedMemoryLesson } from '@/features/predefined-memory-lessons/hooks/usePredefinedMemoryLessons';
import { findPredefinedMemoryLessonItem } from '@/features/predefined-memory-lessons/utils/predefinedMemoryLessonLocalization';
import type { PredefinedMemoryLesson } from '@/features/predefined-memory-lessons/types/predefinedMemoryLesson.types';

type SceneDraft = {
  sceneAssetUrl?: string;
  imageStory?: string;
  imageJobId?: string;
  answer: string;
  sceneText: string;
  source?: string;
  recipe: PegSceneRecipe;
};
type StudioDraft = {
  schemaVersion: 1;
  kind: 'number-peg-studio';
  savedMemorySetId?: string;
  step: 'items' | 'studio';
  title: string;
  goalType: MemoryGoalType;
  items: string[];
  scenes: SceneDraft[];
  index: number;
};
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
const storyCopy = {
  zh: {
    title: '数字记忆',
    story: '联想故事',
    intro: '用一个奇特的联想故事，把目标词和固定数字挂钩连起来。',
    generating: '正在构思故事…',
    generate: '生成联想故事',
    ai: 'AI 联想',
    template: '备用联想 · 可编辑',
    mixed: 'AI 与备用联想',
    manual: '我的故事',
    another: '换个故事',
    editStory: '自己编辑',
    done: '完成编辑',
    improveStory: 'AI 改进故事',
    curated: '课程联想',
    improveHint: '先编辑故事，再让 AI 帮你润色；原故事会保留供比较。',
    preview: 'AI 改进预览',
    previewHint: '你编辑后的原故事仍会保留。喜欢这个版本，再采用它。',
    useStory: '采用新故事',
    keepOriginal: '保留原故事',
    accept: '就记这个，下一张',
    generationError: '故事生成失败，原来的联想已保留。可以重试或自己编辑。',
    offlineSave: '当前离线，故事草稿已保留。联网后再点击保存。',
  },
  en: {
    title: 'Number memory',
    story: 'Association story',
    intro: 'Connect each target to its fixed number peg with a memorable story.',
    generating: 'Creating a story…',
    generate: 'Create association stories',
    ai: 'AI association',
    template: 'Fallback association · editable',
    mixed: 'AI and fallback associations',
    manual: 'My story',
    another: 'Try another story',
    editStory: 'Edit it myself',
    done: 'Finish editing',
    improveStory: 'Improve story with AI',
    curated: 'Authored course association',
    improveHint:
      'Edit your story first, then let AI polish it. Your original stays available to compare.',
    preview: 'AI improvement preview',
    previewHint: 'Your edited original is kept. Adopt this version only if you prefer it.',
    useStory: 'Use new story',
    keepOriginal: 'Keep original',
    accept: 'Keep this · next',
    generationError:
      'Story generation failed. Your previous association is kept; retry or edit it yourself.',
    offlineSave: 'You are offline. Your story draft is kept; reconnect and tap Save again.',
  },
};
export default function NumberPegComposerScreen() {
  const { t, language } = useTranslation('numberPeg');
  const copy = storyCopy[language === 'zh' ? 'zh' : 'en'];
  const { styles, theme } = useStyles();
  const { isReady: networkReady, isOnline } = useNetworkStatus();
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    emoji?: string | string[];
    items?: string | string[];
    goalType?: string | string[];
    guidedStarter?: string | string[];
    onboardingLessonId?: string | string[];
    memoryFolderId?: string | string[];
    memorySetId?: string | string[];
    expectedVersion?: string | string[];
    description?: string | string[];
    predefinedLessonId?: string | string[];
  }>();
  const { createMemorySet, updateMemorySet } = useMemorySetMutations();
  const editingMemorySetId = firstParam(params.memorySetId);
  const predefinedLessonId = firstParam(params.predefinedLessonId);
  const predefinedLessonQuery = usePredefinedMemoryLesson(predefinedLessonId);
  const predefinedLesson = predefinedLessonQuery.data;
  const { linkMemory: linkOnboardingMemory } = useOnboardingMutations();
  const generateStories = useGenerateNumberPegStories();
  const aiCredits = useAiCredits();
  const { user } = useCurrentUser();
  const unlocked = editingMemorySetId ? MAX_NUMBER_PEGS : getUnlockedPegCount(user?.level ?? 1);
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
  const memoryFolderId = firstParam(params.memoryFolderId) || undefined;
  const guidedStarter = Boolean(onboardingLessonId) && firstParam(params.guidedStarter) === '1';
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
    initialScenes(
      initialItems,
      unlocked,
      anchors,
      t,
      predefinedLesson,
      language,
      Boolean(predefinedLessonId)
    )
  );
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const requestVersion = useRef(0);
  const generationController = useRef<AbortController | null>(null);
  const [storyPreview, setStoryPreview] = useState<{ index: number; scene: SceneDraft } | null>(
    null
  );
  const [editStory, setEditStory] = useState(false);
  const savingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const progressScrollRef = useRef<ScrollView>(null);
  const studioScroll = useRef<ScrollView>(null);
  const replayBuilderTour = usePageTour('builder', guidedStarter, loaded && step === 'studio');
  const { t: tourT } = useTranslation('onboarding');
  const draftKey = useMemo(
    () =>
      `@memopal:number-peg-studio:${user?.id ?? 'local'}:${
        editingMemorySetId ??
        (predefinedLessonId
          ? `predefined:${predefinedLessonId}`
          : fromShared
            ? `${firstParam(params.title) ?? ''}:${initialItems.join('|')}`
            : 'direct')
      }`,
    [editingMemorySetId, fromShared, initialItems, params.title, predefinedLessonId, user?.id]
  );
  const current = scenes[index];
  const pegNumber = (index % Math.max(1, unlocked)) + 1;
  const currentAnchor = current?.recipe.anchorSnapshot ?? anchors[pegNumber - 1];
  useEffect(
    () => () => {
      requestVersion.current += 1;
      generationController.current?.abort();
    },
    []
  );
  const cancelGeneration = () => {
    requestVersion.current += 1;
    generationController.current?.abort();
    generatingRef.current = false;
    setIsGenerating(false);
  };
  const generate = useCallback(
    async (
      values: SceneDraft[],
      positions: number[],
      preview = false,
      skipConfirmation = false
    ) => {
      if (generatingRef.current || savingRef.current) return;
      generatingRef.current = true;
      setIsGenerating(true);
      setMessage(null);
      const version = ++requestVersion.current;
      const controller = new AbortController();
      generationController.current = controller;
      try {
        const result = await generateStories.mutateAsync({
          signal: controller.signal,
          locale: language === 'zh' ? 'zh' : 'en',
          style: 'playful',
          items: positions.map((position) => {
            const scene = values[position];
            const anchor = scene.recipe.anchorSnapshot!;
            return {
              position: position + 1,
              pegNumber: anchor.pegNumber,
              pegKeyword: anchor.keyword,
              word: scene.answer,
              existingStory: scene.sceneText,
              improveExisting: preview,
            };
          }),
          skipConfirmation,
        });
        if (requestVersion.current !== version) return;
        const suggestions = new Map(
          result.suggestions.map((suggestion) => [suggestion.position, suggestion])
        );
        const nextScenes = values.map((scene, i): SceneDraft => {
          const suggestion = suggestions.get(i + 1);
          return suggestion?.source === 'ai'
            ? {
                ...scene,
                sceneText: suggestion.story,
                source: suggestion.source,
                recipe: {
                  ...scene.recipe,
                  caption: suggestion.story,
                  associationSource: preview ? 'customized' : 'suggested',
                },
              }
            : scene;
        });
        if (preview) {
          const previewIndex = positions[0];
          if (!suggestions.has(previewIndex + 1)) throw new Error(copy.generationError);
          if (suggestions.get(previewIndex + 1)?.source === 'ai') {
            setStoryPreview({ index: previewIndex, scene: nextScenes[previewIndex] });
            setEditStory(false);
          }
        } else setScenes(nextScenes);
        const acceptedCount = result.suggestions.filter(
          (suggestion) => suggestion.source === 'ai'
        ).length;
        if (acceptedCount < positions.length)
          setMessage(
            language === 'zh'
              ? acceptedCount === 0
                ? '本次没有生成可用的新联想。原故事已保留，未扣费。'
                : '部分联想未生成成功，未成功的故事已原样保留，且未扣除对应积分。'
              : acceptedCount === 0
                ? 'No usable new story was generated. Your original story is unchanged. No credits charged.'
                : 'Some stories could not be generated. Those stories are unchanged and were not charged.'
          );
      } catch (error) {
        if (requestVersion.current === version) {
          setScenes(values);
          setMessage(getNumberPegErrorMessage(error, copy.generationError));
        }
      } finally {
        if (requestVersion.current === version) {
          generatingRef.current = false;
          setIsGenerating(false);
        }
      }
    },
    [copy.generationError, generateStories, language]
  );
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
            if (isOnboarding && typeof d.savedMemorySetId === 'string')
              onboardingMemoryIdRef.current = d.savedMemorySetId;
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
  }, [draftKey, fromShared, initialItems, loaded, isOnboarding]);
  useEffect(() => {
    if (!loaded || !predefinedLesson || !predefinedLessonId || !items.length) return;
    setScenes((current) =>
      current.map((scene, index) => {
        const lessonItem = findPredefinedMemoryLessonItem(
          predefinedLesson,
          scene.answer,
          index,
          language === 'zh' ? 'zh' : 'en'
        );
        const association = lessonItem
          ? (language === 'zh' ? lessonItem.associationZh : lessonItem.associationEn).trim()
          : '';
        return {
          ...scene,
          sceneText: association,
          source: 'curated',
          recipe: { ...scene.recipe, caption: association, associationSource: 'customized' },
        };
      })
    );
  }, [items.length, language, loaded, predefinedLesson, predefinedLessonId]);
  useEffect(() => {
    if (loaded && items.length)
      void AsyncStorage.setItem(
        draftKey,
        JSON.stringify({
          schemaVersion: 1,
          kind: 'number-peg-studio',
          savedMemorySetId: onboardingMemoryIdRef.current ?? undefined,
          step,
          title,
          goalType,
          items,
          scenes,
          index,
        } satisfies StudioDraft)
      );
  }, [draftKey, goalType, index, items, loaded, scenes, step, title]);
  if (step === 'items' || !current) {
    const addItem = () => {
      if (generatingRef.current) return;
      const value = newItem.trim();
      if (!value) return;
      if (value.length > 500 || items.length >= MAX_NUMBER_PEGS) {
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
      if (generatingRef.current) return;
      if (!items.length) {
        setMessage(t('addThingMessage'));
        return;
      }
      const generatedScenes = initialScenes(
        items,
        unlocked,
        anchors,
        t,
        predefinedLesson,
        language,
        Boolean(predefinedLessonId)
      );
      const next = items.map((value, i) =>
        scenes[i]?.answer === value ? scenes[i] : generatedScenes[i]
      );
      setScenes(next);
      setIndex(0);
      setStep('studio');
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
            maxLength={200}
            onChangeText={setTitle}
            placeholder={t('namePlaceholder')}
            placeholderTextColor={theme.inkSoft}
            selectionColor={theme.violetDeep}
            cursorColor={theme.violetDeep}
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
            maxLength={500}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            placeholder={t('itemPlaceholder')}
            placeholderTextColor={theme.inkSoft}
            selectionColor={theme.violetDeep}
            cursorColor={theme.violetDeep}
            style={styles.input}
          />
          <AppButton label={t('addItem')} onPress={addItem} size="regular" trailingIcon={ArrowRight} variant="secondary" />
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
          <AppButton
            disabled={isGenerating}
            label={language === 'zh' ? '进入联想编辑 · 免费模板' : 'Start with free associations'}
            loading={isGenerating}
            onPress={buildScenes}
            size="large"
            trailingIcon={ArrowRight}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  const openScene = (sceneIndex: number) => {
    if (generatingRef.current || savingRef.current) return;
    setIndex(sceneIndex);
    setStoryPreview(null);
    setEditStory(false);
    setMessage(null);
  };
  const advance = () => {
    if (generatingRef.current || savingRef.current) return;
    if (index === items.length - 1) {
      void save();
      return;
    }
    openScene(index + 1);
  };
  async function save() {
    if (savingRef.current || generatingRef.current) return;
    if (networkReady && !isOnline) {
      setMessage(copy.offlineSave);
      return;
    }
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
      if (isOnboarding && onboardingMemoryIdRef.current) {
        await linkOnboardingMemory.mutateAsync(onboardingMemoryIdRef.current);
        await AsyncStorage.removeItem(draftKey);
        router.replace(
          guidedStarter
            ? guidedStarterSessionHref(onboardingMemoryIdRef.current)
            : (`/number-peg/${onboardingMemoryIdRef.current}?returnTo=practice&mode=recall` as Href)
        );
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
          memoryFolderId,
          description: firstParam(params.description),
          emoji: firstParam(params.emoji),
          expectedVersion: editingMemorySetId
            ? Number(firstParam(params.expectedVersion))
            : undefined,
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
              sceneAssetUrl: s.sceneAssetUrl,
              sceneRecipe: s.recipe,
              isCustomScene: s.recipe.associationSource !== 'suggested',
            })),
          },
        };
        created.push(
          editingMemorySetId
            ? await updateMemorySet.mutateAsync({ memorySetId: editingMemorySetId, request: req })
            : await createMemorySet.mutateAsync(req)
        );
      }
      if (created[0]) {
        if (isOnboarding) {
          onboardingMemoryIdRef.current = created[0].id;
          await AsyncStorage.setItem(
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
              savedMemorySetId: created[0].id,
            } satisfies StudioDraft)
          );
          await linkOnboardingMemory.mutateAsync(created[0].id);
        }
        await AsyncStorage.removeItem(draftKey);
        router.replace(
          guidedStarter
            ? guidedStarterSessionHref(created[0].id)
            : (`/number-peg/${created[0].id}?returnTo=${fromShared ? 'practice' : 'number-peg'}${isOnboarding ? '&mode=recall' : ''}` as Href)
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
        title={copy.title}
        description={`${t('sceneOf')} ${index + 1} ${t('of')} ${items.length}`}
        backAction={() => {
          if (!savingRef.current) {
            if (generatingRef.current) cancelGeneration();
            if (fromShared) router.back();
            else setStep('items');
          }
        }}
      />
      <ScrollView
        ref={studioScroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        refreshControl={
          <RefreshControl
            refreshing={aiCredits.isRefetching}
            onRefresh={() => void aiCredits.refetch()}
          />
        }
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
              disabled={isGenerating || isSaving}
              onPress={() => openScene(i)}
              style={[styles.dot, i === index && styles.activeDot]}>
              <Text style={[styles.dotLabel, i === index && { color: theme.onSun }]}>{i + 1}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
        {isOnboarding ? (
          <View style={styles.guidedCard}>
            <Text style={styles.guidedTitle}>{copy.title}</Text>
            <Text style={styles.guidedBody}>{copy.intro}</Text>
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
        <AnimatedPressable
          onPress={replayBuilderTour}
          style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.link }}>{tourT('guideEntry')}</Text>
        </AnimatedPressable>
        <View style={styles.stageCard}>
          <SpotlightTarget
            id="builderScene"
            onReveal={() => studioScroll.current?.scrollTo({ y: 0, animated: false })}>
            <View style={styles.stageTopRow}>
              <View style={styles.anchorPill}>
                <Text style={styles.anchorPillEmoji}>{currentAnchor.image}</Text>
                <Text style={styles.anchorPillText}>
                  {t('pegLabel')} {pegNumber} · {currentAnchor.keyword}
                </Text>
              </View>
            </View>
          </SpotlightTarget>
          <View style={styles.captionPanel}>
            <Text style={styles.heading}>{copy.story}</Text>
            <Text style={styles.targetWord}>{current.answer}</Text>
            <Text style={styles.sectionHint}>
              {isGenerating
                ? language === 'zh'
                  ? '当前联想 · 暂时保留'
                  : 'Current story · kept while generating'
                : current.source === 'ai'
                  ? copy.ai
                  : current.source === 'curated'
                    ? copy.curated
                    : current.source === 'manual'
                      ? copy.manual
                      : current.source === 'mixed'
                        ? copy.mixed
                        : copy.template}
            </Text>
            {editStory ? (
              <TextInput
                multiline
                maxLength={1000}
                accessibilityLabel={copy.editStory}
                editable={!isGenerating && !isSaving}
                value={current.sceneText}
                onChangeText={(value) =>
                  setScenes((all) =>
                    all.map((scene, i) =>
                      i === index
                        ? {
                            ...scene,
                            sceneText: value,
                            source: 'manual',
                            recipe: {
                              ...scene.recipe,
                              caption: value,
                              associationSource: 'user-written',
                            },
                          }
                        : scene
                    )
                  )
                }
                style={[styles.input, styles.customInput]}
              />
            ) : (
              <Text style={styles.caption}>{current.sceneText}</Text>
            )}
            <NumberPegImageEditor
              key={`${index}:${current.answer}`}
              input={{
                pegNumber: currentAnchor.pegNumber,
                pegKeyword: currentAnchor.keyword,
                word: current.answer,
                story: current.sceneText,
              }}
              imagePath={current.sceneAssetUrl}
              imageStory={current.imageStory}
              jobId={current.imageJobId}
              disabled={isGenerating || isSaving}
              onJob={(id) =>
                setScenes((all) =>
                  all.map((scene, i) => (i === index ? { ...scene, imageJobId: id } : scene))
                )
              }
              onAdopt={(path, story) =>
                setScenes((all) =>
                  all.map((scene, i) =>
                    i === index ? { ...scene, sceneAssetUrl: path, imageStory: story } : scene
                  )
                )
              }
              onRemove={() =>
                setScenes((all) =>
                  all.map((scene, i) =>
                    i === index
                      ? {
                          ...scene,
                          sceneAssetUrl: undefined,
                          imageStory: undefined,
                          imageJobId: undefined,
                        }
                      : scene
                  )
                )
              }
            />
            {isGenerating && (
              <View
                style={styles.generatingPanel}
                accessibilityLiveRegion="polite"
                accessibilityState={{ busy: true }}>
                <View style={styles.generatingHeading}>
                  <ActivityIndicator size="small" color={theme.violetDeep} />
                  <Text style={styles.generatingTitle}>{copy.generating}</Text>
                </View>
                <Text style={styles.generatingHint}>
                  {language === 'zh'
                    ? '新联想准备好后才会替换，当前故事会保留。'
                    : 'Your current story stays here until the new one is ready.'}
                </Text>
                <AnimatedPressable onPress={cancelGeneration} style={styles.stopWaiting}>
                  <Text style={styles.replayText}>
                    {language === 'zh' ? '停止等待' : 'Stop waiting'}
                  </Text>
                </AnimatedPressable>
              </View>
            )}
            {!storyPreview && !isGenerating && (
              <View style={styles.storyActionGroup}>
                <View style={styles.storyActionRow}>
                  <AnimatedPressable
                    containerStyle={styles.equalSlot}
                    disabled={isGenerating || isSaving}
                    onPress={() => void generate(scenes, [index], false, true)}
                    style={[styles.storyAction, (isGenerating || isSaving) && styles.disabled]}>
                    <Text accessible={false} style={styles.storyActionIcon}>
                      🔄
                    </Text>
                    <Text style={styles.storyActionText}>
                      {isGenerating ? copy.generating : copy.another}
                    </Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    containerStyle={styles.equalSlot}
                    disabled={isGenerating || isSaving}
                    accessibilityState={{ expanded: editStory }}
                    onPress={() => {
                      setEditStory(!editStory);
                    }}
                    style={[
                      styles.storyAction,
                      editStory && styles.storyActionActive,
                      (isGenerating || isSaving) && styles.disabled,
                    ]}>
                    <Text accessible={false} style={styles.storyActionIcon}>
                      ✏️
                    </Text>
                    <Text style={styles.storyActionText}>
                      {editStory ? copy.done : copy.editStory}
                    </Text>
                  </AnimatedPressable>
                </View>
                {(editStory || current.source === 'manual') && (
                  <>
                    <Text style={styles.sectionHint}>{copy.improveHint}</Text>
                    <AnimatedPressable
                      disabled={isGenerating || isSaving || !current.sceneText.trim()}
                      onPress={() => void generate(scenes, [index], true, true)}
                      style={[
                        styles.storyAction,
                        styles.improveStoryAction,
                        (isGenerating || isSaving || !current.sceneText.trim()) && styles.disabled,
                      ]}>
                      <Text accessible={false} style={styles.storyActionIcon}>
                        ✨
                      </Text>
                      <Text style={styles.storyActionText}>{copy.improveStory}</Text>
                    </AnimatedPressable>
                  </>
                )}
              </View>
            )}
          </View>
          {storyPreview ? (
            <View style={styles.customEditor} accessibilityLiveRegion="polite">
              <Text style={styles.heading}>{copy.preview}</Text>
              <Text style={styles.sectionHint}>{copy.previewHint}</Text>
              <Text style={styles.caption}>{storyPreview.scene.sceneText}</Text>
              <AppButton
                label={copy.useStory}
                onPress={() => {
                  setScenes((all) =>
                    all.map((scene, i) => (i === storyPreview.index ? storyPreview.scene : scene))
                  );
                  setStoryPreview(null);
                  setEditStory(false);
                  setMessage(null);
                }}
                size="large"
                style={styles.previewAction}
              />
              <AnimatedPressable
                style={styles.replay}
                onPress={() => {
                  setStoryPreview(null);
                  setEditStory(false);
                  setMessage(null);
                }}>
                <Text style={styles.replayText}>{copy.keepOriginal}</Text>
              </AnimatedPressable>
            </View>
          ) : null}
        </View>
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
        <AnimatedPressable
          disabled={isGenerating || isSaving}
          style={styles.batchGenerateButton}
          onPress={() =>
            void generate(
              scenes,
              scenes.map((_, i) => i)
            )
          }>
          <Text style={styles.batchGenerateText}>
            {language === 'zh' ? '为全部词语生成联想' : 'Generate stories for all words'}
          </Text>
          <Text style={styles.batchGenerateHint}>
            {language === 'zh' ? '批量更新整组故事' : 'Update the full set at once'}
          </Text>
        </AnimatedPressable>
        <View style={styles.actions}>
          <AppButton
            disabled={!index || isSaving || isGenerating || Boolean(storyPreview)}
            icon={ArrowLeft}
            label={t('previousScene')}
            onPress={() => openScene(Math.max(0, index - 1))}
            size="regular"
            style={styles.equalSlot}
            variant="secondary"
          />
          <View style={styles.equalSlot}>
            <SpotlightTarget
              id="builderNext"
              onReveal={() => studioScroll.current?.scrollToEnd({ animated: false })}
              onActivate={advance}>
              <AppButton
                disabled={isSaving || isGenerating || Boolean(storyPreview)}
                label={isSaving
                  ? t('saving')
                  : index === items.length - 1
                    ? isOnboarding && !guidedStarter
                      ? t('startRecall')
                      : t('saveMemory')
                    : copy.accept}
                loading={isSaving}
                onPress={advance}
                size="regular"
                style={styles.equalSlot}
                trailingIcon={ArrowRight}
              />
            </SpotlightTarget>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function initialScenes(
  items: string[],
  unlocked: number,
  anchors: SceneAnchor[],
  t: (key: any) => string,
  predefinedLesson?: PredefinedMemoryLesson,
  language: 'en' | 'zh' = 'en',
  isPredefinedLesson = false
) {
  return buildInitialSceneCandidates(items, anchors, unlocked, (key) => t(key as any)).map(
    (candidate, index) => {
      const answer = items[index];
      const lessonItem = findPredefinedMemoryLessonItem(predefinedLesson, answer, index, language);
      const association = lessonItem
        ? (language === 'zh' ? lessonItem.associationZh : lessonItem.associationEn).trim()
        : '';
      const sceneText = association || (isPredefinedLesson ? '' : candidate.sceneText);
      return {
        answer,
        sceneText,
        source: association ? 'curated' : isPredefinedLesson ? 'curated' : undefined,
        recipe: association
          ? { ...candidate.recipe, caption: association, associationSource: 'customized' as const }
          : candidate.recipe,
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

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: 'transparent' },
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
      minHeight: 44,
      minWidth: '47%',
      flexGrow: 1,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 8,
    },
    goalSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
    itemList: { gap: 7, marginTop: 12 },
    itemRow: {
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      gap: 9,
    },
    itemNumber: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 12,
      width: 20,
    },
    itemText: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 13 },
    remove: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    capacityCard: {
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.sunLine,
      backgroundColor: theme.sunTint,
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
      width: 44,
      height: 44,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14 },
    activeDot: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
    guidedCard: {
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.violetLine,
      backgroundColor: theme.violetTint,
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
    captionPanel: {
      borderRadius: 16,
      backgroundColor: theme.violetTint,
      borderWidth: 1.5,
      borderColor: theme.violetLine,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 9,
    },
    caption: {
      color: theme.ink,
      fontFamily: typography.bodySemibold,
      fontSize: 17,
      lineHeight: 27,
      marginTop: 12,
    },
    replay: {
      minHeight: 44,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 5,
      marginTop: 7,
      paddingHorizontal: 10,
    },
    replayText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
    batchGenerateButton: {
      minHeight: 52,
      marginTop: 12,
      marginBottom: 2,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.violetLine,
      backgroundColor: theme.violetTint,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    batchGenerateText: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 12,
    },
    batchGenerateHint: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 10,
      marginTop: 2,
    },
    heading: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 14,
    },
    formHeading: { marginTop: 18, marginBottom: 9 },
    sectionHint: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 12,
      marginTop: 8,
    },
    targetWord: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 24,
      marginTop: 10,
    },
    storyTools: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    generatingPanel: {
      marginTop: 18,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.paper,
      gap: 10,
    },
    generatingHeading: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    generatingTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
    generatingHint: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },
    stopWaiting: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    storyActionGroup: { marginTop: 18, gap: 10 },
    storyActionRow: { flexDirection: 'row', gap: 10 },
    storyAction: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    storyActionActive: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
    improveStoryAction: { borderColor: theme.violetLine, backgroundColor: theme.violetTint },
    storyActionIcon: { fontSize: 17 },
    storyActionText: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 13,
      flexShrink: 1,
      textAlign: 'center',
    },
    equalSlot: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
    customEditor: {
      marginTop: 12,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: theme.violetLine,
      backgroundColor: theme.violetTint,
      padding: 11,
      marginBottom: 4,
    },
    customInput: { minHeight: 92, paddingTop: 12 },
    previewAction: { marginTop: 16 },
    input: {
      minHeight: 48,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      color: theme.ink,
      paddingHorizontal: 12,
      fontFamily: typography.bodySemibold,
      fontSize: 14,
      marginTop: 10,
    },
    message: {
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: theme.berryTint,
      borderWidth: 1.5,
      borderColor: theme.berryLine,
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
    disabled: { opacity: 0.35 },
  })
);
