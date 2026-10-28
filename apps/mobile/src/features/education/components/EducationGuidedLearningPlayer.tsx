import { educationCorrectAnswerText } from '../utils/educationCorrectAnswer';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { LearningArrival, LearningButton, LearningConfetti, LearningProgress, useLearningCopy, useLearningStyles } from './LearningUi';
import { LearningPracticeTip } from './LearningPracticeTip';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearningAppButton as AppButton } from '@/features/education/components/LearningAppButton';
import { QuestionCard, QuestionInput } from '@/features/education/components/question-inputs';
import { createEmptyEducationAnswer } from '@/features/education/components/question-inputs/createEmptyEducationAnswer';
import { useEducationCopy } from '@/features/education/i18n';
import type { EducationGuidedLearningSession } from '@/features/education/types/educationPractice.types';
import type { EducationAnswerFeedback, EducationAnswer } from '@/features/education/types/question.types';
import { isPracticeQuestion, type PracticeQuestion } from '@/features/education/components/EducationPracticeReview';
import { educationPracticeApi } from '@/features/education/api/educationPractice.api';
import { EDUCATION_PRACTICE_KEYS } from '@/features/education/hooks/useEducationPracticeItems';
import { createEducationQuestionInputLabels } from '@/features/education/utils/createEducationQuestionInputLabels';
import { isBlankResponse, toAttemptAnswerDto } from '@/features/education/utils/educationAttemptAnswers';
import { activateEducationGuidedCheckGate, claimEducationGuidedAdvance, claimEducationGuidedCheck,
  createEducationGuidedAdvanceGate, createEducationGuidedCheckGate,
  createEducationGuidedCheckPayload, createEducationGuidedPlaylist, deactivateEducationGuidedCheckGate,
  createEducationGuidedResumePlaylist, getNextEducationGuidedPlaylistQuestion,
  decideEducationGuidedFocusRefresh,
  retainEducationGuidedPendingCheck,
  resetEducationGuidedAdvance,
  isEducationGuidedCheckEpochCurrent, releaseEducationGuidedAdvance, releaseEducationGuidedCheck,
  type EducationGuidedCheckPayload } from '@/features/education/utils/educationGuidedLearningFlow';
import { isEducationOrderingAnswerComplete } from '@/features/education/utils/educationOrderingBuilder';
import { useAuth } from '@/contexts/AuthProvider';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { LearningFeedback } from './LearningFeedback';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { EducationGuidedLearningSummary } from '@/features/education/components/EducationGuidedLearningSummary';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = Readonly<{
  session: EducationGuidedLearningSession;
  userId: string;
  classroomId?: string;
  onExit: () => void;
  onUnavailable: () => void;
}>;

type PendingCheck = Readonly<{
  questionId: string;
  payload: EducationGuidedCheckPayload;
}>;

