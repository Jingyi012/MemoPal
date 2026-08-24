import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { RecallAnswerCard } from '@/components/RecallAnswerCard';
import { RecallResultCard } from '@/components/RecallResultCard';
import { NumberPegRehearsalCard } from '@/features/number-peg/components/NumberPegRehearsalCard';
import { useMemorySet } from '@/features/memory-sets';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { buildNumberPegItems } from '@/features/number-peg/utils/numberPegMap';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import {
  useCreatePracticeAttempt,
  getSpellingHint,
  normalizeRecallAnswer,
  upsertRecallResponse,
  type PracticeAttemptInput,
  type PracticeResponseInput,
} from '@/features/practice-attempts';
import {
  clearNumberPegSession,
  readNumberPegSession,
  writeNumberPegSession,
} from '@/features/number-peg/services/numberPegSessionRecovery';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Play, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

type SessionTab = 'scenes' | 'recall';
type Feedback = 'correct' | 'wrong' | null;

function findBinding(bindings: PegBinding[], memoryItem: MemoryItem) {
  return bindings.find((binding) => binding.memoryItemId === memoryItem.id);
}

export default function NumberPegSessionScreen({
  memorySetId,
  restart = false,
  startInRecall = false,
}: {
  memorySetId: string;
  restart?: boolean;
  startInRecall?: boolean;
}) {
  const router = useRouter();
  const memorySetQuery = useMemorySet(memorySetId);
  const pegs = useMemo(() => buildNumberPegItems(), []);
  const [tab, setTab] = useState<SessionTab>(startInRecall ? 'recall' : 'scenes');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [clientAttemptId, setClientAttemptId] = useState(() => Crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState(() => Date.now());
  const [responses, setResponses] = useState<PracticeResponseInput[]>([]);
  const [lastPayload, setLastPayload] = useState<PracticeAttemptInput | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const hydratedSessionRef = useRef<string | null>(null);
  const sessionReadyRef = useRef(false);
  const practiceAttempt = useCreatePracticeAttempt();

  useEffect(() => {
    const memorySet = memorySetQuery.data;
    if (!memorySet) return;

    const sessionKey = `${memorySet.id}:${memorySet.version}`;
    if (hydratedSessionRef.current === sessionKey) return;

    hydratedSessionRef.current = sessionKey;
    sessionReadyRef.current = false;
    void readNumberPegSession(memorySet.id).then((snapshot) => {
      if (restart) {
        if (snapshot) void clearNumberPegSession(memorySet.id);
        setHasRestoredSession(false);
        sessionReadyRef.current = true;
        return;
      }

      if (!snapshot || snapshot.memorySetVersion !== memorySet.version || snapshot.questionIndex >= memorySet.items.length) {
        if (snapshot) void clearNumberPegSession(memorySet.id);
        sessionReadyRef.current = true;
        return;
      }

      if (startInRecall && snapshot.tab !== 'recall') {
        void clearNumberPegSession(memorySet.id);
        setTab('recall');
        setQuestionIndex(0);
        setAnswer('');
        setFeedback(null);
        setScore(0);
        setClientAttemptId(Crypto.randomUUID());
        setStartedAt(new Date().toISOString());
        setStartedAtMs(Date.now());
        setQuestionStartedAtMs(Date.now());
        setResponses([]);
        setLastPayload(null);
        setHasRestoredSession(false);
        sessionReadyRef.current = true;
        return;
      }

      setTab(snapshot.tab);
      setQuestionIndex(snapshot.questionIndex);
      setScore(snapshot.score);
      setClientAttemptId(snapshot.clientAttemptId);
      setStartedAt(snapshot.startedAt);
      setStartedAtMs(snapshot.startedAtMs);
      setQuestionStartedAtMs(snapshot.questionStartedAtMs);
      setResponses(snapshot.responses);
      setHasRestoredSession(true);
      sessionReadyRef.current = true;
    });
  }, [memorySetQuery.data, restart, startInRecall]);

  useEffect(() => {
    const memorySet = memorySetQuery.data;
    if (
      !memorySet ||
      !sessionReadyRef.current ||
      hydratedSessionRef.current !== `${memorySet.id}:${memorySet.version}`
    ) return;

    if (questionIndex >= memorySet.items.length) {
      void clearNumberPegSession(memorySet.id);
      return;
    }

    void writeNumberPegSession({
      memorySetId: memorySet.id,
      memorySetVersion: memorySet.version,
      tab,
      questionIndex,
      score,
      clientAttemptId,
      startedAt,
      startedAtMs,
      questionStartedAtMs,
      responses,
      savedAt: new Date().toISOString(),
    });
  }, [clientAttemptId, memorySetQuery.data, questionIndex, questionStartedAtMs, responses, score, startedAt, startedAtMs, tab]);

  const restartRecall = () => {
    setQuestionIndex(0);
    setAnswer('');
    setFeedback(null);
    setScore(0);
    setClientAttemptId(Crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    setStartedAtMs(Date.now());
    setQuestionStartedAtMs(Date.now());
    setResponses([]);
    setLastPayload(null);
    setHasRestoredSession(false);
    void clearNumberPegSession(memorySetId);
    practiceAttempt.reset();
  };

  const openTab = (nextTab: SessionTab) => {
    setTab(nextTab);
    if (nextTab === 'recall' && tab !== 'recall' && !hasRestoredSession) restartRecall();
  };

  if (memorySetQuery.isLoading) return <LoadingView description="Building your memory scenes…" />;

  if (memorySetQuery.isError || !memorySetQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader title="Number Peg" description="Memory unavailable" backAction={() => router.back()} />
        <View style={styles.centerState}>
          <ModuleNoticeCard
            emoji="🧩"
            title="This memory did not load"
            body={getNumberPegErrorMessage(memorySetQuery.error, 'Check your connection and try again.')}
            onAction={() => memorySetQuery.refetch()}
          />
        </View>
      </View>
    );
  }

  const memorySet = memorySetQuery.data;
  const bindings = memorySet.techniquePlan?.pegBindings ?? [];
  const isSpelling = memorySet.goalType === 'spelling';
  const isComplete = questionIndex >= memorySet.items.length;
  const currentItem = isComplete ? null : memorySet.items[questionIndex];
  const currentBinding = currentItem ? findBinding(bindings, currentItem) : null;
  const currentPeg = currentBinding ? pegs[currentBinding.pegNumber - 1] : null;
  const sceneItem = memorySet.items[sceneIndex] ?? memorySet.items[0];
  const sceneBinding = sceneItem ? findBinding(bindings, sceneItem) : null;
  const scenePeg = sceneBinding ? pegs[sceneBinding.pegNumber - 1] : pegs[sceneIndex];

  const checkOrContinue = () => {
    if (!currentItem) return;
    if (feedback) {
      if (feedback === 'wrong') {
        setFeedback(null);
        setAnswer('');
        setQuestionStartedAtMs(Date.now());
        return;
      }
      if (questionIndex === memorySet.items.length - 1) {
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
      setQuestionIndex((current) => current + 1);
      setAnswer('');
      setFeedback(null);
      setQuestionStartedAtMs(Date.now());
      return;
    }

    if (!answer.trim()) return;
    const isCorrect = normalizeRecallAnswer(answer) === normalizeRecallAnswer(currentItem.answer);
    setResponses((current) => upsertRecallResponse(
      current,
      currentItem.id,
      isCorrect,
      Math.max(0, Date.now() - questionStartedAtMs),
    ));
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore((current) => current + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader eyebrow="Number Peg" title={memorySet.title} description={`${memorySet.items.length} items · Number Peg`} backAction={() => router.back()} />
      <View style={styles.tabs}>
        <AnimatedPressable
          accessibilityLabel="Open Number Peg scenes"
          accessibilityState={{ selected: tab === 'scenes' }}
          onPress={() => openTab('scenes')}
          style={[styles.tab, tab === 'scenes' && styles.activeTab]}>
          <Sparkles size={16} color={tab === 'scenes' ? 'white' : theme.inkSoft} />
          <Text style={[styles.tabText, tab === 'scenes' && styles.activeTabText]}>Scenes</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Open Number Peg recall"
          accessibilityState={{ selected: tab === 'recall' }}
          onPress={() => openTab('recall')}
          style={[styles.tab, tab === 'recall' && styles.activeTab]}>
          <Play size={16} color={tab === 'recall' ? 'white' : theme.inkSoft} />
          <Text style={[styles.tabText, tab === 'recall' && styles.activeTabText]}>Recall</Text>
        </AnimatedPressable>
      </View>

      {hasRestoredSession && tab === 'recall' && (
        <AnimatedPressable onPress={() => setHasRestoredSession(false)} style={styles.restoreNotice}>
          <Text style={styles.restoreNoticeText}>Welcome back — your recall round was restored.</Text>
        </AnimatedPressable>
      )}

      {tab === 'scenes' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.coachCard}>
            <Text style={styles.coachEmoji}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>Play each scene like a tiny movie</Text>
              <Text style={styles.coachBody}>Pause for a second. Make it move. Then continue down the list.</Text>
            </View>
          </View>
          {sceneItem && scenePeg ? (
            <NumberPegRehearsalCard
              binding={sceneBinding ?? undefined}
              index={sceneIndex}
              item={sceneItem}
              onNext={() => {
                if (sceneIndex === memorySet.items.length - 1) {
                  openTab('recall');
                } else {
                  setSceneIndex((current) => current + 1);
                }
              }}
              onPrevious={() => setSceneIndex((current) => Math.max(0, current - 1))}
              peg={scenePeg}
              total={memorySet.items.length}
            />
          ) : null}
          <Text style={styles.rehearsalHint}>You can revisit any scene before starting recall.</Text>
        </ScrollView>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.recallContent}>
          {isComplete ? (
            <RecallResultCard
              tone="peg"
              title="Round complete!"
              score={score}
              total={memorySet.items.length}
              body={score === memorySet.items.length
                ? 'Perfect recall. Your scenes are doing their job!'
                : 'Nice work. Replay the scenes you missed, then try once more.'}
              saveStatus={
                practiceAttempt.isPending ? (
                  <Text style={styles.saveState}>Saving your progress…</Text>
                ) : practiceAttempt.isError ? (
                  <View style={styles.saveError}>
                    <Text style={styles.saveErrorText}>Progress was not saved. Your result is still here.</Text>
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry saving progress"
                      onPress={() => lastPayload && practiceAttempt.mutate(lastPayload)}
                      style={styles.retrySaveButton}>
                      <Text style={styles.retrySaveText}>Retry save</Text>
                    </AnimatedPressable>
                  </View>
                ) : practiceAttempt.data ? (
                  <Text style={styles.saveSuccess}>
                    Saved ✓ Next review {practiceAttempt.data.nextReviewAt ? new Date(practiceAttempt.data.nextReviewAt).toLocaleString() : 'will appear in Today'}
                  </Text>
                ) : null
              }
              onRetry={restartRecall}
              onReturnToToday={() => router.replace('/(tabs)')}
            />
          ) : (
            <>
              <View style={styles.dots}>
                {memorySet.items.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      index < questionIndex && styles.doneDot,
                      index === questionIndex && styles.currentDot,
                    ]}
                  />
                ))}
              </View>
              <RecallAnswerCard
                tone="peg"
                icon={<Text style={styles.quizEmoji}>{currentPeg?.image ?? '✨'}</Text>}
                eyebrow={`PEG ${currentBinding?.pegNumber ?? questionIndex + 1} · ${currentPeg?.keyword.toUpperCase()}`}
                prompt="What was in your mini movie?"
                answer={answer}
                feedback={feedback}
                feedbackText={feedback === 'correct'
                  ? 'Nailed it!'
                  : isSpelling
                    ? `Check the spelling: ${getSpellingHint(currentItem?.answer ?? '', answer)}`
                    : `It was ${currentItem?.answer}. Picture it once more, then try again.`}
                actionLabel={feedback === 'wrong' ? 'Try this peg again' : feedback ? 'Next peg' : 'Check answer'}
                scoreLabel={`Score so far: ${score} / ${responses.length}`}
                onAnswerChange={setAnswer}
                onSubmit={checkOrContinue}
              />
            </>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  tabs: { flexDirection: 'row', gap: 7, padding: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: theme.line },
  tab: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 2, borderColor: theme.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'white' },
  activeTab: { backgroundColor: theme.ink, borderColor: theme.ink },
  tabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  activeTabText: { color: 'white' },
  restoreNotice: { marginHorizontal: 10, marginTop: 10, borderRadius: 12, backgroundColor: '#E3F6ED', borderWidth: 1.5, borderColor: '#BFE7D6', paddingHorizontal: 12, paddingVertical: 9 },
  restoreNoticeText: { color: '#247B67', fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 42 },
  coachCard: { flexDirection: 'row', gap: 12, borderRadius: 18, backgroundColor: '#FFF7E0', borderWidth: 1.5, borderColor: '#FFE6A3', padding: 14, marginBottom: 18 },
  coachEmoji: { fontSize: 28 },
  coachTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  coachBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 3 },
  rehearsalHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, marginTop: 11, textAlign: 'center' },
  sceneCard: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 22, padding: 14, marginBottom: 18, marginTop: 4 },
  sceneBadge: { position: 'absolute', top: -12, left: 14, zIndex: 2, minWidth: 32, height: 32, borderRadius: 16, paddingHorizontal: 5, backgroundColor: theme.berry, borderWidth: 3, borderColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
  sceneBadgeText: { color: 'white', fontSize: 13, fontWeight: '900' },
  sceneVisual: { minHeight: 104, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#EADFC4', backgroundColor: '#FFFCF4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 },
  pegEmoji: { fontSize: 40 },
  sceneArrow: { color: theme.berryDeep, fontSize: 23, fontWeight: '900' },
  answerWord: { maxWidth: 145, color: theme.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  pegName: { color: theme.berryDeep, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 11 },
  sceneText: { color: theme.ink, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 5 },
  primaryButton: { minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3, marginTop: 4 },
  recallContent: { padding: 16, paddingBottom: 42, flexGrow: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 7, marginVertical: 7, minHeight: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.line },
  doneDot: { backgroundColor: theme.grass },
  currentDot: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.25 }] },
  quizEmoji: { fontSize: 36 },
  saveState: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, marginBottom: 12 },
  saveSuccess: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 12 },
  saveError: { width: '100%', alignItems: 'center', marginBottom: 12 },
  saveErrorText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retrySaveButton: { marginTop: 8, borderRadius: 12, backgroundColor: '#FFE3EA', paddingHorizontal: 14, paddingVertical: 9 },
  retrySaveText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  centerState: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
});
