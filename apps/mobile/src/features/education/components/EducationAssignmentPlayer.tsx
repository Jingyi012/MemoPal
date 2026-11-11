import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { LearningProgress } from './LearningUi';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningAppButton as AppButton } from '@/features/education/components/LearningAppButton';
import { ConfirmModal } from '@/components/ConfirmModal';
import { QuestionCard, QuestionInput } from '@/features/education/components/question-inputs';
import { educationAttemptApi } from '@/features/education/api/educationAttempt.api';
import { useEducationCopy } from '@/features/education/i18n';
import { useAuth } from '@/contexts/AuthProvider';
import { createEducationQuestionInputLabels } from '@/features/education/utils/createEducationQuestionInputLabels';
import { EducationAssignmentLeaderboard } from '@/features/education/components/EducationAssignmentLeaderboard';
import { EducationResultShareButton } from '@/features/education/components/EducationResultShareButton';
import { EducationPracticeReview, isPracticeQuestion, type PracticeQuestion } from '@/features/education/components/EducationPracticeReview';
import type {
  EducationAnswer,
  EducationAssessmentAttempt,
  EducationAttemptQuestion,
  EducationResponseAttachmentFile,
} from '@/features/education/types/question.types';
import {
  answerForQuestion,
  answersForAttempt,
  isBlankResponse,
  isSameAnswer,
  toAttemptAnswerDto,
} from '@/features/education/utils/educationAttemptAnswers';
import { enqueueEducationAttemptWrite } from '@/features/education/utils/educationAttemptWriteQueue';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

const TEXT_SAVE_DEBOUNCE_MS = 500;

type PendingAnswer = Readonly<{
  answer: EducationAnswer;
  revision: number;
}>;

type EducationAssignmentPlayerProps = Readonly<{
  attempt: EducationAssessmentAttempt;
  classroomAssignment: boolean;
  initialPracticeType?: string;
  onAttemptUpdated: (attempt: EducationAssessmentAttempt) => void;
  onSketchWorkChange?: (hasUnsavedWork: boolean, processing: boolean) => void;
}>;