export function EducationGuidedLearningPlayer({ session, userId, classroomId, onExit, onUnavailable }: Props) {
  const copy = useEducationCopy();
  const ui = useLearningCopy();
  const { styles: ls, theme } = useLearningStyles();
  const insets = useSafeAreaInsets();
  const { styles } = useStyles();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playSound, feedbackEnabled } = useSoundEffects();
  const reduceMotion = useReducedMotion();
  const guidedSessionKey = EDUCATION_PRACTICE_KEYS.guidedSession(userId, session.sessionId, classroomId);
  const questions = useMemo(() => session.questions.map(item => item.question).filter(isPracticeQuestion), [session.questions]);
  const questionById = useMemo(() => new Map(questions.map(item => [item.id, item])), [questions]);
  const initialId = session.nextQuestionId && questionById.has(session.nextQuestionId) ? session.nextQuestionId : questions[0]?.id ?? '';
  const initialPlaylist = session.isComplete ? [] : createEducationGuidedResumePlaylist(
    session.questions.map(item => ({ questionId: item.question.id, attemptCount: item.progress.attemptCount })), initialId);
  const initialQuestion = questionById.get(initialId);
  const [playlist, setPlaylist] = useState<readonly string[]>(initialPlaylist);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [questionId, setQuestionId] = useState(initialId);
  const [answer, setAnswer] = useState<EducationAnswer>(() => initialQuestion ? createEmptyEducationAnswer(initialQuestion) : { type: 'true-false', value: null });
  const [result, setResult] = useState<EducationAnswerFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [changedElsewhere, setChangedElsewhere] = useState(false);
  const [showConflictNotice, setShowConflictNotice] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [showSummary, setShowSummary] = useState(session.isComplete);
  const [feedbackSequence, setFeedbackSequence] = useState(0);
  const checkGateRef = useRef(createEducationGuidedCheckGate());
  const advanceGateRef = useRef(createEducationGuidedAdvanceGate());
  const userIdRef = useRef(user?.id);
  const pendingCheckRef = useRef<PendingCheck | null>(null);
  const serverSessionRef = useRef(session);
  const minimumVersionRef = useRef<number | undefined>(undefined);
  const celebratedRef = useRef(session.isComplete);
  const refreshSessionRef = useRef<(epoch: number, preserveIfSameVersion?: boolean) => Promise<void>>(async () => undefined);
  const draftVersionRef = useRef(session.version);
  const draftIdentity = `${userId}:${classroomId ?? 'public'}:${session.sessionId}`;
  const draftIdentityRef = useRef(draftIdentity);
  userIdRef.current = user?.id;
  if (session.version >= serverSessionRef.current.version) serverSessionRef.current = session;
  refreshSessionRef.current = refreshSession;
  const activeQuestion = questionById.get(questionId);
  const currentPosition = questions.findIndex(item => item.id === questionId) + 1;
  const labels = createEducationQuestionInputLabels(copy);

  useFocusEffect(useCallback(() => {
    const epoch = activateEducationGuidedCheckGate(checkGateRef.current);
    setChecking(false);
    void refreshSessionRef.current(epoch, true);
    return () => { deactivateEducationGuidedCheckGate(checkGateRef.current); };
  }, []));

  useEffect(() => {
    if (user?.id !== userId) {
      deactivateEducationGuidedCheckGate(checkGateRef.current);
      setUnavailable(true);
      setResult(null);
      setAnswer({ type: 'true-false', value: null });
    }
  }, [user?.id, userId]);

  useEffect(() => { releaseEducationGuidedAdvance(advanceGateRef.current); }, [questionId]);

  if (unavailable || user?.id !== userId) {
    return <View style={styles.panel}><Text accessibilityRole="alert" style={styles.body}>{copy.guidedLessonUnavailable}</Text>
      <AppButton fullWidth label={copy.publicPracticeReturn} onPress={onExit} size="large" /></View>;
  }
  if (questions.length === 0) return <View style={styles.panel}><Text accessibilityRole="alert" style={styles.body}>{copy.practiceNoFormatItems}</Text>
    <AppButton fullWidth label={copy.publicPracticeReturn} onPress={onExit} size="large" /></View>;
  if (showSummary) return <EducationGuidedLearningSummary classroomId={classroomId} session={serverSessionRef.current} onExit={exit} onPractice={startPlaylist}
    disabled={syncPending || syncError} loading={syncPending} onRetry={() => void refreshSession()} />;
  if (!activeQuestion) return <View style={styles.panel}><Text accessibilityRole="alert" style={styles.body}>{copy.guidedLessonSessionError}</Text>
    <AppButton fullWidth label={copy.publicPracticeReturn} onPress={onExit} size="large" /></View>;

  return <View style={{ flex: 1, backgroundColor: theme.canvas }}>
    <View style={[styles.quizHeader, { paddingTop: insets.top + 8 }]}>
      <AnimatedPressable accessibilityRole="button" accessibilityLabel={copy.publicPracticeReturn} onPress={exit} style={styles.quizClose}><Ionicons name="close" size={24} color={theme.violetDeep} /></AnimatedPressable>
      <View style={{ flex: 1 }}><LearningProgress value={currentPosition} total={questions.length} color={theme.grass} height={14} /></View>
      <Text accessibilityLabel={ui.correct(session.questions.filter(item => item.progress.solved).length, questions.length)} style={styles.quizXp}>✦ {user?.totalXp ?? 0} XP</Text>
    </View>
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={[ls.content, { paddingTop: 12 }]}>
      <LearningPracticeTip userId={userId} />
      <LearningArrival key={questionId} style={{ gap: 14 }}>
        {activeQuestion.objectiveTitle ? <View style={styles.goal}><Ionicons name="locate" size={16} color={theme.violetDeep} /><Text style={[ls.small, { color: theme.violetDeep, flexShrink: 1 }]}>{activeQuestion.objectiveTitle}</Text></View> : null}
        <Text style={ls.small}>{copy.questionTypeLabels[activeQuestion.type]} · {copy.practiceGuidance[activeQuestion.type]}</Text>
        <QuestionCard variant="learning" questionIndex={questions.findIndex(item => item.id === questionId)} totalQuestions={questions.length}>
          <QuestionInput attemptId={`guided:${session.sessionId}`} question={activeQuestion} value={answer}
            onChange={setAnswer} labels={labels} feedback={result?.isCorrect} correctAnswer={result?.correctAnswer} showHints={false} orderingBuilder disabled={checking || syncPending || pendingCheckRef.current !== null || result !== null} />
        </QuestionCard>
      </LearningArrival>
    </ScrollView>
    {result?.isCorrect ? <LearningConfetti visible sequence={feedbackSequence} /> : null}
    <View style={[ls.dock, styles.feedbackDock, { paddingBottom: Math.max(16, insets.bottom), backgroundColor: result ? result.isCorrect ? theme.mintTint : theme.berryTint : theme.canvas, borderColor: result ? result.isCorrect ? theme.mintLine : theme.berryLine : theme.line }]}>
      {result ? <LearningFeedback correct={result.isCorrect} title={result.isCorrect ? ui.feedbackCorrect : ui.feedbackWrong} explanation={result.explanation ?? activeQuestion.explanation} correctAnswerText={result.isCorrect ? null : educationCorrectAnswerText(activeQuestion, result.correctAnswer, labels)} sequence={feedbackSequence} /> : null}
      {checkError ? <Text accessibilityRole="alert" style={styles.error}>{copy.guidedLessonCheckError}</Text> : null}
      {showConflictNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{copy.guidedLessonChanged}</Text> : null}
      {syncError ? <Text accessibilityRole="alert" style={styles.error}>{copy.guidedLessonSessionError}</Text> : null}
      {syncPending || syncError ? <LearningButton disabled={syncPending} label={syncPending ? copy.practiceChecking : copy.retry}
        onPress={() => changedElsewhere ? void refreshSession(checkGateRef.current.focusEpoch) : void refreshAfterCheck(minimumVersionRef.current)} loading={syncPending} />
        : pendingCheckRef.current ? <LearningButton disabled={checking} label={checking ? copy.practiceChecking : copy.guidedLessonRetrySend} onPress={() => void retryPendingCheck()} loading={checking} />
          : result ? <View style={{ gap: 8 }}>
            <LearningButton tone={result.isCorrect ? 'success' : 'primary'} disabled={checking} label={copy.practiceContinue} onPress={advance} />
            {!result.isCorrect ? <LearningButton secondary disabled={checking} label={copy.practiceTryAgain} onPress={retryCurrent} /> : null}
          </View> : <LearningButton disabled={checking || changedElsewhere || isBlankResponse(activeQuestion, answer) || !answerReady(activeQuestion, answer)} label={checking ? copy.practiceChecking : copy.practiceCheck} loading={checking} onPress={() => void checkAnswer()} />}
    </View>
  </View>;

  function isActive(generation = checkGateRef.current.focusEpoch) {
    return isEducationGuidedCheckEpochCurrent(checkGateRef.current, generation) && userIdRef.current === userId;
  }

  function exit() {
    deactivateEducationGuidedCheckGate(checkGateRef.current);
    onExit();
  }

  function startPlaylist(ids: readonly string[]) {
    const nextPlaylist = ids.filter(id => questionById.has(id));
    const first = nextPlaylist[0];
    if (!first) return;
    setPlaylist(nextPlaylist);
    resetEducationGuidedAdvance(advanceGateRef.current);
    setPlaylistIndex(0);
    setQuestionId(first);
    setAnswer(createEmptyEducationAnswer(questionById.get(first)!));
    setResult(null);
    setCheckError(false);
    setChangedElsewhere(false);
    setShowConflictNotice(false);
    setShowSummary(false);
    celebratedRef.current = false;
  }

  async function checkAnswer() {
    Keyboard.dismiss();
    if (!activeQuestion || result || syncPending || syncError || pendingCheckRef.current ||
      !isActive() || !claimEducationGuidedCheck(checkGateRef.current, checkGateRef.current.focusEpoch)) return;
    const payload = createEducationGuidedCheckPayload(`${Date.now()}-${Math.random().toString(36).slice(2)}`,
      serverSessionRef.current.version, toAttemptAnswerDto(activeQuestion, answer));
    const pending: PendingCheck = { questionId: activeQuestion.id, payload };
    pendingCheckRef.current = pending;
    setShowConflictNotice(false);
    await sendCheck(pending, checkGateRef.current.focusEpoch);
  }

  async function retryPendingCheck() {
    const pending = pendingCheckRef.current;
    const generation = checkGateRef.current.focusEpoch;
    if (!pending || !isActive(generation) || !claimEducationGuidedCheck(checkGateRef.current, generation)) return;
    await sendCheck(pending, generation);
  }

  async function sendCheck(pending: PendingCheck, generation: number) {
    if (!isActive(generation) || checking) { releaseEducationGuidedCheck(checkGateRef.current, generation); return; }
    setChecking(true);
    setCheckError(false);
    try {
      const checked = await educationPracticeApi.checkGuidedAnswer(session.sessionId, pending.questionId, pending.payload, classroomId);
      if (!isActive(generation)) return;
      pendingCheckRef.current = null;
      setResult({ isCorrect: checked.isCorrect, explanation: checked.explanation, correctAnswer: checked.correctAnswer });
      setFeedbackSequence(value => value + 1);
      if (feedbackEnabled) {
        try { playSound(checked.isCorrect ? 'correct' : 'wrong'); } catch { /* Optional feedback cannot change a checked answer. */ }
        if (!reduceMotion) {
          try { void Haptics.notificationAsync(checked.isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined); } catch { /* Optional feedback. */ }
        }
      }
      minimumVersionRef.current = checked.sessionVersion;
      setSyncPending(true);
      await refreshAfterCheck(checked.sessionVersion, generation);
    } catch (error) {
      if (!isActive(generation)) return;
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        pendingCheckRef.current = null;
        setChangedElsewhere(true);
        setShowConflictNotice(true);
        await refreshSession(generation);
      } else if (status === 403 || status === 404) {
        pendingCheckRef.current = null;
        clearUnavailable();
      } else {
        setCheckError(true);
      }
    } finally {
      releaseEducationGuidedCheck(checkGateRef.current, generation);
      if (isActive(generation)) setChecking(false);
    }
  }

  async function refreshAfterCheck(expectedVersion = minimumVersionRef.current, generation = checkGateRef.current.focusEpoch) {
    setSyncError(false);
    setSyncPending(true);
    try {
      const latest = await queryClient.fetchQuery({
        queryKey: guidedSessionKey,
        queryFn: async () => {
          const snapshot = await educationPracticeApi.getGuidedSession(session.sessionId, classroomId);
          const minimumVersion = Math.max(expectedVersion ?? 0, serverSessionRef.current?.version ?? 0);
          if (snapshot.version < minimumVersion) throw new Error('Stale session response');
          return snapshot;
        }, staleTime: 0,
      });
      if (!isActive(generation)) return;
      serverSessionRef.current = latest;
      draftVersionRef.current = expectedVersion ?? latest.version;
      await queryClient.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.guidedCourseProgress(userId, latest.courseId, classroomId) });
      if (isActive(generation)) { setSyncPending(false); setSyncError(false); setChangedElsewhere(false); }
    } catch (error) {
      if (!isActive(generation)) return;
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) clearUnavailable();
      else { setSyncPending(false); setSyncError(true); }
    }
  }

  async function refreshSession(generation = checkGateRef.current.focusEpoch, preserveIfSameVersion = false) {
    setSyncPending(true);
    setSyncError(false);
    try {
      const latest = await queryClient.fetchQuery({
        queryKey: guidedSessionKey,
        queryFn: async () => {
          const snapshot = await educationPracticeApi.getGuidedSession(session.sessionId, classroomId);
          if (snapshot.version < (serverSessionRef.current?.version ?? 0)) throw new Error('Stale session response');
          return snapshot;
        }, staleTime: 0,
      });
      if (!isActive(generation)) return;
      serverSessionRef.current = latest;
      const identity = `${userId}:${classroomId ?? 'public'}:${session.sessionId}`;
      const identityChanged = draftIdentityRef.current !== identity;
      const previousDraftVersion = draftVersionRef.current;
      const decision = identityChanged
        ? { mode: 'rebuild' as const, retainPendingCheck: false, notifyChanged: false }
        : preserveIfSameVersion
          ? decideEducationGuidedFocusRefresh(previousDraftVersion, latest.version)
          : { mode: 'rebuild' as const, retainPendingCheck: true, notifyChanged: latest.version !== previousDraftVersion };
      if (decision.mode === 'clear') {
        clearUnavailable();
        return;
      }
      if (decision.mode === 'preserve') {
        setSyncError(false);
        setSyncPending(false);
        return;
      }
      pendingCheckRef.current = retainEducationGuidedPendingCheck(decision, pendingCheckRef.current);
      draftIdentityRef.current = identity;
      draftVersionRef.current = latest.version;
      resetEducationGuidedAdvance(advanceGateRef.current);
      const nextPlaylist = latest.isComplete ? [] : createEducationGuidedResumePlaylist(
        latest.questions.map(item => ({ questionId: item.question.id, attemptCount: item.progress.attemptCount })), latest.nextQuestionId);
      const pendingCheck = pendingCheckRef.current;
      const rebuiltPlaylist = pendingCheck && !nextPlaylist.includes(pendingCheck.questionId)
        ? [pendingCheck.questionId, ...nextPlaylist]
        : nextPlaylist;
      setPlaylist(rebuiltPlaylist);
      const pendingIndex = pendingCheck ? rebuiltPlaylist.indexOf(pendingCheck.questionId) : -1;
      setPlaylistIndex(pendingIndex >= 0 ? pendingIndex : 0);
      setShowSummary(latest.isComplete && !pendingCheck);
      setChangedElsewhere(false);
      if (decision.notifyChanged) setShowConflictNotice(true);
      const nextId = pendingCheck?.questionId ?? rebuiltPlaylist[0];
      if (nextId && questionById.has(nextId)) {
        setQuestionId(nextId);
        if (!pendingCheck || questionId !== nextId) setAnswer(createEmptyEducationAnswer(questionById.get(nextId)!));
      }
      if (!pendingCheck || questionId !== pendingCheck.questionId) setResult(null);
      setSyncError(false);
      setSyncPending(false);
      setCheckError(false);
      setChangedElsewhere(false);
    } catch (error) {
      if (!isActive(generation)) return;
      setSyncPending(false);
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) clearUnavailable();
      else setSyncError(true);
    }
  }

  function retryCurrent() {
    if (!activeQuestion) return;
    setAnswer(createEmptyEducationAnswer(activeQuestion));
    setResult(null);
    setCheckError(false);
  }

  function advance() {
    if (!result || checking || syncPending || syncError || !claimEducationGuidedAdvance(advanceGateRef.current)) return;
    const nextId = getNextEducationGuidedPlaylistQuestion(playlist, playlistIndex);
    if (!nextId) {
      const latest = serverSessionRef.current;
      if (!latest.isComplete) {
        const unanswered = createEducationGuidedPlaylist(latest.questions.filter(item => item.progress.attemptCount === 0)
          .map(item => item.question.id), latest.nextQuestionId);
        if (unanswered.length) { startPlaylist(unanswered); return; }
        setShowSummary(true);
        return;
      }
      if (!celebratedRef.current && feedbackEnabled) {
        try { playSound('complete'); } catch { /* Optional feedback. */ }
        celebratedRef.current = true;
      }
      setShowSummary(true);
      return;
    }
    const nextQuestion = questionById.get(nextId);
    if (!nextQuestion) { setShowSummary(true); return; }
    setPlaylistIndex(index => index + 1);
    setQuestionId(nextId);
    setAnswer(createEmptyEducationAnswer(nextQuestion));
    setResult(null);
    setCheckError(false);
    setChangedElsewhere(false);
    setShowConflictNotice(false);
  }

  function clearUnavailable() {
    pendingCheckRef.current = null;
    setUnavailable(true);
    setResult(null);
    setAnswer({ type: 'true-false', value: null });
    setSyncPending(false);
    setSyncError(false);
    setCheckError(false);
    queryClient.removeQueries({ queryKey: guidedSessionKey, exact: true });
    onUnavailable();
  }
}

