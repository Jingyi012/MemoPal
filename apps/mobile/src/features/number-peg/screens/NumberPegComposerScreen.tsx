import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import AnimatedPressable from '@/components/AnimatedPressable';
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
import { useGenerateNumberPegStories } from '@/features/number-peg/hooks/useGenerateNumberPegStories';

type SceneDraft = {
  answer: string;
  sceneText: string;
  userDetail?: string;
  creativeQuestion?: string;
  source?: string;
  recipe: PegSceneRecipe;
};
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
    stopGenerating: '先用当前联想',
    generate: '生成联想故事',
    ai: 'AI 联想',
    template: '备用联想 · 可编辑',
    mixed: 'AI 与备用联想',
    manual: '我的故事',
    another: '换个故事',
    editStory: '自己编辑',
    done: '完成编辑',
    personalize: '加入我的元素',
    explanation: '加入你熟悉的人、地点或物品，让故事更好记。',
    detail: '比如：我家的猫、学校食堂',
    refine: '融入故事',
    preview: '新故事预览',
    previewHint: '原故事还在上方。喜欢这个版本，再采用它。',
    useStory: '采用新故事',
    keepOriginal: '保留原故事',
    accept: '就记这个，下一张',
    fallback:
      '本次未获得完整的 AI 生成结果，故事中包含备用模板。你可以重试 AI 生成，或保留原故事并自己编辑。',
    generationError: '故事生成失败，原来的联想已保留。可以重试或自己编辑。',
    offlineSave: '当前离线，故事草稿已保留。联网后再点击保存。',
  },
  en: {
    title: 'Number memory',
    story: 'Association story',
    intro: 'Connect each target to its fixed number peg with a memorable story.',
    generating: 'Creating a story…',
    stopGenerating: 'Use the current story',
    generate: 'Create association stories',
    ai: 'AI association',
    template: 'Fallback association · editable',
    mixed: 'AI and fallback associations',
    manual: 'My story',
    another: 'Try another story',
    editStory: 'Edit it myself',
    done: 'Finish editing',
    personalize: 'Add my own elements',
    explanation: 'Add a familiar person, place, or object to make the story easier to remember.',
    detail: 'For example: my cat, the school cafeteria',
    refine: 'Blend into story',
    preview: 'New story preview',
    previewHint: 'Your original story is still above. Adopt this version only if you prefer it.',
    useStory: 'Use new story',
    keepOriginal: 'Keep original',
    accept: 'Keep this · next',
    fallback:
      'AI generation did not return a complete result. These stories include fallback templates. Retry AI generation, or keep and edit your original story.',
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
    items?: string | string[];
    goalType?: string | string[];
    onboardingLessonId?: string | string[];
  }>();
  const { createMemorySet } = useMemorySetMutations();
  const { linkMemory: linkOnboardingMemory } = useOnboardingMutations();
  const generateStories = useGenerateNumberPegStories();
  const { user } = useCurrentUser();
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
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const requestVersion = useRef(0);
  const generationController = useRef<AbortController | null>(null);
  const autoGenerated = useRef(false);
  const [editDetail, setEditDetail] = useState(false);
  const [storyPreview, setStoryPreview] = useState<{ index: number; scene: SceneDraft } | null>(
    null
  );
  const [editStory, setEditStory] = useState(false);
  const savingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const progressScrollRef = useRef<ScrollView>(null);
  const draftKey = useMemo(
    () =>
      `@memopal:number-peg-studio:${user?.id ?? 'local'}:${fromShared ? `${firstParam(params.title) ?? ''}:${initialItems.join('|')}` : 'direct'}`,
    [fromShared, initialItems, params.title, user?.id]
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
    async (values: SceneDraft[], positions: number[], preview = false) => {
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
              existingStory: preview || scene.source ? scene.sceneText : undefined,
              userDetail: preview ? scene.userDetail?.trim() || undefined : undefined,
            };
          }),
        });
        if (requestVersion.current !== version) return;
        const suggestions = new Map(
          result.suggestions.map((suggestion) => [suggestion.position, suggestion])
        );
        const nextScenes = values.map((scene, i): SceneDraft => {
          const suggestion = suggestions.get(i + 1);
          return suggestion
            ? {
                ...scene,
                sceneText: suggestion.story,
                creativeQuestion: suggestion.creativeQuestion ?? undefined,
                source: result.source,
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
          setStoryPreview({ index: previewIndex, scene: nextScenes[previewIndex] });
        } else setScenes(nextScenes);
        if (result.source !== 'ai') setMessage(copy.fallback);
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
    [copy.fallback, copy.generationError, generateStories, language]
  );
  useEffect(() => {
    if (!loaded || !fromShared || autoGenerated.current || !scenes.length) return;
    autoGenerated.current = true;
    if (!scenes.some((scene) => scene.source))
      void generate(
        scenes,
        scenes.map((_, i) => i)
      );
  }, [fromShared, generate, loaded, scenes]);
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
    const buildScenes = async () => {
      if (generatingRef.current) return;
      if (!items.length) {
        setMessage(t('addThingMessage'));
        return;
      }
      const generatedScenes = initialScenes(items, unlocked, anchors, t);
      const next = items.map((value, i) =>
        scenes[i]?.answer === value ? scenes[i] : generatedScenes[i]
      );
      setScenes(next);
      setIndex(0);
      setStep('studio');
      await generate(
        next,
        next.map((_, i) => i)
      );
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
            selectionColor={theme.berryDeep}
            cursorColor={theme.berryDeep}
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
            selectionColor={theme.berryDeep}
            cursorColor={theme.berryDeep}
            style={styles.input}
          />
          <AnimatedPressable onPress={addItem} style={styles.next}>
            <Text style={styles.buttonText}>{t('addItem')}</Text>
            <ArrowRight size={17} color={theme.onSun} />
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
          <AnimatedPressable
            disabled={isGenerating}
            onPress={buildScenes}
            style={[styles.next, isGenerating && styles.disabled]}>
            <Text style={styles.buttonText}>{isGenerating ? copy.generating : copy.generate}</Text>
            <ArrowRight size={17} color={theme.onSun} />
          </AnimatedPressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  const openScene = (sceneIndex: number) => {
    if (generatingRef.current || savingRef.current) return;
    setIndex(sceneIndex);
    setStoryPreview(null);
    setEditDetail(false);
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
      if (onboardingLessonId && onboardingMemoryIdRef.current) {
        await linkOnboardingMemory.mutateAsync(onboardingMemoryIdRef.current);
        router.replace(
          `/number-peg/${onboardingMemoryIdRef.current}?returnTo=practice&mode=recall` as Href
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
        <View style={styles.stageCard}>
          <View style={styles.stageTopRow}>
            <View style={styles.anchorPill}>
              <Text style={styles.anchorPillEmoji}>{currentAnchor.image}</Text>
              <Text style={styles.anchorPillText}>
                {t('pegLabel')} {pegNumber} · {currentAnchor.keyword}
              </Text>
            </View>
          </View>
          <View style={styles.captionPanel}>
            {isGenerating ? (
              <View style={styles.storyTools}>
                <ActivityIndicator color={theme.berryDeep} accessibilityLabel={copy.generating} />
                <AnimatedPressable onPress={cancelGeneration} style={styles.replay}>
                  <Text style={styles.replayText}>{copy.stopGenerating}</Text>
                </AnimatedPressable>
              </View>
            ) : null}
            <Text style={styles.heading}>{copy.story}</Text>
            <Text style={styles.targetWord}>{current.answer}</Text>
            <Text style={styles.sectionHint}>
              {isGenerating
                ? copy.generating
                : current.source === 'ai'
                  ? copy.ai
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
            {!storyPreview && (
              <View style={styles.storyActionGroup}>
                <View style={styles.storyActionRow}>
                  <AnimatedPressable
                    containerStyle={styles.equalSlot}
                    disabled={isGenerating || isSaving}
                    onPress={() => void generate(scenes, [index])}
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
                      setEditDetail(false);
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
                <AnimatedPressable
                  disabled={isGenerating || isSaving}
                  accessibilityState={{ expanded: editDetail }}
                  onPress={() => {
                    setEditDetail(!editDetail);
                    setEditStory(false);
                  }}
                  style={[
                    styles.storyAction,
                    editDetail && styles.storyActionActive,
                    (isGenerating || isSaving) && styles.disabled,
                  ]}>
                  <Text accessible={false} style={styles.storyActionIcon}>
                    ✨
                  </Text>
                  <Text style={styles.storyActionText}>{copy.personalize}</Text>
                </AnimatedPressable>
              </View>
            )}
          </View>
          {editDetail && !storyPreview ? (
            <View style={styles.customEditor}>
              <Text style={styles.sectionHint}>{copy.explanation}</Text>
              <TextInput
                multiline
                maxLength={500}
                editable={!isGenerating && !isSaving}
                accessibilityLabel={copy.personalize}
                value={current.userDetail ?? ''}
                onChangeText={(value) =>
                  setScenes((all) =>
                    all.map((scene, i) => (i === index ? { ...scene, userDetail: value } : scene))
                  )
                }
                placeholder={copy.detail}
                placeholderTextColor={theme.inkSoft}
                style={[styles.input, styles.customInput]}
              />
              <AnimatedPressable
                disabled={isGenerating || isSaving || !current.userDetail?.trim()}
                onPress={() => void generate(scenes, [index], true)}
                style={[
                  styles.replay,
                  (isGenerating || !current.userDetail?.trim()) && styles.disabled,
                ]}>
                <Text style={styles.replayText}>
                  {isGenerating ? copy.generating : copy.refine}
                </Text>
              </AnimatedPressable>
            </View>
          ) : null}
          {storyPreview ? (
            <View style={styles.customEditor} accessibilityLiveRegion="polite">
              <Text style={styles.heading}>{copy.preview}</Text>
              <Text style={styles.sectionHint}>{copy.previewHint}</Text>
              <Text style={styles.caption}>{storyPreview.scene.sceneText}</Text>
              <AnimatedPressable
                style={[styles.next, styles.previewAction]}
                onPress={() => {
                  setScenes((all) =>
                    all.map((scene, i) => (i === storyPreview.index ? storyPreview.scene : scene))
                  );
                  setStoryPreview(null);
                  setEditDetail(false);
                  setMessage(null);
                }}>
                <Text style={styles.buttonText}>{copy.useStory}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.replay}
                onPress={() => {
                  setStoryPreview(null);
                  setEditDetail(false);
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
        <View style={styles.actions}>
          <AnimatedPressable
            containerStyle={styles.equalSlot}
            disabled={!index || isSaving || isGenerating || Boolean(storyPreview)}
            onPress={() => openScene(Math.max(0, index - 1))}
            style={[
              styles.back,
              (!index || isSaving || isGenerating || Boolean(storyPreview)) && styles.disabled,
            ]}>
            <ArrowLeft size={17} color={theme.ink} />
            <Text style={[styles.buttonText, styles.navigationButtonText, { color: theme.ink }]}>
              {t('previousScene')}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            containerStyle={styles.equalSlot}
            disabled={isSaving || isGenerating || Boolean(storyPreview)}
            onPress={advance}
            accessibilityState={{ disabled: isSaving || isGenerating || Boolean(storyPreview) }}
            style={[
              styles.next,
              (isSaving || isGenerating || Boolean(storyPreview)) && styles.disabled,
            ]}>
            <Text style={[styles.buttonText, styles.navigationButtonText]}>
              {isSaving
                ? t('saving')
                : index === items.length - 1
                  ? isOnboarding
                    ? t('startRecall')
                    : t('saveMemory')
                  : copy.accept}
            </Text>
            <ArrowRight size={17} color={theme.onSun} />
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
    goalSelected: { borderColor: theme.sunDeep, backgroundColor: theme.sunTint },
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
      color: theme.berryDeep,
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
    activeDot: { backgroundColor: theme.sun, borderColor: theme.sunDeep },
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
    replayText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
    buttonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 13 },
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
    back: {
      width: '100%',
      minHeight: 49,
      borderRadius: 13,
      backgroundColor: theme.paper,
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
  })
);
