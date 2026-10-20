import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { RecallAnswerCard } from '@/components/RecallAnswerCard';
import { RecallResultCard } from '@/components/RecallResultCard';
import { PalaceFocusCard } from '@/features/palace-scenes/components/PalaceFocusCard';
import { PalaceOrderedList } from '@/features/palace-scenes/components/PalaceOrderedList';
import { PALACE_MAX_HINTS, PalaceRecallHints } from '@/features/palace-scenes/components/PalaceRecallHints';
import { List, MapPin } from '@/core/icons';
import { useMemorySet, type MemorySet } from '@/features/memory-sets';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { usePalaceScene } from '@/features/palace-scenes/hooks/usePalaceScenes';
import {
  clearPalaceSession,
  readPalaceSession,
  writePalaceSession,
} from '@/features/palace-scenes/services/palaceSessionRecovery';
import {
  isRecallAnswerCorrect,
  upsertRecallResponse,
  restoreRecallQueue,
  reinforceRecallQueue,
  useCreatePracticeAttempt,
  type PracticeAttemptInput,
  type PracticeResponseInput,
} from '@/features/practice-attempts';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getPalaceLocusName } from '@/features/palace-scenes/utils/palaceLocalization';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

type SessionMode = 'walk' | 'list' | 'recall';
type Feedback = 'correct' | 'wrong' | null;