function answerReady(question: PracticeQuestion, answer: EducationAnswer) {
  if (question.type === 'matching') return answer.type === 'matching' && question.options.every(option => answer.matches.some(match => match.leftOptionId === option.id));
  return question.type !== 'ordering' || (answer.type === 'ordering' && isEducationOrderingAnswerComplete(question, answer));
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
    panel: { backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderRadius: 18, borderWidth: 1.5, gap: 12, padding: 16 },
    title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 },
    body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
    objective: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 17 },
    feedback: { fontFamily: typography.bodyExtraBold, fontSize: 15 },
    feedbackPanel: { alignItems: 'center', borderRadius: 16, borderWidth: 2, flexDirection: 'row', gap: 10, minHeight: 58, paddingHorizontal: 14, paddingVertical: 10 },
    feedbackCorrect: { backgroundColor: theme.mintTint, borderColor: theme.successText },
    feedbackIncorrect: { backgroundColor: theme.paper, borderColor: theme.berryDeep },
    feedbackIcon: { backgroundColor: theme.paper, borderRadius: 18, color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 19, height: 36, lineHeight: 36, overflow: 'hidden', textAlign: 'center', width: 36 },
    explanation: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
    correct: { color: theme.successText },
    incorrect: { color: theme.berryDeep },
    error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 13 },
    notice: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: 12, borderWidth: 1, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, padding: 11 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    rowAction: { flex: 1 },
    progressTrack: { backgroundColor: theme.mintLine, borderRadius: 8, height: 10, overflow: 'hidden' },
    progressFill: { backgroundColor: theme.violetDeep, borderRadius: 8, height: '100%' },
    progressLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
    typeLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14, textTransform: 'capitalize' },
    guidance: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
    summary: { backgroundColor: theme.paper, borderColor: theme.mintLine, borderRadius: 14, borderWidth: 1.5, color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 21, padding: 14 },
    quizHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
    quizClose: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 14, borderWidth: 2, height: 42, justifyContent: 'center', width: 42 },
    quizXp: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, flexShrink: 0, textAlign: 'right' },
    goal: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 99, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 12 },
    feedbackDock: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 0, gap: 10, paddingTop: 16 },
    feedbackContent: { alignItems: 'center', flexDirection: 'row', minHeight: 76, position: 'relative' },
    feedbackTitle: { fontFamily: typography.displayExtraBold, fontSize: 21, lineHeight: 28 },
    feedbackExplanation: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
}));
