import AnimatedPressable from '@/components/AnimatedPressable';
import { QuestionCard, QuestionInput, type QuestionInputLabels } from '@/features/education/components/question-inputs';
import { createEmptyEducationAnswer } from '@/features/education/components/question-inputs/createEmptyEducationAnswer';
import { useEducationCopy } from '@/features/education/i18n';
import type { EducationAnswer, EducationAttemptQuestion } from '@/features/education/types/question.types';
import { EducationResultShareButton } from '@/features/education/components/EducationResultShareButton';
import { isBlankResponse } from '@/features/education/utils/educationAttemptAnswers';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type PracticeQuestion = Exclude<EducationAttemptQuestion, { type: 'written-response' | 'photo-response' | 'voice-response' }>;

type EducationPracticeReviewProps = Readonly<{
  attemptId: string;
  questions: readonly PracticeQuestion[];
  labels: QuestionInputLabels;
  onCheckAnswer: (question: PracticeQuestion, answer: EducationAnswer) => Promise<{ isCorrect: boolean; explanation?: string | null }>;
  onExit: () => void;
}>;

export function isPracticeQuestion(question: EducationAttemptQuestion): question is PracticeQuestion {
  return question.type !== 'written-response' && question.type !== 'photo-response' && question.type !== 'voice-response';
}

export function EducationPracticeReview({ attemptId, questions, labels, onCheckAnswer, onExit }: EducationPracticeReviewProps) {
  const copy = useEducationCopy();
  const { styles } = useStyles();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, EducationAnswer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ isCorrect: boolean; explanation?: string | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const [complete, setComplete] = useState(false);
  const checkingRef = useRef(false);

  if (questions.length === 0) {
    return (
      <View style={styles.panel}>
        <Text accessibilityRole="alert" style={styles.body}>{copy.practiceNoFormatItems}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={onExit} style={styles.action}>
          <Text style={styles.actionText}>{copy.practiceReturn}</Text>
        </AnimatedPressable>
      </View>
    );
  }

  if (complete) {
    return (
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>{copy.practiceComplete}</Text>
        <Text style={styles.body}>{copy.practiceNoGrades}</Text>
        <EducationResultShareButton questionTypes={questions.map(item => item.type)} />
        <AnimatedPressable accessibilityRole="button" onPress={onExit} style={styles.action}>
          <Text style={styles.actionText}>{copy.practiceReturn}</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const question = questions[index];
  if (!question) return null;
  const answer = answers[question.id] ?? createEmptyEducationAnswer(question);
  const hasChecked = checked[question.id] ?? false;

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{copy.practiceTitle}</Text>
      <Text style={styles.body}>{copy.practiceNoGrades}</Text>
      {question.objectiveTitle ? <Text style={styles.objective}>{copy.practiceObjective} · {question.objectiveTitle}</Text> : null}
      <QuestionCard questionIndex={index} totalQuestions={questions.length}>
        <QuestionInput
          attemptId={attemptId}
          question={question}
          value={answer}
          onChange={(next) => setAnswers(current => ({ ...current, [question.id]: next }))}
          labels={labels}
          disabled={checking || result !== null}
        />
      </QuestionCard>
      {result ? (
        <Text accessibilityLiveRegion="polite" style={[styles.feedback, result.isCorrect ? styles.correct : styles.incorrect]}>
          {result.isCorrect ? copy.practiceCorrect : copy.practiceIncorrect}
        </Text>
      ) : null}
      {result && (result.explanation ?? question.explanation) ? (
        <Text style={styles.explanation}>{copy.practiceExplanation}: {result.explanation ?? question.explanation}</Text>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{copy.practiceCheckError}</Text> : null}
      {hasChecked ? (
        <AnimatedPressable accessibilityRole="button" onPress={advance} style={styles.action}>
          <Text style={styles.actionText}>{index === questions.length - 1 ? copy.practiceFinish : copy.next}</Text>
        </AnimatedPressable>
      ) : result ? (
        <View style={styles.actions}>
          <AnimatedPressable accessibilityRole="button" disabled={checking} onPress={retryCurrent} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>{copy.practiceTryAgain}</Text>
          </AnimatedPressable>
          <AnimatedPressable accessibilityRole="button" disabled={checking} onPress={advance} style={styles.action}>
            <Text style={styles.actionText}>{copy.practiceContinue}</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <AnimatedPressable
          accessibilityRole="button"
          disabled={checking || isBlankResponse(question, answer)}
          onPress={() => void checkAnswer()}
          style={[styles.action, (checking || isBlankResponse(question, answer)) && styles.disabled]}>
          <Text style={styles.actionText}>{checking ? copy.practiceChecking : copy.practiceCheck}</Text>
        </AnimatedPressable>
      )}
      <AnimatedPressable accessibilityRole="button" onPress={onExit} style={styles.exitAction}>
        <Text style={styles.exitText}>{copy.practiceReturn}</Text>
      </AnimatedPressable>
    </View>
  );

  async function checkAnswer() {
    if (!question || isBlankResponse(question, answer) || checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    setError(false);
    try {
      const grade = await onCheckAnswer(question, answer);
      setResult({ isCorrect: grade.isCorrect, explanation: grade.explanation });
      if (grade.isCorrect) setChecked(current => ({ ...current, [question.id]: true }));
    } catch {
      setError(true);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }

  function retryCurrent() {
    if (!question) return;
    setAnswers(current => ({ ...current, [question.id]: createEmptyEducationAnswer(question) }));
    setResult(null);
    setError(false);
  }

  function advance() {
    if (index === questions.length - 1) {
      setComplete(true);
      return;
    }
    setIndex(current => current + 1);
    setResult(null);
    setError(false);
  }
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  panel: { backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderRadius: 18, borderWidth: 1.5, gap: 12, padding: 16 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
  objective: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 17 },
  feedback: { fontFamily: typography.bodyExtraBold, fontSize: 15 },
  explanation: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
  correct: { color: theme.successText },
  incorrect: { color: theme.berryDeep },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 13 },
  action: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 14, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  actionText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secondaryAction: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetDeep, borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  secondaryActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  exitAction: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 },
  exitText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  disabled: { opacity: 0.5 },
}));
