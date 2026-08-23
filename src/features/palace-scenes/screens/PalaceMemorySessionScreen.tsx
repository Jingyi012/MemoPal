import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useMemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { usePalaceScene } from '@/features/palace-scenes';
import {
  useCreatePracticeAttempt,
  type PracticeAttemptInput,
  type PracticeResponseInput,
} from '@/features/practice-attempts';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type SessionMode = 'browse' | 'walk' | 'recall';
type Feedback = 'correct' | 'wrong' | null;

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase();
}

export default function PalaceMemorySessionScreen({ memorySetId }: { memorySetId: string }) {
  const router = useRouter();
  const memorySetQuery = useMemorySet(memorySetId);
  const sceneId = memorySetQuery.data?.techniquePlan?.palaceSceneId ?? '';
  const sceneQuery = usePalaceScene(sceneId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<SessionMode>('browse');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [clientAttemptId, setClientAttemptId] = useState(() => Crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState(() => Date.now());
  const [responses, setResponses] = useState<PracticeResponseInput[]>([]);
  const [lastPayload, setLastPayload] = useState<PracticeAttemptInput | null>(null);
  const practiceAttempt = useCreatePracticeAttempt();

  const placements = useMemo(() => {
    const memorySet = memorySetQuery.data;
    const scene = sceneQuery.data;
    if (!memorySet || !scene) return [];
    const bindings = memorySet.techniquePlan?.palaceBindings ?? [];
    return memorySet.items.map((item) => {
      const binding = bindings.find((candidate) => candidate.memoryItemId === item.id);
      return { item, binding, locus: scene.loci.find((locus) => locus.id === binding?.locusId) };
    });
  }, [memorySetQuery.data, sceneQuery.data]);

  if (memorySetQuery.isLoading || (sceneId && sceneQuery.isLoading)) {
    return <LoadingView description="Opening your Palace…" />;
  }

  if (!memorySetQuery.data || !sceneQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader title="Memory Palace" description="Scene unavailable" backAction={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏚️</Text>
          <Text style={styles.emptyTitle}>This Palace could not open</Text>
          <Text style={styles.emptyText}>Refresh your connection or choose another memory.</Text>
        </View>
      </View>
    );
  }

  const memorySet = memorySetQuery.data;
  const scene = sceneQuery.data;
  const active = placements[activeIndex];
  const recallComplete = mode === 'recall' && activeIndex >= placements.length;

  const startRecall = () => {
    setMode('recall');
    setActiveIndex(0);
    setAnswer('');
    setFeedback(null);
    setScore(0);
    setClientAttemptId(Crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    setStartedAtMs(Date.now());
    setQuestionStartedAtMs(Date.now());
    setResponses([]);
    setLastPayload(null);
    practiceAttempt.reset();
  };

  const checkOrContinue = () => {
    if (!active) return;
    if (feedback) {
      if (activeIndex === placements.length - 1) {
        const payload: PracticeAttemptInput = {
          clientAttemptId,
          memorySetId: memorySet.id,
          mode: 'recall',
          startedAt,
          durationMs: Math.max(0, Date.now() - startedAtMs),
          responses,
        };
        setLastPayload(payload);
        practiceAttempt.mutate(payload);
      }
      setActiveIndex((value) => value + 1);
      setAnswer('');
      setFeedback(null);
      setQuestionStartedAtMs(Date.now());
      return;
    }

    if (!answer.trim()) return;
    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(active.item.answer);
    setResponses((current) => [
      ...current,
      {
        memoryItemId: active.item.id,
        isCorrect,
        attemptCount: 1,
        responseMs: Math.max(0, Date.now() - questionStartedAtMs),
      },
    ]);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore((value) => value + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        title={memorySet.title}
        description={`${scene.name} · ${placements.length} loci`}
        backAction={() => router.back()}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.canvas}>
          <AppImage imageUrl={scene.imageUrl} style={StyleSheet.absoluteFillObject} />
          {placements.map((placement, index) =>
            placement.locus ? (
              <AnimatedPressable
                key={placement.item.id}
                onPress={() => mode === 'browse' && setActiveIndex(index)}
                style={[
                  styles.marker,
                  { left: `${placement.locus.xPercent}%`, top: `${placement.locus.yPercent}%` },
                  index === activeIndex && styles.activeMarker,
                ]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </AnimatedPressable>
            ) : null
          )}
        </View>
        <Text style={styles.hint}>
          {mode === 'recall' ? 'Use the active locus as your cue.' : 'Tap a marker, or walk through every locus in order.'}
        </Text>

        {mode === 'walk' && active ? (
          <View style={styles.walkCard}>
            <Text style={styles.eyebrow}>LOCUS {activeIndex + 1} · {active.locus?.name.toUpperCase()}</Text>
            <Text style={styles.walkAnswer}>{active.item.answer}</Text>
            <Text style={styles.walkAssociation}>{active.binding?.associationText}</Text>
            <View style={styles.walkActions}>
              <AnimatedPressable
                disabled={activeIndex === 0}
                onPress={() => setActiveIndex((value) => Math.max(0, value - 1))}
                style={[styles.roundButton, activeIndex === 0 && styles.disabled]}>
                <ChevronLeft size={21} color={theme.ink} />
              </AnimatedPressable>
              <Text style={styles.count}>{activeIndex + 1} / {placements.length}</Text>
              <AnimatedPressable
                onPress={() =>
                  activeIndex === placements.length - 1
                    ? setActiveIndex(0)
                    : setActiveIndex((value) => value + 1)
                }
                style={styles.roundButton}>
                {activeIndex === placements.length - 1 ? (
                  <RotateCcw size={19} color={theme.ink} />
                ) : (
                  <ChevronRight size={21} color={theme.ink} />
                )}
              </AnimatedPressable>
            </View>
            <AnimatedPressable onPress={startRecall} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Start recall challenge</Text>
            </AnimatedPressable>
          </View>
        ) : mode === 'recall' ? (
          recallComplete ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultEmoji}>🏆</Text>
              <Text style={styles.resultTitle}>Palace recalled!</Text>
              <Text style={styles.resultScore}>{score} / {placements.length}</Text>
              <Text style={styles.resultBody}>
                {score === placements.length
                  ? 'Every locus led you to the right memory.'
                  : 'Walk through the missed loci once more, then try another round.'}
              </Text>
              {practiceAttempt.isPending ? (
                <Text style={styles.saveState}>Saving your progress…</Text>
              ) : practiceAttempt.isError ? (
                <View style={styles.saveError}>
                  <Text style={styles.saveErrorText}>Progress was not saved. Your result is still here.</Text>
                  <AnimatedPressable
                    onPress={() => lastPayload && practiceAttempt.mutate(lastPayload)}
                    style={styles.retrySaveButton}>
                    <Text style={styles.retrySaveText}>Retry save</Text>
                  </AnimatedPressable>
                </View>
              ) : practiceAttempt.data ? (
                <Text style={styles.saveSuccess}>
                  Saved ✓ Next review {practiceAttempt.data.nextReviewAt ? new Date(practiceAttempt.data.nextReviewAt).toLocaleString() : 'will appear in Today'}
                </Text>
              ) : null}
              <AnimatedPressable onPress={startRecall} style={styles.primaryButton}>
                <Text style={styles.primaryText}>Try another round</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => { setMode('walk'); setActiveIndex(0); }}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Walk the Palace again</Text>
              </AnimatedPressable>
            </View>
          ) : active ? (
            <View style={styles.recallCard}>
              <Text style={styles.eyebrow}>LOCUS {activeIndex + 1} · {active.locus?.name.toUpperCase()}</Text>
              <Text style={styles.recallPrompt}>What did you place here?</Text>
              <TextInput
                value={answer}
                onChangeText={(value) => { if (!feedback) setAnswer(value); }}
                onSubmitEditing={checkOrContinue}
                editable={!feedback}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="TYPE YOUR ANSWER"
                placeholderTextColor="#AAA7B5"
                style={[
                  styles.answerInput,
                  feedback === 'correct' && styles.correctInput,
                  feedback === 'wrong' && styles.wrongInput,
                ]}
              />
              {feedback ? (
                <View style={styles.feedback}>
                  {feedback === 'correct' ? (
                    <Check size={18} color={theme.grass} />
                  ) : (
                    <X size={18} color={theme.berryDeep} />
                  )}
                  <Text style={[styles.feedbackText, { color: feedback === 'correct' ? theme.grass : theme.berryDeep }]}>
                    {feedback === 'correct'
                      ? 'That is it!'
                      : `It was ${active.item.answer}. See it at this locus once more.`}
                  </Text>
                </View>
              ) : null}
              <AnimatedPressable
                disabled={!answer.trim() && !feedback}
                onPress={checkOrContinue}
                style={[styles.recallButton, !answer.trim() && !feedback && styles.disabled]}>
                <Text style={styles.recallButtonText}>{feedback ? 'Next locus' : 'Check answer'}</Text>
              </AnimatedPressable>
              <Text style={styles.count}>Locus {activeIndex + 1} / {placements.length} · Score {score}</Text>
            </View>
          ) : null
        ) : (
          <>
            {placements.map((placement, index) => (
              <AnimatedPressable
                key={placement.item.id}
                onPress={() => setActiveIndex(index)}
                style={[styles.itemRow, index === activeIndex && styles.activeRow]}>
                <View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index + 1}</Text></View>
                <View style={styles.flex}>
                  <Text style={styles.itemAnswer}>{placement.item.answer}</Text>
                  <Text style={styles.itemLocus}>{placement.locus?.name}</Text>
                </View>
              </AnimatedPressable>
            ))}
            <AnimatedPressable
              onPress={() => { setActiveIndex(0); setMode('walk'); }}
              style={styles.primaryButton}>
              <Text style={styles.primaryText}>🚶 Walk through my Palace</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={startRecall} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Start recall challenge</Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 42 },
  flex: { flex: 1 },
  canvas: { height: 300, borderRadius: 23, overflow: 'hidden', borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#EAE5D8' },
  marker: { position: 'absolute', width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, backgroundColor: '#9B8CFF', borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  activeMarker: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.18 }] },
  markerText: { color: 'white', fontSize: 12, fontWeight: '900' },
  hint: { color: theme.inkSoft, fontSize: 11, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  itemRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 15, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 10, marginBottom: 8 },
  activeRow: { borderColor: '#9B8CFF', backgroundColor: '#F7F5FF' },
  itemNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' },
  itemNumberText: { color: 'white', fontSize: 11, fontWeight: '900' },
  itemAnswer: { color: theme.ink, fontSize: 14, fontWeight: '900' },
  itemLocus: { color: theme.inkSoft, fontSize: 10, fontWeight: '700', marginTop: 2 },
  primaryButton: { width: '100%', minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 16, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  primaryText: { color: theme.ink, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { width: '100%', minHeight: 49, borderRadius: 16, borderWidth: 2, borderColor: '#9B8CFF', backgroundColor: '#F7F5FF', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 16 },
  secondaryText: { color: '#6654D9', fontSize: 14, fontWeight: '900' },
  walkCard: { borderRadius: 23, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  eyebrow: { color: '#7A68E0', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  walkAnswer: { color: theme.ink, fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  walkAssociation: { color: theme.inkSoft, fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  walkActions: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
  roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  count: { color: theme.inkSoft, fontSize: 12, fontWeight: '900' },
  recallCard: { borderRadius: 23, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  recallPrompt: { color: theme.ink, fontSize: 20, fontWeight: '900', marginTop: 12, marginBottom: 16 },
  answerInput: { width: '100%', minHeight: 54, borderRadius: 14, borderWidth: 2.5, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 13, color: theme.ink, textAlign: 'center', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  correctInput: { borderColor: theme.grass, backgroundColor: '#F1FBF5' },
  wrongInput: { borderColor: theme.berry, backgroundColor: '#FFF1F4' },
  feedback: { marginTop: 12, flexDirection: 'row', gap: 7, alignItems: 'center' },
  feedbackText: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  recallButton: { width: '100%', minHeight: 48, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 14 },
  recallButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  resultCard: { minHeight: 360, borderRadius: 23, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: theme.paper, padding: 24, alignItems: 'center', justifyContent: 'center' },
  resultEmoji: { fontSize: 52 },
  resultTitle: { color: theme.ink, fontSize: 22, fontWeight: '900', marginTop: 10 },
  resultScore: { color: theme.grass, fontSize: 34, fontWeight: '900', marginTop: 8 },
  resultBody: { color: theme.inkSoft, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 14 },
  saveState: { color: theme.inkSoft, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  saveSuccess: { color: theme.grass, fontSize: 12, lineHeight: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  saveError: { width: '100%', alignItems: 'center', marginBottom: 8 },
  saveErrorText: { color: theme.berryDeep, fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  retrySaveButton: { marginTop: 8, borderRadius: 12, backgroundColor: '#FFE3EA', paddingHorizontal: 14, paddingVertical: 9 },
  retrySaveText: { color: theme.berryDeep, fontSize: 12, fontWeight: '900' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji: { fontSize: 43 },
  emptyTitle: { color: theme.ink, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: theme.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 6 },
});
