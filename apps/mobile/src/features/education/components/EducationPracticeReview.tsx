import { educationCorrectAnswerText } from '../utils/educationCorrectAnswer';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { LearningArrival, LearningButton, LearningTextAction, LearningConfetti, LearningProgress, useLearningCopy, useLearningStyles } from './LearningUi';
import { LearningPracticeTip } from './LearningPracticeTip';
import { LearningFeedback } from './LearningFeedback';
import { LearningResultHero } from './LearningResultHero';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearningAppButton as AppButton } from '@/features/education/components/LearningAppButton';
import { QuestionCard, QuestionInput, type QuestionInputLabels } from '@/features/education/components/question-inputs';
import { createEmptyEducationAnswer } from '@/features/education/components/question-inputs/createEmptyEducationAnswer';
import { useEducationCopy } from '@/features/education/i18n';
import type { EducationAnswerFeedback, EducationAnswer, EducationAttemptQuestion } from '@/features/education/types/question.types';
import { EducationResultShareButton } from '@/features/education/components/EducationResultShareButton';
import { isBlankResponse } from '@/features/education/utils/educationAttemptAnswers';
import { createEducationPracticeSession, createEducationPracticeSessionKey, educationPracticeSessionReducer, getMissedEducationPracticeQuestionIds, getPendingEducationPracticeQuestionCount, summarizeEducationPracticeSession } from '@/features/education/utils/educationPracticeSession';
import { activateEducationPracticeGate, claimEducationPracticeAdvance, claimEducationPracticeCheck, createEducationPracticeGate, deactivateEducationPracticeGate, failEducationPracticeCheck, finishEducationPracticeCheck, resetEducationPracticeQuestion } from '@/features/education/utils/educationPracticeGate';
import { isEducationOrderingAnswerComplete } from '@/features/education/utils/educationOrderingBuilder';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';

export type PracticeQuestion = Exclude<EducationAttemptQuestion, { type: 'written-response' | 'photo-response' | 'voice-response' }>;

type EducationPracticeReviewProps = Readonly<{
  attemptId: string;
  sessionIdentity?: string;
  questions: readonly PracticeQuestion[];
  labels: QuestionInputLabels;
  onCheckAnswer: (question: PracticeQuestion, answer: EducationAnswer) => Promise<EducationAnswerFeedback>;
  onExit: () => void;
  exitLabel?: string;
  embedded?: boolean;
}>;

export function isPracticeQuestion(question: EducationAttemptQuestion): question is PracticeQuestion {
  return question.type !== 'written-response' && question.type !== 'photo-response' && question.type !== 'voice-response';
}

export function EducationPracticeReview({ attemptId, sessionIdentity = '', questions, labels, onCheckAnswer, onExit, exitLabel, embedded = true }: EducationPracticeReviewProps) {
  const sessionKey = createEducationPracticeSessionKey(sessionIdentity, attemptId, questions);
  return <EducationPracticeReviewSession sessionIdentity={sessionIdentity} key={sessionKey} attemptId={attemptId} questions={questions} labels={labels} onCheckAnswer={onCheckAnswer} onExit={onExit} exitLabel={exitLabel} embedded={embedded} />;
}