export default function PalaceMemorySessionScreen({
  memorySetId,
  restart = false,
  startInRecall = false,
  returnTo,
  sessionMemorySet, sessionScope, sessionDescription, browseOnly = false,
}: {
  memorySetId: string;
  sessionMemorySet?: MemorySet;
  sessionScope?: string;
  sessionDescription?: string;
  browseOnly?: boolean;
  restart?: boolean;
  startInRecall?: boolean;
  returnTo?: 'practice' | 'palaces';
}) {
  const { styles } = useStyles();
  const router = useRouter();
  const { language, t } = useTranslation('palace');
  const { t: reviewText } = useTranslation('review');
  const sourceQuery = useMemorySet(memorySetId);
  const memorySetQuery = { ...sourceQuery, data: sessionMemorySet ?? sourceQuery.data };
  const { t: planText } = useTranslation('reviewPlan');
  const sceneId = memorySetQuery.data?.techniquePlan?.palaceSceneId ?? '';
  const sceneQuery = usePalaceScene(sceneId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recallOrder, setRecallOrder] = useState<string[]>([]);
  const [mode, setMode] = useState<SessionMode>(startInRecall ? 'recall' : 'walk');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [questionHintCount, setQuestionHintCount] = useState(0);
  const checkingAnswerRef = useRef(false);
  const advancingRef = useRef(false);
  useEffect(() => {
    checkingAnswerRef.current = false;
    advancingRef.current = false;
    setQuestionHintCount(0);
  }, [activeIndex]);
  const [clientAttemptId, setClientAttemptId] = useState(() => Crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState(() => Date.now());
  const [responses, setResponses] = useState<PracticeResponseInput[]>([]);
  const recalledFirstTry = responses.filter(
    (response) => response.isCorrect && response.attemptCount === 1 && !response.hintCount
  ).length;
  const [lastPayload, setLastPayload] = useState<PracticeAttemptInput | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const hydratedSessionRef = useRef<string | null>(null);
  const sessionReadyRef = useRef(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const recallScrollRef = useRef<ScrollView | null>(null);
  const recallActionRef = useRef<View | null>(null);
  const recallScrollOffsetRef = useRef(0);
  const recallScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recallKeyboardInset, setRecallKeyboardInset] = useState(0);
  const [recallKeyboardOverlay, setRecallKeyboardOverlay] = useState(0);
  const practiceAttempt = useCreatePracticeAttempt();
  const { playSound } = useSoundEffects();

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
      (scrollView as unknown as View).measureInWindow((_x: number, y: number, _width: number, viewHeight: number) => {
        setRecallKeyboardOverlay(Math.max(0, y + viewHeight - screenY));
      });
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
    if (mode !== 'recall' || recallKeyboardInset <= 0) return;
    queueRecallInputScroll();
  }, [activeIndex, feedback, mode, queueRecallInputScroll, recallKeyboardInset, recallKeyboardOverlay]);
  const leaveSession = () => {
    if (sessionScope) { router.replace({ pathname: '/memory-details/[memorySetId]', params: { memorySetId } }); return; }
    if (returnTo === 'practice') {
      router.replace('/(tabs)/practice');
      return;
    }
    if (returnTo === 'palaces') {
      router.replace('/palaces');
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
    void readPalaceSession(memorySet.id, sessionScope).then((snapshot) => {
      if (restart || browseOnly) {
        if (snapshot) void clearPalaceSession(memorySet.id, sessionScope);
        setHasRestoredSession(false);
        sessionReadyRef.current = true;
        setIsSessionReady(true);
        return;
      }

      if (
        !snapshot ||
        snapshot.memorySetVersion !== memorySet.version ||
        snapshot.activeIndex < 0 ||
        snapshot.activeIndex >= (snapshot.mode === 'recall'
          ? restoreRecallQueue(memorySet.items, snapshot.recallOrder).length
          : memorySet.items.length)
      ) {
        if (snapshot) void clearPalaceSession(memorySet.id, sessionScope);
        sessionReadyRef.current = true;
        setIsSessionReady(true);
        return;
      }

      if (startInRecall && snapshot.mode !== 'recall') {
        void clearPalaceSession(memorySet.id, sessionScope);
        setMode('recall');
        setActiveIndex(0);
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

      setMode(snapshot.mode === 'browse' ? 'walk' : snapshot.mode);
      setActiveIndex(snapshot.activeIndex);
      setRecallOrder(restoreRecallQueue(memorySet.items, snapshot.recallOrder));
      setFeedback(snapshot.feedback ?? null);
      setClientAttemptId(snapshot.clientAttemptId);
      setStartedAt(snapshot.startedAt);
      setStartedAtMs(snapshot.startedAtMs);
      setQuestionStartedAtMs(snapshot.questionStartedAtMs);
      setResponses(snapshot.responses);
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

    if (activeIndex >= (mode === 'recall' ? (recallOrder.length || memorySet.items.length) : memorySet.items.length)) {
      if (practiceAttempt.data) void clearPalaceSession(memorySet.id, sessionScope);
      return;
    }

    void writePalaceSession({
      memorySetId: memorySet.id,
      memorySetVersion: memorySet.version,
      mode,
      activeIndex,
      recallOrder: recallOrder.length ? recallOrder : memorySet.items.map((item) => item.id),
      feedback,
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
    activeIndex,
    recallOrder,
    feedback,
    clientAttemptId,
    memorySetQuery.data,
    mode,
    questionStartedAtMs,
    recalledFirstTry,
    responses,
    startedAt,
    startedAtMs,
  ]);

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

  if (sessionScope && recoveryFailed) return <View style={styles.page}>
    <CommonHeader title={planText('loadError')} backAction={leaveSession} />
    <ModuleNoticeCard title={planText('loadError')} body={planText('connectionRequired')}
      actionLabel={planText('backToMemory')} onAction={leaveSession} />
  </View>;
  if (sessionScope && !isSessionReady) return <LoadingView description={planText('loading')} />;

  if (memorySetQuery.isLoading || (sceneId && sceneQuery.isLoading)) {
    return <LoadingView description={t('loading')} />;
  }

  if (!memorySetQuery.data || !sceneQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader
          title={t('title')}
          description={t('sceneUnavailable')}
          backAction={leaveSession}
        />
        <View style={styles.empty}>
          <ModuleNoticeCard
            emoji="🏚️"
            title={t('sceneUnavailable')}
            body={t('refreshOrChooseAnother')}
            onAction={() =>
              void Promise.allSettled([memorySetQuery.refetch(), sceneQuery.refetch()])
            }
          />
        </View>
      </View>
    );
  }

  const memorySet = memorySetQuery.data;
  const scene = sceneQuery.data;
  const currentRecallOrder = recallOrder.length ? recallOrder : memorySet.items.map((item) => item.id);
  const active = mode === 'recall'
    ? placements.find((placement) => placement.item.id === currentRecallOrder[activeIndex])
    : placements[activeIndex];
  const recallComplete = mode === 'recall' && activeIndex >= currentRecallOrder.length;

  const selectLocus = (index: number) => {
    setActiveIndex(index);
    void Haptics.selectionAsync();
  };

  const advanceWalk = () => {
    if (activeIndex === placements.length - 1) {
      playSound('complete');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveIndex(0);
      return;
    }
    selectLocus(activeIndex + 1);
  };

  const startRecall = () => {
    if (browseOnly) return;
    checkingAnswerRef.current = false;
    advancingRef.current = false;
    setIsFinishing(false);
    setMode('recall');
    setActiveIndex(0);
    setRecallOrder(memorySet.items.map((item) => item.id));
    setAnswer('');
    setFeedback(null);
    setClientAttemptId(Crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    setStartedAtMs(Date.now());
    setQuestionStartedAtMs(Date.now());
    setResponses([]);
    setLastPayload(null);
    practiceAttempt.reset();
  };

  const checkOrContinue = (forgot = false) => {
    if (!active) return;
    if (isFinishing) return;
    if (feedback) {
      const response = responses.find((item) => item.memoryItemId === active.item.id);
      if (!response || advancingRef.current) return;
      advancingRef.current = true;
      const nextOrder = reinforceRecallQueue(currentRecallOrder, activeIndex, response, false);
      setRecallOrder(nextOrder);
      if (activeIndex === nextOrder.length - 1) {
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
        void practiceAttempt
          .mutateAsync(payload)
          .catch(() => undefined)
          .finally(() => {
            setIsFinishing(false);
            setActiveIndex((value) => value + 1);
            setAnswer('');
            setFeedback(null);
            setQuestionStartedAtMs(Date.now());
          });
        return;
      }
      setActiveIndex((value) => value + 1);
      setAnswer('');
      setFeedback(null);
      setQuestionStartedAtMs(Date.now());
      return;
    }

    if ((!answer.trim() && !forgot) || checkingAnswerRef.current) return;
    checkingAnswerRef.current = true;
    const isCorrect = !forgot && isRecallAnswerCorrect(active.item.answer, answer);
    setResponses((current) =>
      upsertRecallResponse(
        current,
        active.item.id,
        isCorrect,
        Math.max(0, Date.now() - questionStartedAtMs)
      )
    );
    setFeedback(isCorrect ? 'correct' : 'wrong');
    playSound(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const requestHint = () => {
    if (!active || questionHintCount >= PALACE_MAX_HINTS || feedback || isFinishing) return;
    setQuestionHintCount((count) => Math.min(PALACE_MAX_HINTS, count + 1));
    setResponses((current) => {
      const existing = current.find((response) => response.memoryItemId === active.item.id);
      if (existing) return current.map((response) => response.memoryItemId === active.item.id
        ? { ...response, hintCount: Math.min(PALACE_MAX_HINTS, (response.hintCount ?? 0) + 1) } : response);
      return [...current, { memoryItemId: active.item.id, isCorrect: false, attemptCount: 0, responseMs: 0, hintCount: 1 }];
    });
  };

  const renderRecallCue = () => {
    if (!active?.locus) return null;
    const zoom = 1.65;
    // Clamp the crop to the image edges so peripheral loci never expose empty space.
    const imageLeft = Math.max(100 - zoom * 100, Math.min(0, 50 - zoom * active.locus.xPercent));
    const imageTop = Math.max(100 - zoom * 100, Math.min(0, 50 - zoom * active.locus.yPercent));
    return (
      <View style={styles.recallCue}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${t('locusLabel')} ${active.item.position}: ${getPalaceLocusName(active.locus, language)}`}
        style={styles.recallCueWindow}>
          <AppImage
            imageUrl={scene.imageUrl}
            imageSource={scene.imageSource}
            style={[
              styles.recallCueImage,
              {
                height: `${zoom * 100}%`,
                left: `${imageLeft}%`,
                top: `${imageTop}%`,
                width: `${zoom * 100}%`,
              },
            ]}
            transition={250}
          />
          <View style={[styles.recallCueTarget, {
            left: `${imageLeft + zoom * active.locus.xPercent}%`,
            top: `${imageTop + zoom * active.locus.yPercent}%`,
          }]}>
            <Text style={styles.recallCuePin}>{active.item.position}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderModeRail = () => {
    const isRehearsing = mode !== 'recall';

    return (
      <View style={styles.modeRail}>
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={`${t('rehearseMode')}. ${t('rehearseModeBody')}`}
          accessibilityState={{ selected: isRehearsing, disabled: !isRehearsing && !recallComplete }}
          disabled={!isRehearsing && !recallComplete}
          onPress={() => {
            if (mode === 'list') {
              setMode('walk');
              return;
            }
            if (mode === 'recall' && recallComplete) {
              setMode('walk');
              setActiveIndex(0);
              setFeedback(null);
              setAnswer('');
            }
          }}
          style={[styles.modeCard, isRehearsing && styles.modeCardActive]}>
          <Text style={styles.modeEmoji}>🚶</Text>
          <Text style={[styles.modeTabText, isRehearsing && styles.modeTabTextActive]}>{t('rehearseMode')}</Text>
        </Pressable>
        {!browseOnly ? <Pressable
          accessibilityRole="tab"
          accessibilityLabel={`${t('recallMode')}. ${t('recallModeBody')}`}
          accessibilityState={{ selected: mode === 'recall', disabled: mode === 'recall' && !recallComplete }}
          disabled={mode === 'recall' && !recallComplete}
          onPress={startRecall}
          style={[styles.modeCard, mode === 'recall' && styles.modeCardActive]}>
          <Text style={styles.modeEmoji}>🧠</Text>
          <Text style={[styles.modeTabText, mode === 'recall' && styles.modeTabTextActive]}>{t('recallMode')}</Text>
        </Pressable> : null}
      </View>
    );
  };

  const renderViewAction = () => (
    <View style={styles.viewActionRow}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={mode === 'list' ? t('returnToScene') : t('openDirectory')}
        onPress={() => setMode(mode === 'list' ? 'walk' : 'list')}
        style={styles.viewActionButton}>
        {mode === 'list' ? (
          <MapPin size={16} color={theme.violetDeep} />
        ) : (
          <List size={16} color={theme.violetDeep} />
        )}
        <Text style={styles.viewActionText}>
          {mode === 'list' ? t('returnToScene') : t('openDirectory')}
        </Text>
        {mode !== 'list' ? <Text style={styles.viewActionCount}>{placements.length}</Text> : null}
      </AnimatedPressable>
    </View>
  );

  const renderRecallPanel = () =>
    recallComplete ? (
      <RecallResultCard
        tone="palace"
        title={t('recallComplete')}
        recalledFirstTry={recalledFirstTry}
        total={placements.length}
        recalledLabel={t('recalledFirstTry')}
        needsPracticeLabel={t('needsPractice')}
        xpEarned={practiceAttempt.data?.xpEarned}
        levelUpTo={
          practiceAttempt.data &&
          practiceAttempt.data.currentLevel > practiceAttempt.data.previousLevel
            ? practiceAttempt.data.currentLevel
            : undefined
        }
        body={
          recalledFirstTry === placements.length
            ? t('recallPerfectBody')
            : reviewText('needsPracticeBody')
        }
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
              {t('saved')} ✓ {t('nextReview')}{' '}
              {practiceAttempt.data.nextReviewAt
                ? new Date(practiceAttempt.data.nextReviewAt).toLocaleString()
                : t('willAppearToday')}
            </Text>
          ) : null
        }
        onRetry={sessionScope ? leaveSession : startRecall}
        retryLabel={sessionScope ? planText('backToMemory') : t('tryAgain')}
        retryAccessibilityLabel={sessionScope ? planText('backToMemory') : t('tryAgain')}
        secondaryAction={sessionScope ? undefined : {
          label: t('walkAgain'),
          onPress: () => {
            setMode('walk');
            setActiveIndex(0);
          },
        }}
        onReturnHome={() => router.replace('/(tabs)')}
        returnHomeLabel={t('backToHome')}
      />
    ) : active ? (
      <RecallAnswerCard
        tone="palace"
        eyebrow={`${t('locusLabel').toUpperCase()} ${active.item.position} · ${active.locus ? getPalaceLocusName(active.locus, language).toUpperCase() : t('memorySpot')}`}
        prompt={t('recallPrompt')}
        answer={answer}
        feedback={feedback}
        feedbackText={
          feedback === 'correct'
            ? t('correctFeedback')
            : reviewText('answerFeedback').replace('{answer}', active.item.answer)
        }
        actionLabel={
          isFinishing
            ? t('savingProgress')
            : feedback
              ? activeIndex === currentRecallOrder.length - 1
                ? t('finishRecallAction')
                : t('nextLocusAction')
              : t('checkAnswer')
        }
        actionDisabled={isFinishing}
        answerAccessibilityLabel={t('typeYourAnswer')}
        answerPlaceholder={t('typeYourAnswer')}
        progressLabel={`${t('recalledFirstTrySoFar')}: ${recalledFirstTry} / ${placements.length}`}
        cue={renderRecallCue()}
        assistance={
          <PalaceRecallHints
            item={active.item}
            binding={active.binding ?? null}
            hintCount={questionHintCount}
            feedback={feedback}
            disabled={isFinishing}
            onHint={requestHint}
          />
        }
        onAnswerFocus={queueRecallInputScroll}
        actionAreaRef={(view) => {
          recallActionRef.current = view;
        }}
        onAnswerChange={(value) => {
          if (feedback) return;
          setAnswer(value);
        }}
        onSubmit={() => checkOrContinue()}
        onSkip={() => checkOrContinue(true)}
        skipLabel={reviewText('forgot')}
      />
    ) : null;

  const renderMap = () => {
    const routePoints = placements
      .flatMap(({ locus }) => locus ? [`${locus.xPercent},${locus.yPercent}`] : [])
      .join(' ');
    const progressPercent = placements.length
      ? Math.min(100, ((activeIndex + 1) / placements.length) * 100)
      : 0;
    const progressLabel = t('walkProgress')
      .replace('{current}', String(activeIndex + 1))
      .replace('{total}', String(placements.length));
    return (
      <View style={styles.mapStage}>
        <View style={styles.mapToolbar}>
          <View
            accessibilityLabel={progressLabel}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: placements.length, now: activeIndex + 1 }}
            style={styles.routeProgress}>
            <Text numberOfLines={1} style={styles.routeProgressText}>{progressLabel}</Text>
            <View style={styles.routeProgressTrack}>
              <View style={[styles.routeProgressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('openDirectory')}
            onPress={() => setMode('list')}
            style={styles.mapDirectoryButton}>
            <List size={18} color={theme.violetDeep} />
          </AnimatedPressable>
        </View>
        <View style={styles.canvas}>
          <AppImage
            imageUrl={scene.imageUrl}
            imageSource={scene.imageSource}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={styles.floor} />
          <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100" preserveAspectRatio="none" accessibilityElementsHidden>
            <Polyline points={routePoints} fill="none" stroke="#FFC43F" strokeDasharray="2.2 2.4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} />
          </Svg>
          {placements.map((placement, index) =>
            placement.locus ? (
              <Pressable
                accessibilityRole="button"
                key={placement.item.id}
                accessibilityLabel={t('locusAccessibility')
                  .replace('{number}', String(index + 1))
                  .replace('{name}', getPalaceLocusName(placement.locus, language))}
                accessibilityState={{ selected: index === activeIndex, disabled: mode !== 'walk' }}
                disabled={mode !== 'walk'}
                onPress={() => mode === 'walk' && selectLocus(index)}
                style={[
                  styles.markerHit,
                  { left: `${placement.locus.xPercent}%`, top: `${placement.locus.yPercent}%` },
                ]}>
                <View style={[
                  styles.marker,
                  index < activeIndex && styles.visitedMarker,
                  index === activeIndex && styles.activeMarker,
                ]}>
                  <Text style={[
                    styles.markerText,
                  index === activeIndex && styles.activeMarkerText,
                    index < activeIndex && styles.visitedMarkerText,
                  ]}>{index < activeIndex ? '✓' : index + 1}</Text>
                </View>
              </Pressable>
            ) : null
          )}
        </View>
      </View>
    );
  };

  const renderSessionPanel = () => (
    <>
      {mode === 'walk' && active ? (
        active.locus ? (
          <PalaceFocusCard
            answer={active.item.answer}
            association={active.binding?.associationText}
            isLast={activeIndex === placements.length - 1}
            locus={active.locus}
            onPrevious={activeIndex > 0 ? () => selectLocus(activeIndex - 1) : undefined}
            onNext={advanceWalk}
          />
        ) : null
      ) : mode === 'recall' ? (
        renderRecallPanel()
      ) : mode === 'list' ? (
        <PalaceOrderedList
          activeIndex={activeIndex}
          items={placements.map((placement) => ({
            id: placement.item.id,
            answer: placement.item.answer,
            association: placement.binding?.associationText,
            locusName: placement.locus ? getPalaceLocusName(placement.locus, language) : undefined,
          }))}
          onSelect={selectLocus}
        />
      ) : null}
    </>
  );

  return (
    <View style={styles.page}>
      <CommonHeader
        compact
        eyebrow={t('eyebrow')}
        title={memorySet.title}
        description={sessionDescription ?? `${scene.name} · ${placements.length} ${t(
          placements.length === 1 ? 'locusSingular' : 'lociPlural'
        )}`}
        backAction={leaveSession}
      />
      <ScrollView
        ref={recallScrollRef}
        style={styles.sessionScroll}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        onScroll={(event) => {
          recallScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.sessionContent,
          mode === 'recall' && recallKeyboardInset > 0
            ? { paddingBottom: recallKeyboardOverlay + 24 }
            : null,
        ]}>
        {sessionScope && startInRecall ? null : (
          <View style={styles.modePanel}>
            {hasRestoredSession ? (
              <AnimatedPressable
                onPress={() => setHasRestoredSession(false)}
                style={styles.restoreNotice}>
                <Text style={styles.restoreNoticeText}>{t('restored')}</Text>
              </AnimatedPressable>
            ) : null}
            {renderModeRail()}
          </View>
        )}
        {mode === 'walk' ? renderMap() : null}
        <View style={styles.sessionPanel}>
          {sessionScope && startInRecall && hasRestoredSession ? (
            <AnimatedPressable
              onPress={() => setHasRestoredSession(false)}
              style={styles.restoreNotice}>
              <Text style={styles.restoreNoticeText}>{t('restored')}</Text>
            </AnimatedPressable>
          ) : null}
          {mode === 'list' ? renderViewAction() : null}
          {renderSessionPanel()}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  sessionScroll: { flex: 1 },
  sessionContent: { paddingBottom: 24 },
  sessionPanel: { paddingHorizontal: 16, paddingBottom: 24 },
  modePanel: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  mapStage: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  mapToolbar: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 },
  canvas: {
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.violetLine,
    backgroundColor: theme.sand,
  },
  floor: {
    position: 'absolute',
    top: 14,
    right: 14,
    bottom: 14,
    left: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.sunLine,
    borderRadius: 14,
  },
  markerHit: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.violet,
    borderWidth: 2.5,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.18)',
  },
  visitedMarker: { backgroundColor: theme.mintTint, borderColor: theme.mintLine },
  activeMarker: {
    backgroundColor: theme.violetDeep,
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
    boxShadow: '0px 0px 0px 5px rgba(255, 255, 255, 0.58), 0px 4px 10px rgba(43, 42, 61, 0.24)',
  },
  markerText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  activeMarkerText: { color: theme.onAccent },
  visitedMarkerText: { color: theme.successText },
  routeProgress: {
    alignItems: 'center',
    backgroundColor: theme.paper,
    borderColor: theme.violetLine,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: 44,
    paddingHorizontal: 12,
  },
  routeProgressText: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    flexShrink: 0,
  },
  routeProgressTrack: { flex: 1, height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: theme.violetTint },
  routeProgressFill: { height: '100%', borderRadius: 999, backgroundColor: theme.sun },
  mapDirectoryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  hint: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginVertical: 12,
  },
  restoreNotice: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: theme.mintTint,
    borderWidth: 1.5,
    borderColor: theme.mintLine,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  restoreNoticeText: {
    color: theme.successText,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  modeRail: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 17, backgroundColor: theme.violetTint, marginBottom: 12 },
  modeCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 0,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  modeCardActive: {
    backgroundColor: theme.paper,
    boxShadow: '0px 2px 6px rgba(43, 42, 61, 0.06)',
  },
  modeEmoji: { fontSize: 14 },
  modeTabText: {
    color: theme.inkSoft,
    flexShrink: 1,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
    textAlign: 'center',
  },
  modeTabTextActive: { color: theme.violetDeep },
  recallCue: { width: '100%' },
  recallCueWindow: {
    aspectRatio: 4 / 3,
    borderRadius: 20,
    borderWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.violetTint,
  },
  recallCueImage: { position: 'absolute' },
  recallCueTarget: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderColor: 'white',
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    position: 'absolute',
    top: '50%',
    width: 40,
    boxShadow: '0px 2px 6px rgba(43, 42, 61, 0.22)',
  },
  recallCuePin: { fontSize: 14, color: theme.ink, fontFamily: typography.bodyExtraBold },
  viewActionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  viewActionButton: {
    alignItems: 'center',
    backgroundColor: theme.violetTint,
    borderColor: theme.violetLine,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  viewActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  viewActionCount: {
    backgroundColor: theme.paper,
    borderRadius: 999,
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  saveState: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    marginBottom: 8,
  },
  saveSuccess: {
    color: theme.successText,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  saveError: { width: '100%', alignItems: 'center', marginBottom: 8 },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
}));
