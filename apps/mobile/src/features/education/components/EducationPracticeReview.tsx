import { AppButton } from '@/components/ui/AppButton';
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
        <AppButton fullWidth label={copy.practiceReturn} onPress={onExit} size="large" />
      </View>
    );
  }

  if (complete) {
    return (
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>{copy.practiceComplete}</Text>
        <Text style={styles.body}>{copy.practiceNoGrades}</Text>
        <EducationResultShareButton questionTypes={questions.map(item => item.type)} />
        <AppButton fullWidth label={copy.practiceReturn} onPress={onExit} size="large" />
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
        <AppButton fullWidth label={index === questions.length - 1 ? copy.practiceFinish : copy.next} onPress={advance} size="large" />
      ) : result ? (
        <View style={styles.actions}>
          <AppButton disabled={checking} label={copy.practiceTryAgain} onPress={retryCurrent} size="regular" style={styles.rowAction} variant="secondary" />
          <AppButton disabled={checking} label={copy.practiceContinue} onPress={advance} size="regular" style={styles.rowAction} />
        </View>
      ) : (
        <AppButton
          disabled={isBlankResponse(question, answer)}
          fullWidth
          label={checking ? copy.practiceChecking : copy.practiceCheck}
          loading={checking}
          onPress={() => void checkAnswer()}
          size="large"
        />
      )}
      <AppButton fullWidth label={copy.practiceReturn} onPress={onExit} size="compact" variant="tertiary" />
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowAction: { flex: 1 },
}));
