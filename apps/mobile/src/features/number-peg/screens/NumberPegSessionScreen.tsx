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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

type SessionTab = 'scenes' | 'recall';
type Feedback = 'correct' | 'wrong' | null;

function findBinding(bindings: PegBinding[], memoryItem: MemoryItem) {
  return bindings.find((binding) => binding.memoryItemId === memoryItem.id);
}

function countCorrectResponses(responses: PracticeResponseInput[]) {
  return new Set(
    responses.filter((response) => response.isCorrect).map((response) => response.memoryItemId),
  ).size;
}

export default function NumberPegSessionScreen({
  memorySetId,
  restart = false,
  startInRecall = false,
  returnTo,
}: {
  memorySetId: string;
  restart?: boolean;
  startInRecall?: boolean;
  returnTo?: 'practice' | 'number-peg';
}) {
  const router = useRouter();
  const { t } = useTranslation('numberPeg');
  const memorySetQuery = useMemorySet(memorySetId);
  const pegs = useMemo(() => buildNumberPegItems(), []);
  const [tab, setTab] = useState<SessionTab>(startInRecall ? 'recall' : 'scenes');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [clientAttemptId, setClientAttemptId] = useState(() => Crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState(() => Date.now());
  const [responses, setResponses] = useState<PracticeResponseInput[]>([]);
  const score = countCorrectResponses(responses);
  const checkingAnswerRef = useRef(false);
  const [lastPayload, setLastPayload] = useState<PracticeAttemptInput | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const hydratedSessionRef = useRef<string | null>(null);
  const sessionReadyRef = useRef(false);
  const practiceAttempt = useCreatePracticeAttempt();
  const leaveSession = () => {
    if (returnTo === 'practice') {
      router.replace('/(tabs)/practice');
      return;
    }
    if (returnTo === 'number-peg') {
      router.replace('/number-peg');
      return;
    }
    router.back();
  };

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
        checkingAnswerRef.current = false;
        setTab('recall');
        setQuestionIndex(0);
        setAnswer('');
        setFeedback(null);
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
      setClientAttemptId(snapshot.clientAttemptId);
      setStartedAt(snapshot.startedAt);
      setStartedAtMs(snapshot.startedAtMs);
      setQuestionStartedAtMs(snapshot.questionStartedAtMs);
      setResponses(snapshot.responses);
      checkingAnswerRef.current = false;
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
    checkingAnswerRef.current = false;
    setQuestionIndex(0);
    setAnswer('');
    setFeedback(null);
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

  if (memorySetQuery.isLoading) return <LoadingView description={t('loading')} />;

  if (memorySetQuery.isError || !memorySetQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader title={t('title')} description={t('unavailable')} backAction={leaveSession} />
        <View style={styles.centerState}>
          <ModuleNoticeCard
            emoji="🧩"
            title={t('unavailable')}
            body={getNumberPegErrorMessage(memorySetQuery.error, t('connection'))}
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
        checkingAnswerRef.current = false;
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
      checkingAnswerRef.current = false;
      setQuestionIndex((current) => current + 1);
      setAnswer('');
      setFeedback(null);
      setQuestionStartedAtMs(Date.now());
      return;
    }

    if (!answer.trim() || checkingAnswerRef.current) return;
    checkingAnswerRef.current = true;
    const isCorrect = normalizeRecallAnswer(answer) === normalizeRecallAnswer(currentItem.answer);
    setResponses((current) => upsertRecallResponse(
      current,
      currentItem.id,
      isCorrect,
      Math.max(0, Date.now() - questionStartedAtMs),
    ));
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader eyebrow={t('eyebrow')} title={memorySet.title} description={`${memorySet.items.length} ${t('items')} · ${t('title')}`} backAction={leaveSession} />
      <View style={styles.tabs}>
        <View style={styles.tabWrap}>
          <AnimatedPressable
            accessibilityLabel={t('reviewScenes')}
            accessibilityState={{ selected: tab === 'scenes' }}
            onPress={() => openTab('scenes')}
            style={[styles.tab, tab === 'scenes' && styles.activeTab]}>
            <Text style={styles.tabEmoji}>🎨</Text>
            <View style={styles.tabCopy}>
              <Text style={[styles.tabText, tab === 'scenes' && styles.activeTabText]}>{t('rehearseTab')}</Text>
              <Text style={[styles.tabSubtext, tab === 'scenes' && styles.activeTabSubtext]}>{t('rehearseTabBody')}</Text>
            </View>
          </AnimatedPressable>
        </View>
        <View style={styles.tabWrap}>
          <AnimatedPressable
            accessibilityLabel={t('startRecall')}
            accessibilityState={{ selected: tab === 'recall' }}
            onPress={() => openTab('recall')}
            style={[styles.tab, tab === 'recall' && styles.activeTab]}>
            <Text style={styles.tabEmoji}>🧠</Text>
            <View style={styles.tabCopy}>
              <Text style={[styles.tabText, tab === 'recall' && styles.activeTabText]}>{t('recallTab')}</Text>
              <Text style={[styles.tabSubtext, tab === 'recall' && styles.activeTabSubtext]}>{t('recallTabBody')}</Text>
            </View>
          </AnimatedPressable>
        </View>
      </View>
      <View style={styles.tabHint}>
        <Text style={styles.tabHintText}>
          {tab === 'scenes' ? t('sceneHint') : t('recallHint')}
        </Text>
      </View>

      {hasRestoredSession && tab === 'recall' && (
        <AnimatedPressable onPress={() => setHasRestoredSession(false)} style={styles.restoreNotice}>
          <Text style={styles.restoreNoticeText}>{t('restored')}</Text>
        </AnimatedPressable>
      )}

      {tab === 'scenes' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.coachCard}>
            <Text style={styles.coachEmoji}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>{t('coachTitle')}</Text>
              <Text style={styles.coachBody}>{t('coachBody')}</Text>
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
          <Text style={styles.rehearsalHint}>{t('rehearsalHint')}</Text>
        </ScrollView>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.recallContent}>
          {isComplete ? (
            <RecallResultCard
              tone="peg"
              title={t('roundComplete')}
              score={score}
              total={memorySet.items.length}
              body={score === memorySet.items.length
                ? t('perfect')
                : t('niceWork')}
              saveStatus={
                practiceAttempt.isPending ? (
                  <Text style={styles.saveState}>{t('savingProgress')}</Text>
                ) : practiceAttempt.isError ? (
                  <View style={styles.saveError}>
                    <Text style={styles.saveErrorText}>{t('progressNotSaved')}</Text>
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel={t('retrySave')}
                      onPress={() => lastPayload && practiceAttempt.mutate(lastPayload)}
                      style={styles.retrySaveButton}>
                      <Text style={styles.retrySaveText}>{t('retrySave')}</Text>
                    </AnimatedPressable>
                  </View>
                ) : practiceAttempt.data ? (
                  <Text style={styles.saveSuccess}>
                    {t('saved')} ✓ {t('nextReview')} {practiceAttempt.data.nextReviewAt ? new Date(practiceAttempt.data.nextReviewAt).toLocaleString() : t('willAppearInToday')}
                  </Text>
                ) : null
              }
              onRetry={restartRecall}
              retryLabel={t('tryAgain')}
              retryAccessibilityLabel={t('tryAgain')}
              onReturnToToday={() => router.replace('/(tabs)')}
              returnToTodayLabel={t('backToHome')}
              returnToTodayAccessibilityLabel={t('backToHome')}
            />
          ) : (
            <>
              <View style={styles.recallProgressRow}>
                <Text style={styles.recallProgressLabel}>{t('recallRound')}</Text>
                <Text style={styles.recallProgressCount}>{questionIndex + 1} {t('of')} {memorySet.items.length}</Text>
              </View>
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
                eyebrow={`${t('pegLabel').toUpperCase()} ${currentBinding?.pegNumber ?? questionIndex + 1} · ${currentPeg?.keyword.toUpperCase()}`}
                prompt={t('miniMoviePrompt')}
                answer={answer}
                feedback={feedback}
                feedbackText={feedback === 'correct'
                  ? t('nailed')
                  : isSpelling
                    ? `${t('checkSpelling')} ${getSpellingHint(currentItem?.answer ?? '', answer)}`
                    : `${t('itWas')} ${currentItem?.answer}. ${t('pictureOnceMore')}`}
                actionLabel={feedback === 'wrong' ? t('retryPeg') : feedback ? t('next') : t('checkAnswer')}
                scoreLabel={`${t('scoreSoFar')}: ${score} / ${memorySet.items.length}`}
                answerAccessibilityLabel={t('typeYourAnswer')}
                answerPlaceholder={t('typeYourAnswerPlaceholder')}
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
  tabs: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 10 },
  tabWrap: { flex: 1, minWidth: 0 },
  tab: { width: '100%', minHeight: 58, borderRadius: 14, borderWidth: 2, borderColor: theme.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'white', paddingHorizontal: 9 },
  activeTab: { backgroundColor: theme.ink, borderColor: theme.ink, boxShadow: '0px 3px 0px rgba(43,42,61,0.12)' },
  tabEmoji: { fontSize: 15 },
  tabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12.5 },
  activeTabText: { color: 'white' },
  tabCopy: { flex: 1, minWidth: 0 },
  tabSubtext: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 9.5, lineHeight: 13, marginTop: 2 },
  activeTabSubtext: { color: 'rgba(255,255,255,0.78)' },
  tabHint: { marginHorizontal: 18, marginTop: 7, marginBottom: 1 },
  tabHintText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  restoreNotice: { marginHorizontal: 16, marginTop: 9, borderRadius: 12, backgroundColor: '#E3F6ED', borderWidth: 1.5, borderColor: '#BFE7D6', paddingHorizontal: 12, paddingVertical: 9 },
  restoreNoticeText: { color: '#247B67', fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  content: { padding: 18, paddingTop: 16, paddingBottom: 48 },
  coachCard: { flexDirection: 'row', gap: 13, borderRadius: 18, backgroundColor: '#FFF7E0', borderWidth: 1.5, borderColor: '#FFE6A3', padding: 16, marginBottom: 20 },
  coachEmoji: { fontSize: 28 },
  coachTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  coachBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 3 },
  rehearsalHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, marginTop: 14, paddingHorizontal: 10, textAlign: 'center' },
  sceneCard: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 22, padding: 14, marginBottom: 18, marginTop: 4 },
  sceneBadge: { position: 'absolute', top: -12, left: 14, zIndex: 2, minWidth: 32, height: 32, borderRadius: 16, paddingHorizontal: 5, backgroundColor: theme.berry, borderWidth: 3, borderColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
  sceneBadgeText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 13 },
  sceneVisual: { minHeight: 104, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#EADFC4', backgroundColor: '#FFFCF4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 },
  pegEmoji: { fontSize: 40 },
  sceneArrow: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 23 },
  answerWord: { maxWidth: 145, color: theme.ink, fontFamily: typography.display, fontSize: 18, textAlign: 'center' },
  pegName: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8, marginTop: 11 },
  sceneText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 19, marginTop: 5 },
  primaryButton: { minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, boxShadow: `0px 5px 0px ${theme.sunDeep}`, marginTop: 4 },
  recallContent: { padding: 18, paddingTop: 16, paddingBottom: 48, flexGrow: 1 },
  recallProgressRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 },
  recallProgressLabel: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1 },
  recallProgressCount: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  dots: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 21, minHeight: 12 },
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