export function EducationAssignmentPlayer({ attempt, classroomAssignment, initialPracticeType, onAttemptUpdated, onSketchWorkChange }: EducationAssignmentPlayerProps) {
  const copy = useEducationCopy();
  const { user } = useAuth();
  const { styles, theme } = useStyles();
  const [answers, setAnswers] = useState<Record<string, EducationAnswer>>(() => answersForAttempt(attempt));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitError, setSubmitError] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasUnsavedSketch, setHasUnsavedSketch] = useState(false);
  const [isSketchProcessing, setIsSketchProcessing] = useState(false);
  const [practiceMode, setPracticeMode] = useState(() => Boolean(initialPracticeType));
  const [secondsRemaining, setSecondsRemaining] = useState(() => remainingSeconds(attempt.expiresAt));
  const answersRef = useRef(answers);
  const pendingAnswersRef = useRef(new Map<string, PendingAnswer>());
  const debounceTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const attachmentUploadsRef = useRef<Promise<void>>(Promise.resolve());
  const answerRevisionRef = useRef(0);
  const attemptRef = useRef(attempt);
  const attemptVersionRef = useRef(attempt.version);
  const onAttemptUpdatedRef = useRef(onAttemptUpdated);
  const onSketchWorkChangeRef = useRef(onSketchWorkChange);
  const localPreviewCleanupRef = useRef(new Map<string, { uri: string; cleanup: () => void }>());
  const isSubmittingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const hasUnsavedSketchRef = useRef(false);
  const isSketchProcessingRef = useRef(false);
  const userIdRef = useRef(user?.id ?? null);
  userIdRef.current = user?.id ?? null;
  const expiryTriggeredRef = useRef(false);

  if (attempt.id !== attemptRef.current.id || attempt.version >= attemptRef.current.version) {
    attemptRef.current = attempt;
  }
  onAttemptUpdatedRef.current = onAttemptUpdated;
  onSketchWorkChangeRef.current = onSketchWorkChange;
  if (attempt.version > attemptVersionRef.current) attemptVersionRef.current = attempt.version;

  const queueSave = useCallback((questionId: string) => {
    return enqueueEducationAttemptWrite(queueRef, async () => {
      const pending = pendingAnswersRef.current.get(questionId);
      const currentAttempt = attemptRef.current;
      const question = currentAttempt.questions.find((item) => item.id === questionId);
      if (!pending || !question || currentAttempt.status !== 'in-progress') return;
      if (Date.now() >= new Date(currentAttempt.expiresAt).getTime()) {
        setSaveState('error');
        return;
      }

      const clear = isBlankResponse(question, pending.answer);
      const answer = clear ? null : toAttemptAnswerDto(question, pending.answer);
      setSaveState('saving');
      try {
        const saved = await educationAttemptApi.saveResponse(currentAttempt.id, {
          questionId,
          expectedVersion: attemptVersionRef.current,
          clear,
          answer,
        });
        attemptVersionRef.current = saved.version;
        const currentPending = pendingAnswersRef.current.get(questionId);
        if (currentPending?.revision === pending.revision) pendingAnswersRef.current.delete(questionId);
        const nextResponses = currentAttempt.responses.filter((response) => response.questionId !== questionId);
        if (!clear) nextResponses.push({ questionId, answer });
        const updatedAttempt = { ...currentAttempt, version: saved.version, responses: nextResponses };
        attemptRef.current = updatedAttempt;
        onAttemptUpdatedRef.current(updatedAttempt);
        setSaveState(pendingAnswersRef.current.size === 0 ? 'saved' : 'saving');
      } catch {
        try {
          const latest = await educationAttemptApi.get(currentAttempt.id);
          attemptVersionRef.current = latest.version;
          attemptRef.current = latest;
          onAttemptUpdatedRef.current(latest);
          const savedAnswer = latest.responses.find((response) => response.questionId === questionId)?.answer;
          const latestAnswer = answerForQuestion(question, savedAnswer);
          const currentPending = pendingAnswersRef.current.get(questionId);
          if (isSameAnswer(latestAnswer, pending.answer) && currentPending?.revision === pending.revision) {
            pendingAnswersRef.current.delete(questionId);
            setSaveState(pendingAnswersRef.current.size === 0 ? 'saved' : 'saving');
            return;
          }
        } catch {
          // Keep the local answer and offer retry; the server version remains unknown until it can be restored.
        }
        setSaveState('error');
      }
    });
  }, []);

  const flushPendingAnswers = useCallback(async () => {
    await attachmentUploadsRef.current;
    for (const [questionId, timer] of debounceTimersRef.current) {
      clearTimeout(timer);
      debounceTimersRef.current.delete(questionId);
    }
    for (const questionId of pendingAnswersRef.current.keys()) void queueSave(questionId);
    await queueRef.current;
    return pendingAnswersRef.current.size === 0;
  }, [queueSave]);

  const submitAttempt = useCallback(async (expired: boolean) => {
    if (isSubmittingRef.current || attemptRef.current.status === 'submitted') return;
    if (!expired && (hasUnsavedSketchRef.current || isSketchProcessingRef.current)) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(false);
    const saved = await flushPendingAnswers();
    const hasExpired = expired || Date.now() >= new Date(attemptRef.current.expiresAt).getTime();
    if (!saved && !hasExpired) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSaveState('error');
      return;
    }

    try {
      const result = await educationAttemptApi.submit(attemptRef.current.id);
      const submittedAttempt: EducationAssessmentAttempt = {
        ...attemptRef.current,
        status: result.status,
        submittedAt: result.submittedAt,
        resultPublished: result.resultPublished,
        resultsPublishedAt: result.resultsPublishedAt,
        score: result.score,
        maxScore: result.maxScore,
        manualGradingPending: result.manualGradingPending,
      };
      attemptRef.current = submittedAttempt;
      pendingAnswersRef.current.clear();
      onAttemptUpdatedRef.current(submittedAttempt);
      setSaveState('saved');
    } catch {
      setSubmitError(true);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [flushPendingAnswers]);

  const handleRecordingChange = useCallback((recording: boolean) => {
    isRecordingRef.current = recording;
    setIsRecording(recording);
    if (!recording && (expiryTriggeredRef.current || Date.now() >= new Date(attemptRef.current.expiresAt).getTime())) {
      expiryTriggeredRef.current = true;
      void submitAttempt(true);
    }
  }, [submitAttempt]);

  const handleSketchWorkChange = useCallback((hasWork: boolean, processing: boolean) => {
    hasUnsavedSketchRef.current = hasWork;
    isSketchProcessingRef.current = processing;
    setHasUnsavedSketch(hasWork);
    setIsSketchProcessing(processing);
    onSketchWorkChangeRef.current?.(hasWork, processing);
  }, []);

  const clearLocalPreview = useCallback((questionId: string, keepUri?: string) => {
    const preview = localPreviewCleanupRef.current.get(questionId);
    if (!preview || preview.uri === keepUri) return;
    localPreviewCleanupRef.current.delete(questionId);
    try { preview.cleanup(); } catch { /* Cache cleanup is best-effort. */ }
  }, []);

  const registerLocalPreview = useCallback((questionId: string, uri: string, cleanup: () => void) => {
    clearLocalPreview(questionId, uri);
    localPreviewCleanupRef.current.set(questionId, { uri, cleanup });
  }, [clearLocalPreview]);

  useEffect(() => () => {
    for (const preview of localPreviewCleanupRef.current.values()) {
      try { preview.cleanup(); } catch { /* Cache cleanup is best-effort. */ }
    }
    localPreviewCleanupRef.current.clear();
  }, [attempt.id, user?.id]);

  const checkPracticeAnswer = useCallback(async (question: PracticeQuestion, answer: EducationAnswer) => {
    const result = await educationAttemptApi.checkPracticeAnswer(attempt.id, question.id, toAttemptAnswerDto(question, answer));
    return { isCorrect: result.isCorrect, explanation: result.explanation, correctAnswer: result.correctAnswer };
  }, [attempt.id]);

  const changeAnswer = useCallback((question: EducationAttemptQuestion, answer: EducationAnswer) => {
    if (answer.type === 'photo-response') clearLocalPreview(question.id, answer.localUri);
    const nextAnswers = { ...answersRef.current, [question.id]: answer };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    if ((question.type === 'photo-response' && answer.type === 'photo-response') ||
        (question.type === 'voice-response' && answer.type === 'voice-response')) {
      const currentAttempt = attemptRef.current;
      const hasAttachment = answer.type === 'photo-response' ? Boolean(answer.photoAttachmentId) : Boolean(answer.audioAttachmentId);
      const dto = hasAttachment ? toAttemptAnswerDto(question, answer) : null;
      const responses = currentAttempt.responses.filter((response) => response.questionId !== question.id);
      if (dto) responses.push({ questionId: question.id, answer: dto });
      const updated = { ...currentAttempt, responses };
      attemptRef.current = updated;
      onAttemptUpdatedRef.current(updated);
      setSaveState('saved');
      return;
    }
    const pending = { answer, revision: ++answerRevisionRef.current };
    pendingAnswersRef.current.set(question.id, pending);
    setSaveState('saving');
    if (question.type === 'fill-blank' || question.type === 'written-response') {
      const previousTimer = debounceTimersRef.current.get(question.id);
      if (previousTimer) clearTimeout(previousTimer);
      const timer = setTimeout(() => {
        debounceTimersRef.current.delete(question.id);
        void queueSave(question.id);
      }, TEXT_SAVE_DEBOUNCE_MS);
      debounceTimersRef.current.set(question.id, timer);
    } else {
      void queueSave(question.id);
    }
  }, [clearLocalPreview, queueSave]);

  const uploadAttachment = useCallback(async (questionId: string, file: EducationResponseAttachmentFile, kind: 'photo' | 'audio') => {
    const identityUserId = userIdRef.current;
    const identityAttemptId = attemptRef.current.id;
    setSaveState('saving');
    let attachmentId = '';
    const operation = enqueueEducationAttemptWrite(queueRef, async () => {
      if (userIdRef.current !== identityUserId || attemptRef.current.id !== identityAttemptId) throw new Error('The assignment identity changed.');
      const saved = await educationAttemptApi.uploadAttachment(identityAttemptId, questionId, attemptVersionRef.current, file, kind);
      if (userIdRef.current !== identityUserId || attemptRef.current.id !== identityAttemptId) throw new Error('The assignment identity changed.');
      attemptVersionRef.current = saved.version;
      const currentAttempt = attemptRef.current;
      const question = currentAttempt.questions.find(item => item.id === questionId);
      let uploadedAnswer: EducationAnswer | null = null;
      if (kind === 'photo' && question?.type === 'photo-response') uploadedAnswer = { type: 'photo-response', photoAttachmentId: saved.attachmentId, localUri: file.uri };
      if (kind === 'audio' && question?.type === 'voice-response') uploadedAnswer = { type: 'voice-response', audioAttachmentId: saved.attachmentId, localUri: file.uri };
      const answerDto = question && uploadedAnswer ? toAttemptAnswerDto(question, uploadedAnswer) : null;
      const responses = currentAttempt.responses.filter(response => response.questionId !== questionId);
      if (answerDto) responses.push({ questionId, answer: answerDto });
      const updated = { ...currentAttempt, version: saved.version, responses };
      attemptRef.current = updated;
      onAttemptUpdatedRef.current(updated);
      if (uploadedAnswer) {
        const nextAnswers = { ...answersRef.current, [questionId]: uploadedAnswer };
        answersRef.current = nextAnswers;
        setAnswers(nextAnswers);
      }
      attachmentId = saved.attachmentId;
    });
    attachmentUploadsRef.current = operation.then(() => undefined, () => undefined);
    try {
      await operation;
      return attachmentId;
    } catch (error) {
      setSaveState('error');
      throw error;
    }
  }, []);

  useEffect(() => {
    attemptVersionRef.current = attempt.version;
    const restoredAnswers = answersForAttempt(attempt);
    answersRef.current = restoredAnswers;
    setAnswers(restoredAnswers);
    setQuestionIndex(0);
    setSecondsRemaining(remainingSeconds(attempt.expiresAt));
    pendingAnswersRef.current.clear();
    expiryTriggeredRef.current = false;
    // Reset only for a different attempt; version updates arrive after each autosave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.id]);

  useEffect(() => {
    if (attempt.status !== 'in-progress') return;
    const timer = setInterval(() => {
      const remaining = remainingSeconds(attempt.expiresAt);
      setSecondsRemaining(remaining);
      if (remaining === 0 && !expiryTriggeredRef.current) {
        expiryTriggeredRef.current = true;
        if (!isRecordingRef.current) void submitAttempt(true);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [attempt.expiresAt, attempt.status, submitAttempt]);

  useEffect(() => () => {
    for (const [questionId, timer] of debounceTimersRef.current) {
      clearTimeout(timer);
      debounceTimersRef.current.delete(questionId);
      void queueSave(questionId);
    }
  }, [queueSave]);

  const labels = createEducationQuestionInputLabels(copy);

  if (attempt.status === 'submitted') {
    const practiceQuestions = attempt.questions.filter(isPracticeQuestion);
    const selectedPracticeQuestions = initialPracticeType && initialPracticeType !== 'all'
      ? practiceQuestions.filter(question => question.type === initialPracticeType)
      : practiceQuestions;
    if (practiceMode) {
      return <EducationPracticeReview attemptId={attempt.id} sessionIdentity={user?.id ?? 'anonymous'} questions={selectedPracticeQuestions} labels={labels}
        onCheckAnswer={checkPracticeAnswer} onExit={() => setPracticeMode(false)} />;
    }
    return (
      <View style={styles.submitted}>
        <Ionicons name="checkmark-circle-outline" size={44} color={theme.successText} /><Text accessibilityRole="header" style={styles.title}>{copy.submitted}</Text>
        <Text style={styles.body}>
          {attempt.resultPublished && attempt.score !== null && attempt.maxScore !== null
            ? copy.publishedScore(attempt.score, attempt.maxScore)
            : copy.submittedBody}
        </Text>
        {attempt.manualGradingPending ? <Text style={styles.body}>{copy.manualGradeWaiting}</Text> : null}
        {attempt.resultPublished ? attempt.responses.filter(response => response.feedback).map(response => (
          <Text key={response.questionId} style={styles.body}>{response.feedback}</Text>
        )) : null}
        {attempt.resultPublished && practiceQuestions.length > 0 ? (
          <AnimatedPressable accessibilityRole="button" onPress={() => setPracticeMode(true)} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>{copy.practiceStart}</Text>
          </AnimatedPressable>
        ) : null}
        <EducationResultShareButton questionTypes={attempt.questions.map(question => question.type)} />
        <EducationAssignmentLeaderboard assignmentId={attempt.assignmentId} resultsPublishedAt={attempt.resultsPublishedAt}
          enabled={classroomAssignment && attempt.resultPublished && attempt.leaderboardEligible !== false} />
      </View>
    );
  }

  const question = attempt.questions[questionIndex];
  if (!question) return <Text accessibilityRole="alert" style={styles.error}>{copy.noQuestions}</Text>;
  const answer = answers[question.id];
  const expiresAt = new Date(attempt.expiresAt).getTime();
  const hasExpired = Date.now() >= expiresAt;

  return (
    <View style={styles.player}>
      <View style={styles.timerRow}>
        <Text style={[styles.timer, hasExpired && styles.error]}>
          {hasExpired ? copy.expired : copy.timeRemaining(Math.floor(secondsRemaining / 60), secondsRemaining % 60)}
        </Text>
        {!hasExpired && !submitError ? (
          <Text style={styles.saveState} accessibilityLiveRegion="polite">
            {saveState === 'saving' ? copy.saveSaving : saveState === 'saved' ? copy.saveSaved : ''}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: appSpacing.sm }}>
        <Text style={styles.saveState}>{questionIndex + 1} / {attempt.questions.length}</Text>
        <LearningProgress value={questionIndex + 1} total={attempt.questions.length} height={12} />
      </View>
      <QuestionCard key={question.id} variant="learning" questionIndex={questionIndex} totalQuestions={attempt.questions.length} errorText={saveState === 'error' ? copy.saveError : undefined}>
        <QuestionInput
          attemptId={attempt.id}
          identity={`${user?.id ?? 'anonymous'}:${attempt.id}`}
          question={question}
          value={answer}
          onChange={(nextAnswer) => changeAnswer(question, nextAnswer)}
          labels={labels}
          onUploadAttachment={(file, kind) => uploadAttachment(question.id, file, kind)}
          onRecordingChange={handleRecordingChange}
          onSketchWorkChange={handleSketchWorkChange}
          onLocalAttachmentPreview={registerLocalPreview}
          expired={hasExpired}
          disabled={isSubmitting || hasExpired}
        />
      </QuestionCard>

      {saveState === 'error' ? (
        <AnimatedPressable accessibilityRole="button" onPress={() => void retrySaves()} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>{copy.retrySave}</Text>
        </AnimatedPressable>
      ) : null}

      <View style={styles.navigation}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: questionIndex === 0 || isSubmitting || isRecording || hasUnsavedSketch || isSketchProcessing }}
          disabled={questionIndex === 0 || isSubmitting || isRecording || hasUnsavedSketch || isSketchProcessing}
          onPress={() => { Keyboard.dismiss(); setQuestionIndex((index) => Math.max(0, index - 1)); }}
          style={[styles.secondaryAction, (questionIndex === 0 || isSubmitting || isRecording || hasUnsavedSketch || isSketchProcessing) && styles.disabledAction]}>
          <Text style={styles.secondaryActionText}>{copy.previous}</Text>
        </AnimatedPressable>
        {questionIndex < attempt.questions.length - 1 ? (
          <AnimatedPressable
            accessibilityRole="button"
            disabled={isSubmitting || isRecording || hasUnsavedSketch || isSketchProcessing}
            onPress={() => { Keyboard.dismiss(); setQuestionIndex((index) => Math.min(attempt.questions.length - 1, index + 1)); }}
            style={[styles.secondaryAction, (isSubmitting || isRecording || hasUnsavedSketch || isSketchProcessing) && styles.disabledAction]}>
            <Text style={styles.secondaryActionText}>{copy.next}</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {submitError ? (
        <Text accessibilityRole="alert" style={styles.error}>{copy.submitError}</Text>
      ) : null}
      <AppButton
        disabled={isSubmitting || isRecording || hasUnsavedSketch || isSketchProcessing}
        fullWidth
        label={isSubmitting ? copy.submitting : submitError ? copy.retrySubmit : copy.submit}
        loading={isSubmitting}
        onPress={() => {
          Keyboard.dismiss();
          if (hasExpired || submitError) void submitAttempt(hasExpired);
          else setConfirmSubmit(true);
        }}
        size="large"
      />
      <ConfirmModal
        visible={confirmSubmit}
        title={copy.submitConfirmTitle}
        description={copy.submitConfirmBody}
        confirmText={copy.submit}
        cancelText={copy.cancel}
        onConfirm={() => {
          setConfirmSubmit(false);
          void submitAttempt(false);
        }}
        onCancel={() => setConfirmSubmit(false)}
      />
    </View>
  );

  async function retrySaves() {
    setSaveState('saving');
    for (const questionId of pendingAnswersRef.current.keys()) void queueSave(questionId);
    await queueRef.current;
  }
}

function remainingSeconds(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  player: { gap: appSpacing.md },
  timerRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: appSpacing.sm, justifyContent: 'space-between', minHeight: 28 },
  timer: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  saveState: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  submitted: { backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderRadius: appRadii.hero, borderWidth: 2, borderBottomWidth: 5, gap: 14, padding: appSpacing.xl },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  secondaryAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: appRadii.control, borderWidth: 2, borderBottomWidth: 4, justifyContent: 'center', minHeight: 48, paddingVertical: 10, paddingHorizontal: 15, maxWidth: '100%' },
  secondaryActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  disabledAction: { opacity: 0.55 },
}));