function EducationPracticeReviewSession({ attemptId, sessionIdentity = '', questions, labels, onCheckAnswer, onExit, exitLabel, embedded = true }: EducationPracticeReviewProps) {
  const copy = useEducationCopy();
  const ui = useLearningCopy();
  const { styles: ls, theme } = useLearningStyles();
  const insets = useSafeAreaInsets();
  const { styles } = useStyles();
  const { playSound, feedbackEnabled } = useSoundEffects();
  const reduceMotion = useReducedMotion();
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [session, dispatchSession] = useReducer(educationPracticeSessionReducer, questions, items => createEducationPracticeSession(items.map(item => item.id)));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, EducationAnswer>>({});
  const [result, setResult] = useState<EducationAnswerFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const [complete, setComplete] = useState(false);
  const [feedbackSequence, setFeedbackSequence] = useState(0);
  const gateRef = useRef(createEducationPracticeGate(questions[0]?.id ?? ''));
  useEffect(() => {
    const gate = gateRef.current;
    activateEducationPracticeGate(gate, gate.questionId);
    return () => deactivateEducationPracticeGate(gate);
  }, []);

  if (questions.length === 0) {
    return (
      <View style={styles.panel}>
        <Text accessibilityRole="alert" style={styles.body}>{copy.practiceNoFormatItems}</Text>
        <AppButton fullWidth label={exitLabel ?? copy.practiceReturn} onPress={exitPractice} size="large" />
      </View>
    );
  }

  if (complete) {
    const summary = summarizeEducationPracticeSession(session);
    return <View style={embedded ? { gap: 14 } : ls.page}>
      <ScrollView contentContainerStyle={[ls.content, !embedded && { paddingTop: insets.top + 16 }]}>
        <LearningResultHero title={copy.practiceComplete} subtitle={copy.practiceSummary(summary.total, summary.firstTryCorrect, summary.retryCorrect, summary.pending, summary.missed)} stars={Math.max(1, Math.round(summary.firstTryCorrect / Math.max(1, summary.total) * 3))} />
        <View style={ls.resultStats}>{[[summary.firstTryCorrect + summary.retryCorrect, ui.zh ? '答对' : 'Solved'], [summary.firstTryCorrect, ui.firstTry], [summary.pending, ui.reinforce]].map(([value, label], i) => <View key={i} style={ls.resultStat}><Text style={ls.resultNumber}>{value}/{summary.total}</Text><Text style={ls.resultLabel}>{label}</Text></View>)}</View>
        {summary.missed ? <LearningButton secondary label={copy.practiceMissedOnly} onPress={practiceMissed} /> : null}
        <EducationResultShareButton questionTypes={activeQuestions.map(item => item.type)} />
      </ScrollView>
      <View style={[ls.dock, { paddingBottom: embedded ? 16 : Math.max(16, insets.bottom) }]}><LearningButton label={exitLabel ?? copy.practiceReturn} onPress={exitPractice} /></View>
    </View>;
  }

  const question = activeQuestions[index];
  if (!question) return null;
  const answer = answers[question.id] ?? createEmptyEducationAnswer(question);
  const hasChecked = session.progress[question.id]?.solved ?? false;

  const Content = embedded ? View : ScrollView;
  return <View style={embedded ? { gap: 12 } : { flex: 1, backgroundColor: theme.canvas }}>
    {embedded
      ? <View style={{ padding: 16, gap: 8 }}><LearningProgress value={index + 1} total={activeQuestions.length} color={theme.grass} height={10} /><Text style={ls.small}>{copy.practiceProgress(index + 1, activeQuestions.length, getPendingEducationPracticeQuestionCount(session))}</Text></View>
      : <View style={[styles.quizHeader, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={exitLabel ?? copy.practiceReturn} onPress={exitPractice} style={styles.quizClose}><Ionicons name="close" size={24} color={theme.violetDeep} /></AnimatedPressable>
        <View style={{ flex: 1 }}><LearningProgress value={index + 1} total={activeQuestions.length} color={theme.grass} height={10} /></View>
        <Text style={styles.quizCount}>{index + 1}/{activeQuestions.length}</Text>
      </View>}
    <Content key={question.id} {...(embedded ? { style: { gap: 14 } } : { style: { flex: 1 }, contentContainerStyle: ls.content, keyboardShouldPersistTaps: 'handled' as const })}>
      <LearningPracticeTip userId={sessionIdentity || attemptId} />
      <LearningArrival key={question.id} style={{ gap: 12 }}>
        <Text style={[ls.small, { color: theme.violetDeep }]}>{[question.objectiveTitle, copy.questionTypeLabels[question.type]].filter(Boolean).join(' · ')}</Text>
        <QuestionCard variant={embedded ? 'default' : 'learning'} questionIndex={index} totalQuestions={activeQuestions.length}>
          <QuestionInput attemptId={attemptId} orderingBuilder question={question} value={answer} onChange={next => setAnswers(current => ({ ...current, [question.id]: next }))} labels={labels} feedback={result?.isCorrect} correctAnswer={result?.correctAnswer} showHints={false} disabled={checking || result !== null} />
        </QuestionCard>
      </LearningArrival>
    </Content>
    {!embedded && result?.isCorrect ? <LearningConfetti visible sequence={feedbackSequence} /> : null}
    <View style={[ls.dock, !embedded && styles.feedbackDock, { paddingBottom: embedded ? 16 : Math.max(16, insets.bottom), backgroundColor: result ? result.isCorrect ? theme.mintTint : theme.berryTint : theme.canvas, borderColor: result ? result.isCorrect ? theme.mintLine : theme.berryLine : theme.line }]}>
      {result ? <LearningFeedback correct={result.isCorrect} title={result.isCorrect ? ui.feedbackCorrect : ui.feedbackWrong} explanation={result.explanation ?? question.explanation} correctAnswerText={result.isCorrect ? null : educationCorrectAnswerText(question, result.correctAnswer, labels)} sequence={feedbackSequence} /> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{copy.practiceCheckError}</Text> : null}
      {hasChecked ? <LearningButton tone={result ? result.isCorrect ? 'success' : 'danger' : 'primary'} label={index === activeQuestions.length - 1 ? copy.practiceFinish : copy.next} onPress={advance} /> : result ? <View style={{ gap: 8 }}><LearningButton tone={result.isCorrect ? 'success' : 'danger'} disabled={checking} label={copy.practiceContinue} onPress={advance} /><LearningTextAction disabled={checking} label={copy.practiceTryAgain} onPress={retryCurrent} /></View>
        : <LearningButton disabled={isBlankResponse(question, answer) || !isPracticeAnswerReady(question, answer)} label={checking ? copy.practiceChecking : copy.practiceCheck} loading={checking} onPress={() => void checkAnswer()} />}
      {embedded ? <AppButton label={exitLabel ?? copy.practiceReturn} onPress={exitPractice} variant="tertiary" /> : null}
    </View>
  </View>;

  async function checkAnswer() {
    Keyboard.dismiss();
    if (!question || isBlankResponse(question, answer) || !isPracticeAnswerReady(question, answer) || !claimEducationPracticeCheck(gateRef.current, question.id)) return;
    setChecking(true);
    setError(false);
    try {
      const grade = await onCheckAnswer(question, answer);
      if (!finishEducationPracticeCheck(gateRef.current, question.id)) return;
      setFeedbackSequence(current => current + 1);
      setResult({ isCorrect: grade.isCorrect, explanation: grade.explanation, correctAnswer: grade.correctAnswer });
      dispatchSession({ type: 'checked', questionId: question.id, isCorrect: grade.isCorrect });
      if (grade.isCorrect) {
        safelyPlaySound('correct');
        if (feedbackEnabled && !reduceMotion) safelyHaptic(Haptics.NotificationFeedbackType.Success);
      } else {
        safelyPlaySound('wrong');
        if (feedbackEnabled && !reduceMotion) safelyHaptic(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      if (failEducationPracticeCheck(gateRef.current, question.id)) setError(true);
    } finally {
      if (gateRef.current.active) setChecking(false);
    }
  }

  function retryCurrent() {
    if (!question) return;
    resetEducationPracticeQuestion(gateRef.current, question.id);
    setAnswers(current => ({ ...current, [question.id]: createEmptyEducationAnswer(question) }));
    setResult(null);
    setError(false);
  }

  function advance() {
    if (!question || !claimEducationPracticeAdvance(gateRef.current, question.id)) return;
    if (index === activeQuestions.length - 1) {
      safelyPlaySound('complete');
      setComplete(true);
      return;
    }
    resetEducationPracticeQuestion(gateRef.current, activeQuestions[index + 1]?.id ?? '');
    setIndex(index + 1);
    setResult(null);
    setError(false);
  }

  function practiceMissed() {
    const missedIds = new Set(getMissedEducationPracticeQuestionIds(session));
    const missed = activeQuestions.filter(item => missedIds.has(item.id));
    if (!missed.length) return;
    setActiveQuestions(missed);
    resetEducationPracticeQuestion(gateRef.current, missed[0]!.id);
    setIndex(0);
    setComplete(false);
    setAnswers({});
    dispatchSession({ type: 'reset', questionIds: missed.map(item => item.id) });
    setResult(null);
    setError(false);
  }

  function exitPractice() {
    deactivateEducationPracticeGate(gateRef.current);
    onExit();
  }

  function safelyPlaySound(effect: 'correct' | 'wrong' | 'complete') {
    try { playSound(effect); } catch { /* Feedback must never affect the checked result. */ }
  }

  function safelyHaptic(type: Haptics.NotificationFeedbackType) {
    try { void Haptics.notificationAsync(type).catch(() => undefined); } catch { /* Haptics are optional feedback. */ }
  }

  function isPracticeAnswerReady(currentQuestion: PracticeQuestion, currentAnswer: EducationAnswer) {
    if (currentQuestion.type === 'matching') return currentAnswer.type === 'matching' && currentQuestion.options.every(option => currentAnswer.matches.some(match => match.leftOptionId === option.id));
    return currentQuestion.type !== 'ordering' || (currentAnswer.type === 'ordering' && isEducationOrderingAnswerComplete(currentQuestion, currentAnswer));
  }
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowAction: { flex: 1 },
  progressTrack: { backgroundColor: theme.mintLine, borderRadius: 8, height: 10, overflow: 'hidden' },
  progressFill: { backgroundColor: theme.violetDeep, borderRadius: 8, height: '100%' },
  progressLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  typeLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14, textTransform: 'capitalize' },
  guidance: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
  summary: { backgroundColor: theme.paper, borderColor: theme.mintLine, borderRadius: 14, borderWidth: 1.5, color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 21, padding: 14 },
  quizHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  quizClose: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 14, borderWidth: 1.5, height: 44, justifyContent: 'center', width: 44 },
  quizCount: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13, minWidth: 38, textAlign: 'right' },
  feedbackDock: { maxHeight: '65%', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 1.5, gap: 10, paddingTop: 16 },
  feedbackContent: { alignItems: 'center', flexDirection: 'row', minHeight: 76, position: 'relative' },
  feedbackTitle: { fontFamily: typography.displayExtraBold, fontSize: 21, lineHeight: 28 },
  feedbackExplanation: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
}));
