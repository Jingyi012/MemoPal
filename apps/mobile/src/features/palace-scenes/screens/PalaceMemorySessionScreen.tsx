import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { RecallAnswerCard } from '@/components/RecallAnswerCard';
import { RecallResultCard } from '@/components/RecallResultCard';
import { PalaceFocusCard } from '@/features/palace-scenes/components/PalaceFocusCard';
import { PalaceOrderedList } from '@/features/palace-scenes/components/PalaceOrderedList';
import { useMemorySet, type MemorySet } from '@/features/memory-sets';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { usePalaceScene } from '@/features/palace-scenes/hooks/usePalaceScenes';
import {
  clearPalaceSession,
  readPalaceSession,
  writePalaceSession,
} from '@/features/palace-scenes/services/palaceSessionRecovery';
import {
  normalizeRecallAnswer,
  upsertRecallResponse,
  restoreRecallQueue,
  reinforceRecallQueue,
  MAX_RECALL_ATTEMPTS,
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

type SessionMode = 'browse' | 'walk' | 'list' | 'recall';
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
  const [mode, setMode] = useState<SessionMode>(startInRecall ? 'recall' : 'browse');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const checkingAnswerRef = useRef(false);
  const advancingRef = useRef(false);
  useEffect(() => {
    checkingAnswerRef.current = false;
    advancingRef.current = false;
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

      setMode(snapshot.mode);
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
    const isCorrect = !forgot && normalizeRecallAnswer(answer) === normalizeRecallAnswer(active.item.answer);
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

  const renderRecallCue = () => {
    if (!active?.locus) return null;
    const zoom = 2.15;
    return (
      <View style={styles.recallCue}>
        <View style={styles.recallCueWindow}>
          <AppImage
            imageUrl={scene.imageUrl}
            imageSource={scene.imageSource}
            style={[
              styles.recallCueImage,
              {
                height: `${zoom * 100}%`,
                left: `${50 - zoom * active.locus.xPercent}%`,
                top: `${50 - zoom * active.locus.yPercent}%`,
                width: `${zoom * 100}%`,
              },
            ]}
            transition={250}
          />
          <View style={styles.recallCueTarget}>
            <Text style={styles.recallCuePin}>📍</Text>
          </View>
          <View style={styles.recallCueLabel}>
            <Text style={styles.recallCueLabelText}>{getPalaceLocusName(active.locus, language)}</Text>
          </View>
        </View>
        <Text style={styles.recallCueCaption}>{t('recallCueHint')}</Text>
      </View>
    );
  };

  const renderModeRail = () => {
    const isRehearsing = mode !== 'recall';
    const openRehearsalView = (nextMode: 'browse' | 'walk' | 'list') => {
      setMode(nextMode);
      setActiveIndex(0);
      setFeedback(null);
      setAnswer('');
    };

    return (
      <>
        <View style={styles.modeRail}>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={t('rehearseMode')}
            accessibilityState={{ selected: isRehearsing, disabled: !isRehearsing && !recallComplete }}
            disabled={!isRehearsing && !recallComplete}
            onPress={() => {
              if (!isRehearsing) openRehearsalView('browse');
            }}
            style={[styles.modeCard, isRehearsing && styles.modeCardActive]}>
            <Text style={styles.modeEmoji}>👀</Text>
            <View style={styles.modeCardCopy}>
              <Text style={[styles.modeTabText, isRehearsing && styles.modeTabTextActive]}>
                {t('rehearseMode')}
              </Text>
              <Text style={[styles.modeTabBody, isRehearsing && styles.modeTabBodyActive]}>
                {t('rehearseModeBody')}
              </Text>
            </View>
          </Pressable>
          {!browseOnly ? <Pressable
            accessibilityRole="tab"
            accessibilityLabel={t('recallMode')}
            accessibilityState={{ selected: mode === 'recall', disabled: mode === 'recall' && !recallComplete }}
            disabled={mode === 'recall' && !recallComplete}
            onPress={startRecall}
            style={[styles.modeCard, mode === 'recall' && styles.modeCardActive]}>
            <Text style={styles.modeEmoji}>🧠</Text>
            <View style={styles.modeCardCopy}>
              <Text style={[styles.modeTabText, mode === 'recall' && styles.modeTabTextActive]}>
                {t('recallMode')}
              </Text>
              <Text style={[styles.modeTabBody, mode === 'recall' && styles.modeTabBodyActive]}>
                {t('recallModeBody')}
              </Text>
            </View>
          </Pressable> : null}
        </View>
        {isRehearsing ? (
          <View style={styles.subModeRail}>
            {(
              [
                ['browse', '🗺️', t('map')],
                ['walk', '🚶', t('walk')],
                ['list', '📋', t('list')],
              ] as const
            ).map(([nextMode, emoji, label]) => (
              <Pressable
                key={nextMode}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: mode === nextMode }}
                onPress={() => openRehearsalView(nextMode)}
                style={[styles.subModeTab, mode === nextMode && styles.subModeTabActive]}>
                <Text style={styles.subModeEmoji}>{emoji}</Text>
                <Text style={[styles.subModeText, mode === nextMode && styles.subModeTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </>
    );
  };

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
        icon={<Text style={styles.recallEmoji}>🧠</Text>}
        eyebrow={`${t('locusLabel').toUpperCase()} ${active.item.position} · ${active.locus ? getPalaceLocusName(active.locus, language).toUpperCase() : t('memorySpot')}`}
        prompt={t('recallPrompt')}
        answer={answer}
        feedback={feedback}
        feedbackText={
          feedback === 'correct'
            ? t('correctFeedback')
            : `${reviewText('answerFeedback').replace('{answer}', active.item.answer)} ${
              (responses.find((item) => item.memoryItemId === active.item.id)?.attemptCount ?? 0) >= MAX_RECALL_ATTEMPTS
                ? reviewText('reinforcementFinished') : reviewText('reinforcementLater')}`
        }
        actionLabel={
          isFinishing
            ? t('savingProgress')
            : feedback
              ? t('nextLocusAction')
              : t('checkAnswer')
        }
        actionDisabled={isFinishing}
        answerAccessibilityLabel={t('typeYourAnswer')}
        answerPlaceholder={t('typeYourAnswer')}
        progressLabel={`${t('recalledFirstTrySoFar')}: ${recalledFirstTry} / ${placements.length}`}
        cue={<View>
          {renderRecallCue()}
          {feedback === 'wrong' && active.binding?.associationText ? (
            <Text style={styles.saveState}>{active.binding.associationText}</Text>
          ) : null}
        </View>}
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

  const renderMap = () => (
    <View style={styles.mapStage}>
      <View style={styles.canvas}>
        <AppImage
          imageUrl={scene.imageUrl}
          imageSource={scene.imageSource}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={styles.floor} />
        {placements.map((placement, index) =>
          placement.locus ? (
            <Pressable
              key={placement.item.id}
              accessibilityLabel={t('locusAccessibility')
                .replace('{number}', String(index + 1))
                .replace('{name}', getPalaceLocusName(placement.locus, language))}
              onPress={() => mode === 'browse' && setActiveIndex(index)}
              style={[
                styles.marker,
                { left: `${placement.locus.xPercent}%`, top: `${placement.locus.yPercent}%` },
                index === activeIndex && styles.activeMarker,
              ]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </Pressable>
          ) : null
        )}
      </View>
    </View>
  );

  const renderSessionPanel = () => (
    <>
      {mode === 'browse' && active ? (
        <View style={styles.previewCard}>
          <View style={styles.previewTop}>
            <View style={styles.previewIcon}>
              <Text style={styles.sceneSparkle}>✨</Text>
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.eyebrow}>
                {t('locusLabel').toUpperCase()} {activeIndex + 1} ·{' '}
                {active.locus ? getPalaceLocusName(active.locus, language).toUpperCase() : t('memorySpot')}
              </Text>
              <Text style={styles.previewAnswer}>{active.item.answer}</Text>
            </View>
          </View>
          <Text style={styles.previewAssociation}>
            {active.binding?.associationText ?? t('associationFallback')}
          </Text>
        </View>
      ) : null}

      {mode === 'walk' && active ? (
        active.locus ? (
          <PalaceFocusCard
            answer={active.item.answer}
            association={active.binding?.associationText}
            index={activeIndex}
            isLast={activeIndex === placements.length - 1}
            locus={active.locus}
            onPrevious={() => setActiveIndex((value) => Math.max(0, value - 1))}
            onNext={() =>
              activeIndex === placements.length - 1
                ? setActiveIndex(0)
                : setActiveIndex((value) => value + 1)
            }
            onStartRecall={browseOnly ? undefined : startRecall}
            scene={scene}
            total={placements.length}
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
          onSelect={setActiveIndex}
        />
      ) : (
        <>
          {placements.map((placement, index) => (
            <AnimatedPressable
              key={placement.item.id}
              onPress={() => setActiveIndex(index)}
              style={[styles.itemRow, index === activeIndex && styles.activeRow]}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.itemAnswer}>{placement.item.answer}</Text>
                <Text style={styles.itemLocus}>{placement.locus ? getPalaceLocusName(placement.locus, language) : null}</Text>
              </View>
            </AnimatedPressable>
          ))}
          <AnimatedPressable
            onPress={() => {
              setActiveIndex(0);
              setMode('walk');
            }}
            style={styles.primaryButton}>
            <Text style={styles.primaryText}>🚶 {t('walkThrough')}</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={browseOnly ? leaveSession : startRecall} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{browseOnly ? planText('backToMemory') : t('recallChallenge')}</Text>
          </AnimatedPressable>
        </>
      )}
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
        {mode !== 'recall' ? renderMap() : null}
        <View style={styles.sessionPanel}>
          <Text style={styles.hint}>
            {mode === 'recall'
              ? t('activeLocusHint')
              : t('routeNavigationHint')}
          </Text>
          {hasRestoredSession ? (
            <AnimatedPressable
              onPress={() => setHasRestoredSession(false)}
              style={styles.restoreNotice}>
              <Text style={styles.restoreNoticeText}>{t('restored')}</Text>
            </AnimatedPressable>
          ) : null}
          {sessionScope && startInRecall ? null : renderModeRail()}
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
  mapStage: { padding: 16, paddingBottom: 24 },
  flex: { flex: 1 },
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
  marker: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    backgroundColor: theme.violet,
    borderWidth: 2.5,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.18)',
  },
  activeMarker: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.18 }] },
  markerText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 12 },
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
  modeRail: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modeCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 70,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
  },
  modeCardActive: {
    backgroundColor: theme.night,
    borderColor: theme.night,
    boxShadow: '0px 3px 0px rgba(43,42,61,0.12)',
  },
  modeEmoji: { fontSize: 15 },
  modeTabText: {
    color: theme.inkSoft,
    flexShrink: 1,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11.5,
  },
  modeTabTextActive: { color: 'white' },
  modeCardCopy: { flex: 1, minWidth: 0 },
  modeTabBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 2,
  },
  modeTabBodyActive: { color: 'rgba(255,255,255,0.78)' },
  subModeRail: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  subModeTab: {
    alignItems: 'center',
    backgroundColor: theme.violetTint,
    borderColor: theme.violetLine,
    borderRadius: 11,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  subModeTabActive: { backgroundColor: theme.violetTint, borderColor: theme.violet },
  subModeEmoji: { fontSize: 13 },
  subModeText: { color: theme.inkSoft, flexShrink: 1, textAlign: 'center', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  subModeTextActive: { color: theme.violetDeep },
  previewCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.violetLine,
    backgroundColor: theme.violetTint,
    padding: 14,
    marginBottom: 12,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: theme.violetTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: { flex: 1 },
  eyebrow: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  previewAnswer: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 19,
    marginTop: 4,
  },
  previewAssociation: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  sceneSparkle: { fontSize: 18 },
  recallEmoji: { fontSize: 22 },
  recallCue: { width: '100%' },
  recallCueWindow: {
    aspectRatio: 2.15,
    borderColor: theme.violetLine,
    borderRadius: 16,
    borderWidth: 2,
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
  recallCuePin: { fontSize: 14 },
  recallCueLabel: {
    backgroundColor: 'rgba(36,31,56,.84)',
    borderRadius: 999,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute',
    top: 10,
  },
  recallCueLabelText: {
    color: 'white',
    fontFamily: typography.bodyExtraBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  recallCueCaption: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    textAlign: 'center',
  },
  itemRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 10,
    marginBottom: 8,
  },
  activeRow: { borderColor: theme.violet, backgroundColor: theme.violetTint },
  itemNumber: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: theme.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  itemLocus: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginTop: 2 },
  primaryButton: {
    width: '100%',
    minHeight: 53,
    borderRadius: 16,
    backgroundColor: theme.sun,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    boxShadow: `0px 5px 0px ${theme.sunDeep}`,
  },
  primaryText: {
    color: theme.onSun,
    fontFamily: typography.bodyExtraBold,
    fontSize: 14,
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 49,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.violet,
    backgroundColor: theme.violetTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  secondaryText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14 },
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
