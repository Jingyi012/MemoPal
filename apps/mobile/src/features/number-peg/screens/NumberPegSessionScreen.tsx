import { usePageTour, useSpotlightTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { CircleHelp } from 'lucide-react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { RecallAnswerCard } from '@/components/RecallAnswerCard';
import { RecallResultCard } from '@/components/RecallResultCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { NumberPegRehearsalCard } from '@/features/number-peg/components/NumberPegRehearsalCard';
import { NumberPegRecallHints } from '@/features/number-peg/components/NumberPegRecallHints';
import { useMemorySet } from '@/features/memory-sets';
import type { MemorySet, MemoryItem, PegBinding } from '@/features/memory-sets';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { buildAllNumberPegItems } from '@/features/number-peg/utils/numberPegMap';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { createNumberPegRecallOrder } from '@/features/number-peg/utils/numberPegRecall';
import { useOnboardingMutations } from '@/features/onboarding/hooks/useOnboardingMutations';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { PushNotificationService } from '@/features/notifications/services/pushNotificationService';
import {
  useCreatePracticeAttempt,
  usePracticeAttemptHistory,
  normalizeRecallAnswer,
  upsertRecallResponse,
  restoreRecallQueue,
  reinforceRecallQueue,
  MAX_RECALL_ATTEMPTS,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

type SessionTab = 'scenes' | 'recall';
type Feedback = 'correct' | 'wrong' | null;

function findBinding(bindings: PegBinding[], memoryItem: MemoryItem) {
  return bindings.find((binding) => binding.memoryItemId === memoryItem.id);
}

function resolvePeg(pegs: ReturnType<typeof buildAllNumberPegItems>, binding: PegBinding) {
  const livePeg = pegs[binding.pegNumber - 1];
  const snapshot = binding.sceneRecipe?.anchorSnapshot;
  if (!snapshot) return livePeg;
  return {
    id: livePeg?.id ?? `peg-${binding.pegNumber}`,
    number: binding.pegNumber,
    keyword: snapshot.keyword,
    image: snapshot.image,
    description: snapshot.description,
  };
}

function countFirstAttemptRecalls(responses: PracticeResponseInput[]) {
  return new Set(
    responses
      .filter(
        (response) => response.isCorrect && response.attemptCount === 1 && !response.hintCount
      )
      .map((response) => response.memoryItemId)
  ).size;
}

export default function NumberPegSessionScreen({
  memorySetId,
  guided = false,
  restart = false,
  startInRecall = false,
  returnTo,
  sessionMemorySet, sessionScope, sessionDescription, browseOnly = false,
}: {
  memorySetId: string;
  guided?: boolean;
  sessionMemorySet?: MemorySet;
  sessionScope?: string;
  sessionDescription?: string;
  browseOnly?: boolean;
  restart?: boolean;
  startInRecall?: boolean;
  returnTo?: 'practice' | 'number-peg';
}) {
  const { styles } = useStyles();
  const router = useRouter();
  const { language, t } = useTranslation('numberPeg');
  const { t: reviewText } = useTranslation('review');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const sourceQuery = useMemorySet(memorySetId);
  const memorySetQuery = { ...sourceQuery, data: sessionMemorySet ?? sourceQuery.data };
  const { t: planText } = useTranslation('reviewPlan');
  const history = usePracticeAttemptHistory(memorySetId);
  const pegs = useMemo(() => buildAllNumberPegItems(), []);
  const [tab, setTab] = useState<SessionTab>(startInRecall ? 'recall' : 'scenes');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [questionHintCount, setQuestionHintCount] = useState(0);
  const [clientAttemptId, setClientAttemptId] = useState(() => Crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState(() => Date.now());
  const [responses, setResponses] = useState<PracticeResponseInput[]>([]);
  const recalledFirstTry = countFirstAttemptRecalls(responses);
  const checkingAnswerRef = useRef(false);
  const advancingRef = useRef(false);
  useEffect(() => { advancingRef.current = false; }, [questionIndex]);
  const [lastPayload, setLastPayload] = useState<PracticeAttemptInput | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showReminderChoice, setShowReminderChoice] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const hydratedSessionRef = useRef<string | null>(null);
  const sessionReadyRef = useRef(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const answerInputRef = useRef<TextInput>(null);
  const sceneScrollRef = useRef<ScrollView>(null);
  const recallScrollRef = useRef<ScrollView | null>(null);
  const recallActionRef = useRef<View | null>(null);
  const recallScrollOffsetRef = useRef(0);
  const recallScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recallKeyboardInset, setRecallKeyboardInset] = useState(0);
  const [recallKeyboardOverlay, setRecallKeyboardOverlay] = useState(0);
  const practiceAttempt = useCreatePracticeAttempt();
  const { user } = useAuth();
  const { register } = useSpotlightTour();
  const { t: tourT } = useTranslation('onboarding');
  const replaySessionTour = usePageTour(tab === 'scenes' ? 'learn' : 'recall', guided || (user?.onboardingStatus === 'in-progress' && user.onboardingMemorySetId === memorySetId), Boolean(memorySetQuery.data) && isSessionReady && !(questionOrder.length > 0 && questionIndex >= questionOrder.length));
  const inputTourRef = useCallback((node: View | null) => register('recallAnswer', node ? { node, reveal: () => recallScrollRef.current?.scrollToEnd({ animated: false }), activate: () => { requestAnimationFrame(() => answerInputRef.current?.focus()); } } : null), [register]);
  const { userState, updateState } = useUserState();
  const { complete: completeOnboarding } = useOnboardingMutations();
  const { playSound, feedbackEnabled } = useSoundEffects();

  const scrollRecallInputIntoView = useCallback(() => {
    const scrollView = recallScrollRef.current;
    if (!scrollView) return;
    requestAnimationFrame(() => scrollView.scrollToEnd({ animated: true }));
  }, []);

  const queueRecallInputScroll = useCallback(() => {
    if (recallScrollTimerRef.current) clearTimeout(recallScrollTimerRef.current);
    recallScrollTimerRef.current = setTimeout(() => {
      recallScrollTimerRef.current = null;
      scrollRecallInputIntoView();
    }, 80);
  }, [scrollRecallInputIntoView]);

  const syncRecallKeyboardLayout = useCallback((screenY: number, height: number) => {
    setRecallKeyboardInset(height);
    const scrollView = recallScrollRef.current;
    if (!scrollView) return;
    requestAnimationFrame(() => {
      (scrollView as unknown as View).measureInWindow(
        (_x: number, y: number, _width: number, viewHeight: number) => {
          setRecallKeyboardOverlay(Math.max(0, y + viewHeight - screenY));
        }
      );
    });
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      syncRecallKeyboardLayout(event.endCoordinates.screenY, event.endCoordinates.height);
      queueRecallInputScroll();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setRecallKeyboardInset(0);
      setRecallKeyboardOverlay(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (recallScrollTimerRef.current) clearTimeout(recallScrollTimerRef.current);
    };
  }, [queueRecallInputScroll, syncRecallKeyboardLayout]);

  useEffect(() => {
    if (tab !== 'recall' || recallKeyboardInset <= 0) return;
    queueRecallInputScroll();
  }, [
    feedback,
    questionIndex,
    queueRecallInputScroll,
    recallKeyboardInset,
    recallKeyboardOverlay,
    tab,
  ]);

  const leaveSession = () => {
    if (sessionScope) { router.replace({ pathname: '/memory-details/[memorySetId]', params: { memorySetId } }); return; }
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
    setIsSessionReady(false);
    void readNumberPegSession(memorySet.id, sessionScope).then((snapshot) => {
      if (restart || browseOnly) {
        setQuestionOrder(
          createNumberPegRecallOrder(memorySet.items, memorySet.goalType === 'ordered-list')
        );
        if (snapshot) void clearNumberPegSession(memorySet.id, sessionScope);
        setHasRestoredSession(false);
        sessionReadyRef.current = true;
        setIsSessionReady(true);
        return;
      }

      if (
        !snapshot ||
        snapshot.memorySetVersion !== memorySet.version ||
        snapshot.questionIndex < 0 ||
        snapshot.questionIndex >= restoreRecallQueue(memorySet.items, snapshot.questionOrder).length
      ) {
        if (snapshot) void clearNumberPegSession(memorySet.id, sessionScope);
        setQuestionOrder(
          createNumberPegRecallOrder(memorySet.items, memorySet.goalType === 'ordered-list')
        );
        sessionReadyRef.current = true;
        setIsSessionReady(true);
        return;
      }

      if (startInRecall && snapshot.tab !== 'recall') {
        void clearNumberPegSession(memorySet.id, sessionScope);
        checkingAnswerRef.current = false;
        setTab('recall');
        setQuestionIndex(0);
        setQuestionOrder(
          createNumberPegRecallOrder(memorySet.items, memorySet.goalType === 'ordered-list')
        );
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
        setIsSessionReady(true);
        return;
      }

      setTab(snapshot.tab);
      setQuestionIndex(snapshot.questionIndex);
      const restoredOrder = restoreRecallQueue(memorySet.items, snapshot.questionOrder);
      setQuestionOrder(restoredOrder);
      setClientAttemptId(snapshot.clientAttemptId);
      setStartedAt(snapshot.startedAt);
      setStartedAtMs(snapshot.startedAtMs);
      setQuestionStartedAtMs(snapshot.questionStartedAtMs);
      setResponses(snapshot.responses);
      const restoredItem = memorySet.items.find(
        (item) => item.id === restoredOrder[snapshot.questionIndex]
      );
      const alreadyCorrect = snapshot.feedback === undefined && snapshot.responses.some(
        (response) => response.memoryItemId === restoredItem?.id && response.isCorrect
      );
      const restoredFeedback = snapshot.feedback ?? (alreadyCorrect ? 'correct' : null);
      setAnswer(restoredFeedback ? (restoredItem?.answer ?? '') : '');
      setFeedback(restoredFeedback);
      setQuestionHintCount(snapshot.questionHintCount ?? 0);
      checkingAnswerRef.current = !!restoredFeedback;
      setHasRestoredSession(true);
      sessionReadyRef.current = true;
      setIsSessionReady(true);
    }).catch(() => setRecoveryFailed(true));
  }, [memorySetQuery.data, restart, startInRecall, sessionScope, browseOnly]);

  useEffect(() => {
    if (!hasRestoredSession) return;
    const timer = setTimeout(() => setHasRestoredSession(false), 2400);
    return () => clearTimeout(timer);
  }, [hasRestoredSession]);

  useEffect(() => {
    const memorySet = memorySetQuery.data;
    if (
      !memorySet || browseOnly ||
      !sessionReadyRef.current ||
      hydratedSessionRef.current !== `${memorySet.id}:${memorySet.version}`
    )
      return;

    if (questionIndex >= questionOrder.length) {
      if (practiceAttempt.data) void clearNumberPegSession(memorySet.id, sessionScope);
      return;
    }

    void writeNumberPegSession({
      memorySetId: memorySet.id,
      memorySetVersion: memorySet.version,
      tab,
      questionIndex,
      questionOrder,
      feedback,
      questionHintCount,
      score: recalledFirstTry,
      clientAttemptId,
      startedAt,
      startedAtMs,
      questionStartedAtMs,
      responses,
      savedAt: new Date().toISOString(),
    }, sessionScope);
  }, [
    sessionScope, browseOnly, practiceAttempt.data,
    clientAttemptId,
    memorySetQuery.data,
    questionIndex,
    questionOrder,
    feedback,
    questionHintCount,
    questionStartedAtMs,
    recalledFirstTry,
    responses,
    startedAt,
    startedAtMs,
    tab,
  ]);

  const restartRecall = () => {
    checkingAnswerRef.current = false;
    advancingRef.current = false;
    setIsFinishing(false);
    setQuestionIndex(0);
    if (memorySetQuery.data)
      setQuestionOrder(
        createNumberPegRecallOrder(
          memorySetQuery.data.items,
          memorySetQuery.data.goalType === 'ordered-list'
        )
      );
    setAnswer('');
    setFeedback(null);
    setQuestionHintCount(0);
    setClientAttemptId(Crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    setStartedAtMs(Date.now());
    setQuestionStartedAtMs(Date.now());
    setResponses([]);
    setLastPayload(null);
    setHasRestoredSession(false);
    void clearNumberPegSession(memorySetId, sessionScope);
    practiceAttempt.reset();
  };

  const openTab = (nextTab: SessionTab) => {
    if (browseOnly && nextTab === 'recall') return;
    // Returning to the full stories mid-round would turn an unaided answer
    // into an assisted answer without recording a hint.
    if (
      tab === 'recall' &&
      nextTab === 'scenes' &&
      questionIndex < questionOrder.length
    )
      return;
    setTab(nextTab);
    if (
      nextTab === 'recall' &&
      tab !== 'recall' &&
      !hasRestoredSession &&
      responses.length === 0 &&
      questionIndex === 0
    )
      restartRecall();
  };

  if (sessionScope && recoveryFailed) return <View style={styles.page}>
    <CommonHeader title={planText('loadError')} backAction={leaveSession} />
    <ModuleNoticeCard title={planText('loadError')} body={planText('connectionRequired')}
      actionLabel={planText('backToMemory')} onAction={leaveSession} />
  </View>;
  if (sessionScope && !isSessionReady) return <LoadingView description={planText('loading')} />;

  if (!isOffline && memorySetQuery.isLoading) return <LoadingView description={t('loading')} />;

  if (!memorySetQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader title={t('title')} description={canShowRequestErrors ? t('unavailable') : undefined} backAction={leaveSession} />
        {canShowRequestErrors ? <View style={styles.centerState}>
          <ModuleNoticeCard
            emoji="🧩"
            title={t('unavailable')}
            body={getNumberPegErrorMessage(memorySetQuery.error, t('connection'))}
            onAction={() => memorySetQuery.refetch()}
          />
        </View> : null}
      </View>
    );
  }

  const memorySet = memorySetQuery.data;
  const bindings = memorySet.techniquePlan?.pegBindings ?? [];
  const isComplete = questionOrder.length > 0 && questionIndex >= questionOrder.length;
  const currentItem = isComplete
    ? null
    : (memorySet.items.find((item) => item.id === questionOrder[questionIndex]) ??
      memorySet.items[questionIndex]);
  const currentBinding = currentItem ? findBinding(bindings, currentItem) : null;
  const currentPeg = currentBinding ? resolvePeg(pegs, currentBinding) : null;
  const localizedCurrentPeg = currentPeg ? localizeNumberPeg(currentPeg, t) : null;
  const currentResponse = currentItem
    ? responses.find((response) => response.memoryItemId === currentItem.id)
    : undefined;
  const hintCount = questionHintCount;
  const previousResponse = history.data
    ?.filter(
      (attempt) =>
        attempt.mode === 'recall' &&
        attempt.clientAttemptId !== clientAttemptId &&
        new Date(attempt.completedAt).getTime() < startedAtMs
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .flatMap((attempt) =>
      attempt.responses.filter((response) => response.memoryItemId === currentItem?.id)
    )[0];
  const requestHint = () => {
    if (!currentItem || hintCount >= 3 || feedback || isFinishing) return;
    setQuestionHintCount((count) => Math.min(3, count + 1));
    setResponses((current) => {
      const existing = current.find((response) => response.memoryItemId === currentItem.id);
      if (existing)
        return current.map((response) =>
          response.memoryItemId === currentItem.id
            ? { ...response, hintCount: Math.min(3, (response.hintCount ?? 0) + 1) }
            : response
        );
      return [
        ...current,
        {
          memoryItemId: currentItem.id,
          isCorrect: false,
          attemptCount: 0,
          responseMs: 0,
          hintCount: 1,
        },
      ];
    });
  };
  const sceneItem = memorySet.items[sceneIndex] ?? memorySet.items[0];
  const sceneBinding = sceneItem ? findBinding(bindings, sceneItem) : null;
  const scenePeg = sceneBinding ? resolvePeg(pegs, sceneBinding) : pegs[sceneIndex];

  const saveRecallAttempt = async (payload: PracticeAttemptInput) => {
    await practiceAttempt.mutateAsync(payload);
    if (user?.onboardingStatus === 'in-progress' && user.onboardingMemorySetId === memorySet.id) {
      await completeOnboarding.mutateAsync(memorySet.id);
      setShowReminderChoice(true);
    }
  };

  const checkOrContinue = (forgot = false) => {
    if (!currentItem) return;
    if (isFinishing) return;
    if (feedback) {
      if (!currentResponse || advancingRef.current) return;
      advancingRef.current = true;
      const nextOrder = reinforceRecallQueue(questionOrder, questionIndex, currentResponse, hintCount > 0);
      setQuestionOrder(nextOrder);
      if (questionIndex === nextOrder.length - 1) {
        playSound('complete');
        const payload: PracticeAttemptInput = {
          clientAttemptId,
          memorySetId: memorySet.id,
          mode: 'recall',
          startedAt,
          durationMs: Math.max(0, Date.now() - startedAtMs),
          responses,
        };
        setLastPayload(payload);
        setIsFinishing(true);
        void saveRecallAttempt(payload)
          .catch(() => undefined)
          .finally(() => {
            setIsFinishing(false);
            checkingAnswerRef.current = false;
            setQuestionIndex((current) => current + 1);
            setAnswer('');
            setFeedback(null);
            setQuestionHintCount(0);
            setQuestionStartedAtMs(Date.now());
          });
        return;
      }
      checkingAnswerRef.current = false;
      setQuestionIndex((current) => current + 1);
      setAnswer('');
      setFeedback(null);
      setQuestionHintCount(0);
      setQuestionStartedAtMs(Date.now());
      return;
    }

    if ((!answer.trim() && !forgot) || checkingAnswerRef.current) return;
    checkingAnswerRef.current = true;
    const isCorrect = !forgot && normalizeRecallAnswer(answer) === normalizeRecallAnswer(currentItem.answer);
    setResponses((current) =>
      upsertRecallResponse(
        current,
        currentItem.id,
        isCorrect,
        Math.max(0, Date.now() - questionStartedAtMs),
        hintCount
      )
    );
    setFeedback(isCorrect ? 'correct' : 'wrong');
    playSound(isCorrect ? 'correct' : 'wrong');
    if (isCorrect && feedbackEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (feedbackEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const saveOnboardingReminderChoice = async (enabled: boolean) => {
    if (!enabled) {
      await updateState({
        notifications: { ...userState.notifications, reviewReminders: false },
      });
      setShowReminderChoice(false);
      return;
    }
    const granted = await PushNotificationService.requestPermissions();
    await updateState({
      notifications: { ...userState.notifications, reviewReminders: granted },
    });
    if (granted) {
      await InAppNotificationSync.syncAllUpcoming(true);
      setShowReminderChoice(false);
    } else {
      setReminderMessage(t('reminderPermissionDenied'));
    }
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        compact
        eyebrow={t('eyebrow')}
        title={memorySet.title}
        description={sessionDescription ?? `${memorySet.items.length} ${t('items')} · ${t('title')}`}
        backAction={leaveSession}
        actions={[{ icon: CircleHelp, onPress: replaySessionTour, accessibilityLabel: tourT('guideEntry') }]}
      />
      {!sessionScope ? <View style={styles.tabs}>
        <View style={styles.tabWrap}>
          <AnimatedPressable
            accessibilityLabel={t('reviewScenes')}
            disabled={tab === 'recall' && !isComplete}
            accessibilityState={{
              selected: tab === 'scenes',
              disabled: tab === 'recall' && !isComplete,
            }}
            onPress={() => openTab('scenes')}
            style={[styles.tab, tab === 'scenes' && styles.activeTab]}>
            <Text style={styles.tabEmoji}>🎨</Text>
            <View style={styles.tabCopy}>
              <Text style={[styles.tabText, tab === 'scenes' && styles.activeTabText]}>
                {t('rehearseTab')}
              </Text>
              <Text style={[styles.tabSubtext, tab === 'scenes' && styles.activeTabSubtext]}>
                {t('rehearseTabBody')}
              </Text>
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
              <Text style={[styles.tabText, tab === 'recall' && styles.activeTabText]}>
                {t('recallTab')}
              </Text>
              <Text style={[styles.tabSubtext, tab === 'recall' && styles.activeTabSubtext]}>
                {t('recallTabBody')}
              </Text>
            </View>
          </AnimatedPressable>
        </View>
      </View> : null}
      <View style={styles.tabHint}>
        <Text style={styles.tabHintText}>
          {browseOnly ? planText('browseNote') : tab === 'scenes' ? t('sceneHint') : t('recallHint')}
        </Text>
      </View>

      {hasRestoredSession && (
        <AnimatedPressable
          onPress={() => setHasRestoredSession(false)}
          style={styles.restoreNotice}>
          <Text style={styles.restoreNoticeText}>{t('restored')}</Text>
        </AnimatedPressable>
      )}

      {tab === 'scenes' ? (
        <ScrollView ref={sceneScrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.coachCard}>
            <Text style={styles.coachEmoji}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>{t('coachTitle')}</Text>
              <Text style={styles.coachBody}>{t('coachBody')}</Text>
            </View>
          </View>
          {sceneItem && scenePeg ? (
            <NumberPegRehearsalCard
              onRevealScene={() => sceneScrollRef.current?.scrollTo({ y: 0, animated: false })}
              onRevealNext={() => sceneScrollRef.current?.scrollToEnd({ animated: false })}
              binding={sceneBinding ?? undefined}
              index={sceneIndex}
              item={sceneItem}
              onNext={() => {
                if (sceneIndex === memorySet.items.length - 1) {
                  if (browseOnly) leaveSession(); else openTab('recall');
                } else {
                  setSceneIndex((current) => current + 1);
                }
              }}
              onPrevious={() => setSceneIndex((current) => Math.max(0, current - 1))}
              peg={scenePeg}
              total={memorySet.items.length}
              lastActionLabel={browseOnly ? planText('backToMemory') : undefined}
            />
          ) : null}
          <Text style={styles.rehearsalHint}>{t('rehearsalHint')}</Text>
        </ScrollView>
      ) : (
        <ScrollView
          ref={recallScrollRef}
          style={styles.recallScroll}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          onScroll={(event) => {
            recallScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.recallContent,
            recallKeyboardInset > 0 ? { paddingBottom: recallKeyboardOverlay + 24 } : null,
          ]}>
          {isComplete ? (
            <RecallResultCard
              tone="peg"
              title={t('roundComplete')}
              recalledFirstTry={recalledFirstTry}
              total={memorySet.items.length}
              recalledLabel={t('recalledFirstTry')}
              needsPracticeLabel={t('needsPractice')}
              xpEarned={practiceAttempt.data?.xpEarned}
              levelUpTo={
                practiceAttempt.data &&
                practiceAttempt.data.currentLevel > practiceAttempt.data.previousLevel
                  ? practiceAttempt.data.currentLevel
                  : undefined
              }
              body={recalledFirstTry === memorySet.items.length ? t('perfect') : reviewText('needsPracticeBody')}
              saveStatus={
                practiceAttempt.isPending || completeOnboarding.isPending ? (
                  <Text style={styles.saveState}>{t('savingProgress')}</Text>
                ) : practiceAttempt.isError || completeOnboarding.isError ? (
                  <View style={styles.saveError}>
                    <Text style={styles.saveErrorText}>{t('progressNotSaved')}</Text>
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel={t('retrySave')}
                      onPress={() => {
                        if (practiceAttempt.isError && lastPayload) {
                          void saveRecallAttempt(lastPayload).catch(() => undefined);
                        } else if (completeOnboarding.isError) {
                          void completeOnboarding
                            .mutateAsync(memorySet.id)
                            .then(() => setShowReminderChoice(true))
                            .catch(() => undefined);
                        }
                      }}
                      style={styles.retrySaveButton}>
                      <Text style={styles.retrySaveText}>{t('retrySave')}</Text>
                    </AnimatedPressable>
                  </View>
                ) : practiceAttempt.data ? (
                  <View>
                    {typeof previousResponse?.hintCount === 'number' ? (
                      <Text style={styles.safeHint}>
                        {language === 'zh'
                          ? previousResponse.hintCount > 0
                            ? `上次使用了 ${previousResponse.hintCount} 层提示，这次试着少用一层。`
                            : '上次无需提示，这次再试试看。'
                          : previousResponse.hintCount > 0
                            ? `Last time: ${previousResponse.hintCount} hints. Try one fewer this time.`
                            : 'You needed no hints last time. Try again.'}
                      </Text>
                    ) : null}
                    <Text style={styles.saveSuccess}>
                      {t('saved')} ✓ {t('nextReview')}{' '}
                      {practiceAttempt.data.nextReviewAt
                        ? new Date(practiceAttempt.data.nextReviewAt).toLocaleString()
                        : t('willAppearInToday')}
                    </Text>
                    {showReminderChoice ? (
                      <View style={styles.reminderChoice}>
                        <Text style={styles.reminderChoiceTitle}>{t('reminderChoiceTitle')}</Text>
                        <Text style={styles.reminderChoiceBody}>{t('reminderChoiceBody')}</Text>
                        {reminderMessage ? (
                          <Text style={styles.reminderChoiceError}>{reminderMessage}</Text>
                        ) : null}
                        <View style={styles.reminderChoiceActions}>
                          <AnimatedPressable
                            onPress={() => void saveOnboardingReminderChoice(false)}
                            style={styles.reminderLaterButton}
                            containerStyle={{ width: '50%' }}>
                            <Text style={styles.reminderLaterText}>{t('notNow')}</Text>
                          </AnimatedPressable>
                          <AnimatedPressable
                            onPress={() => void saveOnboardingReminderChoice(true)}
                            style={styles.reminderEnableButton}
                            containerStyle={{ width: '50%' }}>
                            <Text style={styles.reminderEnableText}>{t('enableReminder')}</Text>
                          </AnimatedPressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null
              }
              onRetry={sessionScope ? leaveSession : restartRecall}
              retryLabel={sessionScope ? planText('backToMemory') : t('tryAgain')}
              retryAccessibilityLabel={sessionScope ? planText('backToMemory') : t('tryAgain')}
              onReturnHome={() => router.replace('/(tabs)')}
              returnHomeLabel={t('backToHome')}
            />
          ) : (
            <>
              <View style={styles.recallProgressRow}>
                <Text style={styles.recallProgressLabel}>{t('recallRound')}</Text>
                <Text style={styles.recallProgressCount}>
                  {questionIndex + 1} {t('of')} {questionOrder.length}
                </Text>
              </View>
              <View style={styles.dots}>
                {questionOrder.map((itemId, index) => (
                  <View
                    key={`${itemId}-${index}`}
                    style={[
                      styles.dot,
                      index < questionIndex && styles.doneDot,
                      index === questionIndex && styles.currentDot,
                    ]}
                  />
                ))}
              </View>
              <RecallAnswerCard
                inputRef={answerInputRef}
                inputAreaRef={inputTourRef}
                tone="peg"
                icon={
                  <Text style={styles.quizEmoji}>
                    {currentBinding?.pegNumber ?? questionIndex + 1}
                  </Text>
                }
                eyebrow={language === 'zh' ? '数字回忆' : 'Number recall'}
                prompt={language === 'zh' ? '这个数字对应哪一项？' : 'What belongs to this number?'}
                answer={answer}
                feedback={feedback}
                feedbackText={
                  feedback === 'correct'
                    ? hintCount > 0
                      ? reviewText(currentResponse && currentResponse.attemptCount >= MAX_RECALL_ATTEMPTS
                        ? 'reinforcementFinished' : 'assistedFeedback')
                      : t('nailed')
                    : `${reviewText('answerFeedback').replace('{answer}', currentItem?.answer ?? '')} ${currentResponse && currentResponse.attemptCount >= MAX_RECALL_ATTEMPTS ? reviewText('reinforcementFinished') : reviewText('reinforcementLater')}`
                }
                actionLabel={
                  isFinishing
                    ? t('savingProgress')
                    : feedback
                      ? t('next')
                      : t('checkAnswer')
                }
                actionDisabled={isFinishing}
                progressLabel={`${t('recalledFirstTrySoFar')}: ${recalledFirstTry} / ${memorySet.items.length}`}
                answerAccessibilityLabel={t('typeYourAnswer')}
                answerPlaceholder={t('typeYourAnswerPlaceholder')}
                cue={
                  currentItem ? <NumberPegRecallHints
                    item={currentItem}
                    binding={currentBinding ?? null}
                    peg={localizedCurrentPeg}
                    hintCount={hintCount}
                    feedback={feedback}
                    disabled={isFinishing}
                    onHint={requestHint}
                  /> : null
                }
                onAnswerFocus={queueRecallInputScroll}
                actionAreaRef={(view) => {
                  recallActionRef.current = view;
                }}
                onAnswerChange={(value) => {
                  if (feedback) return;
                  checkingAnswerRef.current = false;
                  setAnswer(value);
                }}
                onSubmit={() => checkOrContinue()}
                onSkip={() => checkOrContinue(true)}
                skipLabel={reviewText('forgot')}
              />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: 'transparent' },
    tabs: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 10 },
    tabWrap: { flex: 1, minWidth: 0 },
    tab: {
      width: '100%',
      minHeight: 58,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.line,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: theme.paper,
      paddingHorizontal: 9,
    },
    activeTab: {
      backgroundColor: theme.night,
      borderColor: theme.night,
      boxShadow: '0px 3px 0px rgba(43,42,61,0.12)',
    },
    tabEmoji: { fontSize: 15 },
    tabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12.5 },
    activeTabText: { color: 'white' },
    tabCopy: { flex: 1, minWidth: 0 },
    tabSubtext: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 9.5,
      lineHeight: 13,
      marginTop: 2,
    },
    activeTabSubtext: { color: 'rgba(255,255,255,0.78)' },
    tabHint: { marginHorizontal: 18, marginTop: 7, marginBottom: 1 },
    tabHintText: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
    },
    restoreNotice: {
      marginHorizontal: 16,
      marginTop: 9,
      borderRadius: 12,
      backgroundColor: theme.mintTint,
      borderWidth: 1.5,
      borderColor: theme.mintLine,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    restoreNoticeText: {
      color: theme.successText,
      fontFamily: typography.bodyBold,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
    },
    content: { padding: 18, paddingTop: 16, paddingBottom: 48 },
    coachCard: {
      flexDirection: 'row',
      gap: 13,
      borderRadius: 18,
      backgroundColor: theme.sunTint,
      borderWidth: 1.5,
      borderColor: theme.sunLine,
      padding: 16,
      marginBottom: 20,
    },
    coachEmoji: { fontSize: 28 },
    coachTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
    coachBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 3,
    },
    rehearsalHint: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 14,
      paddingHorizontal: 10,
      textAlign: 'center',
    },
    sceneCard: {
      backgroundColor: theme.paper,
      borderWidth: 2,
      borderColor: theme.line,
      borderRadius: 22,
      padding: 14,
      marginBottom: 18,
      marginTop: 4,
    },
    sceneBadge: {
      position: 'absolute',
      top: -12,
      left: 14,
      zIndex: 2,
      minWidth: 32,
      height: 32,
      borderRadius: 16,
      paddingHorizontal: 5,
      backgroundColor: theme.berry,
      borderWidth: 3,
      borderColor: theme.paper,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sceneBadgeText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 13 },
    sceneVisual: {
      minHeight: 104,
      borderRadius: 16,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.sunLine,
      backgroundColor: theme.sunTint,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 12,
    },
    pegEmoji: { fontSize: 40 },
    sceneArrow: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 23 },
    answerWord: {
      maxWidth: 145,
      color: theme.ink,
      fontFamily: typography.display,
      fontSize: 18,
      textAlign: 'center',
    },
    pegName: {
      color: theme.berryDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10,
      letterSpacing: 0.8,
      marginTop: 11,
    },
    sceneText: {
      color: theme.ink,
      fontFamily: typography.bodyBold,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },
    primaryButton: {
      minHeight: 53,
      borderRadius: 16,
      backgroundColor: theme.sun,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
      boxShadow: `0px 5px 0px ${theme.sunDeep}`,
      marginTop: 4,
    },
    recallScroll: { flex: 1 },
    recallContent: { padding: 18, paddingTop: 16, paddingBottom: 24, flexGrow: 1 },
    recallProgressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    recallProgressLabel: {
      color: theme.berryDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10,
      letterSpacing: 1,
    },
    recallProgressCount: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 7,
      marginBottom: 21,
      minHeight: 12,
    },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.line },
    doneDot: { backgroundColor: theme.grass },
    currentDot: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.25 }] },
    quizEmoji: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 36 },
    safeHint: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
    },
    saveState: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 12,
      marginBottom: 12,
    },
    saveSuccess: {
      color: theme.successText,
      fontFamily: typography.bodyExtraBold,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginBottom: 12,
    },
    saveError: { width: '100%', alignItems: 'center', marginBottom: 12 },
    saveErrorText: {
      color: theme.berryDeep,
      fontFamily: typography.bodyBold,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    retrySaveButton: {
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: theme.berryTint,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    retrySaveText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
    reminderChoice: {
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: theme.violetLine,
      backgroundColor: theme.violetTint,
      padding: 12,
      marginBottom: 12,
    },
    reminderChoiceTitle: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 12.5,
      textAlign: 'center',
    },
    reminderChoiceBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 3,
    },
    reminderChoiceError: {
      color: theme.berryDeep,
      fontFamily: typography.bodyBold,
      fontSize: 10.5,
      textAlign: 'center',
      marginTop: 7,
    },
    reminderChoiceActions: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      gap: 8,
      marginTop: 10,
    },
    reminderLaterButton: {
      flex: 1,
      minWidth: 0,
      minHeight: 40,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      gap: 4,
    },
    reminderLaterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
    reminderEnableButton: {
      flex: 1,
      minWidth: 0,
      minHeight: 40,
      borderRadius: 12,
      backgroundColor: theme.sun,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      gap: 4,
    },
    reminderEnableText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 11 },
    centerState: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  })
);
