import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import type { MemoryGoalType, MemorySetUpsertRequest } from '@/features/memory-sets';
import { useMemorySetMutations } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import type { PegNumber } from '@/features/number-peg/types/numberPeg.types';
import { buildNumberPegItems, buildPegScene } from '@/features/number-peg/utils/numberPegMap';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { firstParam, parseComposerGoal, parseComposerItems, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { ComposerProgress } from '@/features/memory-composer/components/ComposerProgress';
import { SceneEditorCard } from '@/features/memory-composer/components/SceneEditorCard';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ComposerStep = 'items' | 'scenes';
type SceneDraft = { answer: string; sceneText: string; variant: number };

const goals: { key: MemoryGoalType; label: string; emoji: string }[] = [
  { key: 'spelling', label: 'Spelling', emoji: '✏️' },
  { key: 'ordered-list', label: 'A list', emoji: '🛒' },
  { key: 'facts', label: 'Facts', emoji: '💡' },
  { key: 'custom', label: 'Something else', emoji: '✨' },
];

export default function NumberPegComposerScreen() {
  const { t } = useTranslation('numberPeg');
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string | string[]; items?: string | string[]; goalType?: string | string[] }>();
  const { createMemorySet } = useMemorySetMutations();
  const pegs = useMemo(() => buildNumberPegItems(), []);
  const prefilledItems = useMemo(() => parseComposerItems(params.items), [params.items]);
  const fromSharedComposer = prefilledItems.length > 0;
  const [step, setStep] = useState<ComposerStep>(() => (prefilledItems.length ? 'scenes' : 'items'));
  const [title, setTitle] = useState(() => firstParam(params.title) ?? '');
  const [goalType, setGoalType] = useState<MemoryGoalType>(() => parseComposerGoal(params.goalType));
  const [newItem, setNewItem] = useState('');
  const [items, setItems] = useState<string[]>(() => prefilledItems.slice(0, 10));
  const [scenes, setScenes] = useState<SceneDraft[]>(() =>
    prefilledItems.slice(0, 10).map((answer, index) => ({
      answer,
      sceneText: buildPegScene((index + 1) as PegNumber, answer),
      variant: 0,
    }))
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const addItem = () => {
    const answer = newItem.trim();
    if (!answer) return;
    if (items.length >= 10) {
      setValidationMessage('Number Peg is strongest with 10 items or fewer.');
      return;
    }
    setItems((current) => [...current, answer]);
    setNewItem('');
    setValidationMessage(null);
    createMemorySet.reset();
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setValidationMessage(null);
    createMemorySet.reset();
  };

  const continueToScenes = () => {
    if (!items.length) {
      setValidationMessage('Add at least one thing to remember.');
      return;
    }
    if (!title.trim()) setTitle(suggestMemoryTitle(goalType, items));

    setScenes(
      items.map((answer, index) => {
        const existing = scenes[index];
        if (existing?.answer === answer) return existing;
        return {
          answer,
          sceneText: buildPegScene((index + 1) as PegNumber, answer),
          variant: 0,
        };
      })
    );
    setValidationMessage(null);
    createMemorySet.reset();
    setStep('scenes');
  };

  const makeSceneCrazier = (index: number) => {
    setScenes((current) =>
      current.map((scene, sceneIndex) => {
        if (sceneIndex !== index) return scene;
        const variant = scene.variant + 1;
        return {
          ...scene,
          variant,
          sceneText: buildPegScene((index + 1) as PegNumber, scene.answer, variant),
        };
      })
    );
  };

  const updateScene = (index: number, sceneText: string) => {
    setScenes((current) =>
      current.map((scene, sceneIndex) => (sceneIndex === index ? { ...scene, sceneText } : scene))
    );
  };

  const save = () => {
    if (scenes.some((scene) => !scene.sceneText.trim())) {
      setValidationMessage('Every peg needs a vivid scene before recall begins.');
      return;
    }

    const request: MemorySetUpsertRequest = {
      title: title.trim(),
      goalType,
      techniqueKey: 'number-peg',
      status: 'ready',
      visibility: 'private',
      items: items.map((answer, index) => ({
        position: index + 1,
        prompt: goalType === 'spelling' ? `Spell item ${index + 1}` : `Recall item ${index + 1}`,
        answer,
      })),
      techniquePlan: {
        schemaVersion: 1,
        palaceBindings: [],
        pegBindings: scenes.map((scene, index) => ({
          itemPosition: index + 1,
          pegNumber: index + 1,
          sceneText: scene.sceneText.trim(),
          isCustomScene: true,
        })),
      },
    };

    setValidationMessage(null);
    createMemorySet.mutate(request, {
      onSuccess: (created) => {
        const returnTo = fromSharedComposer ? 'practice' : 'number-peg';
        router.replace(`/number-peg/${created.id}?returnTo=${returnTo}` as Href);
      },
    });
  };

  const errorMessage = createMemorySet.isError
    ? getNumberPegErrorMessage(createMemorySet.error, 'We could not save this memory. Try again.')
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={step === 'items' ? (fromSharedComposer ? t('checkItems') : t('addItems')) : t('memoryMovies')}
        description={step === 'items' ? (fromSharedComposer ? `${items.length} items · Up to 10` : 'Step 1 of 2 · Up to 10 items') : 'One tiny movie per peg · Weird wins'}
        backAction={() => {
          if (step === 'scenes') {
            // When launched from the shared chooser, return to technique
            // selection so the user can compare the other method. Direct
            // Number Peg entry still steps back to its item editor.
            if (fromSharedComposer) {
              router.back();
            } else {
              setStep('items');
            }
            return;
          }
          router.back();
        }}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ComposerProgress currentStep={step === 'items' ? 1 : 2} firstLabel="Add items" secondLabel="Make scenes" />

        {step === 'items' ? (
          <>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Text style={styles.tipEmoji}>📝</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{t('startSmall')}</Text>
                <Text style={styles.tipBody}>
                  Five clear items make a great first round. You can always create another set.
                </Text>
              </View>
            </View>

            {fromSharedComposer && title.trim() ? (
              <View style={styles.draftCard}>
                <Text style={styles.draftEyebrow}>{t('sessionReady')}</Text>
                <Text numberOfLines={1} style={styles.draftTitle}>{title}</Text>
                <Text style={styles.draftMeta}>{goalLabel(goalType)} · {items.length} items</Text>
              </View>
            ) : (
              <>
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
                        <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                          {goal.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>{t('nameMemory')} <Text style={styles.optionalLabel}>{t('optional')}</Text></Text>
                <TextInput
                  value={title}
                  onChangeText={(value) => {
                    setTitle(value);
                    setValidationMessage(null);
                  }}
                  maxLength={200}
                  placeholder={t('namePlaceholder')}
                  placeholderTextColor="#AAA7B5"
                  style={styles.input}
                />
              </>
            )}

            <View style={styles.labelRow}>
                <Text style={styles.label}>{t('addItems')}</Text>
              <Text style={styles.itemCount}>{items.length}/10</Text>
            </View>
            <View style={styles.addRow}>
              <TextInput
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={addItem}
                returnKeyType="done"
                maxLength={500}
                placeholder={t('itemPlaceholder')}
                placeholderTextColor="#AAA7B5"
                style={[styles.input, styles.addInput]}
              />
              <AnimatedPressable
                accessibilityLabel={t('addItem')}
                onPress={addItem}
                style={styles.addButton}>
                <Plus size={22} color="white" />
              </AnimatedPressable>
            </View>

            <View style={styles.itemList}>
              {items.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.itemRow}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.itemText}>{item}</Text>
                  <AnimatedPressable
                    accessibilityLabel={`Remove ${item}`}
                    onPress={() => removeItem(index)}
                    style={styles.deleteButton}>
                    <Trash2 size={17} color={theme.inkSoft} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Text style={styles.tipEmoji}>🎬</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{t('vividPrompt')}</Text>
                <Text style={styles.tipBody}>
                  Edit any suggestion. Funny, loud, impossible scenes are easier to recall.
                </Text>
              </View>
            </View>

            {scenes.map((scene, index) => {
              const peg = pegs[index];
              return (
                <SceneEditorCard
                  key={`${scene.answer}-${index}`}
                  index={index}
                  total={scenes.length}
                  anchorLabel={`PEG ${index + 1} · ${peg.keyword.toUpperCase()}`}
                  itemLabel={scene.answer}
                  visual={
                    <>
                      <Text style={styles.pegEmoji}>{peg.image}</Text>
                      <Text style={styles.plusSign}>+</Text>
                      <Text style={styles.answerVisual} numberOfLines={2}>{scene.answer}</Text>
                    </>
                  }
                  value={scene.sceneText}
                  onChangeText={(value) => updateScene(index, value)}
                  placeholder={t('associationPlaceholder')}
                  maxLength={1000}
                  accessibilityLabel={`Scene for ${scene.answer}`}
                  actionLabel={t('makeCrazier')}
                  onAction={() => makeSceneCrazier(index)}
                />
              );
            })}
          </>
        )}

        {(validationMessage || errorMessage) && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{validationMessage ?? errorMessage}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {step === 'scenes' && (
            <AnimatedPressable onPress={() => setStep('items')} style={styles.secondaryButton}>
              <ArrowLeft size={18} color={theme.ink} />
              <Text style={styles.secondaryButtonText}>{t('itemsLabel')}</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable
            disabled={createMemorySet.isPending}
            onPress={step === 'items' ? continueToScenes : save}
            style={[styles.continueButton, createMemorySet.isPending && styles.disabledButton]}>
            {step === 'scenes' ? <Check size={19} color={theme.ink} /> : null}
            <Text style={styles.continueButtonText}>
              {createMemorySet.isPending
                ? 'Saving…'
                : step === 'items'
                  ? 'Build my scenes'
                  : errorMessage
                    ? 'Try saving again'
                    : 'Save and open scenes'}
            </Text>
            {step === 'items' ? <ArrowRight size={19} color={theme.ink} /> : null}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function goalLabel(goalType: MemoryGoalType) {
  return goals.find((goal) => goal.key === goalType)?.label ?? 'Something to remember';
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 44 },
  progressTrack: { height: 7, borderRadius: 99, backgroundColor: theme.line, overflow: 'hidden', marginBottom: 18 },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: theme.sunDeep },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFF0F4',
    borderWidth: 1.5,
    borderColor: '#FFD9E2',
    marginBottom: 20,
  },
  tipIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  tipEmoji: { fontSize: 21 },
  tipTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  tipBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 3 },
  draftCard: { borderRadius: 16, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 13, marginBottom: 2 },
  draftEyebrow: { color: theme.sunDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  draftTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 16, marginTop: 4 },
  draftMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3 },
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginBottom: 8, marginTop: 10 },
  optionalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, marginTop: 10, marginBottom: 8 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 13, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 11, paddingVertical: 9 },
  goalChipSelected: { borderColor: theme.sunDeep, backgroundColor: '#FFF7E0' },
  goalEmoji: { fontSize: 15 },
  goalLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  goalLabelSelected: { color: theme.ink },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 14, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  addRow: { flexDirection: 'row', gap: 9 },
  addInput: { flex: 1 },
  addButton: { width: 50, height: 50, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  itemList: { marginTop: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: theme.line },
  itemNumber: { width: 27, height: 27, borderRadius: 14, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center' },
  itemNumberText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemText: { flex: 1, color: theme.ink, fontFamily: typography.bodyBold, fontSize: 14, marginHorizontal: 11 },
  deleteButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pegEmoji: { fontSize: 39 },
  plusSign: { color: theme.berryDeep, fontFamily: typography.display, fontSize: 22 },
  answerVisual: { maxWidth: 135, color: theme.ink, fontFamily: typography.display, fontSize: 17, textAlign: 'center' },
  errorCard: { borderRadius: 14, backgroundColor: '#FFF0F4', borderWidth: 1.5, borderColor: '#FFD2DC', padding: 12, marginTop: 10 },
  errorText: { color: '#B53A5F', fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actions: { marginTop: 18, flexDirection: 'row', gap: 9 },
  secondaryButton: { minHeight: 52, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, gap: 5 },
  secondaryButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  continueButton: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  continueButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
});
